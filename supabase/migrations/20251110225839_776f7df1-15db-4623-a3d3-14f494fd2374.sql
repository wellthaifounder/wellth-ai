-- Fix search_path security issue by recreating the function with proper security
DROP TRIGGER IF EXISTS trigger_update_provider_reviews_updated_at ON provider_reviews;
DROP FUNCTION IF EXISTS update_provider_reviews_updated_at();

CREATE OR REPLACE FUNCTION public.update_provider_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public';

CREATE TRIGGER trigger_update_provider_reviews_updated_at
  BEFORE UPDATE ON provider_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_reviews_updated_at();