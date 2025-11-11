import { Upload, Sparkles, CreditCard, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Snap or Import Expenses",
    description: "Take a photo of your receipt, forward an email, or connect your bank. No manual data entry required.",
  },
  {
    icon: Sparkles,
    title: "Get Smart Recommendations",
    description: "Wellth analyzes each expense and tells you exactly how to pay for maximum savings—whether you have an HSA or not.",
  },
  {
    icon: TrendingUp,
    title: "Track Everything Effortlessly",
    description: "Watch your savings grow and access tax-ready reports anytime. Everything organized for you automatically.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-secondary/30 py-20 lg:py-32" aria-labelledby="how-it-works-heading">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 id="how-it-works-heading" className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Start Saving in 3 Minutes
          </h2>
          <p className="text-lg text-muted-foreground">
            No HSA required. No complex setup. Just snap, save, and track.
          </p>
        </div>
        
        <div className="mx-auto max-w-5xl">
          <ol className="grid gap-8 md:grid-cols-3 lg:gap-12" aria-label="How Wellth works in 3 steps">
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
