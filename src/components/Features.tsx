import { CheckCircle2, CreditCard, FileText, PiggyBank, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Sparkles,
    title: "Smart Categorization",
    description: "Automatically identifies HSA-eligible expenses using IRS guidelines and AI-powered analysis.",
  },
  {
    icon: CreditCard,
    title: "Payment Strategy",
    description: "Get real-time recommendations: pay with HSA now, or use rewards cards and reimburse later.",
  },
  {
    icon: FileText,
    title: "Receipt Vault",
    description: "Securely store and organize receipts with instant search and IRS-ready export capabilities.",
  },
  {
    icon: TrendingUp,
    title: "Savings Dashboard",
    description: "Track total tax savings, rewards earned, and unreimbursed balances in one beautiful view.",
  },
  {
    icon: PiggyBank,
    title: "Maximize Benefits",
    description: "Optimize every healthcare dollar with combined tax-free HSA benefits and credit card rewards.",
  },
  {
    icon: CheckCircle2,
    title: "IRS Compliant",
    description: "All categorizations follow IRS Publication 502 guidelines with audit-ready documentation.",
  },
];

export const Features = () => {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Optimize Healthcare Spending
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to save you money on every medical expense.
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-border/50 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
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
