import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { public_token } = await req.json();
    
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

    console.log('Exchanging public token for user:', user.id);

    // Exchange public token for access token
    const exchangeResponse = await fetch('https://sandbox.plaid.com/item/public_token/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: '679b0c9bf18b9c001afa6fdf',
        secret: plaidSecretKey,
        public_token,
      }),
    });

    const exchangeData = await exchangeResponse.json();
    
    if (!exchangeResponse.ok) {
      console.error('Plaid exchange error:', exchangeData);
      throw new Error(exchangeData.error_message || 'Failed to exchange token');
    }

    const { access_token, item_id } = exchangeData;

    // Get account info
    const accountsResponse = await fetch('https://sandbox.plaid.com/accounts/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: '679b0c9bf18b9c001afa6fdf',
        secret: plaidSecretKey,
        access_token,
      }),
    });

    const accountsData = await accountsResponse.json();
    
    if (!accountsResponse.ok) {
      console.error('Plaid accounts error:', accountsData);
      throw new Error(accountsData.error_message || 'Failed to get accounts');
    }

    console.log('Successfully retrieved accounts:', accountsData.accounts.length);

    // Store connection in database (you'll need to create a plaid_connections table)
    const { error: insertError } = await supabase
      .from('plaid_connections')
      .insert({
        user_id: user.id,
        access_token,
        item_id,
        institution_name: accountsData.item?.institution_id || 'Unknown',
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to store connection');
    }

    return new Response(JSON.stringify({ 
      success: true,
      accounts: accountsData.accounts 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in plaid-exchange-token:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
