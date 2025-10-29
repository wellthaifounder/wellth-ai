import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { SetHSADateDialog } from "@/components/profile/SetHSADateDialog";

export function EmptyStateOnboarding() {
  const navigate = useNavigate();
  const [showHSADialog, setShowHSADialog] = useState(false);

  return (
    <>
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="pt-8 pb-8">
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold">👋 Welcome to Wellth!</h2>
          
          <p className="text-muted-foreground">
            Let's get you set up. Here's what we'll do together:
          </p>

          <div className="space-y-4 text-left bg-background/50 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <p className="font-semibold">Tell us when you opened your HSA (30 seconds)</p>
                <p className="text-sm text-muted-foreground">So we know which expenses are reimbursable</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <p className="font-semibold">Connect your bank (2 minutes)</p>
                <p className="text-sm text-muted-foreground">Automatically track your medical expenses</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <p className="font-semibold">Review your transactions</p>
                <p className="text-sm text-muted-foreground">We'll help you find medical ones</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">4️⃣</span>
              <div>
                <p className="font-semibold">Start saving money!</p>
                <p className="text-sm text-muted-foreground">Track HSA benefits and maximize rewards</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <Button size="lg" onClick={() => setShowHSADialog(true)}>
              Get Started
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/expenses/new")}>
              Add Expense Manually
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <SetHSADateDialog
      open={showHSADialog}
      onOpenChange={setShowHSADialog}
      onSuccess={() => navigate("/bank-accounts")}
    />
    </>
  );
}
