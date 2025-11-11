import { CheckCircle2, CreditCard, FileText, PiggyBank, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Sparkles,
    title: "Never Miss a Tax Deduction",
    description: "Automatically categorize every medical expense as tax-deductible or HSA-eligible. No more spreadsheets or guessing.",
  },
  {
    icon: CreditCard,
    title: "Maximize Every Dollar",
    description: "Get instant recommendations on the smartest way to pay—whether that's cash, rewards card, FSA, or HSA.",
  },
  {
    icon: FileText,
    title: "Stress-Free Tax Time",
    description: "All your receipts organized and instantly searchable. Export IRS-compliant reports in seconds, not hours.",
  },
  {
    icon: TrendingUp,
    title: "Watch Your Money Grow",
    description: "Track tax savings, rewards earned, and HSA investment growth in one beautiful dashboard.",
  },
  {
    icon: PiggyBank,
    title: "Stack Savings Automatically",
    description: "Combine tax advantages, credit card rewards, and strategic timing to maximize every healthcare purchase.",
  },
  {
    icon: CheckCircle2,
    title: "Audit-Proof Records",
    description: "All categorizations follow IRS Publication 502 with detailed documentation. Sleep easy at tax time.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-20 lg:py-32" aria-labelledby="features-heading">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 id="features-heading" className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Take Control
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you have an HSA or not, these tools help you save money and reduce stress on every medical expense.
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Product features">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-border/50 transition-all hover:shadow-lg" role="listitem">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10" aria-hidden="true">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
