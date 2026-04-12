import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHSA } from "@/contexts/HSAContext";
import { toast } from "sonner";
import { logError } from "@/utils/errorHandler";

interface EmptyStateOnboardingProps {
  projectedSavings?: number;
}

export function EmptyStateOnboarding({
  projectedSavings,
}: EmptyStateOnboardingProps) {
  const navigate = useNavigate();
  const { userIntent, hsaOpenedDate, refreshHSAStatus } = useHSA();
  const [hsaDate, setHsaDate] = useState("");
  const [savingDate, setSavingDate] = useState(false);

  const needsHSADate =
    (userIntent === "hsa" || userIntent === "both") && !hsaOpenedDate;

  const handleSaveHSADate = async () => {
    if (!hsaDate) return;
    setSavingDate(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ hsa_opened_date: hsaDate })
        .eq("id", user.id);

      if (error) throw error;
      await refreshHSAStatus();
      toast.success("HSA date saved! You can now track eligible expenses.");
    } catch (error) {
      logError("Error saving HSA date from empty state", error);
      toast.error("Failed to save HSA date. Please try again.");
    } finally {
      setSavingDate(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="pt-8 pb-8">
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          {/* Show personalized projection if available from calculator */}
          {projectedSavings && projectedSavings > 0 ? (
            <div className="bg-accent/20 p-6 rounded-lg mb-6 border-2 border-accent/30">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-accent-foreground" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-accent mb-2">
                ${projectedSavings.toLocaleString()}/year
              </h2>
              <p className="text-sm text-muted-foreground">
                Your Personalized Savings Projection
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on your calculator results. Start tracking expenses to put
                this into action.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {projectedSavings
                ? "Let's Start Tracking"
                : "Start Saving on Healthcare Today"}
            </h2>
            <p className="text-muted-foreground">
              Upload your first expense and see how Wellth organizes everything
              for you.
            </p>
          </div>

          <div className="bg-accent/10 rounded-lg p-6 border border-accent/20">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Upload className="h-6 w-6 text-accent" />
              </div>
              <div className="h-1 w-12 bg-accent/30 rounded" />
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="h-1 w-12 bg-muted rounded" />
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-accent-foreground">
                    1
                  </span>
                </div>
                <div>
                  <p className="font-semibold">Upload Your First Bill</p>
                  <p className="text-sm text-muted-foreground">
                    Take 30 seconds. Upload any medical bill, EOB, or receipt.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-muted-foreground">
                    2
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">
                    Organize & Categorize
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Wellth auto-categorizes expenses and helps you organize them
                    into collections.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-muted-foreground">
                    3
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">
                    Complete Setup
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Connect your bank and HSA to unlock automated tracking.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {needsHSADate ? (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 text-left space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">
                    Set Your HSA Date to Get Started
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Only expenses after your HSA opened date are eligible for
                  reimbursement. Set this first so Wellth can accurately track
                  your savings.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="space-y-1.5 flex-1 w-full">
                    <Label htmlFor="empty-hsa-date" className="text-sm">
                      HSA Opened Date
                    </Label>
                    <Input
                      id="empty-hsa-date"
                      type="date"
                      value={hsaDate}
                      onChange={(e) => setHsaDate(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSaveHSADate}
                    disabled={!hsaDate || savingDate}
                    className="w-full sm:w-auto"
                  >
                    {savingDate ? "Saving..." : "Save HSA Date"}
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/bills/new")}
                className="text-muted-foreground"
              >
                Skip for now — upload a bill instead
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                size="lg"
                onClick={() => navigate("/bills/new")}
                className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Bill
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>
                  HSA holders save an average of{" "}
                  <strong className="text-foreground">$1,800/year</strong> in
                  taxes
                </span>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-3">
              Already have bills to track?
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/bank-accounts")}
            >
              Connect Bank Instead
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
