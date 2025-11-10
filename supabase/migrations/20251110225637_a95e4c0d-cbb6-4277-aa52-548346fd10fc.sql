-- Create provider_reviews table for multi-dimensional ratings
CREATE TABLE IF NOT EXISTS provider_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Multi-dimensional ratings (1-5 stars)
  overall_rating NUMERIC(2,1) CHECK (overall_rating >= 1 AND overall_rating <= 5),
  care_quality_rating NUMERIC(2,1) CHECK (care_quality_rating IS NULL OR (care_quality_rating >= 1 AND care_quality_rating <= 5)),
  billing_transparency_rating NUMERIC(2,1) CHECK (billing_transparency_rating IS NULL OR (billing_transparency_rating >= 1 AND billing_transparency_rating <= 5)),
  staff_responsiveness_rating NUMERIC(2,1) CHECK (staff_responsiveness_rating IS NULL OR (staff_responsiveness_rating >= 1 AND staff_responsiveness_rating <= 5)),
  payment_flexibility_rating NUMERIC(2,1) CHECK (payment_flexibility_rating IS NULL OR (payment_flexibility_rating >= 1 AND payment_flexibility_rating <= 5)),
  
  -- Context
  visit_date DATE,
  procedure_type TEXT,
  insurance_plan_type TEXT,
  
  -- Review content
  review_text TEXT,
  would_recommend BOOLEAN,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE provider_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own provider reviews"
  ON provider_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all provider reviews"
  ON provider_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own provider reviews"
  ON provider_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own provider reviews"
  ON provider_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_reviews_provider_id ON provider_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_reviews_user_id ON provider_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_reviews_insurance_plan ON provider_reviews(insurance_plan_type);

-- Add missing columns to provider_bills for insurance plan tracking
ALTER TABLE provider_bills 
  ADD COLUMN IF NOT EXISTS insurance_plan_type TEXT,
  ADD COLUMN IF NOT EXISTS network_status TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS deductible_met BOOLEAN,
  ADD COLUMN IF NOT EXISTS confirmed_errors JSONB DEFAULT '[]'::jsonb;

-- Create index for insurance plan filtering
CREATE INDEX IF NOT EXISTS idx_provider_bills_insurance_plan ON provider_bills(insurance_plan_type);

-- Update trigger for provider_reviews
CREATE OR REPLACE FUNCTION update_provider_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_provider_reviews_updated_at
  BEFORE UPDATE ON provider_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_reviews_updated_at();