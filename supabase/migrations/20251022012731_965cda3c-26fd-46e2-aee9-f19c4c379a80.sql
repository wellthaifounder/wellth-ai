-- Step 1: Create labels system tables
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
DROP TABLE IF EXISTS public.medical_incidents CASCADE;