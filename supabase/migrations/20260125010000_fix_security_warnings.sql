-- Migration: Fix Supabase Security Linter Warnings
-- Date: 2026-01-25
--
-- This migration addresses security warnings from Supabase linter:
-- 1. Fix function search_path vulnerabilities (add explicit search_path)
-- 2. Drop unused email marketing tables (email_subscribers, email_sequence_sends)
-- 3. Drop unused insurance plan functions (get_user_insurance_plan, calculate_deductible_remaining)

-- ============================================
-- 1. Fix function search_path warnings
-- ============================================
-- Add explicit search_path to SECURITY DEFINER functions to prevent
-- privilege escalation attacks via schema poisoning

-- Fix: update_medical_event_totals
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix: update_medical_event_paid
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================
-- 2. Drop unused insurance plan functions
-- ============================================
-- These functions are not used in the current codebase

DROP FUNCTION IF EXISTS public.get_user_insurance_plan(UUID);
DROP FUNCTION IF EXISTS public.calculate_deductible_remaining(UUID);

-- ============================================
-- 3. Drop unused email marketing tables
-- ============================================
-- These tables were created for email sequences but are not used

-- Drop dependent table first
DROP TABLE IF EXISTS public.email_sequence_sends CASCADE;

-- Drop main table
DROP TABLE IF EXISTS public.email_subscribers CASCADE;

-- ============================================
-- Migration Complete
-- ============================================
-- Remaining manual action required:
-- - Enable "Leaked Password Protection" in Supabase Dashboard
--   Navigate to: Authentication → Policies → Password Security
--   Enable: "Check passwords against leaked databases"
