-- Create hsa_accounts table
CREATE TABLE hsa_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  opened_date DATE NOT NULL,
  closed_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE hsa_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own HSA accounts"
  ON hsa_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own HSA accounts"
  ON hsa_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own HSA accounts"
  ON hsa_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own HSA accounts"
  ON hsa_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_hsa_accounts_user_id ON hsa_accounts(user_id);
CREATE INDEX idx_hsa_accounts_dates ON hsa_accounts(user_id, opened_date, closed_date);
CREATE INDEX idx_hsa_accounts_active ON hsa_accounts(user_id, is_active);

-- Trigger for updated_at
CREATE TRIGGER update_hsa_accounts_updated_at
  BEFORE UPDATE ON hsa_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();