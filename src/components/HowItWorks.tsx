import { Upload, Sparkles, CreditCard, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Add Your Expenses",
    description: "Manually enter purchases or upload receipts. Import CSV from your bank for bulk processing.",
  },
  {
    icon: Sparkles,
    title: "Automatic Categorization",
    description: "Wellth.ai analyzes each expense and determines HSA eligibility using IRS guidelines.",
  },
  {
    icon: CreditCard,
    title: "Get Smart Recommendations",
    description: "Receive instant guidance: pay with HSA, or use rewards cards and reimburse later for maximum benefit.",
  },
  {
    icon: TrendingUp,
    title: "Track Your Savings",
    description: "Watch your tax savings and cashback rewards grow. Export reports for easy reimbursement and tax filing.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-secondary/30 py-20 lg:py-32" aria-labelledby="how-it-works-heading">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 id="how-it-works-heading" className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            How Wellth.ai Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Four simple steps to optimize your healthcare spending
          </p>
        </div>
        
        <div className="mx-auto max-w-5xl">
          <ol className="grid gap-8 md:grid-cols-2 lg:gap-12" aria-label="How Wellth.ai works in 4 steps">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={index} className="relative flex gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg" aria-hidden="true">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-semibold text-primary">
                      Step {index + 1}
                    </div>
                    <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
};
