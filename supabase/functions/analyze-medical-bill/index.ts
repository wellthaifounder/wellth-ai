import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BillError {
  error_type: string;
  error_category: string;
  description: string;
  line_item_reference?: string;
  potential_savings: number;
  evidence: Record<string, any>;
}

interface AnalysisResult {
  errors: BillError[];
  total_potential_savings: number;
  confidence_score: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { invoiceId, receiptId } = await req.json();

    if (!invoiceId || !receiptId) {
      throw new Error('Missing required parameters');
    }

    console.log(`Analyzing bill for invoice ${invoiceId}, receipt ${receiptId}`);

    // Get receipt file
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('file_path, file_type')
      .eq('id', receiptId)
      .eq('user_id', user.id)
      .single();

    if (receiptError || !receipt) {
      throw new Error('Receipt not found');
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('receipts')
      .download(receipt.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download receipt');
    }

    // Convert to base64 for Lovable AI
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = receipt.file_type || 'image/jpeg';

    // Call Lovable AI for bill analysis
    const analysisPrompt = `You are a medical billing expert analyzing this bill for potential errors and overcharges.

Analyze the bill image and extract:

1. **Provider Information**: Name, address, tax ID
2. **Patient Information**: Name, date of birth (if visible)
3. **Service Date(s)**: When services were rendered
4. **Line Items**: For each charge, extract:
   - CPT/HCPCS code (if present)
   - Procedure/service description
   - Quantity
   - Unit charge
   - Total charge
   - Any modifiers

5. **Billing Errors**: Identify potential issues:

   **DUPLICATE CHARGES**: Same CPT code billed multiple times on same date with same amount
   - Priority: HIGH if savings > $100, MEDIUM otherwise
   - Calculate: Sum of duplicate charges after first occurrence
   
   **UPCODING**: Procedure code seems more complex than service description suggests
   - Priority: HIGH if savings > $200, MEDIUM if > $50
   - Look for: E&M codes that don't match visit complexity, surgical codes for minor procedures
   
   **UNBUNDLING**: Separate billing for services that should be bundled
   - Priority: HIGH if savings > $150
   - Common examples: Separate billing for items included in global surgical package
   
   **INCORRECT QUANTITIES**: Charges for more units than medically reasonable
   - Priority: HIGH if quantity > 10 for typical single-use items
   - Example: 20 band-aids charged individually
   
   **BALANCE BILLING**: Out-of-network charges where patient shouldn't be responsible
   - Priority: HIGH (protected under No Surprises Act)
   - Calculate: Difference between out-of-network charge and in-network rate
   
   **PRICING DISCREPANCIES**: Charges significantly above typical rates
   - Priority: MEDIUM if charge > 2x typical rate, HIGH if > 3x
   - Compare against typical commercial rates (not just Medicare)
   
   **CODING ERRORS**: Invalid codes, mismatched diagnosis/procedure codes
   - Priority: MEDIUM
   - Look for: Codes that don't exist, modifiers used incorrectly

For each error found, provide:
- Error type (one of the categories above)
- Priority level (high_priority, medium_priority, low_priority)
- Clear description in patient-friendly language
- Line item reference (which line on bill)
- Potential savings estimate
- Evidence/reasoning

Return ONLY valid JSON in this exact format:
{
  "errors": [
    {
      "error_type": "duplicate_charge",
      "error_category": "high_priority",
      "description": "You were charged twice for the same X-ray on the same day. The charge of $150 appears on line 3 and again on line 7.",
      "line_item_reference": "Lines 3, 7",
      "potential_savings": 150.00,
      "evidence": {
        "cpt_code": "71020",
        "duplicate_count": 2,
        "charge_amount": 150.00
      }
    }
  ],
  "total_potential_savings": 150.00,
  "confidence_score": 0.85
}

If no errors are found, return:
{
  "errors": [],
  "total_potential_savings": 0,
  "confidence_score": 0.95
}

IMPORTANT: 
- Be conservative with error flagging - only flag clear issues
- Provide specific line references when possible
- Explain errors in simple, non-technical language
- Calculate realistic savings estimates
- Confidence score should reflect certainty (0.0-1.0)
`;

    console.log('Calling Lovable AI for bill analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: analysisPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('AI rate limit exceeded. Please try again in a few minutes.');
      }
      
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add funds to your Lovable workspace.');
      }
      
      throw new Error(`AI analysis failed: ${aiResponse.statusText}`);
    }

    const aiResult = await aiResponse.json();
    console.log('AI analysis complete');

    // Parse AI response
    const content = aiResult.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    let analysisResult: AnalysisResult;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : content;
      analysisResult = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI analysis');
    }

    // Update or create bill review record
    const { data: existingReview } = await supabase
      .from('bill_reviews')
      .select('id')
      .eq('invoice_id', invoiceId)
      .maybeSingle();

    let billReview;
    
    if (existingReview) {
      // Update existing review
      const { data, error: updateError } = await supabase
        .from('bill_reviews')
        .update({
          review_status: 'reviewed',
          total_potential_savings: analysisResult.total_potential_savings || 0,
          confidence_score: analysisResult.confidence_score || 0.5,
          analyzed_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating bill review:', updateError);
        throw updateError;
      }
      billReview = data;
      console.log(`Updated bill review ${billReview.id}`);
    } else {
      // Create new review
      const { data, error: reviewError } = await supabase
        .from('bill_reviews')
        .insert({
          user_id: user.id,
          invoice_id: invoiceId,
          review_status: 'reviewed',
          total_potential_savings: analysisResult.total_potential_savings || 0,
          confidence_score: analysisResult.confidence_score || 0.5,
          analyzed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (reviewError) {
        console.error('Error creating bill review:', reviewError);
        throw reviewError;
      }
      billReview = data;
      console.log(`Created bill review ${billReview.id}`);
    }

    // Insert or update error findings
    if (analysisResult.errors && analysisResult.errors.length > 0) {
      // First, delete any existing errors for this review
      await supabase
        .from('bill_errors')
        .delete()
        .eq('bill_review_id', billReview.id);

      const errorInserts = analysisResult.errors.map(error => ({
        bill_review_id: billReview.id,
        error_type: error.error_type,
        error_category: error.error_category,
        description: error.description,
        line_item_reference: error.line_item_reference || null,
        potential_savings: error.potential_savings || 0,
        evidence: error.evidence || {},
        status: 'identified'
      }));

      const { error: errorsInsertError } = await supabase
        .from('bill_errors')
        .insert(errorInserts);

      if (errorsInsertError) {
        console.error('Error inserting bill errors:', errorsInsertError);
        throw errorsInsertError;
      }

      console.log(`Inserted ${errorInserts.length} error findings`);
    }

    // Sync provider data in the background
    try {
      await supabase.functions.invoke('sync-provider-data', {
        body: { 
          invoiceId,
          billReviewId: billReview.id
        }
      });
      console.log('Provider data sync initiated');
    } catch (syncError) {
      // Don't fail the whole request if provider sync fails
      console.error('Failed to sync provider data (non-fatal):', syncError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        billReviewId: billReview.id,
        totalPotentialSavings: analysisResult.total_potential_savings,
        errorsFound: analysisResult.errors?.length || 0,
        confidenceScore: analysisResult.confidence_score
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in analyze-medical-bill:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
