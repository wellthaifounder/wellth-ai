-- Create user vendor preferences table for learning medical vendors
CREATE TABLE IF NOT EXISTS public.user_vendor_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vendor_pattern TEXT NOT NULL,
  is_medical BOOLEAN NOT NULL DEFAULT true,
  confidence_score NUMERIC DEFAULT 1.0,
  times_confirmed INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_vendor_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own vendor preferences"
ON public.user_vendor_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vendor preferences"
ON public.user_vendor_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendor preferences"
ON public.user_vendor_preferences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendor preferences"
ON public.user_vendor_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_vendor_preferences_updated_at
BEFORE UPDATE ON public.user_vendor_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance (skip if they already exist)
CREATE INDEX IF NOT EXISTS idx_user_vendor_preferences_user_id ON public.user_vendor_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vendor_preferences_vendor_pattern ON public.user_vendor_preferences(vendor_pattern);
CREATE INDEX IF NOT EXISTS idx_transactions_vendor ON public.transactions(vendor);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor ON public.invoices(vendor);