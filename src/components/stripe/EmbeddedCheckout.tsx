import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout as StripeEmbeddedCheckout } from "@stripe/react-stripe-js";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface EmbeddedCheckoutProps {
  clientSecret: string;
  onComplete?: () => void;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

export const EmbeddedCheckout = ({ clientSecret, onComplete }: EmbeddedCheckoutProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clientSecret) {
      setIsLoading(false);
    }
  }, [clientSecret]);

  const options = { clientSecret };

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
