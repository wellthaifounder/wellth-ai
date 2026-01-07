-- Migration: Add Hospital Price Transparency Tables
-- Purpose: Support CMS Hospital Price Transparency data integration per Marshall Allen principles
-- Reference: 45 CFR § 180.50 (Hospital Price Transparency Rule)

-- Table: hospitals
-- Stores hospital information from CMS data
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cms_id TEXT UNIQUE NOT NULL, -- CMS Certification Number (CCN)
  name TEXT NOT NULL,
  location_name TEXT[], -- Array of location names (hospitals can have multiple locations)
  address JSONB, -- Structured address data
  city TEXT,
  state TEXT,
  zip TEXT,
  license_information JSONB, -- License number and state
  type_2_npi TEXT[], -- Array of Type 2 (organizational) NPIs
  pricing_file_url TEXT, -- Link to CMS machine-readable JSON file
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT cms_id_format CHECK (cms_id ~ '^[0-9A-Z]+$')
);

-- Table: hospital_pricing
-- Stores standard charge information from CMS hospital price transparency files
-- Schema based on CMS v3.0 specification
CREATE TABLE IF NOT EXISTS hospital_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,

  -- Item/Service Information
  description TEXT NOT NULL,
  setting TEXT CHECK (setting IN ('inpatient', 'outpatient', 'both')),
  billing_class TEXT,

  -- Code Information (can have multiple codes per item)
  code TEXT NOT NULL, -- CPT, HCPCS, NDC, Revenue Center, DRG, etc.
  code_type TEXT NOT NULL, -- 'CPT', 'HCPCS', 'NDC', 'RC', 'ICD', 'DRG', 'LOCAL', 'EAPG', 'CDT', 'HIPPS', 'MS-DRG', 'APC'
  modifier_codes TEXT[], -- Array of modifier codes

  -- Drug Information (if applicable)
  drug_unit NUMERIC,
  drug_type TEXT, -- 'GR', 'ME', 'ML', 'UN', 'F2', 'EA', 'GM'

  -- Standard Charges
  gross_charge NUMERIC(12,2), -- Chargemaster price
  discounted_cash_price NUMERIC(12,2), -- Cash-pay rate
  min_negotiated_charge NUMERIC(12,2), -- De-identified minimum
  max_negotiated_charge NUMERIC(12,2), -- De-identified maximum

  -- Payer-Specific Information
  payer_name TEXT, -- Insurance company name
  plan_name TEXT, -- Specific insurance plan
  negotiated_rate NUMERIC(12,2), -- Actual negotiated dollar amount
  negotiated_percentage NUMERIC(5,2), -- Percentage-based rate
  negotiated_algorithm TEXT, -- Formula for calculation

  -- Statistical Information (required April 1, 2026)
  median_allowed_amount NUMERIC(12,2),
  percentile_10_amount NUMERIC(12,2),
  percentile_90_amount NUMERIC(12,2),
  claim_count TEXT, -- '0', '1 through 10', or '>= 11'

  -- Metadata
  methodology TEXT CHECK (methodology IN ('case rate', 'fee schedule', 'percent of total billed charges', 'per diem', 'other')),
  additional_payer_notes TEXT,
  additional_generic_notes TEXT,

  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_code_type CHECK (code_type IN ('CPT', 'HCPCS', 'NDC', 'RC', 'ICD', 'DRG', 'LOCAL', 'EAPG', 'CDT', 'HIPPS', 'MS-DRG', 'APC')),
  CONSTRAINT has_negotiated_rate CHECK (
    negotiated_rate IS NOT NULL OR
    negotiated_percentage IS NOT NULL OR
    negotiated_algorithm IS NOT NULL
  )
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_hospitals_cms_id ON hospitals(cms_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_name ON hospitals USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_hospitals_state ON hospitals(state);

CREATE INDEX IF NOT EXISTS idx_hospital_pricing_hospital_id ON hospital_pricing(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_pricing_code ON hospital_pricing(code);
CREATE INDEX IF NOT EXISTS idx_hospital_pricing_code_type ON hospital_pricing(code_type);
CREATE INDEX IF NOT EXISTS idx_hospital_pricing_hospital_code ON hospital_pricing(hospital_id, code);
CREATE INDEX IF NOT EXISTS idx_hospital_pricing_payer ON hospital_pricing(payer_name);
CREATE INDEX IF NOT EXISTS idx_hospital_pricing_hospital_payer_code ON hospital_pricing(hospital_id, payer_name, code);

-- Full-text search index for procedure descriptions
CREATE INDEX IF NOT EXISTS idx_hospital_pricing_description_fts ON hospital_pricing USING gin(to_tsvector('english', description));

-- Row Level Security (RLS) Policies
-- Hospital pricing data is public per CMS regulations, but we'll restrict writes

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_pricing ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read hospital data (public information per CMS rules)
CREATE POLICY "Anyone can read hospital information"
  ON hospitals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read hospital pricing"
  ON hospital_pricing
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update hospital data (admin-only via edge functions)
CREATE POLICY "Service role can insert hospitals"
  ON hospitals
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update hospitals"
  ON hospitals
  FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert pricing"
  ON hospital_pricing
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update pricing"
  ON hospital_pricing
  FOR UPDATE
  TO service_role
  USING (true);

-- Comments for documentation
COMMENT ON TABLE hospitals IS 'CMS-certified hospitals with price transparency data. Reference: 45 CFR § 180.50';
COMMENT ON TABLE hospital_pricing IS 'Standard charge information from hospital machine-readable files (CMS v3.0 schema)';

COMMENT ON COLUMN hospitals.cms_id IS 'CMS Certification Number (CCN) - unique identifier for Medicare/Medicaid certified facilities';
COMMENT ON COLUMN hospitals.type_2_npi IS 'Array of Type 2 (organizational) National Provider Identifiers';
COMMENT ON COLUMN hospitals.pricing_file_url IS 'URL to hospital''s CMS-compliant machine-readable pricing file';

COMMENT ON COLUMN hospital_pricing.code IS 'Billing/accounting code (CPT, HCPCS, NDC, Revenue Center, DRG, etc.)';
COMMENT ON COLUMN hospital_pricing.gross_charge IS 'Chargemaster price before any discounts';
COMMENT ON COLUMN hospital_pricing.discounted_cash_price IS 'Cash-pay rate offered to self-pay patients';
COMMENT ON COLUMN hospital_pricing.min_negotiated_charge IS 'De-identified minimum negotiated charge across all payers';
COMMENT ON COLUMN hospital_pricing.max_negotiated_charge IS 'De-identified maximum negotiated charge across all payers';
COMMENT ON COLUMN hospital_pricing.negotiated_rate IS 'Payer-specific negotiated dollar amount';
COMMENT ON COLUMN hospital_pricing.median_allowed_amount IS 'Median allowed amount (required April 1, 2026)';
