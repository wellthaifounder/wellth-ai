import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Execute the migration SQL
    const migrationSQL = `
-- Migration: Add Hospital Price Transparency Tables
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cms_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location_name TEXT[],
  address JSONB,
  city TEXT,
  state TEXT,
  zip TEXT,
  license_information JSONB,
  type_2_npi TEXT[],
  pricing_file_url TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cms_id_format CHECK (cms_id ~ '^[0-9A-Z]+$')
);

CREATE TABLE IF NOT EXISTS hospital_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  setting TEXT CHECK (setting IN ('inpatient', 'outpatient', 'both')),
  billing_class TEXT,
  code TEXT NOT NULL,
  code_type TEXT NOT NULL,
  modifier_codes TEXT[],
  drug_unit NUMERIC,
  drug_type TEXT,
  gross_charge NUMERIC(12,2),
  discounted_cash_price NUMERIC(12,2),
  min_negotiated_charge NUMERIC(12,2),
  max_negotiated_charge NUMERIC(12,2),
  payer_name TEXT,
  plan_name TEXT,
  negotiated_rate NUMERIC(12,2),
  negotiated_percentage NUMERIC(5,2),
  negotiated_algorithm TEXT,
  median_allowed_amount NUMERIC(12,2),
  percentile_10_amount NUMERIC(12,2),
  percentile_90_amount NUMERIC(12,2),
  claim_count TEXT,
  methodology TEXT CHECK (methodology IN ('case rate', 'fee schedule', 'percent of total billed charges', 'per diem', 'other')),
  additional_payer_notes TEXT,
  additional_generic_notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_code_type CHECK (code_type IN ('CPT', 'HCPCS', 'NDC', 'RC', 'ICD', 'DRG', 'LOCAL', 'EAPG', 'CDT', 'HIPPS', 'MS-DRG', 'APC')),
  CONSTRAINT has_negotiated_rate CHECK (
    negotiated_rate IS NOT NULL OR
    negotiated_percentage IS NOT NULL OR
    negotiated_algorithm IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_hospitals_cms_id ON hospitals(cms_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_name ON hospitals USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_hospitals_state ON hospitals(state);
CREATE INDEX IF NOT EXISTS idx_hospital_pricing_hospital_id ON hospital_pricing(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_pricing_code ON hospital_pricing(code);
CREATE INDEX IF NOT EXISTS idx_hospital_pricing_code_type ON hospital_pricing(code_type);
CREATE INDEX IF NOT EXISTS idx_hospital_pricing_hospital_code ON hospital_pricing(hospital_id, code);
CREATE INDEX IF NOT EXISTS idx_hospital_pricing_payer ON hospital_pricing(payer_name);
CREATE INDEX IF NOT EXISTS idx_hospital_pricing_hospital_payer_code ON hospital_pricing(hospital_id, payer_name, code);
CREATE INDEX IF NOT EXISTS idx_hospital_pricing_description_fts ON hospital_pricing USING gin(to_tsvector('english', description));

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_pricing ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read hospital information') THEN
    CREATE POLICY "Anyone can read hospital information" ON hospitals FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read hospital pricing') THEN
    CREATE POLICY "Anyone can read hospital pricing" ON hospital_pricing FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can insert hospitals') THEN
    CREATE POLICY "Service role can insert hospitals" ON hospitals FOR INSERT TO service_role WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can update hospitals') THEN
    CREATE POLICY "Service role can update hospitals" ON hospitals FOR UPDATE TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can insert pricing') THEN
    CREATE POLICY "Service role can insert pricing" ON hospital_pricing FOR INSERT TO service_role WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can update pricing') THEN
    CREATE POLICY "Service role can update pricing" ON hospital_pricing FOR UPDATE TO service_role USING (true);
  END IF;
END $$;
    `;

    const { data, error } = await supabase.rpc("exec", { sql: migrationSQL });

    if (error) {
      console.error("Migration error:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Migration completed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
