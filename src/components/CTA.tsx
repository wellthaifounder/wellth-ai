import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/90 p-8 text-center shadow-2xl lg:p-16">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Ready to Stop Leaving Money on the Table?
          </h2>
          <p className="mb-8 text-lg text-white/90 sm:text-xl">
            Join thousands of smart savers who are maximizing their HSA benefits and earning rewards on every medical expense.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="group bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg"
            >
              Start Saving Today - It's Free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
          
          <p className="mt-6 text-sm text-white/70">
            No credit card required • Free tier available • Premium from $5/month
          </p>
        </div>
      </div>
    </section>
  );
};
