import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";

const pricingTiers = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Perfect for getting started with HSA management",
    features: [
      { text: "Up to 50 expenses/month", included: true },
      { text: "Manual expense entry", included: true },
      { text: "Basic receipt storage", included: true },
      { text: "HSA eligibility checker", included: true },
      { text: "Simple reimbursement PDFs", included: true },
      { text: "Single payment method tracking", included: true },
      { text: "Basic expense categorization", included: true },
      { text: "Receipt OCR", included: false },
      { text: "Unlimited expenses", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Plus",
    price: "$19",
    period: "per month",
    description: "For active HSA users who want automation",
    annualPrice: "$15/mo",
    annualSavings: "Save $48/year",
    features: [
      { text: "Unlimited expenses", included: true },
      { text: "Receipt OCR automation", included: true },
      { text: "Smart categorization", included: true },
      { text: "Multiple payment method tracking", included: true },
      { text: "Rewards optimization alerts", included: true },
      { text: "Advanced analytics & reports", included: true },
      { text: "Email support (24hr response)", included: true },
      { text: "Custom reimbursement templates", included: true },
      { text: "Bulk actions", included: true },
      { text: "Priority support", included: false },
    ],
    cta: "Start 14-Day Trial",
    popular: true,
  },
  {
    name: "Premium",
    price: "$49",
    period: "per month",
    description: "Maximum automation and insights for power users",
    annualPrice: "$39/mo",
    annualSavings: "Save $120/year",
    features: [
      { text: "Everything in Plus", included: true },
      { text: "Auto-submit reimbursements", included: true },
      { text: "Bank/card integration (coming soon)", included: true },
      { text: "Tax optimization reports", included: true },
      { text: "Multi-year expense tracking", included: true },
      { text: "Export to tax software", included: true },
      { text: "Priority support (1hr response)", included: true },
      { text: "Custom HSA provider integrations", included: true },
      { text: "Expense forecasting & planning", included: true },
      { text: "API access", included: true },
    ],
    cta: "Start 14-Day Trial",
    popular: false,
  },
];

export const Pricing = () => {
  const { createCheckoutSession, tier } = useSubscription();
  const navigate = useNavigate();

  const handleCTA = (tierName: string) => {
    if (tierName === "Starter") {
      navigate("/auth");
    } else if (tierName === "Plus") {
      createCheckoutSession("plus");
    } else if (tierName === "Premium") {
      createCheckoutSession("premium");
    }
  };

  return (
    <section id="pricing" className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground sm:text-xl">
            Start free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative flex flex-col ${
                tier.popular
                  ? "border-primary shadow-lg ring-2 ring-primary/20"
                  : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription className="min-h-12">{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.period && (
                    <span className="text-muted-foreground"> /{tier.period}</span>
                  )}
                  {tier.annualPrice && (
                    <p className="mt-2 text-sm font-medium text-primary">
                      or {tier.annualPrice} billed annually
                    </p>
                  )}
                  {tier.annualSavings && (
                    <p className="text-xs text-muted-foreground">{tier.annualSavings}</p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col">
                <Button
                  className="mb-6 w-full"
                  variant={tier.popular ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleCTA(tier.name)}
                >
                  {tier.cta}
                </Button>

                <ul className="space-y-3 text-sm">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 shrink-0 text-primary" />
                      ) : (
                        <X className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                      )}
                      <span className={feature.included ? "" : "text-muted-foreground"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-24 max-w-3xl">
          <h3 className="mb-8 text-center text-2xl font-bold">Frequently Asked Questions</h3>
          <div className="space-y-6">
            <div>
              <h4 className="mb-2 font-semibold">Can I switch plans anytime?</h4>
              <p className="text-muted-foreground">
                Yes! Upgrade or downgrade anytime. When upgrading, you'll be charged a prorated amount. When downgrading, you'll receive credit for your next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">What happens if I exceed my plan limits?</h4>
              <p className="text-muted-foreground">
                On the free plan, you'll be prompted to upgrade when you hit 50 expenses. We'll never charge you without permission or delete your data.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Is my financial data secure?</h4>
              <p className="text-muted-foreground">
                Absolutely. We use bank-level encryption, never store card numbers, and are fully compliant with healthcare data regulations.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Do you offer annual billing?</h4>
              <p className="text-muted-foreground">
                Yes! Save 20% with annual billing on both Plus ($180/year vs $228) and Premium ($468/year vs $588).
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">What payment methods do you accept?</h4>
              <p className="text-muted-foreground">
                We accept all major credit cards, debit cards, and digital wallets. Payments are processed securely through Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
