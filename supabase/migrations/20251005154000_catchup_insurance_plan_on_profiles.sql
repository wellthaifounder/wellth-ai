-- ============================================
-- Catch-up: insurance_plan + is_admin on profiles
-- ============================================
-- The original migration that adds these columns (20241209000000_add_analytics_and_insurance.sql)
-- runs BEFORE the migration that creates public.profiles (20251005153724_*) on fresh DBs.
-- That earlier migration now guards its ALTERs with a DO block; this catch-up applies
-- the columns once profiles definitely exists. Both `IF NOT EXISTS` so this is a no-op
-- on production where the columns are already present.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS insurance_plan JSONB DEFAULT NULL;

COMMENT ON COLUMN public.profiles.insurance_plan IS 'Stores user insurance plan details: carrier, plan_type, deductible, out_of_pocket_max, etc.';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Admin RLS policy moved here from 20241209000000 — its USING clause references
-- public.profiles, which Postgres validates at CREATE POLICY time.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'analytics_events'
      AND policyname = 'Admins can view all analytics events'
  ) THEN
    CREATE POLICY "Admins can view all analytics events"
      ON public.analytics_events FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND is_admin = true
        )
      );
  END IF;
END $$;

-- Helper functions moved here from 20241209000000 — their SQL bodies reference
-- public.profiles, which Postgres validates at CREATE FUNCTION time for SQL-language
-- functions. CREATE OR REPLACE keeps prod behavior intact.
CREATE OR REPLACE FUNCTION public.get_user_insurance_plan(p_user_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT insurance_plan
  FROM public.profiles
  WHERE id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.calculate_deductible_remaining(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    CASE
      WHEN insurance_plan->>'deductible' IS NOT NULL
        AND insurance_plan->>'deductible_met' IS NOT NULL
      THEN
        GREATEST(
          0,
          (insurance_plan->>'deductible')::numeric - (insurance_plan->>'deductible_met')::numeric
        )
      ELSE NULL
    END
  FROM public.profiles
  WHERE id = p_user_id;
$$;
