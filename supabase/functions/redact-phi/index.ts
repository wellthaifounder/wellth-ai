import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PHIPattern {
  type: string;
  pattern: RegExp;
  replacement: string;
}

interface DetectedPHI {
  type: string;
  value: string;
  redacted: string;
  location: number;
}

// Common PHI patterns to detect and redact
const PHI_PATTERNS: PHIPattern[] = [
  {
    type: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN REDACTED]',
  },
  {
    type: 'ssn_no_dash',
    pattern: /\b\d{9}\b/g,
    replacement: '[SSN REDACTED]',
  },
  {
    type: 'phone',
    pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    replacement: '[PHONE REDACTED]',
  },
  {
    type: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL REDACTED]',
  },
  {
    type: 'date_of_birth',
    pattern: /\b(?:DOB|Date of Birth|Birth Date):\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi,
    replacement: '[DOB REDACTED]',
  },
  {
    type: 'mrn',
    pattern: /\b(?:MRN|Medical Record|Patient ID)#?\s*:?\s*[A-Z0-9]{6,}\b/gi,
    replacement: '[MRN REDACTED]',
  },
  {
    type: 'address_line',
    pattern: /\b\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way|Place|Pl)\b/gi,
    replacement: '[ADDRESS REDACTED]',
  },
  {
    type: 'zip_code',
    pattern: /\b\d{5}(?:-\d{4})?\b/g,
    replacement: '[ZIP REDACTED]',
  },
];

function detectPatternBasedPHI(text: string): { redactedText: string; detectedPHI: DetectedPHI[] } {
  let redactedText = text;
  const detectedPHI: DetectedPHI[] = [];

  for (const pattern of PHI_PATTERNS) {
    const matches = [...text.matchAll(pattern.pattern)];
    
    for (const match of matches) {
      if (match[0] && match.index !== undefined) {
        detectedPHI.push({
          type: pattern.type,
          value: match[0],
          redacted: pattern.replacement,
          location: match.index,
        });
      }
    }
    
    redactedText = redactedText.replace(pattern.pattern, pattern.replacement);
  }

  return { redactedText, detectedPHI };
}

async function detectAIBasedPHI(text: string): Promise<string[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not found, skipping AI-based PHI detection');
    return [];
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a PHI (Protected Health Information) detection system. Analyze medical bills and identify any sensitive patient information that should be redacted. This includes:
- Patient names (first, last, full names)
- Addresses (partial or complete)
- Personal identifiers not caught by patterns
- Provider notes containing patient details
- Insurance member IDs
- Any other personally identifiable information

Return ONLY a JSON array of strings containing the exact text snippets that contain PHI. Do not include explanations. Format: ["text snippet 1", "text snippet 2"]`
          },
          {
            role: 'user',
            content: `Identify PHI in this text:\n\n${text.substring(0, 4000)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "identify_phi",
              description: "Return identified PHI text snippets",
              parameters: {
                type: "object",
                properties: {
                  phi_snippets: {
                    type: "array",
                    items: {
                      type: "string"
                    }
                  }
                },
                required: ["phi_snippets"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "identify_phi" } }
      }),
    });

    if (!response.ok) {
      console.error('AI PHI detection failed:', response.status);
      return [];
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return args.phi_snippets || [];
    }

    return [];
  } catch (error) {
    console.error('Error in AI PHI detection:', error);
    return [];
  }
}

function redactAIDetectedPHI(text: string, phiSnippets: string[]): { redactedText: string; detectedPHI: DetectedPHI[] } {
  let redactedText = text;
  const detectedPHI: DetectedPHI[] = [];

  for (const snippet of phiSnippets) {
    if (!snippet || snippet.length < 3) continue;
    
    // Create a safe pattern that escapes special regex characters
    const escapedSnippet = snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escapedSnippet, 'gi');
    
    const matches = [...redactedText.matchAll(pattern)];
    for (const match of matches) {
      if (match.index !== undefined) {
        detectedPHI.push({
          type: 'ai_detected',
          value: match[0],
          redacted: '[PHI REDACTED]',
          location: match.index,
        });
      }
    }
    
    redactedText = redactedText.replace(pattern, '[PHI REDACTED]');
  }

  return { redactedText, detectedPHI };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, use_ai = true } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid text parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting PHI redaction for text of length: ${text.length}`);
    console.log(`AI detection enabled: ${use_ai}`);

    // Step 1: Pattern-based detection
    const { redactedText: patternRedacted, detectedPHI: patternPHI } = detectPatternBasedPHI(text);
    console.log(`Pattern-based detection found ${patternPHI.length} PHI items`);

    let finalRedactedText = patternRedacted;
    let allDetectedPHI = [...patternPHI];

    // Step 2: AI-based detection (optional)
    if (use_ai) {
      console.log('Running AI-based PHI detection...');
      const aiSnippets = await detectAIBasedPHI(patternRedacted);
      console.log(`AI detection found ${aiSnippets.length} potential PHI snippets`);
      
      if (aiSnippets.length > 0) {
        const { redactedText: aiRedacted, detectedPHI: aiPHI } = redactAIDetectedPHI(
          finalRedactedText,
          aiSnippets
        );
        finalRedactedText = aiRedacted;
        allDetectedPHI = [...allDetectedPHI, ...aiPHI];
      }
    }

    // Calculate statistics
    const stats = {
      original_length: text.length,
      redacted_length: finalRedactedText.length,
      total_phi_detected: allDetectedPHI.length,
      phi_by_type: allDetectedPHI.reduce((acc, phi) => {
        acc[phi.type] = (acc[phi.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    console.log('Redaction complete:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        redacted_text: finalRedactedText,
        detected_phi: allDetectedPHI,
        stats,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in redact-phi function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
