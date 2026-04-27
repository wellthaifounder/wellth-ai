import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/utils/errorHandler";

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
      const { data, error } = await supabase.functions.invoke(
        "plaid-create-link-token",
      );

      if (error) throw error;

      setLinkToken(data.link_token);
    } catch (error) {
      logError("Error creating link token", error);
      toast.error("Failed to initialize Plaid Link");
    } finally {
      setLoading(false);
    }
  };

  const onSuccessCallback = async (public_token: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke(
        "plaid-exchange-token",
        {
          body: { public_token },
        },
      );

      if (error) throw error;

      toast.success("Bank account connected successfully!");
      onSuccess?.();
    } catch (error) {
      logError("Error exchanging token", error);
      toast.error("Failed to connect bank account");
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
    <div className="space-y-3">
      <Button onClick={() => open()} disabled={!ready || loading}>
        Connect Bank Account
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">
        By connecting an account, you authorize Wellth.ai to access your account
        and transaction data via Plaid in accordance with our{" "}
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          Privacy Policy
        </a>{" "}
        and Plaid's{" "}
        <a
          href="https://plaid.com/legal/#end-user-privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          End User Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
