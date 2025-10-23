-- Create plaid_connections table to store Plaid access tokens
CREATE TABLE IF NOT EXISTS public.plaid_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  item_id TEXT NOT NULL,
  institution_name TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.plaid_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own plaid connections" 
ON public.plaid_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plaid connections" 
ON public.plaid_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plaid connections" 
ON public.plaid_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plaid connections" 
ON public.plaid_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_plaid_connections_updated_at
BEFORE UPDATE ON public.plaid_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint on plaid_transaction_id in transactions table
ALTER TABLE public.transactions 
ADD CONSTRAINT unique_plaid_transaction_id 
UNIQUE (plaid_transaction_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_plaid_id ON public.transactions(plaid_transaction_id);
CREATE INDEX IF NOT EXISTS idx_plaid_connections_user_id ON public.plaid_connections(user_id);