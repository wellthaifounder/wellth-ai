import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Wallet, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

interface UserIntentDialogProps {
  open: boolean;
  onComplete: (intent: 'billing' | 'hsa' | 'both') => void;
}

export function UserIntentDialog({ open, onComplete }: UserIntentDialogProps) {
  const [selectedIntent, setSelectedIntent] = useState<'billing' | 'hsa' | 'both' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedIntent) {
      toast.error("Please select an option");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update profile with user intent
      const { error } = await supabase
        .from('profiles')
        .update({ user_intent: selectedIntent })
        .eq('id', user.id);

      if (error) throw error;

      // Track analytics
      analytics.trackEvent('user_intent_selected', { intent: selectedIntent });

      toast.success("Preferences saved! Let's get started.");
      onComplete(selectedIntent);
    } catch (error) {
      console.error('Error saving user intent:', error);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const intents = [
    {
      id: 'billing' as const,
      title: 'Check My Bills for Errors',
      description: 'Find overcharges, duplicate charges, and billing mistakes',
      icon: AlertCircle,
      badge: 'Most Popular',
      benefits: [
        'AI-powered error detection',
        'Automated dispute letters',
        'Provider transparency scores',
      ],
    },
    {
      id: 'hsa' as const,
      title: 'Optimize My HSA',
      description: 'Strategic tax-advantaged reimbursement and investment tracking',
      icon: Wallet,
      benefits: [
        'Strategic reimbursement timing',
        'Vault balance tracking',
        'HSA eligibility detection',
      ],
    },
    {
      id: 'both' as const,
      title: 'Both',
      description: 'Get the full Wellth experience with all features',
      icon: CheckCircle,
      benefits: [
        'Complete bill error detection',
        'Full HSA optimization',
        'Maximum savings potential',
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Wellth! 👋</DialogTitle>
          <DialogDescription className="text-base">
            Let's personalize your experience. What brings you here today?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {intents.map((intent) => {
            const Icon = intent.icon;
            const isSelected = selectedIntent === intent.id;

            return (
              <Card
                key={intent.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary border-2 bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`}
                onClick={() => setSelectedIntent(intent.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-3 ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                      <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{intent.title}</h3>
                        {intent.badge && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {intent.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {intent.description}
                      </p>

                      <ul className="space-y-1">
                        {intent.benefits.map((benefit, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                            <div className={`h-1 w-1 rounded-full ${isSelected ? 'bg-primary' : 'bg-muted-foreground'}`} />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!selectedIntent || isSubmitting}
            className="px-8"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Don't worry, you can change this anytime in settings
        </p>
      </DialogContent>
    </Dialog>
  );
}
