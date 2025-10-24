import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Medical expense keywords for auto-categorization
const MEDICAL_KEYWORDS = [
  'pharmacy', 'cvs', 'walgreens', 'rite aid', 'medical', 'hospital', 'clinic',
  'doctor', 'dentist', 'dental', 'orthodont', 'vision', 'optometry', 'physical therapy',
  'urgent care', 'lab', 'radiology', 'imaging', 'prescription', 'rx', 'health',
  'kaiser', 'blue cross', 'aetna', 'cigna', 'united health', 'humana'
];

function isMedicalTransaction(name: string, category: string[]): boolean {
  const searchText = `${name} ${category.join(' ')}`.toLowerCase();
  return MEDICAL_KEYWORDS.some(keyword => searchText.includes(keyword));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { connection_id, start_date, end_date } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const plaidSecretKey = Deno.env.get('PLAID_SANDBOX_SECRET_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('Syncing transactions for user:', user.id);

    // Get Plaid connection
    const { data: connection, error: connectionError } = await supabase
      .from('plaid_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connectionError || !connection) {
      console.error('Connection error:', connectionError);
      throw new Error('Connection not found');
    }

    // Fetch transactions from Plaid
    const transactionsResponse = await fetch('https://sandbox.plaid.com/transactions/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecretKey,
        access_token: connection.access_token,
        start_date: start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: end_date || new Date().toISOString().split('T')[0],
      }),
    });

    const transactionsData = await transactionsResponse.json();
    
    if (!transactionsResponse.ok) {
      console.error('Plaid transactions error:', transactionsData);
      throw new Error(transactionsData.error_message || 'Failed to fetch transactions');
    }

    console.log('Retrieved transactions:', transactionsData.transactions.length);

    // Process and store transactions
    const transactionsToInsert = transactionsData.transactions.map((txn: any) => {
      const isMedical = isMedicalTransaction(txn.name, txn.category || []);
      
      return {
        user_id: user.id,
        plaid_transaction_id: txn.transaction_id,
        transaction_date: txn.date,
        vendor: txn.merchant_name || txn.name,
        description: txn.name,
        amount: Math.abs(txn.amount),
        category: txn.category?.[0] || 'Other',
        is_medical: isMedical,
        is_hsa_eligible: isMedical,
        reconciliation_status: 'unlinked',
        source: 'plaid',
      };
    });

    // Insert transactions (ignore duplicates)
    if (transactionsToInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('transactions')
        .upsert(transactionsToInsert, {
          onConflict: 'plaid_transaction_id',
          ignoreDuplicates: true,
        })
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to store transactions');
      }

      console.log('Successfully inserted transactions:', inserted?.length || 0);

      // Update last sync time
      await supabase
        .from('plaid_connections')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', connection_id);

      return new Response(JSON.stringify({ 
        success: true,
        total: transactionsData.transactions.length,
        inserted: inserted?.length || 0,
        medical_detected: inserted?.filter((t: any) => t.is_medical).length || 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      total: 0,
      inserted: 0,
      medical_detected: 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in plaid-sync-transactions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
