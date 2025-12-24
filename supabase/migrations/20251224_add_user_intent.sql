-- Add user intent tracking for onboarding segmentation
-- This enables "Bill Error Detection First" strategy

-- Add user_intent column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS user_intent TEXT CHECK (user_intent IN ('billing', 'hsa', 'both'));

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_intent ON profiles(user_intent);

-- Add has_seen_insurance_prompt flag to defer insurance collection
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_seen_insurance_prompt BOOLEAN DEFAULT FALSE;

-- Add comment explaining the columns
COMMENT ON COLUMN profiles.user_intent IS 'User onboarding intent: billing (error detection), hsa (optimization), or both';
COMMENT ON COLUMN profiles.has_seen_insurance_prompt IS 'Tracks if user has been shown insurance plan dialog (to defer until 3+ bills)';
