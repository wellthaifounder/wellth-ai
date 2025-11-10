-- Drop existing provider_reviews table if it exists
DROP TABLE IF EXISTS public.provider_reviews CASCADE;

-- Create provider_reviews table with all necessary columns
CREATE TABLE public.provider_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  -- Multi-dimensional ratings (1-5 scale)
  overall_experience_rating INTEGER NOT NULL CHECK (overall_experience_rating BETWEEN 1 AND 5),
  billing_clarity_rating INTEGER NOT NULL CHECK (billing_clarity_rating BETWEEN 1 AND 5),
  cost_transparency_rating INTEGER NOT NULL CHECK (cost_transparency_rating BETWEEN 1 AND 5),
  payment_flexibility_rating INTEGER NOT NULL CHECK (payment_flexibility_rating BETWEEN 1 AND 5),
  
  -- Context about the visit
  insurance_plan_type TEXT,
  network_status TEXT CHECK (network_status IN ('in_network', 'out_of_network', 'unknown')),
  deductible_met BOOLEAN,
  procedure_category TEXT,
  
  -- Review content
  review_text TEXT,
  would_recommend BOOLEAN DEFAULT true,
  
  -- Verification and moderation
  is_verified_patient BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- One review per user per invoice
  UNIQUE(user_id, invoice_id)
);

-- Enable RLS
ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view non-flagged reviews and their own"
  ON public.provider_reviews
  FOR SELECT
  USING (public.can_view_provider_review(user_id, is_flagged));

CREATE POLICY "Users can create reviews for their own invoices"
  ON public.provider_reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update their own reviews"
  ON public.provider_reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.provider_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_provider_reviews_provider ON public.provider_reviews(provider_id);
CREATE INDEX idx_provider_reviews_user ON public.provider_reviews(user_id);
CREATE INDEX idx_provider_reviews_invoice ON public.provider_reviews(invoice_id);
CREATE INDEX idx_provider_reviews_flagged ON public.provider_reviews(is_flagged) WHERE is_flagged = false;

-- Update timestamp trigger
CREATE TRIGGER update_provider_reviews_updated_at
  BEFORE UPDATE ON public.provider_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update provider aggregates
CREATE TRIGGER trigger_update_provider_review_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON public.provider_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_provider_review_aggregates();