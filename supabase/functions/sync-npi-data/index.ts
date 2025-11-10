import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NPIResult {
  number: string;
  basic: {
    first_name?: string;
    last_name?: string;
    organization_name?: string;
    credential?: string;
    taxonomies: Array<{
      code: string;
      desc: string;
      primary: boolean;
      state?: string;
      license?: string;
    }>;
  };
  addresses: Array<{
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postal_code: string;
    country_code: string;
    telephone_number?: string;
    address_purpose: 'LOCATION' | 'MAILING';
  }>;
}

interface NPIResponse {
  result_count: number;
  results: NPIResult[];
}

async function fetchNPIData(npiNumber: string): Promise<NPIResult | null> {
  const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${npiNumber}`;
  
  console.log(`Fetching NPI data for: ${npiNumber}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`NPI Registry API error: ${response.status}`);
      return null;
    }
    
    const data: NPIResponse = await response.json();
    
    if (data.result_count === 0) {
      console.log(`No results found for NPI: ${npiNumber}`);
      return null;
    }
    
    return data.results[0];
  } catch (error) {
    console.error('Error fetching NPI data:', error);
    return null;
  }
}

function extractProviderData(npiData: NPIResult) {
  const { basic, addresses } = npiData;
  
  // Get primary taxonomy (specialty)
  const primaryTaxonomy = basic.taxonomies.find(t => t.primary) || basic.taxonomies[0];
  
  // Get location address
  const locationAddress = addresses.find(a => a.address_purpose === 'LOCATION') || addresses[0];
  
  // Extract all specialties
  const specialties = basic.taxonomies.map(t => t.desc).filter(Boolean);
  
  // Build provider name
  const providerName = basic.organization_name || 
    `${basic.first_name || ''} ${basic.last_name || ''}`.trim();
  
  return {
    name: providerName,
    specialty: primaryTaxonomy?.desc || null,
    taxonomy_codes: basic.taxonomies.map(t => t.code),
    address: locationAddress?.address_1 || null,
    city: locationAddress?.city || null,
    state: locationAddress?.state || null,
    zip: locationAddress?.postal_code || null,
    phone: locationAddress?.telephone_number || null,
    specialties_verified: true,
    data_last_updated: new Date().toISOString(),
  };
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

    const { npi_number, provider_id, batch_sync } = await req.json();

    let providersToSync = [];

    if (batch_sync) {
      // Sync all providers with NPI numbers that haven't been verified recently
      console.log('Starting batch sync of all providers...');
      
      const { data: providers, error } = await supabase
        .from('providers')
        .select('id, npi_number, data_last_updated')
        .not('npi_number', 'is', null)
        .or('specialties_verified.is.null,specialties_verified.eq.false,data_last_updated.lt.now() - interval \'30 days\'')
        .limit(50); // Limit batch size to avoid timeout

      if (error) {
        throw error;
      }

      providersToSync = providers || [];
      console.log(`Found ${providersToSync.length} providers to sync`);
    } else if (provider_id) {
      // Sync specific provider by ID
      const { data: provider, error } = await supabase
        .from('providers')
        .select('id, npi_number')
        .eq('id', provider_id)
        .single();

      if (error) {
        throw error;
      }

      if (!provider.npi_number) {
        return new Response(
          JSON.stringify({ error: 'Provider does not have an NPI number' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      providersToSync = [provider];
    } else if (npi_number) {
      // Sync provider by NPI number
      const { data: provider, error } = await supabase
        .from('providers')
        .select('id, npi_number')
        .eq('npi_number', npi_number)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (provider) {
        providersToSync = [provider];
      } else {
        // Provider doesn't exist, fetch data to potentially create
        console.log(`Provider with NPI ${npi_number} not found, fetching data...`);
        const npiData = await fetchNPIData(npi_number);
        
        if (!npiData) {
          return new Response(
            JSON.stringify({ error: 'NPI number not found in registry' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const providerData = extractProviderData(npiData);
        
        // Create new provider
        const { data: newProvider, error: insertError } = await supabase
          .from('providers')
          .insert({
            npi_number: npi_number,
            ...providerData,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'New provider created',
            provider: newProvider 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: npi_number, provider_id, or batch_sync' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sync all providers in the list
    const results = {
      total: providersToSync.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const provider of providersToSync) {
      try {
        const npiData = await fetchNPIData(provider.npi_number);
        
        if (!npiData) {
          results.failed++;
          results.errors.push(`NPI ${provider.npi_number}: Not found in registry`);
          continue;
        }

        const providerData = extractProviderData(npiData);
        
        const { error: updateError } = await supabase
          .from('providers')
          .update(providerData)
          .eq('id', provider.id);

        if (updateError) {
          results.failed++;
          results.errors.push(`Provider ${provider.id}: ${updateError.message}`);
          console.error(`Error updating provider ${provider.id}:`, updateError);
        } else {
          results.success++;
          console.log(`Successfully synced provider ${provider.id}`);
        }

        // Add small delay to avoid rate limiting
        if (providersToSync.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Provider ${provider.id}: ${errorMessage}`);
        console.error(`Error processing provider ${provider.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Synced ${results.success} of ${results.total} providers`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-npi-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
