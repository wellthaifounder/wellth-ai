import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, TrendingUp, Sparkles } from "lucide-react";
import { calculateSavings } from "@/lib/savingsCalculator";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();
  // Calculate dynamic savings rate based on representative user profile
  const representativeProfile = {
    monthlySpending: 400,
    householdSize: 2,
    hasHSA: "no" as const,
    paymentMethod: "debit" as const,
    hasRewards: "no" as const,
    upcomingExpenses: "ongoing" as const,
  };
  
  const annualSpending = representativeProfile.monthlySpending * 12;
  const savings = calculateSavings(representativeProfile);
  const savingsRate = Math.round((savings.total / annualSpending) * 100);
  return (
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/95 via-primary/85 to-primary/75 py-20 lg:py-32" aria-labelledby="hero-heading">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
            <TrendingUp className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">Smart HSA Management</span>
          </div>
          
          <h1 id="hero-heading" className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
            Stop Overpaying on Healthcare.
            <span className="block bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent mt-2">
              Start Earning Rewards.
            </span>
          </h1>
          
          <p className="text-lg text-white/90 sm:text-xl leading-relaxed max-w-3xl mx-auto">
            Wellth.ai automatically categorizes medical expenses, identifies HSA-eligible purchases, 
            and recommends the smartest payment strategy—saving you 20-40% instantly.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4" role="group" aria-label="Call to action">
            <Button
              size="lg"
              className="group bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm hover:shadow-md"
              onClick={() => navigate('/calculator')}
              aria-label="Calculate your potential healthcare savings"
            >
              See Your Savings Potential
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              onClick={() => navigate('/auth')}
              aria-label="Sign up for Wellth - I already know my savings potential"
            >
              I Already Know My Savings - Sign Up
            </Button>
          </div>
          
          <div className="mt-16 grid gap-8 sm:grid-cols-3" role="list" aria-label="Key savings statistics">
            <div className="rounded-xl bg-white/10 p-8 backdrop-blur-sm transition-all duration-200 hover:bg-white/15" role="listitem">
              <DollarSign className="mb-3 h-8 w-8 text-accent" aria-hidden="true" />
              <h3 className="mb-2 text-2xl font-bold text-white">
                <span className="sr-only">Average annual savings: </span>$1,948
              </h3>
              <p className="text-sm text-white/80">Average annual savings</p>
            </div>
            <div className="rounded-xl bg-white/10 p-8 backdrop-blur-sm transition-all duration-200 hover:bg-white/15" role="listitem">
              <TrendingUp className="mb-3 h-8 w-8 text-accent" aria-hidden="true" />
              <h3 className="mb-2 text-2xl font-bold text-white">
                <span className="sr-only">Potential savings rate: </span>{savingsRate}%
              </h3>
              <p className="text-sm text-white/80">Potential savings rate</p>
            </div>
            <div className="rounded-xl bg-white/10 p-8 backdrop-blur-sm transition-all duration-200 hover:bg-white/15" role="listitem">
              <Sparkles className="mb-3 h-8 w-8 text-accent" aria-hidden="true" />
              <h3 className="mb-2 text-2xl font-bold text-white">
                <span className="sr-only">Average annual HSA investment growth: </span>$800+
              </h3>
              <p className="text-sm text-white/80">Average annual HSA investment growth</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
