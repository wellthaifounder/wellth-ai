-- Migration: Add New Error Types for Enhanced AI Detection
-- Purpose: Support Marshall Allen principles - detect excessive markups, facility fee issues, timeline problems, etc.
-- Phase 2 of "Never Pay the First Bill" implementation

-- Add new error types to the bill_error_type enum
ALTER TYPE bill_error_type ADD VALUE IF NOT EXISTS 'excessive_markup';
ALTER TYPE bill_error_type ADD VALUE IF NOT EXISTS 'facility_fees_questionable';
ALTER TYPE bill_error_type ADD VALUE IF NOT EXISTS 'timeline_inconsistency';
ALTER TYPE bill_error_type ADD VALUE IF NOT EXISTS 'inappropriate_for_diagnosis';
ALTER TYPE bill_error_type ADD VALUE IF NOT EXISTS 'services_not_documented';
ALTER TYPE bill_error_type ADD VALUE IF NOT EXISTS 'pricing_transparency_violation';

-- Add comments to document the new error types
COMMENT ON TYPE bill_error_type IS 'Types of billing errors detected by AI analysis. Updated 2026-01-06 to include enhanced Marshall Allen principles-based detection.';

-- Note: The enum values have been added but TypeScript types need to be regenerated
-- Run: npx supabase gen types typescript --local > src/integrations/supabase/types.ts
