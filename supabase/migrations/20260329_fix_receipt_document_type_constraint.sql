-- Migration: Expand receipts.document_type CHECK constraint
-- Date: 2026-03-29
--
-- The bill upload wizard uses document type values ('bill', 'itemized_statement', 'other')
-- that were not included in the existing CHECK constraint. This expands the constraint
-- to include all values the wizard produces.

ALTER TABLE public.receipts
  DROP CONSTRAINT IF EXISTS receipts_document_type_check;

ALTER TABLE public.receipts
  ADD CONSTRAINT receipts_document_type_check
  CHECK (document_type IN (
    'receipt',
    'invoice',
    'bill',
    'itemized_statement',
    'eob',
    'payment_receipt',
    'payment_plan_agreement',
    'other'
  ));
