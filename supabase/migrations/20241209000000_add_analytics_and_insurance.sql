-- ============================================
-- Wellth.ai MVP Analytics & Insurance Migration
-- ============================================
-- This migration adds:
-- 1. Analytics events tracking table
-- 2. Insurance plan column to profiles
-- 3. Necessary RLS policies

-- ============================================
-- 1. Create analytics_events table
-- ============================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- Add comment
COMMENT ON TABLE public.analytics_events IS 'Stores analytics events for KPI tracking and user behavior analysis';

-- ============================================
-- 2. Add insurance_plan to profiles table
-- ============================================
-- Note: Your table is called 'profiles', not 'user_profiles'.
-- Guard: this migration's date prefix runs before the migration that creates
-- public.profiles (20251005153724_*). On fresh local/CI DBs the table doesn't
-- exist yet; the catch-up runs in 20251005154000_catchup_insurance_plan_on_profiles.sql.
-- On production (where this migration was applied to a pre-existing schema with
-- profiles already present), the ALTER runs as before.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS insurance_plan JSONB DEFAULT NULL;

    COMMENT ON COLUMN public.profiles.insurance_plan IS 'Stores user insurance plan details: carrier, plan_type, deductible, out_of_pocket_max, etc.';
  ELSE
    RAISE NOTICE 'profiles table not yet present; insurance_plan column will be added by 20251005154000_catchup_insurance_plan_on_profiles.sql';
  END IF;
END $$;

-- ============================================
-- 3. Enable RLS on analytics_events
-- ============================================
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own analytics events
CREATE POLICY "Users can view own analytics events"
  ON public.analytics_events FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own analytics events (or anonymous events with user_id IS NULL)
CREATE POLICY "Users can insert own analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Admins can view all analytics events
-- First, add is_admin column to profiles if it doesn't exist
-- Guarded for the same reason as the insurance_plan ALTER above.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
  ELSE
    RAISE NOTICE 'profiles table not yet present; is_admin column will be added by 20251005154000_catchup_insurance_plan_on_profiles.sql';
  END IF;
END $$;

-- The "Admins can view all" policy and the two helper SQL functions
-- (get_user_insurance_plan, calculate_deductible_remaining) reference public.profiles
-- in clauses that Postgres validates at CREATE time. They are defined in
-- 20251005154000_catchup_insurance_plan_on_profiles.sql once profiles exists.

-- ============================================
-- 5. Example data structure for insurance_plan
-- ============================================
-- {
--   "carrier": "Aetna",
--   "plan_type": "hdhp",
--   "deductible": 3000,
--   "deductible_met": 1500,
--   "out_of_pocket_max": 8000,
--   "out_of_pocket_met": 2000,
--   "updated_at": "2025-01-15T10:30:00Z"
-- }

-- ============================================
-- Migration Complete
-- ============================================
