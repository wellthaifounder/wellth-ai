import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout as StripeEmbeddedCheckout } from "@stripe/react-stripe-js";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface EmbeddedCheckoutProps {
  clientSecret: string;
  onComplete?: () => void;
}

const stripeKey = "pk_test_51SHqh32Oq7FyVuCtKXpEc9rlEqa7NhrxnfacTjGjZwY01Xfkxny6zpFU4SQqvmeH30qgwDOF6JdtmPoBBKoTssmM00BBOHEBdH";
console.log('Stripe publishable key available:', !!stripeKey);

const stripePromise = loadStripe(stripeKey || "");

export const EmbeddedCheckout = ({ clientSecret, onComplete }: EmbeddedCheckoutProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stripeKey) {
      setError('Stripe configuration error. Please contact support.');
      setIsLoading(false);
      return;
    }

    if (clientSecret) {
      console.log('Client secret received, loading checkout');
      setIsLoading(false);
    }
  }, [clientSecret]);

  const options = { clientSecret };

  if (error) {
    return (
      <Card className="flex min-h-[400px] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="flex min-h-[400px] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading secure checkout...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <StripeEmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </Card>
  );
};
