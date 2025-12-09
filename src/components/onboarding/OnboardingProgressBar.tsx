import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Upload, Sparkles, Link2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHSA } from "@/contexts/HSAContext";

interface OnboardingProgressBarProps {
  compact?: boolean;
}

export function OnboardingProgressBar({ compact = false }: OnboardingProgressBarProps) {
  const { hasHSA } = useHSA();

  // Check if user has uploaded any bills
  const { data: billsData } = useQuery({
    queryKey: ['onboarding-bills'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('invoices')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) throw error;
      return data;
    },
  });

  // Check if user has any bill reviews (analyzed bills)
  const { data: reviewsData } = useQuery({
    queryKey: ['onboarding-reviews'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('bill_reviews')
        .select('id, analyzed_at')
        .order('analyzed_at', { ascending: true })
        .limit(1);

      if (error) throw error;
      return data;
    },
    enabled: !!billsData && billsData.length > 0,
  });

  // Check if user has connected bank accounts
  const { data: bankData } = useQuery({
    queryKey: ['onboarding-banks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;
      return data;
    },
  });

  // Calculate progress
  const hasBill = (billsData && billsData.length > 0) || false;
  const hasReview = (reviewsData && reviewsData.length > 0) || false;
  const hasBank = (bankData && bankData.length > 0) || false;
  const hasSetup = hasHSA || hasBank;

  const steps = [
    { key: 'bill', label: 'Upload Bill', icon: Upload, complete: hasBill },
    { key: 'review', label: 'See Value', icon: Sparkles, complete: hasReview },
    { key: 'setup', label: 'Connect Accounts', icon: Link2, complete: hasSetup },
  ];

  const completedSteps = steps.filter(s => s.complete).length;
  const progress = (completedSteps / steps.length) * 100;

  // Don't show if onboarding is complete
  if (completedSteps === steps.length) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full border border-accent/20">
        <span className="text-xs font-medium text-muted-foreground">
          Setup: {completedSteps}/{steps.length}
        </span>
        <Progress value={progress} className="w-16 h-1.5" />
      </div>
    );
  }

  return (
    <div className="bg-accent/5 border-b border-accent/10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {completedSteps === 0 && "Get Started"}
              {completedSteps === 1 && "Almost There!"}
              {completedSteps === 2 && "One More Step"}
            </span>

            <div className="hidden md:flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.key} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${
                    step.complete
                      ? 'bg-accent/20 text-accent'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.complete ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <step.icon className="h-3.5 w-3.5" />
                    )}
                    <span className="text-xs font-medium">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-px w-6 ${step.complete ? 'bg-accent' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="flex md:hidden flex-1">
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-muted-foreground">
              {completedSteps}/{steps.length} complete
            </span>
            <span className="text-xs font-bold text-accent">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
