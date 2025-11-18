-- Task 2.1: Create transaction_splits table
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
CREATE INDEX IF NOT EXISTS idx_transactions_is_split ON public.transactions(is_split);