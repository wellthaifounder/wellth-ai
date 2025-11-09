-- Fix search_path security warning for trigger function
CREATE OR REPLACE FUNCTION public.trigger_update_provider_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_provider_statistics(OLD.provider_id);
    RETURN OLD;
  ELSE
    PERFORM update_provider_statistics(NEW.provider_id);
    RETURN NEW;
  END IF;
END;
$$;