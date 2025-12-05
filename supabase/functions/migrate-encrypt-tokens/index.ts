import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encryptPlaidToken } from '../_shared/encryption.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://wellth.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * ONE-TIME ADMIN FUNCTION
 * Encrypts all existing Plaid access tokens in the database
 *
 * SECURITY: Requires MIGRATION_ADMIN_KEY environment variable
 * DELETE THIS FUNCTION after migration is complete
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Starting Plaid token migration`);

    // Security check: Require admin key
    const { admin_key } = await req.json();
    const expectedAdminKey = Deno.env.get("MIGRATION_ADMIN_KEY");

    if (!expectedAdminKey) {
      throw new Error("MIGRATION_ADMIN_KEY not configured - migration disabled");
    }

    if (admin_key !== expectedAdminKey) {
      console.error(`[${requestId}] Unauthorized migration attempt`);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[${requestId}] Fetching connections with plaintext tokens...`);

    // Get all connections that need encryption
    const { data: connections, error: fetchError } = await supabase
      .from('plaid_connections')
      .select('id, access_token')
      .is('encrypted_access_token', null)
      .not('access_token', 'is', null);

    if (fetchError) {
      console.error(`[${requestId}] Database fetch error:`, fetchError);
      throw fetchError;
    }

    const totalCount = connections?.length || 0;
    console.log(`[${requestId}] Found ${totalCount} tokens to encrypt`);

    if (totalCount === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No tokens to migrate",
        total: 0,
        encrypted: 0,
        errors: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ id: string; error: string }> = [];

    // Encrypt each token
    for (const conn of connections) {
      try {
        console.log(`[${requestId}] Encrypting token for connection ${conn.id}`);

        const encryptedToken = await encryptPlaidToken(conn.access_token);

        const { error: updateError } = await supabase
          .from('plaid_connections')
          .update({ encrypted_access_token: encryptedToken })
          .eq('id', conn.id);

        if (updateError) {
          console.error(`[${requestId}] Failed to update connection ${conn.id}:`, updateError);
          errorCount++;
          errors.push({ id: conn.id, error: updateError.message });
        } else {
          successCount++;
        }
      } catch (encryptError) {
        const errorMsg = encryptError instanceof Error ? encryptError.message : 'Unknown error';
        console.error(`[${requestId}] Encryption error for ${conn.id}:`, errorMsg);
        errorCount++;
        errors.push({ id: conn.id, error: errorMsg });
      }
    }

    console.log(`[${requestId}] Migration complete: ${successCount}/${totalCount} succeeded`);

    return new Response(JSON.stringify({
      success: errorCount === 0,
      total: totalCount,
      encrypted: successCount,
      errors: errorCount,
      error_details: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: errorCount === 0 ? 200 : 207 // 207 Multi-Status for partial success
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[MIGRATION] Fatal error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
