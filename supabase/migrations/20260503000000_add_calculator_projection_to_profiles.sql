-- ============================================
-- Persist calculator results across sessions
-- ============================================
-- The pre-signup HSA savings calculator stores its result in sessionStorage and
-- the dashboard reads it on mount. That projection is the single most concrete
-- piece of value Maya sees in onboarding — but sessionStorage dies on tab close,
-- so a user who calculates → signs up → bounces → comes back tomorrow loses it.
--
-- Persisting to profiles.calculator_projection lets the dashboard re-render the
-- projection on subsequent visits until the user has uploaded their first bill
-- and graduated past the empty state.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS calculator_projection JSONB DEFAULT NULL;

COMMENT ON COLUMN public.profiles.calculator_projection IS 'Snapshot of the pre-signup HSA savings calculator result. Used by the dashboard empty state to keep the projection visible until the user has tracked any bills.';
