import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, TrendingUp, Sparkles } from "lucide-react";
import { calculateSavings } from "@/lib/savingsCalculator";
import { useNavigate } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export const Hero = () => {
  const navigate = useNavigate();
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: painPointsRef, isVisible: painPointsVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: hsaBonusRef, isVisible: hsaBonusVisible } = useScrollAnimation({ threshold: 0.1 });
  
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-32" aria-labelledby="hero-heading">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-5xl space-y-12">
          {/* Main headline */}
          <div 
            ref={heroRef}
            className={`text-center space-y-6 scroll-fade-in ${heroVisible ? 'visible' : ''}`}
          >
            <h1 id="hero-heading" className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
              Turn Healthcare Complexity
              <span className="block bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent mt-2">
                Into Simple Savings
              </span>
            </h1>
            
            <p className="text-lg text-white/90 sm:text-xl leading-relaxed max-w-3xl mx-auto">
              Medical bills are confusing. Payment strategies are overwhelming. Tax deductions slip through the cracks.
              <span className="block mt-2 font-medium text-white">We make it simple—and save you thousands.</span>
            </p>
          </div>

          {/* Pain points we solve */}
          <div 
            ref={painPointsRef}
            className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-12 scroll-fade-in ${painPointsVisible ? 'visible' : ''}`}
          >
            <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm border border-white/20">
              <h3 className="font-semibold text-white mb-2">Catch Billing Errors</h3>
              <p className="text-sm text-white/80">Spot duplicate charges and overcharges before you pay</p>
            </div>
            <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm border border-white/20">
              <h3 className="font-semibold text-white mb-2">Choose Smart</h3>
              <p className="text-sm text-white/80">Pick providers with proven track records, not guesswork</p>
            </div>
            <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm border border-white/20">
              <h3 className="font-semibold text-white mb-2">Track Everything</h3>
              <p className="text-sm text-white/80">All bills, payments, and receipts in one organized place</p>
            </div>
            <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm border border-white/20">
              <h3 className="font-semibold text-white mb-2">Maximize Savings</h3>
              <p className="text-sm text-white/80">Get the best payment strategy for every medical expense</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4" role="group" aria-label="Call to action">
            <Button
              size="lg"
              className="group bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate('/calculator')}
              aria-label="Calculate your potential healthcare savings in 60 seconds"
            >
              Calculate My Savings in 60 Seconds
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              onClick={() => navigate('/auth')}
              aria-label="Start using Wellth for free"
            >
              Start Free
            </Button>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-sm text-white/70 border-t border-white/10">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Bank-Level Security</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>256-bit Encryption</span>
            </div>
          </div>

          {/* HSA Bonus Section */}
          <div 
            ref={hsaBonusRef}
            className={`rounded-2xl bg-white/5 p-8 backdrop-blur-sm border border-white/10 mt-12 scroll-scale-in ${hsaBonusVisible ? 'visible' : ''}`}
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-accent/20 p-3">
                <Sparkles className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Bonus for HSA Users</h3>
                <p className="text-white/80 mb-4">
                  Have an HSA? Unlock advanced tax-advantaged strategies to save even more:
                </p>
                <ul className="grid gap-2 sm:grid-cols-2 text-sm text-white/90">
                  <li className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-accent shrink-0" />
                    <span>Automatic HSA eligibility detection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent shrink-0" />
                    <span>Investment vault tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-accent shrink-0" />
                    <span>Strategic reimbursement timing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent shrink-0" />
                    <span>Tax-free growth optimization</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
