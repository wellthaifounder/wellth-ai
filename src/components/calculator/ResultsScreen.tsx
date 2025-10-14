import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalculatorData } from "@/pages/Calculator";
import { calculateSavings } from "@/lib/savingsCalculator";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TripwireOffer } from "./TripwireOffer";
import { supabase } from "@/integrations/supabase/client";

interface ResultsScreenProps {
  data: CalculatorData;
}

export const ResultsScreen = ({ data }: ResultsScreenProps) => {
  const navigate = useNavigate();
  const [displayedSavings, setDisplayedSavings] = useState(0);
  const [email, setEmail] = useState("");
  const savings = calculateSavings(data);

  useEffect(() => {
    let start = 0;
    const end = savings.total;
    const duration = 1500;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayedSavings(end);
        clearInterval(timer);
      } else {
        setDisplayedSavings(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [savings.total]);

  const handleEmailCapture = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    try {
      // Send nurture email sequence
      const { error } = await supabase.functions.invoke('send-nurture-email', {
        body: {
          email,
          estimatedSavings: savings.total,
          calculatorData: data,
          sequenceDay: 0,
        }
      });

      if (error) throw error;

      sessionStorage.setItem("leadEmail", email);
      toast.success("Results sent! Check your inbox.");
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Tripwire Offer - Primary CTA */}
      <div className="animate-scale-in">
        <TripwireOffer estimatedSavings={savings.total} />
      </div>

      {/* Original Results - Now Secondary */}
      <div className="space-y-8 rounded-2xl bg-card p-8 shadow-lg">
        <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">🎉 Your Personalized Savings</h1>
        <div className="rounded-xl bg-primary/10 p-8">
          <div className="text-5xl font-bold text-primary">
            ${displayedSavings.toLocaleString()}
          </div>
          <div className="mt-2 text-lg text-muted-foreground">
            Estimated annual savings
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          People like you save an average of $1,200/year
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Here's how we calculated it:</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>Tax savings (HSA usage)</span>
            </div>
            <span className="font-semibold">${savings.taxSavings.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent" />
              <span>Rewards optimization</span>
            </div>
            <span className="font-semibold">${savings.rewardsSavings.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-secondary" />
              <span>Timing strategy</span>
            </div>
            <span className="font-semibold">${savings.timingSavings.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => navigate("/auth")}
          size="lg"
          className="w-full"
        >
          Claim My Savings – Sign Up Free
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg" className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Email Me These Results
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Get Your Results via Email</DialogTitle>
              <DialogDescription>
                We'll send you a detailed breakdown of your potential savings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleEmailCapture} className="w-full">
                Send Results
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

        <p className="text-center text-xs text-muted-foreground">
          You can always update these answers later
        </p>
      </div>
    </div>
  );
};
