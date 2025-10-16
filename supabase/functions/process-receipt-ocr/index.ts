import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema - limit image size to 10MB base64
const ocrSchema = z.object({
  imageBase64: z.string()
    .min(100, 'Image data too small')
    .max(13500000, 'Image size exceeds 10MB limit')
    .regex(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/, 'Invalid image format'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = ocrSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', validation.error);
      return new Response(
        JSON.stringify({ error: 'Invalid image data or size exceeds limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { imageBase64 } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing receipt with OCR...');

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
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract the following information from this receipt image and return ONLY valid JSON with this exact structure:
{
  "amount": <number or null>,
  "vendor": "<string or null>",
  "date": "<YYYY-MM-DD or null>",
  "category": "<one of: Medical, Dental, Vision, Pharmacy, Other or null>",
  "confidence": <number 0-1>
}

Rules:
- Return ONLY the JSON object, no other text
- Use null for any field you cannot extract
- For category, choose the best match from: Medical, Dental, Vision, Pharmacy, Other
- confidence should be 0-1 representing how confident you are in the extraction`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', data);

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON from the response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      extractedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', content);
      throw new Error('Failed to parse OCR results');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          amount: extractedData.amount,
          vendor: extractedData.vendor,
          date: extractedData.date,
          category: extractedData.category,
          confidence: extractedData.confidence || 0.5
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in process-receipt-ocr:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Unable to process receipt'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
