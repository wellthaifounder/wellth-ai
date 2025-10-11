import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Receipt, TrendingUp } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-20 lg:py-32">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
            <TrendingUp className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">Smart HSA Management</span>
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Stop Overpaying on Healthcare.
            <span className="block bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">
              Start Earning Rewards.
            </span>
          </h1>
          
          <p className="mb-10 text-lg text-white/90 sm:text-xl">
            HSA Buddy automatically categorizes medical expenses, identifies HSA-eligible purchases, 
            and recommends the smartest payment strategy—saving you 20-40% instantly.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="group bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"
              onClick={() => window.location.href = '/calculator'}
            >
              See Your Savings Potential
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              onClick={() => window.location.href = '/auth'}
            >
              I Already Know My Savings - Sign Up
            </Button>
          </div>
          
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <DollarSign className="mb-3 h-8 w-8 text-accent" />
              <h3 className="mb-2 text-2xl font-bold text-white">$243</h3>
              <p className="text-sm text-white/80">Average quarterly savings</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <Receipt className="mb-3 h-8 w-8 text-accent" />
              <h3 className="mb-2 text-2xl font-bold text-white">100%</h3>
              <p className="text-sm text-white/80">HSA-eligible tracking</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <TrendingUp className="mb-3 h-8 w-8 text-accent" />
              <h3 className="mb-2 text-2xl font-bold text-white">40%</h3>
              <p className="text-sm text-white/80">Tax + rewards optimization</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
