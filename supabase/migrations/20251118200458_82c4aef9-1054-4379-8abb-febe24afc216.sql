-- Add HSA account tracking to invoices and payments

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
COMMENT ON COLUMN public.payment_transactions.hsa_account_id IS 'The HSA account used for this payment (for split tracking)';