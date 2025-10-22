-- Create transactions table for tracking all financial transactions
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
  EXECUTE FUNCTION public.update_updated_at_column();