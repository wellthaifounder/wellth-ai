import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://wellth.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

interface BillError {
  error_type: string;
  error_category: string;
  description: string;
  line_item_reference?: string;
  potential_savings: number;
  evidence: Record<string, any>;
}

interface ExtractedField {
  value: any;
  confidence: number;
  source?: string;
}

interface BillMetadata {
  provider_name?: ExtractedField;
  total_amount?: ExtractedField;
  service_date?: ExtractedField;
  bill_date?: ExtractedField;
  invoice_number?: ExtractedField;
  patient_name?: ExtractedField;
  insurance_company?: ExtractedField;
  category?: ExtractedField;
}

interface AnalysisResult {
  metadata?: BillMetadata;
  errors: BillError[];
  total_potential_savings: number;
  confidence_score: number;
  extraction_warnings?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
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

    console.log(`[${requestId}] Analyzing medical bill`);

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

CRITICAL INSTRUCTIONS FOR ACCURACY:
1. Only extract information that is CLEARLY VISIBLE on the bill
2. If you cannot confidently read a value, return null with low confidence
3. Do not infer, estimate, or hallucinate values
4. Cross-validate extracted amounts with line item totals when visible
5. Verify dates are in logical chronological order

Analyze the bill image and extract:

**PART 1: METADATA EXTRACTION** (Required for bill creation):

Extract the following fields with HIGH ACCURACY. For each field, provide:
- value: The extracted value (or null if not found/unclear)
- confidence: 0.0-1.0 confidence score
- source: Where on bill this was found (e.g., "header", "bottom total line")

Required fields:
- **provider_name**: Exact name as shown on bill header (not billing department contact)
- **total_amount**: Final amount due (NOT subtotals, look for "TOTAL", "AMOUNT DUE", "BALANCE")
- **service_date**: Date services were rendered (YYYY-MM-DD format)
- **bill_date**: Date bill was issued/statement date (YYYY-MM-DD format)
- **category**: HSA-eligible category - choose ONE:
  * "medical" (doctor visits, ER, hospital, surgery, lab tests)
  * "dental" (dentist, orthodontist)
  * "vision" (eye exams, glasses, contacts)
  * "pharmacy" (prescriptions, medications)
  * "mental_health" (therapy, counseling, psychiatry)
  * "other_hsa_eligible" (medical equipment, hearing aids)

Optional fields:
- **invoice_number**: Bill/invoice/account number if present
- **patient_name**: Patient name if visible
- **insurance_company**: Insurance payer name if shown

**PART 2: LINE ITEMS** (For error detection):

For each charge, extract:
   - CPT/HCPCS code (if present)
   - Procedure/service description
   - Quantity
   - Unit charge
   - Total charge
   - Any modifiers

**PART 3: BILLING ERRORS** (Identify potential issues):

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

   **EXCESSIVE MARKUP**: Charges significantly above Medicare allowable rates
   - Priority: HIGH if charge > 300% of Medicare rate, MEDIUM if > 200%
   - Common examples: $15 aspirin (Medicare: $0.50), $100 band-aid (Medicare: $1), $500 saline bag (Medicare: $5)
   - Look for: Common supplies with extreme markups, basic medications priced far above standard rates

   **FACILITY FEES QUESTIONABLE**: Unjustified or excessive facility fees
   - Priority: MEDIUM
   - Look for: Facility fee for simple office visit, ER facility fee when treated in urgent care setting, operating room fee when procedure was done in office
   - Red flags: Multiple facility fees on same date, facility fee higher than actual service charge

   **TIMELINE INCONSISTENCY**: Services that don't make chronological sense
   - Priority: MEDIUM
   - Look for: Follow-up visit before initial consultation, post-op care without corresponding surgery on bill, services dated on weekends/holidays for non-emergency procedures
   - Red flag: Multiple procedures requiring sedation on same day

   **INAPPROPRIATE FOR DIAGNOSIS**: Services that don't match patient demographics or diagnosis
   - Priority: MEDIUM to HIGH
   - Look for: Pregnancy-related services for male patients, pediatric services for adult patients, cardiac testing for broken arm treatment
   - Red flag: Services unrelated to chief complaint or diagnosis codes

   **PRICING TRANSPARENCY VIOLATION**: Charges exceed hospital's published rates (if applicable)
   - Priority: HIGH
   - Only flag if you can identify this is a hospital bill
   - Note: "This charge may exceed the hospital's published pricing under 45 CFR § 180.50"
   - Recommend: Patient should check hospital's CMS pricing file

   **BALANCE BILLING - NO SURPRISES ACT**: Enhanced balance billing detection
   - Priority: HIGH
   - Categorize specific scenarios:
     * Emergency services at out-of-network facility
     * Non-emergency services from out-of-network providers at in-network facilities (when patient didn't consent)
     * Air ambulance services
   - Cite: No Surprises Act protections apply
   - Note: Patient should only pay in-network cost-sharing amount

For each error found, provide:
- Error type (one of the categories above)
- Priority level (high_priority, medium_priority, low_priority)
- Clear description in patient-friendly language
- Line item reference (which line on bill)
- Potential savings estimate
- Evidence/reasoning

Return ONLY valid JSON in this exact format:
{
  "metadata": {
    "provider_name": { "value": "Memorial Regional Medical Center", "confidence": 0.95, "source": "header" },
    "total_amount": { "value": 13297.75, "confidence": 0.98, "source": "bottom total line" },
    "service_date": { "value": "2024-12-15", "confidence": 0.92, "source": "line items" },
    "bill_date": { "value": "2026-01-08", "confidence": 0.85, "source": "statement date" },
    "category": { "value": "medical", "confidence": 0.90, "source": "inferred from services" },
    "invoice_number": { "value": "MR-2024-12345", "confidence": 0.93, "source": "header" },
    "patient_name": { "value": "John Doe", "confidence": 0.88, "source": "patient info section" },
    "insurance_company": { "value": "Blue Cross Blue Shield", "confidence": 0.91, "source": "insurance section" }
  },
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
  "confidence_score": 0.85,
  "extraction_warnings": [
    "Unable to clearly read patient name due to image quality"
  ]
}

If no errors are found, return metadata with empty errors array:
{
  "metadata": { ... },
  "errors": [],
  "total_potential_savings": 0,
  "confidence_score": 0.95,
  "extraction_warnings": []
}

IMPORTANT:
- Be conservative with error flagging - only flag clear issues
- Provide specific line references when possible
- Explain errors in simple, non-technical language
- Calculate realistic savings estimates
- Confidence score should reflect certainty (0.0-1.0)
- For metadata: set confidence < 0.90 if uncertain about any field
- If a metadata field is not found or unclear, set value to null and confidence to 0
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

    // Validate AI results for consistency and prevent hallucinations
    const validationWarnings: string[] = [];

    if (analysisResult.metadata) {
      // Validate service date is before or equal to bill date
      const serviceDate = analysisResult.metadata.service_date?.value;
      const billDate = analysisResult.metadata.bill_date?.value;
      if (serviceDate && billDate && new Date(serviceDate) > new Date(billDate)) {
        validationWarnings.push('Service date is after bill date - please verify dates');
      }

      // Check provider name isn't generic
      const providerName = analysisResult.metadata.provider_name?.value;
      if (providerName && ['Hospital', 'Clinic', 'Medical Center', 'Billing Department'].some(generic =>
        providerName === generic)) {
        validationWarnings.push('Provider name appears generic - may need manual verification');
        if (analysisResult.metadata.provider_name) {
          analysisResult.metadata.provider_name.confidence = Math.min(
            analysisResult.metadata.provider_name.confidence,
            0.70
          );
        }
      }

      // Flag amounts over $100k for review
      const totalAmount = analysisResult.metadata.total_amount?.value;
      if (totalAmount && totalAmount > 100000) {
        validationWarnings.push('Amount exceeds $100,000 - flagged for review');
      }

      // Ensure confidence scores are in valid range
      for (const field of Object.values(analysisResult.metadata)) {
        if (field && typeof field === 'object' && 'confidence' in field) {
          if (field.confidence < 0 || field.confidence > 1) {
            console.warn(`Invalid confidence score ${field.confidence}, clamping to 0-1`);
            field.confidence = Math.max(0, Math.min(1, field.confidence));
          }
        }
      }
    }

    // Validate error calculations
    if (analysisResult.errors && analysisResult.errors.length > 0) {
      // Check total savings matches sum of individual errors
      const calculatedTotal = analysisResult.errors.reduce((sum, e) => sum + (e.potential_savings || 0), 0);
      const reportedTotal = analysisResult.total_potential_savings || 0;

      if (Math.abs(calculatedTotal - reportedTotal) > 1) {
        console.warn(`Savings mismatch: calculated ${calculatedTotal}, reported ${reportedTotal}`);
        // Use calculated total as it's more accurate
        analysisResult.total_potential_savings = calculatedTotal;
      }

      // Validate duplicate charge logic
      const duplicates = analysisResult.errors.filter(e => e.error_type === 'duplicate_charge');
      for (const dup of duplicates) {
        if (dup.evidence?.duplicate_count && dup.evidence?.charge_amount) {
          const expectedSavings = dup.evidence.charge_amount * (dup.evidence.duplicate_count - 1);
          if (Math.abs(expectedSavings - dup.potential_savings) > 1) {
            console.warn(`Duplicate charge calculation error in: ${dup.description}`);
          }
        }
      }
    }

    // Validate overall confidence score
    if (analysisResult.confidence_score < 0 || analysisResult.confidence_score > 1) {
      console.warn(`Invalid overall confidence ${analysisResult.confidence_score}, setting to 0.5`);
      analysisResult.confidence_score = 0.5;
    }

    // Merge validation warnings with extraction warnings
    if (validationWarnings.length > 0) {
      analysisResult.extraction_warnings = [
        ...(analysisResult.extraction_warnings || []),
        ...validationWarnings
      ];
    }

    console.log(`Validation complete. ${validationWarnings.length} warnings generated.`);

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

    // Store extracted metadata in receipt_ocr_data table
    if (analysisResult.metadata) {
      const metadata = analysisResult.metadata;

      // Calculate average confidence across all extracted fields
      const confidenceScores = Object.values(metadata)
        .filter((field): field is ExtractedField => field !== null && typeof field === 'object' && 'confidence' in field)
        .map(field => field.confidence);
      const avgConfidence = confidenceScores.length > 0
        ? confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length
        : 0.5;

      // Upsert metadata to receipt_ocr_data
      const { error: ocrError } = await supabase
        .from('receipt_ocr_data')
        .upsert({
          receipt_id: receiptId,
          extracted_vendor: metadata.provider_name?.value || null,
          extracted_amount: metadata.total_amount?.value || null,
          extracted_date: metadata.service_date?.value || metadata.bill_date?.value || null,
          extracted_category: metadata.category?.value || null,
          extracted_invoice_number: metadata.invoice_number?.value || null,
          extracted_insurance: metadata.insurance_company?.value || null,
          extracted_service_date: metadata.service_date?.value || null,
          extracted_bill_date: metadata.bill_date?.value || null,
          metadata_confidence: avgConfidence,
          metadata_full: metadata,
          extraction_warnings: analysisResult.extraction_warnings || [],
          confidence_score: analysisResult.confidence_score,
          processed_at: new Date().toISOString()
        }, {
          onConflict: 'receipt_id'
        });

      if (ocrError) {
        console.error('Error storing metadata (non-fatal):', ocrError);
        // Don't throw - metadata storage failure shouldn't break the whole flow
      } else {
        console.log('Metadata stored successfully');
      }
    }

    // Sync provider data in the background
    try {
    const requestId = crypto.randomUUID();
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
        metadata: analysisResult.metadata || null,
        totalPotentialSavings: analysisResult.total_potential_savings,
        errorsFound: analysisResult.errors?.length || 0,
        confidenceScore: analysisResult.confidence_score,
        warnings: analysisResult.extraction_warnings || []
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
