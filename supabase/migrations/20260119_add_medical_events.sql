-- Migration: Add Medical Events (Episodes of Care)
-- This enables users to group related medical documents, bills, and payments
-- under a single "medical event" like a surgery or ongoing treatment.

-- Create enum for event types
CREATE TYPE medical_event_type AS ENUM (
  'surgery',
  'office_visit',
  'emergency',
  'ongoing_treatment',
  'lab_test',
  'imaging',
  'physical_therapy',
  'dental',
  'vision',
  'prescription',
  'other'
);

-- Create enum for event status
CREATE TYPE medical_event_status AS ENUM (
  'active',
  'resolved',
  'disputed',
  'archived'
);

-- Create enum for document categories (for filtering)
CREATE TYPE document_category AS ENUM (
  'bills',
  'insurance',
  'payments',
  'clinical',
  'receipts',
  'other'
);

-- Create medical_events table
CREATE TABLE medical_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event details
  title TEXT NOT NULL,
  event_date DATE,
  event_type medical_event_type DEFAULT 'other',
  primary_provider TEXT,
  description TEXT,

  -- Financial tracking (computed fields updated via triggers or app logic)
  total_billed DECIMAL(10,2) DEFAULT 0,
  total_paid DECIMAL(10,2) DEFAULT 0,
  user_responsibility_override DECIMAL(10,2), -- Manual override for outstanding balance
  hsa_eligible_amount DECIMAL(10,2) DEFAULT 0,

  -- Status
  status medical_event_status DEFAULT 'active',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add medical_event_id to invoices
ALTER TABLE invoices
ADD COLUMN medical_event_id UUID REFERENCES medical_events(id) ON DELETE SET NULL;

-- Add user_responsibility_amount to invoices for manual override per bill
ALTER TABLE invoices
ADD COLUMN user_responsibility_amount DECIMAL(10,2);

-- Add medical_event_id to receipts (documents)
ALTER TABLE receipts
ADD COLUMN medical_event_id UUID REFERENCES medical_events(id) ON DELETE SET NULL;

-- Add document_category to receipts for better filtering
ALTER TABLE receipts
ADD COLUMN category document_category DEFAULT 'other';

-- Create indexes for performance
CREATE INDEX idx_medical_events_user_id ON medical_events(user_id);
CREATE INDEX idx_medical_events_status ON medical_events(status);
CREATE INDEX idx_medical_events_event_date ON medical_events(event_date);
CREATE INDEX idx_invoices_medical_event_id ON invoices(medical_event_id);
CREATE INDEX idx_receipts_medical_event_id ON receipts(medical_event_id);
CREATE INDEX idx_receipts_category ON receipts(category);

-- Enable RLS on medical_events
ALTER TABLE medical_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_events
CREATE POLICY "Users can view their own medical events"
  ON medical_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medical events"
  ON medical_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medical events"
  ON medical_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medical events"
  ON medical_events FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update medical_event totals when invoices change
CREATE OR REPLACE FUNCTION update_medical_event_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update totals for the affected medical event
  IF NEW.medical_event_id IS NOT NULL THEN
    UPDATE medical_events
    SET
      total_billed = COALESCE((
        SELECT SUM(COALESCE(total_amount, amount))
        FROM invoices
        WHERE medical_event_id = NEW.medical_event_id
      ), 0),
      hsa_eligible_amount = COALESCE((
        SELECT SUM(COALESCE(total_amount, amount))
        FROM invoices
        WHERE medical_event_id = NEW.medical_event_id
          AND is_hsa_eligible = true
      ), 0),
      updated_at = NOW()
    WHERE id = NEW.medical_event_id;
  END IF;

  -- Also update old event if invoice was moved
  IF TG_OP = 'UPDATE' AND OLD.medical_event_id IS NOT NULL AND OLD.medical_event_id != NEW.medical_event_id THEN
    UPDATE medical_events
    SET
      total_billed = COALESCE((
        SELECT SUM(COALESCE(total_amount, amount))
        FROM invoices
        WHERE medical_event_id = OLD.medical_event_id
      ), 0),
      hsa_eligible_amount = COALESCE((
        SELECT SUM(COALESCE(total_amount, amount))
        FROM invoices
        WHERE medical_event_id = OLD.medical_event_id
          AND is_hsa_eligible = true
      ), 0),
      updated_at = NOW()
    WHERE id = OLD.medical_event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update medical event totals
CREATE TRIGGER trigger_update_medical_event_totals
  AFTER INSERT OR UPDATE OF medical_event_id, amount, total_amount, is_hsa_eligible
  ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_event_totals();

-- Function to update total_paid when payment_transactions change
CREATE OR REPLACE FUNCTION update_medical_event_paid()
RETURNS TRIGGER AS $$
DECLARE
  v_medical_event_id UUID;
BEGIN
  -- Get the medical_event_id from the linked invoice
  SELECT medical_event_id INTO v_medical_event_id
  FROM invoices
  WHERE id = NEW.invoice_id;

  IF v_medical_event_id IS NOT NULL THEN
    UPDATE medical_events
    SET
      total_paid = COALESCE((
        SELECT SUM(pt.amount)
        FROM payment_transactions pt
        JOIN invoices i ON pt.invoice_id = i.id
        WHERE i.medical_event_id = v_medical_event_id
      ), 0),
      updated_at = NOW()
    WHERE id = v_medical_event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update paid totals
CREATE TRIGGER trigger_update_medical_event_paid
  AFTER INSERT OR UPDATE OR DELETE
  ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_event_paid();

-- Add comment for documentation
COMMENT ON TABLE medical_events IS 'Episodes of care that group related bills, documents, and payments (e.g., shoulder surgery, ongoing PT)';
COMMENT ON COLUMN medical_events.user_responsibility_override IS 'Manual override for outstanding balance - user-entered "what I actually owe"';
COMMENT ON COLUMN invoices.user_responsibility_amount IS 'Manual override for this specific bill - what user actually owes after insurance adjustments';
