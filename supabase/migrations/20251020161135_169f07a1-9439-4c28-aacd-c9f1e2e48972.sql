-- Phase 1: Database restructuring for invoice/payment separation

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
CREATE INDEX idx_receipts_payment_transaction_id ON public.receipts(payment_transaction_id);