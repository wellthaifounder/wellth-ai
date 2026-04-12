import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Receipt, Wallet, CheckCircle, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";
import { logError } from "@/utils/errorHandler";

type Step = "intent" | "hsa-date";

interface UserIntentDialogProps {
  open: boolean;
  onComplete: (intent: "billing" | "hsa" | "both") => void;
}

export function UserIntentDialog({ open, onComplete }: UserIntentDialogProps) {
  const [step, setStep] = useState<Step>("intent");
  const [selectedIntent, setSelectedIntent] = useState<
    "billing" | "hsa" | "both" | null
  >(null);
  const [hsaOpenedDate, setHsaOpenedDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const needsHSADate = selectedIntent === "hsa" || selectedIntent === "both";

  const handleIntentSubmit = async () => {
    if (!selectedIntent) {
      toast.error("Please select an option");
      return;
    }

    if (needsHSADate) {
      setStep("hsa-date");
      return;
    }

    await saveAndComplete();
  };

  const handleHSADateSubmit = async () => {
    await saveAndComplete();
  };

  const saveAndComplete = async () => {
    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Build update payload
      const updates: Record<string, string | null> = {
        user_intent: selectedIntent,
      };
      if (hsaOpenedDate) {
        updates.hsa_opened_date = hsaOpenedDate;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      analytics.trackEvent("user_intent_selected", {
        intent: selectedIntent!,
        hsa_date_provided: !!hsaOpenedDate,
      });

      toast.success("Preferences saved! Let's get started.");
      onComplete(selectedIntent!);
    } catch (error) {
      logError("Error saving user intent", error);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const intents = [
    {
      id: "billing" as const,
      title: "Track & Organize Expenses",
      description:
        "Upload bills and receipts, organize into collections, and stay on top of spending",
      icon: Receipt,
      badge: "Most Popular",
      benefits: [
        "Smart expense categorization",
        "Receipt scanning & OCR",
        "Care events for episodes of care",
      ],
    },
    {
      id: "hsa" as const,
      title: "Optimize My HSA/FSA",
      description:
        "Maximize tax savings with strategic reimbursement and investment tracking",
      icon: Wallet,
      benefits: [
        "Tax savings calculator",
        "Strategic reimbursement timing",
        "HSA eligibility detection",
      ],
    },
    {
      id: "both" as const,
      title: "Both",
      description:
        "Get the full Wellth experience — track expenses and maximize HSA/FSA savings",
      icon: CheckCircle,
      benefits: [
        "Complete expense tracking",
        "Full HSA/FSA optimization",
        "Maximum savings potential",
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {step === "intent" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Welcome to Wellth! 👋
              </DialogTitle>
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
                        ? "border-primary border-2 bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                    }`}
                    onClick={() => setSelectedIntent(intent.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`rounded-lg p-3 ${isSelected ? "bg-primary/20" : "bg-muted"}`}
                        >
                          <Icon
                            className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                          />
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
                              <li
                                key={idx}
                                className="text-xs text-muted-foreground flex items-center gap-2"
                              >
                                <div
                                  className={`h-1 w-1 rounded-full ${isSelected ? "bg-primary" : "bg-muted-foreground"}`}
                                />
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
                onClick={handleIntentSubmit}
                disabled={!selectedIntent || isSubmitting}
                className="px-8"
              >
                Continue
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Don't worry, you can change this anytime in settings
            </p>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-primary" />
                When did you open your HSA?
              </DialogTitle>
              <DialogDescription className="text-base">
                This date determines which expenses qualify for HSA
                reimbursement. Only expenses after your HSA was opened can be
                claimed.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hsa-opened-date">HSA Opened Date</Label>
                <Input
                  id="hsa-opened-date"
                  type="date"
                  value={hsaOpenedDate}
                  onChange={(e) => setHsaOpenedDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Check your HSA provider statement if you're unsure
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep("intent")}>
                Back
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleHSADateSubmit}
                  disabled={isSubmitting}
                >
                  Skip for now
                </Button>
                <Button
                  onClick={handleHSADateSubmit}
                  disabled={isSubmitting}
                  className="px-8"
                >
                  {isSubmitting ? "Saving..." : "Continue"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
