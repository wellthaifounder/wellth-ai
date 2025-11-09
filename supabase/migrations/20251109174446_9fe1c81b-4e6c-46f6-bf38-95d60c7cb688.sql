-- Create providers table to track healthcare provider information and performance
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_type TEXT, -- hospital, clinic, lab, imaging, etc.
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  website TEXT,
  npi_number TEXT UNIQUE, -- National Provider Identifier
  tax_id TEXT,
  specialties TEXT[], -- array of specialties
  network_status TEXT DEFAULT 'unknown', -- in-network, out-of-network, both, unknown
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Performance metrics
  total_bills_analyzed INTEGER DEFAULT 0,
  total_disputes_filed INTEGER DEFAULT 0,
  disputes_won INTEGER DEFAULT 0,
  disputes_lost INTEGER DEFAULT 0,
  average_bill_amount NUMERIC DEFAULT 0,
  total_overcharges_found NUMERIC DEFAULT 0,
  billing_accuracy_score NUMERIC DEFAULT 100, -- 0-100 scale
  
  -- Ratings
  overall_rating NUMERIC DEFAULT 0, -- 0-5 scale
  cost_rating NUMERIC DEFAULT 0,
  accuracy_rating NUMERIC DEFAULT 0,
  response_rating NUMERIC DEFAULT 0
);

-- Create provider bills junction table to track which bills belong to which provider
CREATE TABLE IF NOT EXISTS public.provider_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  bill_review_id UUID REFERENCES public.bill_reviews(id) ON DELETE SET NULL,
  
  -- Bill-specific metrics
  bill_amount NUMERIC NOT NULL,
  errors_found INTEGER DEFAULT 0,
  overcharge_amount NUMERIC DEFAULT 0,
  was_disputed BOOLEAN DEFAULT false,
  dispute_outcome TEXT, -- favorable, unfavorable, pending, withdrawn
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(provider_id, invoice_id)
);

-- Create provider charge benchmarks table for tracking typical charges
CREATE TABLE IF NOT EXISTS public.provider_charge_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  cpt_code TEXT NOT NULL,
  procedure_name TEXT,
  
  -- Charge statistics
  average_charge NUMERIC NOT NULL,
  median_charge NUMERIC,
  min_charge NUMERIC,
  max_charge NUMERIC,
  sample_size INTEGER DEFAULT 1,
  
  -- Benchmarking
  medicare_rate NUMERIC,
  variance_from_medicare NUMERIC, -- percentage
  variance_from_national NUMERIC, -- percentage
  
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(provider_id, cpt_code)
);

-- Create provider reviews table for user feedback
CREATE TABLE IF NOT EXISTS public.provider_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Ratings
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  cost_rating INTEGER CHECK (cost_rating >= 1 AND cost_rating <= 5),
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  response_rating INTEGER CHECK (response_rating >= 1 AND response_rating <= 5),
  
  -- Review content
  review_text TEXT,
  would_recommend BOOLEAN,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(provider_id, user_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_charge_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for providers (everyone can view, system can manage)
CREATE POLICY "Anyone can view providers"
ON public.providers FOR SELECT
USING (true);

CREATE POLICY "Service role can manage providers"
ON public.providers FOR ALL
USING (auth.role() = 'service_role');

-- RLS Policies for provider_bills (users can see their own bills)
CREATE POLICY "Users can view their provider bills"
ON public.provider_bills FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = provider_bills.invoice_id
    AND invoices.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their provider bills"
ON public.provider_bills FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = provider_bills.invoice_id
    AND invoices.user_id = auth.uid()
  )
);

-- RLS Policies for provider_charge_benchmarks (everyone can view)
CREATE POLICY "Anyone can view provider benchmarks"
ON public.provider_charge_benchmarks FOR SELECT
USING (true);

CREATE POLICY "Service role can manage benchmarks"
ON public.provider_charge_benchmarks FOR ALL
USING (auth.role() = 'service_role');

-- RLS Policies for provider_reviews
CREATE POLICY "Anyone can view provider reviews"
ON public.provider_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reviews"
ON public.provider_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.provider_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.provider_reviews FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_providers_name ON public.providers(name);
CREATE INDEX idx_providers_npi ON public.providers(npi_number);
CREATE INDEX idx_providers_billing_accuracy ON public.providers(billing_accuracy_score DESC);
CREATE INDEX idx_provider_bills_provider ON public.provider_bills(provider_id);
CREATE INDEX idx_provider_bills_invoice ON public.provider_bills(invoice_id);
CREATE INDEX idx_provider_benchmarks_provider ON public.provider_charge_benchmarks(provider_id);
CREATE INDEX idx_provider_benchmarks_cpt ON public.provider_charge_benchmarks(cpt_code);
CREATE INDEX idx_provider_reviews_provider ON public.provider_reviews(provider_id);

-- Create function to update provider statistics
CREATE OR REPLACE FUNCTION public.update_provider_statistics(p_provider_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_bills INTEGER;
  v_total_disputes INTEGER;
  v_disputes_won INTEGER;
  v_disputes_lost INTEGER;
  v_avg_amount NUMERIC;
  v_total_overcharges NUMERIC;
  v_accuracy_score NUMERIC;
BEGIN
  -- Calculate statistics from provider_bills
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE was_disputed = true),
    COUNT(*) FILTER (WHERE dispute_outcome = 'favorable'),
    COUNT(*) FILTER (WHERE dispute_outcome = 'unfavorable'),
    AVG(bill_amount),
    SUM(overcharge_amount)
  INTO 
    v_total_bills,
    v_total_disputes,
    v_disputes_won,
    v_disputes_lost,
    v_avg_amount,
    v_total_overcharges
  FROM provider_bills
  WHERE provider_id = p_provider_id;
  
  -- Calculate billing accuracy score (100 - percentage of bills with errors)
  IF v_total_bills > 0 THEN
    SELECT 
      100 - (COUNT(*) FILTER (WHERE errors_found > 0)::NUMERIC / v_total_bills * 100)
    INTO v_accuracy_score
    FROM provider_bills
    WHERE provider_id = p_provider_id;
  ELSE
    v_accuracy_score := 100;
  END IF;
  
  -- Update provider record
  UPDATE providers
  SET
    total_bills_analyzed = COALESCE(v_total_bills, 0),
    total_disputes_filed = COALESCE(v_total_disputes, 0),
    disputes_won = COALESCE(v_disputes_won, 0),
    disputes_lost = COALESCE(v_disputes_lost, 0),
    average_bill_amount = COALESCE(v_avg_amount, 0),
    total_overcharges_found = COALESCE(v_total_overcharges, 0),
    billing_accuracy_score = COALESCE(v_accuracy_score, 100),
    updated_at = now()
  WHERE id = p_provider_id;
  
  -- Update ratings from reviews
  UPDATE providers
  SET
    overall_rating = (SELECT AVG(overall_rating) FROM provider_reviews WHERE provider_id = p_provider_id),
    cost_rating = (SELECT AVG(cost_rating) FROM provider_reviews WHERE provider_id = p_provider_id),
    accuracy_rating = (SELECT AVG(accuracy_rating) FROM provider_reviews WHERE provider_id = p_provider_id),
    response_rating = (SELECT AVG(response_rating) FROM provider_reviews WHERE provider_id = p_provider_id)
  WHERE id = p_provider_id;
END;
$$;

-- Create trigger to update provider stats when bills change
CREATE OR REPLACE FUNCTION public.trigger_update_provider_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_provider_statistics(OLD.provider_id);
    RETURN OLD;
  ELSE
    PERFORM update_provider_statistics(NEW.provider_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER update_provider_stats_on_bill_change
AFTER INSERT OR UPDATE OR DELETE ON public.provider_bills
FOR EACH ROW
EXECUTE FUNCTION trigger_update_provider_stats();

-- Create trigger to update provider stats when reviews change
CREATE TRIGGER update_provider_stats_on_review_change
AFTER INSERT OR UPDATE OR DELETE ON public.provider_reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_update_provider_stats();

-- Create trigger for updated_at on providers
CREATE TRIGGER update_providers_updated_at
BEFORE UPDATE ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();