-- Create medical_incidents table for grouping related expenses
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
CREATE INDEX idx_payment_transactions_reimbursed ON public.payment_transactions(is_reimbursed);