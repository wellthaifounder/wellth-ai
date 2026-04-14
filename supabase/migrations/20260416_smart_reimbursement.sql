-- Migration: Smart Reimbursement — per-care-event claims + auto-detect claimable (Phase 5)

-- 1. Link reimbursement requests to care events (collections)
ALTER TABLE reimbursement_requests
  ADD COLUMN collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;

CREATE INDEX idx_reimbursement_requests_collection
  ON reimbursement_requests(collection_id) WHERE collection_id IS NOT NULL;

-- 2. Function to detect care events ready for HSA claims
--    Returns care events where: HSA-eligible OOP spending > threshold AND no claim filed yet
CREATE OR REPLACE FUNCTION detect_claimable_care_events(
  p_user_id UUID,
  p_threshold NUMERIC DEFAULT 50
)
RETURNS TABLE(
  collection_id UUID,
  title TEXT,
  hsa_eligible_amount NUMERIC,
  total_paid NUMERIC,
  paid_via_hsa NUMERIC,
  oop_claimable NUMERIC,
  invoice_count BIGINT,
  unreimbursed_invoice_ids UUID[]
) AS $$
  SELECT
    c.id AS collection_id,
    c.title,
    c.hsa_eligible_amount,
    c.total_paid,
    COALESCE(hsa_pay.paid_via_hsa, 0) AS paid_via_hsa,
    -- Claimable = HSA-eligible invoices paid out-of-pocket (not yet reimbursed)
    COALESCE(oop.oop_claimable, 0) AS oop_claimable,
    COALESCE(oop.invoice_count, 0) AS invoice_count,
    COALESCE(oop.unreimbursed_invoice_ids, ARRAY[]::UUID[]) AS unreimbursed_invoice_ids
  FROM collections c
  -- Sum of HSA payments already made for this collection's invoices
  LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(pt.amount), 0) AS paid_via_hsa
    FROM payment_transactions pt
    JOIN invoices i ON pt.invoice_id = i.id
    WHERE i.collection_id = c.id
      AND pt.payment_source = 'hsa'
  ) hsa_pay ON true
  -- OOP amount on unreimbursed HSA-eligible invoices
  LEFT JOIN LATERAL (
    SELECT
      SUM(i.amount) AS oop_claimable,
      COUNT(*) AS invoice_count,
      ARRAY_AGG(i.id) AS unreimbursed_invoice_ids
    FROM invoices i
    WHERE i.collection_id = c.id
      AND i.is_hsa_eligible = true
      AND i.is_reimbursed = false
  ) oop ON true
  WHERE c.user_id = p_user_id
    AND COALESCE(oop.oop_claimable, 0) >= p_threshold
  ORDER BY COALESCE(oop.oop_claimable, 0) DESC;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp;

COMMENT ON FUNCTION detect_claimable_care_events IS 'Returns care events with unreimbursed HSA-eligible OOP spending above a threshold, for smart reimbursement suggestions';
