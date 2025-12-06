-- Add the missing function before the provider_reviews table creation

-- Helper function for provider reviews RLS
CREATE OR REPLACE FUNCTION public.can_view_provider_review(review_user_id UUID, review_is_flagged BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
  -- Users can see their own reviews, or non-flagged reviews
  RETURN auth.uid() = review_user_id OR review_is_flagged = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper function for updating provider review aggregates
CREATE OR REPLACE FUNCTION public.update_provider_review_aggregates()
RETURNS TRIGGER AS $$
DECLARE
  affected_provider_id UUID;
BEGIN
  -- Get the provider_id from either NEW or OLD record
  IF TG_OP = 'DELETE' THEN
    affected_provider_id := OLD.provider_id;
  ELSE
    affected_provider_id := NEW.provider_id;
  END IF;

  -- Update provider aggregate ratings
  UPDATE providers
  SET
    overall_rating = (
      SELECT AVG(overall_experience_rating)
      FROM provider_reviews
      WHERE provider_id = affected_provider_id
      AND is_flagged = false
    ),
    billing_clarity_score = (
      SELECT AVG(billing_clarity_rating)
      FROM provider_reviews
      WHERE provider_id = affected_provider_id
      AND is_flagged = false
    ),
    cost_transparency_score = (
      SELECT AVG(cost_transparency_rating)
      FROM provider_reviews
      WHERE provider_id = affected_provider_id
      AND is_flagged = false
    ),
    payment_flexibility_score = (
      SELECT AVG(payment_flexibility_rating)
      FROM provider_reviews
      WHERE provider_id = affected_provider_id
      AND is_flagged = false
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM provider_reviews
      WHERE provider_id = affected_provider_id
      AND is_flagged = false
    ),
    verified_patient_reviews = (
      SELECT COUNT(*)
      FROM provider_reviews
      WHERE provider_id = affected_provider_id
      AND is_verified_patient = true
      AND is_flagged = false
    )
  WHERE id = affected_provider_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'debit_card', 'hsa_card', 'fsa_card')),
  rewards_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Payment methods policies
CREATE POLICY "Users can view their own payment methods"
  ON public.payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods"
  ON public.payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
  ON public.payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
  ON public.payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  vendor TEXT NOT NULL,
  category TEXT NOT NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  is_hsa_eligible BOOLEAN DEFAULT false,
  notes TEXT,
  is_reimbursed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "Users can view their own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Create receipts table
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on receipts
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Receipts policies - users can only see receipts for their own expenses
CREATE POLICY "Users can view receipts for their own expenses"
  ON public.receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE expenses.id = receipts.expense_id
      AND expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert receipts for their own expenses"
  ON public.receipts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE expenses.id = receipts.expense_id
      AND expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete receipts for their own expenses"
  ON public.receipts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE expenses.id = receipts.expense_id
      AND expenses.user_id = auth.uid()
    )
  );

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false);

-- Create storage policies for receipts
CREATE POLICY "Users can view their own receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);-- Create reimbursement requests table
CREATE TABLE public.reimbursement_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.reimbursement_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reimbursement requests"
ON public.reimbursement_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reimbursement requests"
ON public.reimbursement_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reimbursement requests"
ON public.reimbursement_requests FOR UPDATE
USING (auth.uid() = user_id);

-- Junction table for reimbursement items
CREATE TABLE public.reimbursement_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reimbursement_request_id UUID NOT NULL REFERENCES public.reimbursement_requests(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE
);

ALTER TABLE public.reimbursement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reimbursement items"
ON public.reimbursement_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.reimbursement_requests
  WHERE id = reimbursement_request_id AND user_id = auth.uid()
));

CREATE POLICY "Users can insert their own reimbursement items"
ON public.reimbursement_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.reimbursement_requests
  WHERE id = reimbursement_request_id AND user_id = auth.uid()
));

-- OCR processing results table
CREATE TABLE public.receipt_ocr_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
  extracted_amount NUMERIC,
  extracted_vendor TEXT,
  extracted_date DATE,
  extracted_category TEXT,
  confidence_score NUMERIC,
  raw_response TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.receipt_ocr_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view OCR data for their receipts"
ON public.receipt_ocr_data FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.receipts r
  JOIN public.expenses e ON r.expense_id = e.id
  WHERE r.id = receipt_id AND e.user_id = auth.uid()
));-- Add HSA provider field to reimbursement requests
ALTER TABLE public.reimbursement_requests 
ADD COLUMN hsa_provider TEXT;

-- Update status enum to include more tracking states
COMMENT ON COLUMN public.reimbursement_requests.status IS 'Status values: pending, submitted, approved, paid, rejected';

-- Add submission metadata
ALTER TABLE public.reimbursement_requests
ADD COLUMN submission_method TEXT,
ADD COLUMN submission_email TEXT,
ADD COLUMN pdf_file_path TEXT;-- Create table for email subscribers
CREATE TABLE public.email_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  estimated_savings NUMERIC,
  calculator_data JSONB,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'calculator',
  is_active BOOLEAN DEFAULT true
);

-- Create table for email sequence tracking
CREATE TABLE public.email_sequence_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES public.email_subscribers(id) ON DELETE CASCADE,
  sequence_day INTEGER NOT NULL,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_sends ENABLE ROW LEVEL SECURITY;

-- Policies for email_subscribers (admin only, no user access needed for now)
CREATE POLICY "Service role can manage subscribers" 
ON public.email_subscribers 
FOR ALL 
USING (true);

-- Policies for email_sequence_sends (admin only)
CREATE POLICY "Service role can manage sequence sends" 
ON public.email_sequence_sends 
FOR ALL 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_email_subscribers_email ON public.email_subscribers(email);
CREATE INDEX idx_sequence_sends_subscriber ON public.email_sequence_sends(subscriber_id);
CREATE INDEX idx_sequence_sends_day ON public.email_sequence_sends(sequence_day);-- Fix email_subscribers public data exposure
-- Add policy to explicitly deny anonymous access to email_subscribers table
CREATE POLICY "Deny public access to email subscribers"
ON email_subscribers
FOR SELECT
TO anon
USING (false);

-- Add missing DELETE policy for reimbursement_items (user experience fix)
CREATE POLICY "Users can delete their own reimbursement items"
ON reimbursement_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM reimbursement_requests
    WHERE reimbursement_requests.id = reimbursement_items.reimbursement_request_id
    AND reimbursement_requests.user_id = auth.uid()
  )
);-- Add document management fields to receipts table
ALTER TABLE receipts 
ADD COLUMN document_type TEXT DEFAULT 'receipt' CHECK (document_type IN ('invoice', 'payment_receipt', 'eob', 'prescription_label', 'other', 'receipt')),
ADD COLUMN description TEXT,
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Add payment plan tracking to expenses table
ALTER TABLE expenses
ADD COLUMN payment_plan_total_amount NUMERIC,
ADD COLUMN payment_plan_installments INTEGER,
ADD COLUMN payment_plan_notes TEXT;

-- Create index for better query performance
CREATE INDEX idx_receipts_expense_type ON receipts(expense_id, document_type);

-- Add comment for documentation
COMMENT ON COLUMN receipts.document_type IS 'Type of document: invoice (primary billing), payment_receipt (proof of payment), eob (Explanation of Benefits), prescription_label, other, or receipt (default)';
COMMENT ON COLUMN receipts.description IS 'Optional description or notes about this document';
COMMENT ON COLUMN receipts.display_order IS 'Order for displaying multiple documents for the same expense';
COMMENT ON COLUMN expenses.payment_plan_total_amount IS 'Total amount if on payment plan (different from individual payment amounts)';
COMMENT ON COLUMN expenses.payment_plan_installments IS 'Number of installments if on payment plan';
COMMENT ON COLUMN expenses.payment_plan_notes IS 'Notes about payment plan arrangements';-- Create conversations table for Wellbie chat history
CREATE TABLE IF NOT EXISTS public.wellbie_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.wellbie_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.wellbie_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.wellbie_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellbie_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON public.wellbie_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.wellbie_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.wellbie_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.wellbie_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their conversations"
  ON public.wellbie_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wellbie_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON public.wellbie_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wellbie_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations"
  ON public.wellbie_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.wellbie_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_wellbie_conversations_user_id ON public.wellbie_conversations(user_id);
CREATE INDEX idx_wellbie_messages_conversation_id ON public.wellbie_messages(conversation_id);

-- Trigger for updated_at
CREATE TRIGGER update_wellbie_conversations_updated_at
  BEFORE UPDATE ON public.wellbie_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Phase 1: Database restructuring for invoice/payment separation

-- Step 1: Create payment_transactions table first
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_report_id UUID NOT NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_source TEXT NOT NULL CHECK (payment_source IN ('hsa_direct', 'out_of_pocket', 'unpaid')),
  payment_method_id UUID,
  notes TEXT,
  plaid_transaction_id TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 2: Rename expenses to expense_reports
ALTER TABLE public.expenses RENAME TO expense_reports;

-- Step 3: Add foreign key for payment_transactions
ALTER TABLE public.payment_transactions
ADD CONSTRAINT payment_transactions_expense_report_id_fkey
FOREIGN KEY (expense_report_id) REFERENCES public.expense_reports(id) ON DELETE CASCADE;

ALTER TABLE public.payment_transactions
ADD CONSTRAINT payment_transactions_payment_method_id_fkey
FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE SET NULL;

-- Step 4: Update receipts table to support both expense reports and payment transactions
ALTER TABLE public.receipts
ADD COLUMN payment_transaction_id UUID,
ADD CONSTRAINT receipts_payment_transaction_id_fkey
FOREIGN KEY (payment_transaction_id) REFERENCES public.payment_transactions(id) ON DELETE CASCADE;

-- Update document_type to support more types
ALTER TABLE public.receipts DROP CONSTRAINT IF EXISTS receipts_document_type_check;
ALTER TABLE public.receipts
ADD CONSTRAINT receipts_document_type_check
CHECK (document_type IN ('receipt', 'invoice', 'payment_receipt', 'eob', 'payment_plan_agreement'));

-- Step 5: Add invoice-specific fields to expense_reports
ALTER TABLE public.expense_reports
ADD COLUMN invoice_number TEXT,
ADD COLUMN invoice_date DATE,
ADD COLUMN total_amount NUMERIC;

-- Migrate existing amount to total_amount for invoices
UPDATE public.expense_reports SET total_amount = amount WHERE total_amount IS NULL;

-- Step 6: Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own payment transactions"
ON public.payment_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment transactions"
ON public.payment_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment transactions"
ON public.payment_transactions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment transactions"
ON public.payment_transactions
FOR DELETE
USING (auth.uid() = user_id);

-- Step 7: Update receipts RLS policies to include payment transactions
DROP POLICY IF EXISTS "Users can view receipts for their own expenses" ON public.receipts;
DROP POLICY IF EXISTS "Users can insert receipts for their own expenses" ON public.receipts;
DROP POLICY IF EXISTS "Users can delete receipts for their own expenses" ON public.receipts;

CREATE POLICY "Users can view their receipts"
ON public.receipts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM expense_reports
    WHERE expense_reports.id = receipts.expense_id
    AND expense_reports.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM payment_transactions
    WHERE payment_transactions.id = receipts.payment_transaction_id
    AND payment_transactions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their receipts"
ON public.receipts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM expense_reports
    WHERE expense_reports.id = receipts.expense_id
    AND expense_reports.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM payment_transactions
    WHERE payment_transactions.id = receipts.payment_transaction_id
    AND payment_transactions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their receipts"
ON public.receipts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM expense_reports
    WHERE expense_reports.id = receipts.expense_id
    AND expense_reports.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM payment_transactions
    WHERE payment_transactions.id = receipts.payment_transaction_id
    AND payment_transactions.user_id = auth.uid()
  )
);

-- Step 8: Create trigger for payment_transactions updated_at
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 9: Create indexes for performance
CREATE INDEX idx_payment_transactions_expense_report_id ON public.payment_transactions(expense_report_id);
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_payment_date ON public.payment_transactions(payment_date);
CREATE INDEX idx_receipts_payment_transaction_id ON public.receipts(payment_transaction_id);-- Make expense_id nullable since receipts can be attached to either expense_reports or payment_transactions
ALTER TABLE receipts ALTER COLUMN expense_id DROP NOT NULL;-- Create medical_incidents table for grouping related expenses
CREATE TABLE public.medical_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  incident_date DATE NOT NULL,
  description TEXT,
  incident_type TEXT NOT NULL DEFAULT 'other',
  is_hsa_eligible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_incidents
CREATE POLICY "Users can view their own medical incidents"
ON public.medical_incidents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medical incidents"
ON public.medical_incidents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medical incidents"
ON public.medical_incidents
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medical incidents"
ON public.medical_incidents
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_medical_incidents_updated_at
BEFORE UPDATE ON public.medical_incidents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add medical_incident_id and complexity_level to expense_reports
ALTER TABLE public.expense_reports
ADD COLUMN medical_incident_id UUID REFERENCES public.medical_incidents(id) ON DELETE SET NULL,
ADD COLUMN complexity_level TEXT NOT NULL DEFAULT 'simple';

-- Add reimbursement tracking to payment_transactions
ALTER TABLE public.payment_transactions
ADD COLUMN is_reimbursed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN reimbursed_date DATE,
ADD COLUMN reimbursement_request_id UUID REFERENCES public.reimbursement_requests(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_expense_reports_medical_incident ON public.expense_reports(medical_incident_id);
CREATE INDEX idx_payment_transactions_reimbursed ON public.payment_transactions(is_reimbursed);-- Phase 1: Rename expense_reports to invoices
ALTER TABLE expense_reports RENAME TO invoices;

-- Update foreign key column names for clarity
ALTER TABLE payment_transactions RENAME COLUMN expense_report_id TO invoice_id;
ALTER TABLE receipts RENAME COLUMN expense_id TO invoice_id;
ALTER TABLE reimbursement_items RENAME COLUMN expense_id TO invoice_id;

-- Update RLS policy names to reflect new terminology
DROP POLICY IF EXISTS "Users can view their own expenses" ON invoices;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON invoices;
DROP POLICY IF EXISTS "Users can update their own expenses" ON invoices;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON invoices;

CREATE POLICY "Users can view their own invoices"
ON invoices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
ON invoices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
ON invoices FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
ON invoices FOR DELETE
USING (auth.uid() = user_id);-- Add user_id to receipts table to track ownership
ALTER TABLE receipts ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Backfill user_id for existing receipts from their invoices
UPDATE receipts
SET user_id = invoices.user_id
FROM invoices
WHERE receipts.invoice_id = invoices.id AND receipts.user_id IS NULL;

-- Backfill user_id for receipts linked to payment_transactions
UPDATE receipts
SET user_id = payment_transactions.user_id
FROM payment_transactions
WHERE receipts.payment_transaction_id = payment_transactions.id AND receipts.user_id IS NULL;

-- Make user_id not nullable after backfill
ALTER TABLE receipts ALTER COLUMN user_id SET NOT NULL;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view their receipts" ON receipts;
DROP POLICY IF EXISTS "Users can insert their receipts" ON receipts;
DROP POLICY IF EXISTS "Users can delete their receipts" ON receipts;

-- Create new RLS policies based on user_id
CREATE POLICY "Users can view their own receipts"
ON receipts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts"
ON receipts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts"
ON receipts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts"
ON receipts FOR DELETE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_receipts_user_id ON receipts(user_id);-- Step 1: Create labels system tables
CREATE TABLE public.labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own labels"
ON public.labels FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own labels"
ON public.labels FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own labels"
ON public.labels FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own labels"
ON public.labels FOR DELETE
USING (auth.uid() = user_id);

-- Step 2: Create invoice_labels junction table
CREATE TABLE public.invoice_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(invoice_id, label_id)
);

ALTER TABLE public.invoice_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view labels on their invoices"
ON public.invoice_labels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_labels.invoice_id
    AND invoices.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add labels to their invoices"
ON public.invoice_labels FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_labels.invoice_id
    AND invoices.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove labels from their invoices"
ON public.invoice_labels FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_labels.invoice_id
    AND invoices.user_id = auth.uid()
  )
);

-- Step 3: Create payment_labels junction table
CREATE TABLE public.payment_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_transaction_id UUID NOT NULL REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(payment_transaction_id, label_id)
);

ALTER TABLE public.payment_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view labels on their payments"
ON public.payment_labels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.payment_transactions
    WHERE payment_transactions.id = payment_labels.payment_transaction_id
    AND payment_transactions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add labels to their payments"
ON public.payment_labels FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.payment_transactions
    WHERE payment_transactions.id = payment_labels.payment_transaction_id
    AND payment_transactions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove labels from their payments"
ON public.payment_labels FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.payment_transactions
    WHERE payment_transactions.id = payment_labels.payment_transaction_id
    AND payment_transactions.user_id = auth.uid()
  )
);

-- Step 4: Migrate existing medical incidents to labels
-- Create labels from incident titles and link invoices
INSERT INTO public.labels (user_id, name, color)
SELECT DISTINCT 
  user_id,
  title,
  '#8B5CF6' -- Purple color for migrated incidents
FROM public.medical_incidents
ON CONFLICT (user_id, name) DO NOTHING;

-- Link invoices to their incident labels
INSERT INTO public.invoice_labels (invoice_id, label_id)
SELECT 
  i.id,
  l.id
FROM public.invoices i
INNER JOIN public.medical_incidents mi ON i.medical_incident_id = mi.id
INNER JOIN public.labels l ON l.user_id = mi.user_id AND l.name = mi.title
WHERE i.medical_incident_id IS NOT NULL
ON CONFLICT (invoice_id, label_id) DO NOTHING;

-- Step 5: Remove medical_incident_id from invoices
ALTER TABLE public.invoices DROP COLUMN IF EXISTS medical_incident_id;

-- Step 6: Remove complexity_level (no longer needed)
ALTER TABLE public.invoices DROP COLUMN IF EXISTS complexity_level;

-- Step 7: Drop medical_incidents table
DROP TABLE IF EXISTS public.medical_incidents CASCADE;-- Create transactions table for tracking all financial transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  vendor TEXT,
  category TEXT DEFAULT 'uncategorized',
  is_medical BOOLEAN DEFAULT false,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  plaid_transaction_id TEXT,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  reconciliation_status TEXT DEFAULT 'unlinked' CHECK (reconciliation_status IN ('unlinked', 'linked_to_invoice', 'ignored')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'plaid', 'csv_import')),
  is_hsa_eligible BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Add transaction_id to payment_transactions for linking
ALTER TABLE public.payment_transactions
ADD COLUMN transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;

-- Create transaction_invoice_suggestions table for smart matching
CREATE TABLE public.transaction_invoice_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  match_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(transaction_id, invoice_id)
);

-- Enable RLS
ALTER TABLE public.transaction_invoice_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suggestions
CREATE POLICY "Users can view suggestions for their transactions"
  ON public.transaction_invoice_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_invoice_suggestions.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert suggestions for their transactions"
  ON public.transaction_invoice_suggestions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_invoice_suggestions.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete suggestions for their transactions"
  ON public.transaction_invoice_suggestions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_invoice_suggestions.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX idx_transactions_is_medical ON public.transactions(is_medical);
CREATE INDEX idx_transactions_reconciliation_status ON public.transactions(reconciliation_status);
CREATE INDEX idx_transaction_suggestions_transaction_id ON public.transaction_invoice_suggestions(transaction_id);
CREATE INDEX idx_transaction_suggestions_invoice_id ON public.transaction_invoice_suggestions(invoice_id);

-- Create trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Create plaid_connections table to store Plaid access tokens
CREATE TABLE IF NOT EXISTS public.plaid_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  item_id TEXT NOT NULL,
  institution_name TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.plaid_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own plaid connections" 
ON public.plaid_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plaid connections" 
ON public.plaid_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plaid connections" 
ON public.plaid_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plaid connections" 
ON public.plaid_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_plaid_connections_updated_at
BEFORE UPDATE ON public.plaid_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint on plaid_transaction_id in transactions table
ALTER TABLE public.transactions 
ADD CONSTRAINT unique_plaid_transaction_id 
UNIQUE (plaid_transaction_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_plaid_id ON public.transactions(plaid_transaction_id);
CREATE INDEX IF NOT EXISTS idx_plaid_connections_user_id ON public.plaid_connections(user_id);-- Create user vendor preferences table for learning medical vendors
CREATE TABLE IF NOT EXISTS public.user_vendor_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vendor_pattern TEXT NOT NULL,
  is_medical BOOLEAN NOT NULL DEFAULT true,
  confidence_score NUMERIC DEFAULT 1.0,
  times_confirmed INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_vendor_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own vendor preferences"
ON public.user_vendor_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vendor preferences"
ON public.user_vendor_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendor preferences"
ON public.user_vendor_preferences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendor preferences"
ON public.user_vendor_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_vendor_preferences_updated_at
BEFORE UPDATE ON public.user_vendor_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance (skip if they already exist)
CREATE INDEX IF NOT EXISTS idx_user_vendor_preferences_user_id ON public.user_vendor_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vendor_preferences_vendor_pattern ON public.user_vendor_preferences(vendor_pattern);
CREATE INDEX IF NOT EXISTS idx_transactions_vendor ON public.transactions(vendor);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor ON public.invoices(vendor);-- Phase 1: Add HSA opened date to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hsa_opened_date date;

-- Phase 1-2: Add reimbursement strategy fields to invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS reimbursement_strategy text CHECK (reimbursement_strategy IN ('immediate', 'medium', 'vault')) DEFAULT 'immediate',
ADD COLUMN IF NOT EXISTS planned_reimbursement_date date,
ADD COLUMN IF NOT EXISTS reimbursement_reminder_date date,
ADD COLUMN IF NOT EXISTS card_payoff_months integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS investment_notes text;

-- Phase 3: Create expense decisions table for pre-purchase tracking
CREATE TABLE IF NOT EXISTS expense_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  expense_amount numeric NOT NULL,
  payment_strategy jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  used_for_expense_id uuid REFERENCES invoices(id)
);

-- Enable RLS on expense_decisions
ALTER TABLE expense_decisions ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_decisions
CREATE POLICY "Users can view their own expense decisions"
ON expense_decisions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense decisions"
ON expense_decisions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense decisions"
ON expense_decisions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense decisions"
ON expense_decisions FOR DELETE
USING (auth.uid() = user_id);-- Create table for user savings goals
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'monthly_hsa', 'annual_savings', 'unreimbursed_vault', 'rewards_earned'
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own goals"
  ON public.savings_goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
  ON public.savings_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON public.savings_goals
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON public.savings_goals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Add is_hsa_account flag to payment_methods table
ALTER TABLE payment_methods 
ADD COLUMN is_hsa_account BOOLEAN NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN payment_methods.is_hsa_account IS 'Indicates if this payment method is a Health Savings Account (HSA)';-- Bill Review & Dispute Feature - Database Schema

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
  EXECUTE FUNCTION public.update_updated_at_column();-- Create providers table to track healthcare provider information and performance
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
EXECUTE FUNCTION public.update_updated_at_column();-- Fix search_path security warning for trigger function
CREATE OR REPLACE FUNCTION public.trigger_update_provider_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
$$;-- Phase 1: Database Schema Enhancements for Provider Transparency

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
  ON regional_benchmarks(region_code, cpt_code);-- Step 1: Add new fields to invoices table for provider and insurance tracking
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
COMMENT ON COLUMN invoices.deductible_portion IS 'Amount of this bill that went toward meeting the deductible (for split deductible scenarios)';-- Drop existing provider_reviews table if it exists
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
  EXECUTE FUNCTION public.update_provider_review_aggregates();-- Create provider_reviews table for multi-dimensional ratings
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
  EXECUTE FUNCTION update_provider_reviews_updated_at();-- Fix search_path security issue by recreating the function with proper security
DROP TRIGGER IF EXISTS trigger_update_provider_reviews_updated_at ON provider_reviews;
DROP FUNCTION IF EXISTS update_provider_reviews_updated_at();

CREATE OR REPLACE FUNCTION public.update_provider_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public';

CREATE TRIGGER trigger_update_provider_reviews_updated_at
  BEFORE UPDATE ON provider_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_reviews_updated_at();-- Create reviews table for user testimonials
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view featured reviews
CREATE POLICY "Featured reviews are viewable by everyone"
  ON public.reviews
  FOR SELECT
  USING (is_featured = true OR auth.uid() = user_id);

-- Policy: Users can create their own reviews
CREATE POLICY "Users can create their own reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for featured reviews
CREATE INDEX idx_reviews_featured ON public.reviews(is_featured, created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Add admin role to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create review moderation table for tracking admin actions
CREATE TABLE IF NOT EXISTS review_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'featured', 'unfeatured', 'flagged')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on review_moderation_log
ALTER TABLE review_moderation_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all moderation logs
CREATE POLICY "Admins can view all moderation logs"
  ON review_moderation_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can insert moderation logs
CREATE POLICY "Admins can insert moderation logs"
  ON review_moderation_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Add moderation status columns to reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Update RLS policies for reviews
DROP POLICY IF EXISTS "Users can view featured reviews" ON reviews;
CREATE POLICY "Users can view approved featured reviews"
  ON reviews
  FOR SELECT
  USING (is_featured = true AND moderation_status = 'approved');

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
  ON reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can update reviews
CREATE POLICY "Admins can update reviews"
  ON reviews
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON reviews(moderation_status);
CREATE INDEX IF NOT EXISTS idx_reviews_is_featured ON reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_review_moderation_log_review_id ON review_moderation_log(review_id);-- Create hsa_accounts table
CREATE TABLE hsa_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  opened_date DATE NOT NULL,
  closed_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE hsa_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own HSA accounts"
  ON hsa_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own HSA accounts"
  ON hsa_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own HSA accounts"
  ON hsa_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own HSA accounts"
  ON hsa_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_hsa_accounts_user_id ON hsa_accounts(user_id);
CREATE INDEX idx_hsa_accounts_dates ON hsa_accounts(user_id, opened_date, closed_date);
CREATE INDEX idx_hsa_accounts_active ON hsa_accounts(user_id, is_active);

-- Trigger for updated_at
CREATE TRIGGER update_hsa_accounts_updated_at
  BEFORE UPDATE ON hsa_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();-- Task 2.1: Create transaction_splits table
CREATE TABLE IF NOT EXISTS public.transaction_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  hsa_account_id UUID REFERENCES public.hsa_accounts(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transaction_splits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transaction_splits
CREATE POLICY "Users can view their own transaction splits"
  ON public.transaction_splits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_splits.parent_transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own transaction splits"
  ON public.transaction_splits
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_splits.parent_transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own transaction splits"
  ON public.transaction_splits
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_splits.parent_transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own transaction splits"
  ON public.transaction_splits
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_splits.parent_transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_transaction_splits_parent ON public.transaction_splits(parent_transaction_id);
CREATE INDEX idx_transaction_splits_hsa_account ON public.transaction_splits(hsa_account_id);

-- Trigger for updated_at
CREATE TRIGGER update_transaction_splits_updated_at
  BEFORE UPDATE ON public.transaction_splits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Task 2.2: Modify transactions table
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS is_split BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS split_parent_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;

-- Index for split tracking
CREATE INDEX IF NOT EXISTS idx_transactions_split_parent ON public.transactions(split_parent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_is_split ON public.transactions(is_split);-- Add HSA account tracking to invoices and payments

-- Add hsa_account_id to invoices table
ALTER TABLE public.invoices
ADD COLUMN hsa_account_id uuid REFERENCES public.hsa_accounts(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_invoices_hsa_account ON public.invoices(hsa_account_id);

-- Add hsa_account_id to payment_transactions table
ALTER TABLE public.payment_transactions
ADD COLUMN hsa_account_id uuid REFERENCES public.hsa_accounts(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_payment_transactions_hsa_account ON public.payment_transactions(hsa_account_id);

-- Add comment for clarity
COMMENT ON COLUMN public.invoices.hsa_account_id IS 'The HSA account to be used for reimbursement';
COMMENT ON COLUMN public.payment_transactions.hsa_account_id IS 'The HSA account used for this payment (for split tracking)';-- Migration: Add encrypted storage for Plaid access tokens
-- Issue #5: CRITICAL - Plaid tokens stored in plaintext (HIPAA violation)
-- Date: 2025-12-02

-- Step 1: Add encrypted column (nullable during transition)
ALTER TABLE public.plaid_connections
ADD COLUMN encrypted_access_token TEXT;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN public.plaid_connections.encrypted_access_token IS
  'AES-256-GCM encrypted Plaid access token. Format: base64(iv):base64(ciphertext)';

-- Step 3: Create index for faster lookups (optional optimization)
CREATE INDEX IF NOT EXISTS idx_plaid_connections_encrypted_token
  ON public.plaid_connections(encrypted_access_token)
  WHERE encrypted_access_token IS NOT NULL;

-- MANUAL STEPS REQUIRED AFTER DEPLOYMENT:
-- 1. Run the migrate-encrypt-tokens edge function to encrypt existing tokens
-- 2. Verify all tokens are encrypted (check encrypted_access_token IS NOT NULL)
-- 3. After 30-day verification period, run cleanup migration:
--    - ALTER TABLE plaid_connections ALTER COLUMN encrypted_access_token SET NOT NULL;
--    - ALTER TABLE plaid_connections DROP COLUMN access_token;
