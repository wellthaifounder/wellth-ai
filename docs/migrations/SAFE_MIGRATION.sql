-- ============================================
-- Wellth.ai MVP Analytics & Insurance Migration (SAFE VERSION)
-- ============================================
-- This version checks for existing objects before creating them

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

-- Add indexes for performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- ============================================
-- 2. Add insurance_plan to profiles table
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS insurance_plan JSONB DEFAULT NULL;

-- ============================================
-- 3. Add is_admin column to profiles table
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- ============================================
-- 4. Enable RLS on analytics_events
-- ============================================
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Drop existing policies if they exist, then recreate
-- ============================================
DROP POLICY IF EXISTS "Users can view own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can view all analytics events" ON public.analytics_events;

-- Recreate policies
CREATE POLICY "Users can view own analytics events"
  ON public.analytics_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

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
-- 6. Add helpful functions (optional)
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
-- Migration Complete ✅
-- ============================================
