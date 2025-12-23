import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptPlaidToken } from '../_shared/encryption.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://wellth-ai.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

// Helper function to get Plaid URL based on environment
const getPlaidUrl = (): string => {
  const env = Deno.env.get('PLAID_ENV') || 'sandbox';

  const urls: Record<string, string> = {
    'sandbox': 'https://sandbox.plaid.com',
    'development': 'https://development.plaid.com',
    'production': 'https://production.plaid.com'
  };

  return urls[env] || urls['sandbox'];
};

// Comprehensive medical expense keywords for auto-categorization
const MEDICAL_KEYWORDS = [
  // Pharmacies
  'cvs', 'walgreens', 'rite aid', 'walmart pharmacy', 'kroger pharmacy',
  'costco pharmacy', 'target pharmacy', 'publix pharmacy', 'safeway pharmacy',
  // Healthcare providers
  'kaiser', 'sutter', 'dignity health', 'adventist health', 'scripps',
  'sharp', 'hoag', 'cedars-sinai', 'ucla health', 'stanford health',
  // Labs
  'quest diagnostics', 'labcorp', 'biomat', 'grifols',
  // Vision
  'visionworks', 'lenscrafters', 'pearle vision', 'eyeglass world',
  // Dental
  'aspen dental', 'gentle dental', 'bright now dental',
  // Medical supplies
  'medline', 'fsa store', 'hsa store', 'direct medical',
  // Telehealth
  'teladoc', 'doctor on demand', 'amwell', 'mdlive',
  // Mental health
  'talkspace', 'betterhelp', 'cerebral', 'headspace care',
  // Common terms
  'pharmacy', 'medical', 'hospital', 'clinic', 'doctor', 'dentist', 'dental',
  'orthodont', 'vision', 'optometry', 'physical therapy', 'urgent care',
  'lab', 'radiology', 'imaging', 'prescription', 'rx', 'health',
  'blue cross', 'aetna', 'cigna', 'united health', 'humana',
  'dr ', 'dds', 'dmd', 'chiropractic', 'pediatric', 'dermatology',
  'cardiology', 'orthopedic', 'veterinary'
];

const MEDICAL_CATEGORIES = [
  'healthcare', 'pharmacy', 'medical', 'dentist', 'optometrist',
  'veterinary', 'healthcare services', 'pharmacies', 'medical services'
];

function isMedicalTransaction(name: string, category: string[]): boolean {
  const searchText = name.toLowerCase();
  const categoryText = category.join(' ').toLowerCase();
  
  // Check vendor name
  const hasVendorMatch = MEDICAL_KEYWORDS.some(keyword => searchText.includes(keyword));
  
  // Check category
  const hasCategoryMatch = MEDICAL_CATEGORIES.some(medCat => 
    categoryText.includes(medCat)
  );
  
  return hasVendorMatch || hasCategoryMatch;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    const { connection_id, start_date, end_date } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')!;
    const plaidSecretKey = Deno.env.get('PLAID_SECRET')!;
    const plaidBaseUrl = getPlaidUrl();

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log(`[${requestId}] Syncing transactions`);

    // Get Plaid connection
    const { data: connection, error: connectionError } = await supabase
      .from('plaid_connections')
      .select('encrypted_access_token, item_id, institution_name')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connectionError || !connection) {
      console.error('Connection error:', connectionError);
      throw new Error('Connection not found');
    }

    // Decrypt the access token
    console.log(`[${requestId}] Decrypting Plaid access token`);
    const access_token = await decryptPlaidToken(connection.encrypted_access_token);

    // Fetch transactions from Plaid
    console.log(`[${requestId}] Fetching transactions from ${plaidBaseUrl}`);
    const transactionsResponse = await fetch(`${plaidBaseUrl}/transactions/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecretKey,
        access_token,
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

    // Get user's vendor preferences for better categorization
    const { data: userPreferences } = await supabase
      .from('user_vendor_preferences')
      .select('vendor_pattern, is_medical')
      .eq('user_id', user.id);

    // Get user's invoices for matching
    const { data: userInvoices } = await supabase
      .from('invoices')
      .select('id, vendor, amount, date, invoice_date')
      .eq('user_id', user.id)
      .eq('is_reimbursed', false);

    // Process and store transactions
    const transactionsToInsert = transactionsData.transactions.map((txn: any) => {
      const vendorName = txn.merchant_name || txn.name;
      
      // Check user's learned preferences first
      let isMedical = false;
      if (userPreferences) {
        const preference = userPreferences.find(p => 
          vendorName.toLowerCase().includes(p.vendor_pattern.toLowerCase())
        );
        if (preference) {
          isMedical = preference.is_medical;
        }
      }
      
      // Fall back to keyword detection
      if (!isMedical) {
        isMedical = isMedicalTransaction(txn.name, txn.category || []);
      }
      
      return {
        user_id: user.id,
        plaid_transaction_id: txn.transaction_id,
        transaction_date: txn.date,
        vendor: vendorName,
        description: txn.name,
        amount: Math.abs(txn.amount),
        category: isMedical ? 'medical' : (txn.category?.[0] || 'Other'),
        is_medical: isMedical,
        is_hsa_eligible: isMedical,
        reconciliation_status: isMedical ? 'linked' : 'unlinked',
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
