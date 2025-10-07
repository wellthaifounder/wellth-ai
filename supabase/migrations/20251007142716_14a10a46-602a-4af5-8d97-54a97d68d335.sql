-- Create reimbursement requests table
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
));