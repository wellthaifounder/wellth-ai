-- ============================================
-- Default user_intent to 'both' on new profiles
-- ============================================
-- Wave 5 (2026-05-06) UX rebuild: UserIntentDialog is deleted from the
-- signup flow. Everyone defaults to 'both' so HSA features are visible
-- without forcing an upfront intent picker; users refine in Settings.
--
-- Idempotent: ADD COLUMN was done in 20251224_add_user_intent.sql; this
-- only changes the default for newly inserted rows. Existing rows are
-- left as-is (their NULL → app falls back to 'both' via HSAContext).

ALTER TABLE public.profiles
  ALTER COLUMN user_intent SET DEFAULT 'both';

COMMENT ON COLUMN public.profiles.user_intent IS 'User-selected intent: billing | hsa | both. Defaults to both since 2026-05-06 (Wave 5 UX rebuild — UserIntentDialog removed; users refine in Settings).';
