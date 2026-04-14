-- Migration: Add computed status to collections + auto-clustering function (Phase 4)

-- 1. Status enum and column
CREATE TYPE collection_status AS ENUM ('active', 'complete', 'needs_attention');

ALTER TABLE collections ADD COLUMN status collection_status NOT NULL DEFAULT 'active';

CREATE INDEX idx_collections_status ON collections(user_id, status);

-- 2. Function to compute collection status from its invoices and payments
CREATE OR REPLACE FUNCTION compute_collection_status(p_collection_id UUID)
RETURNS collection_status AS $$
DECLARE
  v_total_billed NUMERIC;
  v_total_paid NUMERIC;
  v_has_overdue BOOLEAN;
BEGIN
  SELECT COALESCE(total_billed, 0), COALESCE(total_paid, 0)
    INTO v_total_billed, v_total_paid
    FROM collections WHERE id = p_collection_id;

  -- Check for overdue unpaid invoices (>30 days old, status = 'unpaid')
  SELECT EXISTS(
    SELECT 1 FROM invoices
    WHERE collection_id = p_collection_id
      AND status = 'unpaid'
      AND date < (CURRENT_DATE - INTERVAL '30 days')
  ) INTO v_has_overdue;

  IF v_has_overdue THEN RETURN 'needs_attention'; END IF;
  IF v_total_billed > 0 AND v_total_paid >= v_total_billed THEN RETURN 'complete'; END IF;
  RETURN 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. Trigger function to recompute status after totals change
CREATE OR REPLACE FUNCTION recompute_collection_status()
RETURNS TRIGGER AS $$
BEGIN
  -- NEW.id is the collection that was just updated
  UPDATE collections
  SET status = compute_collection_status(NEW.id)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Fire after any UPDATE on collections (totals triggers already update collections)
CREATE TRIGGER trg_recompute_collection_status
  AFTER UPDATE OF total_billed, total_paid ON collections
  FOR EACH ROW
  EXECUTE FUNCTION recompute_collection_status();

-- 4. Also recompute when invoices are assigned/unassigned to collections
CREATE OR REPLACE FUNCTION recompute_collection_status_on_invoice_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.collection_id IS NOT NULL THEN
    UPDATE collections
    SET status = compute_collection_status(NEW.collection_id)
    WHERE id = NEW.collection_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.collection_id IS NOT NULL AND OLD.collection_id IS DISTINCT FROM NEW.collection_id THEN
    UPDATE collections
    SET status = compute_collection_status(OLD.collection_id)
    WHERE id = OLD.collection_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE TRIGGER trg_collection_status_on_invoice
  AFTER INSERT OR UPDATE OF collection_id, status ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION recompute_collection_status_on_invoice_change();

-- 5. Backfill status for existing collections
UPDATE collections SET status = compute_collection_status(id);

-- 6. Auto-clustering function: suggests groups of unassigned invoices by vendor + month
CREATE OR REPLACE FUNCTION suggest_invoice_clusters(p_user_id UUID)
RETURNS TABLE(
  cluster_key TEXT,
  vendor TEXT,
  min_date DATE,
  max_date DATE,
  invoice_count BIGINT,
  total_amount NUMERIC,
  invoice_ids UUID[]
) AS $$
  SELECT
    i.vendor || '_' || date_trunc('month', i.date)::date AS cluster_key,
    i.vendor,
    MIN(i.date)::date AS min_date,
    MAX(i.date)::date AS max_date,
    COUNT(*) AS invoice_count,
    SUM(i.amount) AS total_amount,
    ARRAY_AGG(i.id) AS invoice_ids
  FROM invoices i
  WHERE i.user_id = p_user_id
    AND i.collection_id IS NULL
  GROUP BY i.vendor, date_trunc('month', i.date)::date
  HAVING COUNT(*) >= 2
  ORDER BY MAX(i.date) DESC;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp;

COMMENT ON FUNCTION suggest_invoice_clusters IS 'Returns groups of unassigned invoices by vendor + month window for care event auto-suggestions';
