import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { analytics } from "@/lib/analytics";

export const CTA = () => {
  const navigate = useNavigate();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation({ threshold: 0.3 });

  const handleCTAClick = () => {
    analytics.ctaClick("start_free", "final_cta");
    navigate('/auth');
  };

  return (
    <section className="py-12 sm:py-16 lg:py-24 xl:py-32">
      <div className="container mx-auto px-4 sm:px-6">
        <div 
          ref={ctaRef}
          className={`mx-auto max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-hero p-6 sm:p-8 lg:p-12 xl:p-16 text-center shadow-2xl scroll-scale-in ${ctaVisible ? 'visible' : ''}`}
        >
          <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white">
            Take Control of Your Healthcare Dollars
          </h2>
          <p className="mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg xl:text-xl text-white/90 px-4 sm:px-0">
            Track every expense, organize by episode of care, and optimize your HSA or FSA for maximum tax savings.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto group bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
              onClick={handleCTAClick}
            >
              Start Free Today
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
          
          <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-white/70">
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
