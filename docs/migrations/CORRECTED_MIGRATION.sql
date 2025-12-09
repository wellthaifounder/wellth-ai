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
-- Note: Your table is called 'profiles', not 'user_profiles'
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS insurance_plan JSONB DEFAULT NULL;

COMMENT ON COLUMN public.profiles.insurance_plan IS 'Stores user insurance plan details: carrier, plan_type, deductible, out_of_pocket_max, etc.';

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
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create admin policy for analytics
CREATE POLICY "Admins can view all analytics events"
  ON public.analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- ============================================
-- 4. Add helpful functions (optional but useful)
-- ============================================

-- Function to get user's insurance plan
CREATE OR REPLACE FUNCTION public.get_user_insurance_plan(p_user_id UUID)
RETURNS JSONB AS $$
  SELECT insurance_plan
  FROM public.profiles
  WHERE id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to calculate deductible remaining
CREATE OR REPLACE FUNCTION public.calculate_deductible_remaining(p_user_id UUID)
RETURNS NUMERIC AS $$
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
$$ LANGUAGE sql SECURITY DEFINER;

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
