import { AlertCircle, Shield, FileText, CheckCircle2, PiggyBank, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

// Reordered to prioritize bill error detection (Bill Error Detection First strategy)
const features = [
  {
    icon: AlertCircle,
    title: "AI-Powered Bill Analysis",
    description: "Automatically detect billing errors, duplicate charges, and overcharges before you pay. Our AI scans every line item.",
    isPrimary: true,
  },
  {
    icon: FileText,
    title: "Dispute Automation",
    description: "Generate professional dispute letters instantly when errors are found. We handle the paperwork, you keep the savings.",
    isPrimary: true,
  },
  {
    icon: Shield,
    title: "Provider Transparency",
    description: "Check billing accuracy scores and dispute success rates for healthcare providers before scheduling your next appointment.",
    isPrimary: true,
  },
  {
    icon: CheckCircle2,
    title: "Tax Deduction Tracking",
    description: "Automatically categorize every medical expense as tax-deductible. Export IRS-compliant reports in seconds.",
    isPrimary: false,
  },
  {
    icon: PiggyBank,
    title: "HSA Optimization (Bonus for HSA Users)",
    description: "Strategic reimbursement timing and claimable balance tracking to maximize your tax-advantaged healthcare account.",
    isPrimary: false,
  },
  {
    icon: Sparkles,
    title: "Organized Records",
    description: "All your bills, receipts, and payments in one searchable place. Never lose a document again.",
    isPrimary: false,
  },
];

export const Features = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 });
  const { ref: featuresRef, isVisible: featuresVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="features" className="py-12 sm:py-16 lg:py-24 xl:py-32" aria-labelledby="features-heading">
      <div className="container mx-auto px-4 sm:px-6">
        <div 
          ref={headerRef}
          className={`mx-auto mb-12 sm:mb-16 max-w-2xl text-center scroll-fade-in ${headerVisible ? 'visible' : ''}`}
        >
          <h2 id="features-heading" className="mb-4 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Everything You Need to Take Control
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground px-4 sm:px-0">
            Whether you have an HSA or not, these tools help you save money and reduce stress on every medical expense.
          </p>
        </div>
        
        <div 
          ref={featuresRef}
          className={`grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 scroll-fade-in ${featuresVisible ? 'visible' : ''}`} 
          role="list" 
          aria-label="Product features"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-border/50 transition-all hover:shadow-lg h-full" role="listitem">
                <CardHeader className="pb-4">
                  <div className="mb-3 sm:mb-4 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10" aria-hidden="true">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-sm sm:text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
