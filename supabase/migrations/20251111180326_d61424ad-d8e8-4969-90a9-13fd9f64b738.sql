-- Add admin role to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create review moderation table for tracking admin actions
CREATE TABLE IF NOT EXISTS review_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'featured', 'unfeatured', 'flagged')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on review_moderation_log
ALTER TABLE review_moderation_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all moderation logs
CREATE POLICY "Admins can view all moderation logs"
  ON review_moderation_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can insert moderation logs
CREATE POLICY "Admins can insert moderation logs"
  ON review_moderation_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Add moderation status columns to reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Update RLS policies for reviews
DROP POLICY IF EXISTS "Users can view featured reviews" ON reviews;
CREATE POLICY "Users can view approved featured reviews"
  ON reviews
  FOR SELECT
  USING (is_featured = true AND moderation_status = 'approved');

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
  ON reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can update reviews
CREATE POLICY "Admins can update reviews"
  ON reviews
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON reviews(moderation_status);
CREATE INDEX IF NOT EXISTS idx_reviews_is_featured ON reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_review_moderation_log_review_id ON review_moderation_log(review_id);