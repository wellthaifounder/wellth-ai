import { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PlaidLinkProps {
  onSuccess?: () => void;
}

export function PlaidLink({ onSuccess }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createLinkToken();
  }, []);

  const createLinkToken = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('plaid-create-link-token');
      
      if (error) throw error;
      
      setLinkToken(data.link_token);
    } catch (error) {
      console.error('Error creating link token:', error);
      toast.error('Failed to initialize Plaid Link');
    } finally {
      setLoading(false);
    }
  };

  const onSuccessCallback = async (public_token: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('plaid-exchange-token', {
        body: { public_token },
      });

      if (error) throw error;

      toast.success('Bank account connected successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Error exchanging token:', error);
      toast.error('Failed to connect bank account');
    } finally {
      setLoading(false);
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onSuccessCallback,
  });

  if (!linkToken || loading) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  return (
    <Button onClick={() => open()} disabled={!ready || loading}>
      Connect Bank Account
    </Button>
  );
}
