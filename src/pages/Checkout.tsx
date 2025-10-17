import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { EmbeddedCheckout } from "@/components/stripe/EmbeddedCheckout";

const Checkout = () => {
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Prefer sessionStorage to avoid exposing the client secret in the URL
    const cs = sessionStorage.getItem("stripe_tripwire_client_secret");
    if (cs) {
      setClientSecret(cs);
    }
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12 lg:py-20">
        <header className="mb-6 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Secure Checkout</h1>
        </header>

        <section aria-label="Stripe embedded checkout">
          <Card className="p-0 overflow-hidden">
            {loading && (
              <div className="flex min-h-[400px] items-center justify-center p-8">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Preparing checkout…</p>
                </div>
              </div>
            )}

            {!loading && clientSecret && (
              <EmbeddedCheckout clientSecret={clientSecret} />
            )}

            {!loading && !clientSecret && (
              <div className="flex min-h-[400px] items-center justify-center p-8 text-center">
                <div className="space-y-3">
                  <p className="text-sm text-destructive">Checkout session not found.</p>
                  <Button onClick={() => navigate("/calculator")} size="sm">
                    Return to Calculator
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Checkout;
