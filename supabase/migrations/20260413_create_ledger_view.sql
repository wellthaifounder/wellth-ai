-- Migration: Create ledger_entries view for the unified Ledger page
-- Phase 2 of expense lifecycle redesign
-- Joins invoices + payment_transactions + transactions into a single queryable view

CREATE OR REPLACE VIEW ledger_entries AS
SELECT
  i.id AS invoice_id,
  i.user_id,
  i.vendor,
  i.category,
  i.date AS service_date,
  i.invoice_date,
  i.amount AS billed_amount,
  i.total_amount,
  i.is_hsa_eligible,
  i.is_reimbursed,
  i.status AS invoice_status,
  i.collection_id,
  i.invoice_number,
  i.notes AS invoice_notes,
  i.created_at AS invoice_created_at,
  -- Payment aggregates
  COALESCE(pay.total_paid, 0) AS total_paid,
  COALESCE(pay.paid_via_hsa, 0) AS paid_via_hsa,
  COALESCE(pay.paid_via_oop, 0) AS paid_via_oop,
  COALESCE(i.amount, 0) - COALESCE(pay.total_paid, 0) AS outstanding_balance,
  COALESCE(pay.payment_count, 0) AS payment_count,
  COALESCE(pay.has_auto_linked, false) AS has_auto_linked,
  pay.latest_payment_date,
  -- Linked transaction info
  COALESCE(txn.linked_transaction_count, 0) AS linked_transaction_count,
  -- Match status derived
  CASE
    WHEN COALESCE(pay.payment_count, 0) = 0 THEN 'unmatched'
    WHEN COALESCE(pay.has_auto_linked, false) THEN 'auto_matched'
    ELSE 'manual'
  END AS match_status,
  -- Collection/care event info
  c.title AS care_event_title
FROM invoices i
LEFT JOIN LATERAL (
  SELECT
    SUM(pt.amount) AS total_paid,
    SUM(CASE WHEN pt.payment_source = 'hsa_direct' THEN pt.amount ELSE 0 END) AS paid_via_hsa,
    SUM(CASE WHEN pt.payment_source = 'out_of_pocket' THEN pt.amount ELSE 0 END) AS paid_via_oop,
    COUNT(*) AS payment_count,
    bool_or(pt.auto_linked) AS has_auto_linked,
    MAX(pt.payment_date) AS latest_payment_date
  FROM payment_transactions pt
  WHERE pt.invoice_id = i.id
) pay ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS linked_transaction_count
  FROM transactions t
  WHERE t.invoice_id = i.id
) txn ON true
LEFT JOIN collections c ON c.id = i.collection_id;

-- RLS note: This view inherits RLS from the invoices table since it's the driving table.
-- Queries must filter by user_id to enforce access control.

COMMENT ON VIEW ledger_entries IS 'Unified view of invoices with payment aggregates, match status, and care event info for the Ledger page';
