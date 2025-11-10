-- Phase 1: Database Schema Enhancements for Provider Transparency

-- 1.1 Enhance providers table with new transparency metrics
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS fair_pricing_score NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS regional_pricing_percentile INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS transparency_score NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS most_common_procedures JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS insurance_networks TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS specialties_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add NPI validation constraint
ALTER TABLE providers 
ADD CONSTRAINT valid_npi 
CHECK (npi_number IS NULL OR LENGTH(npi_number) = 10);

-- 1.2 Create regional_benchmarks table for price comparisons
CREATE TABLE IF NOT EXISTS regional_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_code TEXT NOT NULL,
  cpt_code TEXT NOT NULL,
  procedure_name TEXT,
  median_charge NUMERIC NOT NULL,
  p25_charge NUMERIC,
  p75_charge NUMERIC,
  p90_charge NUMERIC,
  sample_size INTEGER DEFAULT 1,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(region_code, cpt_code)
);

ALTER TABLE regional_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view regional benchmarks"
  ON regional_benchmarks FOR SELECT
  USING (true);

-- 1.3 Create procedure_insights table for provider-specific procedure data
CREATE TABLE IF NOT EXISTS procedure_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  cpt_code TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  procedure_category TEXT,
  average_patient_cost NUMERIC NOT NULL,
  median_patient_cost NUMERIC,
  typical_insurance_payment NUMERIC,
  times_performed INTEGER DEFAULT 1,
  fair_price_indicator TEXT CHECK (fair_price_indicator IN ('below_average', 'average', 'above_average', 'significantly_high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, cpt_code)
);

ALTER TABLE procedure_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view procedure insights"
  ON procedure_insights FOR SELECT
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_procedure_insights_updated_at
BEFORE UPDATE ON procedure_insights
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 1.4 Enhance provider_reviews with verification
ALTER TABLE provider_reviews
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bill_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS procedure_type TEXT,
ADD COLUMN IF NOT EXISTS visit_date DATE;

CREATE INDEX IF NOT EXISTS idx_provider_reviews_verified 
  ON provider_reviews(provider_id, is_verified);

-- 1.5 Create transparency_metrics table for aggregated data
CREATE TABLE IF NOT EXISTS transparency_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  top_transparent_providers JSONB DEFAULT '[]'::jsonb,
  top_overcharging_providers JSONB DEFAULT '[]'::jsonb,
  common_overcharge_trends JSONB DEFAULT '[]'::jsonb,
  regional_insights JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_date)
);

ALTER TABLE transparency_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view transparency metrics"
  ON transparency_metrics FOR SELECT
  USING (true);

-- Phase 2: Calculation Functions

-- 2.1 Fair Pricing Score Calculation Function
CREATE OR REPLACE FUNCTION calculate_fair_pricing_score(p_provider_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score NUMERIC;
  v_avg_variance NUMERIC;
BEGIN
  -- Calculate average variance from regional medians
  SELECT AVG(
    CASE 
      WHEN rb.median_charge > 0 THEN 
        ((pcb.average_charge - rb.median_charge) / rb.median_charge * 100)
      ELSE 0
    END
  ) INTO v_avg_variance
  FROM provider_charge_benchmarks pcb
  JOIN providers p ON pcb.provider_id = p.id
  LEFT JOIN regional_benchmarks rb ON 
    pcb.cpt_code = rb.cpt_code AND 
    rb.region_code = p.state
  WHERE pcb.provider_id = p_provider_id;
  
  -- Convert variance to score (lower variance = higher score)
  -- Score: 100 = at median, decreases as variance increases
  v_score := GREATEST(0, 100 - COALESCE(ABS(v_avg_variance), 0));
  
  RETURN ROUND(v_score, 2);
END;
$$;

-- 2.2 Update provider scores function
CREATE OR REPLACE FUNCTION update_provider_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update fair pricing score and transparency score
  UPDATE providers
  SET 
    fair_pricing_score = calculate_fair_pricing_score(NEW.provider_id),
    transparency_score = (
      COALESCE(billing_accuracy_score, 0) * 0.4 + 
      COALESCE(calculate_fair_pricing_score(NEW.provider_id), 0) * 0.4 + 
      COALESCE(overall_rating, 0) * 20 * 0.2
    ),
    data_last_updated = NOW()
  WHERE id = NEW.provider_id;
  
  RETURN NEW;
END;
$$;

-- 2.3 Create trigger to update scores when provider_bills changes
DROP TRIGGER IF EXISTS on_provider_bill_change ON provider_bills;
CREATE TRIGGER on_provider_bill_change
AFTER INSERT OR UPDATE ON provider_bills
FOR EACH ROW
EXECUTE FUNCTION update_provider_scores();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_providers_fair_pricing_score 
  ON providers(fair_pricing_score DESC NULLS LAST);
  
CREATE INDEX IF NOT EXISTS idx_providers_transparency_score 
  ON providers(transparency_score DESC NULLS LAST);
  
CREATE INDEX IF NOT EXISTS idx_procedure_insights_provider 
  ON procedure_insights(provider_id);
  
CREATE INDEX IF NOT EXISTS idx_regional_benchmarks_lookup 
  ON regional_benchmarks(region_code, cpt_code);