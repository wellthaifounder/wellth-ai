-- Step 1: Add new fields to invoices table for provider and insurance tracking
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS npi_number TEXT,
ADD COLUMN IF NOT EXISTS insurance_plan_type TEXT,
ADD COLUMN IF NOT EXISTS insurance_plan_name TEXT,
ADD COLUMN IF NOT EXISTS network_status TEXT,
ADD COLUMN IF NOT EXISTS deductible_met BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deductible_portion NUMERIC;

-- Add check constraints separately
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'invoices_insurance_plan_type_check'
  ) THEN
    ALTER TABLE invoices 
    ADD CONSTRAINT invoices_insurance_plan_type_check 
    CHECK (insurance_plan_type IN ('hdhp_hsa', 'ppo', 'hmo', 'epo', 'pos', 'other'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'invoices_network_status_check'
  ) THEN
    ALTER TABLE invoices 
    ADD CONSTRAINT invoices_network_status_check 
    CHECK (network_status IN ('in_network', 'out_of_network', 'unknown'));
  END IF;
END $$;

-- Create index on npi_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_npi_number ON invoices(npi_number);

-- Step 2: Add new fields to provider_bills for insurance context
ALTER TABLE provider_bills
ADD COLUMN IF NOT EXISTS insurance_plan_type TEXT,
ADD COLUMN IF NOT EXISTS network_status TEXT,
ADD COLUMN IF NOT EXISTS deductible_met BOOLEAN,
ADD COLUMN IF NOT EXISTS error_confirmed_by_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS error_flagged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Update providers table to add new rating fields
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS billing_clarity_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_transparency_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_flexibility_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified_patient_reviews INTEGER DEFAULT 0;

-- Add comment explaining deductible_portion
COMMENT ON COLUMN invoices.deductible_portion IS 'Amount of this bill that went toward meeting the deductible (for split deductible scenarios)';