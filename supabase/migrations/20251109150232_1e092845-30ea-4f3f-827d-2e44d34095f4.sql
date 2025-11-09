-- Bill Review & Dispute Feature - Database Schema

-- Create enum types for bill review system
CREATE TYPE bill_review_status AS ENUM (
  'pending',
  'analyzing', 
  'reviewed',
  'disputed',
  'resolved'
);

CREATE TYPE bill_error_type AS ENUM (
  'duplicate_charge',
  'upcoding',
  'unbundling',
  'incorrect_quantity',
  'balance_billing',
  'out_of_network_surprise',
  'wrong_insurance_info',
  'coding_error',
  'uncovered_service',
  'other'
);

CREATE TYPE bill_error_category AS ENUM (
  'high_priority',
  'medium_priority',
  'low_priority',
  'informational'
);

CREATE TYPE bill_error_status AS ENUM (
  'identified',
  'user_confirmed',
  'user_dismissed',
  'disputed',
  'resolved'
);

CREATE TYPE dispute_status AS ENUM (
  'draft',
  'submitted',
  'in_review',
  'appealed',
  'resolved_favorable',
  'resolved_unfavorable',
  'withdrawn'
);

CREATE TYPE document_type AS ENUM (
  'original_bill',
  'insurance_eob',
  'price_comparison',
  'medical_records',
  'correspondence',
  'appeal_letter',
  'resolution_letter',
  'other'
);

CREATE TYPE communication_type AS ENUM (
  'phone_call',
  'email',
  'letter',
  'portal_message',
  'in_person'
);

CREATE TYPE communication_direction AS ENUM (
  'outbound',
  'inbound'
);

-- Main bill review table
CREATE TABLE IF NOT EXISTS public.bill_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  review_status bill_review_status NOT NULL DEFAULT 'pending',
  total_potential_savings NUMERIC(10,2) DEFAULT 0,
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual billing errors
CREATE TABLE IF NOT EXISTS public.bill_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_review_id UUID NOT NULL REFERENCES public.bill_reviews(id) ON DELETE CASCADE,
  error_type bill_error_type NOT NULL,
  error_category bill_error_category NOT NULL DEFAULT 'medium_priority',
  description TEXT NOT NULL,
  line_item_reference TEXT,
  potential_savings NUMERIC(10,2) DEFAULT 0,
  evidence JSONB DEFAULT '{}'::jsonb,
  status bill_error_status NOT NULL DEFAULT 'identified',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dispute case management
CREATE TABLE IF NOT EXISTS public.bill_disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_review_id UUID REFERENCES public.bill_reviews(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  dispute_status dispute_status NOT NULL DEFAULT 'draft',
  provider_name TEXT NOT NULL,
  provider_contact_info JSONB DEFAULT '{}'::jsonb,
  insurance_company TEXT,
  insurance_contact_info JSONB DEFAULT '{}'::jsonb,
  claim_number TEXT,
  original_amount NUMERIC(10,2) NOT NULL,
  disputed_amount NUMERIC(10,2) NOT NULL,
  resolved_amount NUMERIC(10,2),
  savings_achieved NUMERIC(10,2),
  dispute_reason TEXT,
  submitted_date DATE,
  response_deadline DATE,
  resolution_date DATE,
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Supporting evidence documents
CREATE TABLE IF NOT EXISTS public.dispute_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES public.bill_disputes(id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL,
  document_type document_type NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Communication log
CREATE TABLE IF NOT EXISTS public.dispute_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES public.bill_disputes(id) ON DELETE CASCADE,
  communication_type communication_type NOT NULL,
  direction communication_direction NOT NULL,
  contact_person TEXT,
  summary TEXT NOT NULL,
  outcome TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CPT code reference for pricing and bundling
CREATE TABLE IF NOT EXISTS public.cpt_code_reference (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpt_code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT,
  medicare_rate NUMERIC(10,2),
  bundling_rules JSONB DEFAULT '{}'::jsonb,
  common_modifiers TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add user profile field for HSA status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_hsa BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bill_reviews_user_id ON public.bill_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_reviews_invoice_id ON public.bill_reviews(invoice_id);
CREATE INDEX IF NOT EXISTS idx_bill_reviews_status ON public.bill_reviews(review_status);
CREATE INDEX IF NOT EXISTS idx_bill_errors_review_id ON public.bill_errors(bill_review_id);
CREATE INDEX IF NOT EXISTS idx_bill_errors_status ON public.bill_errors(status);
CREATE INDEX IF NOT EXISTS idx_bill_disputes_user_id ON public.bill_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_disputes_status ON public.bill_disputes(dispute_status);
CREATE INDEX IF NOT EXISTS idx_dispute_documents_dispute_id ON public.dispute_documents(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_communications_dispute_id ON public.dispute_communications(dispute_id);
CREATE INDEX IF NOT EXISTS idx_cpt_code_reference_code ON public.cpt_code_reference(cpt_code);

-- Enable Row Level Security
ALTER TABLE public.bill_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpt_code_reference ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bill_reviews
CREATE POLICY "Users can view their own bill reviews"
  ON public.bill_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bill reviews"
  ON public.bill_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bill reviews"
  ON public.bill_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bill reviews"
  ON public.bill_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for bill_errors
CREATE POLICY "Users can view errors from their bill reviews"
  ON public.bill_errors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bill_reviews
      WHERE bill_reviews.id = bill_errors.bill_review_id
      AND bill_reviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create errors for their bill reviews"
  ON public.bill_errors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bill_reviews
      WHERE bill_reviews.id = bill_errors.bill_review_id
      AND bill_reviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update errors from their bill reviews"
  ON public.bill_errors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bill_reviews
      WHERE bill_reviews.id = bill_errors.bill_review_id
      AND bill_reviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete errors from their bill reviews"
  ON public.bill_errors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bill_reviews
      WHERE bill_reviews.id = bill_errors.bill_review_id
      AND bill_reviews.user_id = auth.uid()
    )
  );

-- RLS Policies for bill_disputes
CREATE POLICY "Users can view their own disputes"
  ON public.bill_disputes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own disputes"
  ON public.bill_disputes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own disputes"
  ON public.bill_disputes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own disputes"
  ON public.bill_disputes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dispute_documents
CREATE POLICY "Users can view documents from their disputes"
  ON public.dispute_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bill_disputes
      WHERE bill_disputes.id = dispute_documents.dispute_id
      AND bill_disputes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents for their disputes"
  ON public.dispute_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bill_disputes
      WHERE bill_disputes.id = dispute_documents.dispute_id
      AND bill_disputes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents from their disputes"
  ON public.dispute_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bill_disputes
      WHERE bill_disputes.id = dispute_documents.dispute_id
      AND bill_disputes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents from their disputes"
  ON public.dispute_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bill_disputes
      WHERE bill_disputes.id = dispute_documents.dispute_id
      AND bill_disputes.user_id = auth.uid()
    )
  );

-- RLS Policies for dispute_communications
CREATE POLICY "Users can view communications from their disputes"
  ON public.dispute_communications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bill_disputes
      WHERE bill_disputes.id = dispute_communications.dispute_id
      AND bill_disputes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create communications for their disputes"
  ON public.dispute_communications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bill_disputes
      WHERE bill_disputes.id = dispute_communications.dispute_id
      AND bill_disputes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update communications from their disputes"
  ON public.dispute_communications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bill_disputes
      WHERE bill_disputes.id = dispute_communications.dispute_id
      AND bill_disputes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete communications from their disputes"
  ON public.dispute_communications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bill_disputes
      WHERE bill_disputes.id = dispute_communications.dispute_id
      AND bill_disputes.user_id = auth.uid()
    )
  );

-- RLS Policies for cpt_code_reference (public read access)
CREATE POLICY "Anyone can view CPT code reference"
  ON public.cpt_code_reference FOR SELECT
  USING (true);

-- Create trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_bill_reviews_updated_at
  BEFORE UPDATE ON public.bill_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bill_disputes_updated_at
  BEFORE UPDATE ON public.bill_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cpt_code_reference_updated_at
  BEFORE UPDATE ON public.cpt_code_reference
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();