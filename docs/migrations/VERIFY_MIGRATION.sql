-- ============================================
-- Verification Queries for Migration
-- ============================================
-- Run these to confirm everything was created successfully

-- 1. Check analytics_events table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'analytics_events'
ORDER BY ordinal_position;

-- 2. Check indexes on analytics_events
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'analytics_events';

-- 3. Check RLS policies on analytics_events
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'analytics_events';

-- 4. Check new columns in profiles table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('insurance_plan', 'is_admin');

-- 5. Check that functions were created
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_user_insurance_plan', 'calculate_deductible_remaining');
