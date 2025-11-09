import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invoiceId, billReviewId } = await req.json();

    console.log('Syncing provider data for invoice:', invoiceId);

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    // Get bill review details if provided
    let billReview = null;
    let errors = [];
    if (billReviewId) {
      const { data: reviewData, error: reviewError } = await supabaseClient
        .from('bill_reviews')
        .select('*')
        .eq('id', billReviewId)
        .single();

      if (!reviewError && reviewData) {
        billReview = reviewData;

        // Get errors
        const { data: errorsData } = await supabaseClient
          .from('bill_errors')
          .select('*')
          .eq('bill_review_id', billReviewId);

        errors = errorsData || [];
      }
    }

    // Find or create provider
    let provider;
    const { data: existingProvider } = await supabaseClient
      .from('providers')
      .select('*')
      .ilike('name', invoice.vendor)
      .single();

    if (existingProvider) {
      provider = existingProvider;
    } else {
      // Create new provider
      const { data: newProvider, error: providerError } = await supabaseClient
        .from('providers')
        .insert({
          name: invoice.vendor,
          provider_type: 'unknown',
          total_bills_analyzed: 0,
          billing_accuracy_score: 100
        })
        .select()
        .single();

      if (providerError) throw providerError;
      provider = newProvider;
    }

    // Create or update provider_bills record
    const overchargeAmount = billReview?.total_potential_savings || 0;
    const errorsFound = errors.length;

    const { error: billError } = await supabaseClient
      .from('provider_bills')
      .upsert({
        provider_id: provider.id,
        invoice_id: invoiceId,
        bill_review_id: billReviewId,
        bill_amount: invoice.amount,
        errors_found: errorsFound,
        overcharge_amount: overchargeAmount,
        was_disputed: false
      });

    if (billError) throw billError;

    console.log('Provider data synced successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        provider_id: provider.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in sync-provider-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
