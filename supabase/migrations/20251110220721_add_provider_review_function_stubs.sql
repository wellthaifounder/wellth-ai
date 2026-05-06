-- ============================================
-- Provider review function stubs (local/CI bootstrap)
-- ============================================
-- The next migration (20251110220722_99e2f0fc-...sql) creates the provider_reviews
-- table and references two functions that were never added to the migrations history:
--   * public.can_view_provider_review(uuid, boolean) — used in a SELECT RLS policy
--   * public.update_provider_review_aggregates() — trigger function on provider_reviews
-- These functions exist in production (they predate version-controlled migrations) but
-- fresh local/CI databases fail without them. This migration creates safe defaults
-- using CREATE OR REPLACE so production behavior is preserved if the prod versions
-- were ever subsequently committed.
--
-- Default behavior:
--   can_view_provider_review: visible if not flagged, or if the viewer authored it.
--     Matches the policy intent ("Users can view non-flagged reviews and their own").
--   update_provider_review_aggregates: no-op trigger that returns the appropriate row.
--     If aggregate-updating logic was meant to happen, replace this stub with a real
--     definition pulled from production (\df+ public.update_provider_review_aggregates).

CREATE OR REPLACE FUNCTION public.can_view_provider_review(
  p_user_id UUID,
  p_is_flagged BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT NOT COALESCE(p_is_flagged, false) OR auth.uid() = p_user_id;
$$;

COMMENT ON FUNCTION public.can_view_provider_review(UUID, BOOLEAN) IS 'Default: visible if not flagged, or if viewer authored the review. Replace with prod definition if behavior differs.';

CREATE OR REPLACE FUNCTION public.update_provider_review_aggregates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Local/CI stub. Replace with production function definition if aggregate
  -- counts on `providers` are required to update on review insert/update/delete.
  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.update_provider_review_aggregates() IS 'Local/CI stub. No-op trigger. Replace with prod function if aggregate maintenance is required.';
