-- Migration: Replace Medical Events with Collections + Enhanced Labels
-- Date: 2026-01-31
--
-- This migration:
-- 1. Renames medical_events → collections (generic grouping)
-- 2. Drops domain-specific columns/enums (event_type, status, etc.)
-- 3. Adds icon/color customization to collections
-- 4. Renames medical_event_id → collection_id on invoices and receipts
-- 5. Recreates triggers to reference new table/column names
-- 6. Adds receipt_labels junction table (extends labels to documents)
-- 7. Drops document_category enum (replaced by labels)

-- ============================================
-- 1. Drop existing triggers that reference old names
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_medical_event_totals ON invoices;
DROP TRIGGER IF EXISTS trigger_update_medical_event_paid ON payment_transactions;

-- Drop old functions
DROP FUNCTION IF EXISTS update_medical_event_totals();
DROP FUNCTION IF EXISTS update_medical_event_paid();

-- ============================================
-- 2. Rename table: medical_events → collections
-- ============================================
ALTER TABLE medical_events RENAME TO collections;

-- ============================================
-- 3. Drop domain-specific columns
-- ============================================
ALTER TABLE collections DROP COLUMN IF EXISTS event_type;
ALTER TABLE collections DROP COLUMN IF EXISTS event_date;
ALTER TABLE collections DROP COLUMN IF EXISTS primary_provider;
ALTER TABLE collections DROP COLUMN IF EXISTS status;

-- Drop the enums (CASCADE to handle any remaining dependencies)
DROP TYPE IF EXISTS medical_event_type CASCADE;
DROP TYPE IF EXISTS medical_event_status CASCADE;

-- ============================================
-- 4. Add customization fields
-- ============================================
ALTER TABLE collections ADD COLUMN icon TEXT DEFAULT 'folder';
ALTER TABLE collections ADD COLUMN color TEXT DEFAULT '#3B82F6';

-- ============================================
-- 5. Rename FK columns on invoices and receipts
-- ============================================
ALTER TABLE invoices RENAME COLUMN medical_event_id TO collection_id;
ALTER TABLE receipts RENAME COLUMN medical_event_id TO collection_id;

-- ============================================
-- 6. Drop and recreate indexes with new names
-- ============================================
DROP INDEX IF EXISTS idx_medical_events_user_id;
DROP INDEX IF EXISTS idx_medical_events_status;
DROP INDEX IF EXISTS idx_medical_events_event_date;
DROP INDEX IF EXISTS idx_invoices_medical_event_id;
DROP INDEX IF EXISTS idx_receipts_medical_event_id;

CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_invoices_collection_id ON invoices(collection_id);
CREATE INDEX idx_receipts_collection_id ON receipts(collection_id);

-- ============================================
-- 7. Update RLS policies (drop old, create new)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own medical events" ON collections;
DROP POLICY IF EXISTS "Users can create their own medical events" ON collections;
DROP POLICY IF EXISTS "Users can update their own medical events" ON collections;
DROP POLICY IF EXISTS "Users can delete their own medical events" ON collections;

CREATE POLICY "Users can view their own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 8. Recreate triggers with new names
-- ============================================

-- Function to update collection totals when invoices change
CREATE OR REPLACE FUNCTION update_collection_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update totals for the affected collection
  IF NEW.collection_id IS NOT NULL THEN
    UPDATE collections
    SET
      total_billed = COALESCE((
        SELECT SUM(COALESCE(total_amount, amount))
        FROM invoices
        WHERE collection_id = NEW.collection_id
      ), 0),
      hsa_eligible_amount = COALESCE((
        SELECT SUM(COALESCE(total_amount, amount))
        FROM invoices
        WHERE collection_id = NEW.collection_id
          AND is_hsa_eligible = true
      ), 0),
      updated_at = NOW()
    WHERE id = NEW.collection_id;
  END IF;

  -- Also update old collection if invoice was moved
  IF TG_OP = 'UPDATE' AND OLD.collection_id IS NOT NULL AND OLD.collection_id != NEW.collection_id THEN
    UPDATE collections
    SET
      total_billed = COALESCE((
        SELECT SUM(COALESCE(total_amount, amount))
        FROM invoices
        WHERE collection_id = OLD.collection_id
      ), 0),
      hsa_eligible_amount = COALESCE((
        SELECT SUM(COALESCE(total_amount, amount))
        FROM invoices
        WHERE collection_id = OLD.collection_id
          AND is_hsa_eligible = true
      ), 0),
      updated_at = NOW()
    WHERE id = OLD.collection_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Trigger to update collection totals
CREATE TRIGGER trigger_update_collection_totals
  AFTER INSERT OR UPDATE OF collection_id, amount, total_amount, is_hsa_eligible
  ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_totals();

-- Function to update total_paid when payment_transactions change
CREATE OR REPLACE FUNCTION update_collection_paid()
RETURNS TRIGGER AS $$
DECLARE
  v_collection_id UUID;
BEGIN
  -- Get the collection_id from the linked invoice
  SELECT collection_id INTO v_collection_id
  FROM invoices
  WHERE id = NEW.invoice_id;

  IF v_collection_id IS NOT NULL THEN
    UPDATE collections
    SET
      total_paid = COALESCE((
        SELECT SUM(pt.amount)
        FROM payment_transactions pt
        JOIN invoices i ON pt.invoice_id = i.id
        WHERE i.collection_id = v_collection_id
      ), 0),
      updated_at = NOW()
    WHERE id = v_collection_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Trigger to update paid totals
CREATE TRIGGER trigger_update_collection_paid
  AFTER INSERT OR UPDATE OR DELETE
  ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_paid();

-- ============================================
-- 9. Add receipt_labels junction table
-- ============================================
CREATE TABLE public.receipt_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  UNIQUE(receipt_id, label_id)
);

ALTER TABLE public.receipt_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view labels on their receipts"
ON public.receipt_labels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.receipts
    WHERE receipts.id = receipt_labels.receipt_id
    AND receipts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add labels to their receipts"
ON public.receipt_labels FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.receipts
    WHERE receipts.id = receipt_labels.receipt_id
    AND receipts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove labels from their receipts"
ON public.receipt_labels FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.receipts
    WHERE receipts.id = receipt_labels.receipt_id
    AND receipts.user_id = auth.uid()
  )
);

CREATE INDEX idx_receipt_labels_receipt_id ON public.receipt_labels(receipt_id);
CREATE INDEX idx_receipt_labels_label_id ON public.receipt_labels(label_id);

-- ============================================
-- 10. Drop document_category (replaced by labels)
-- ============================================
ALTER TABLE receipts DROP COLUMN IF EXISTS category;
DROP TYPE IF EXISTS document_category CASCADE;

-- ============================================
-- 11. Update table comments
-- ============================================
COMMENT ON TABLE collections IS 'User-defined collections for grouping related bills, documents, and payments (e.g., "Mom - Knee Surgery", "2026 Dental")';
COMMENT ON COLUMN collections.icon IS 'Lucide icon name for visual customization';
COMMENT ON COLUMN collections.color IS 'Hex color for visual customization';
COMMENT ON COLUMN collections.user_responsibility_override IS 'Manual override for outstanding balance - user-entered "what I actually owe"';

-- ============================================
-- Migration Complete
-- ============================================
