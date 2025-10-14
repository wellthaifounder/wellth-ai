-- Create table for email subscribers
CREATE TABLE public.email_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  estimated_savings NUMERIC,
  calculator_data JSONB,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'calculator',
  is_active BOOLEAN DEFAULT true
);

-- Create table for email sequence tracking
CREATE TABLE public.email_sequence_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES public.email_subscribers(id) ON DELETE CASCADE,
  sequence_day INTEGER NOT NULL,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_sends ENABLE ROW LEVEL SECURITY;

-- Policies for email_subscribers (admin only, no user access needed for now)
CREATE POLICY "Service role can manage subscribers" 
ON public.email_subscribers 
FOR ALL 
USING (true);

-- Policies for email_sequence_sends (admin only)
CREATE POLICY "Service role can manage sequence sends" 
ON public.email_sequence_sends 
FOR ALL 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_email_subscribers_email ON public.email_subscribers(email);
CREATE INDEX idx_sequence_sends_subscriber ON public.email_sequence_sends(subscriber_id);
CREATE INDEX idx_sequence_sends_day ON public.email_sequence_sends(sequence_day);