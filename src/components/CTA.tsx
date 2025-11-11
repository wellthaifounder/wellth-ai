import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CTA = () => {
  const navigate = useNavigate();
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/90 p-8 text-center shadow-2xl lg:p-16">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Start Saving This Tax Year
          </h2>
          <p className="mb-8 text-lg text-white/90 sm:text-xl">
            Stop overpaying on healthcare. Join users who are saving thousands by taking control of medical expenses with smart tracking and payment strategies.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="group bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate('/auth')}
            >
              Start Free Today
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
          
          <p className="mt-6 text-sm text-white/70">
            Free forever • No credit card required • 14-day trial on paid plans
          </p>
          <p className="mt-2 text-xs text-white/60">
            30-day money-back guarantee on all paid plans
          </p>
        </div>
      </div>
    </section>
  );
};
