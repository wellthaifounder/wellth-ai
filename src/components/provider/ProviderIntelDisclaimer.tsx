import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProviderIntelDisclaimerProps {
  variant?: "homepage" | "detail" | "review";
  providerName?: string;
  billCount?: number;
  reviewCount?: number;
  insurancePlanType?: string;
  lastUpdated?: Date;
}

export const ProviderIntelDisclaimer = ({
  variant = "homepage",
  providerName,
  billCount = 0,
  reviewCount = 0,
  insurancePlanType,
  lastUpdated,
}: ProviderIntelDisclaimerProps) => {
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);

  if (variant === "homepage") {
    return (
      <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm text-foreground">
          <strong className="text-amber-600">⚠️ BETA FEATURE - Community-Sourced Data</strong>
          <p className="mt-2">
            Provider Intel displays crowd-sourced billing data and user reviews. This information is:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
            <li>Based on real user experiences, not clinical outcomes</li>
            <li>Not verified by medical professionals</li>
            <li>Subject to insurance plan variations</li>
            <li>For informational purposes only</li>
          </ul>
          <p className="mt-3 text-xs font-medium">
            <strong>Always verify billing details with your provider and insurance company.</strong> Wellth is not responsible for medical decisions or billing disputes based on this data.
          </p>
          <Dialog open={showFullDisclaimer} onOpenChange={setShowFullDisclaimer}>
            <DialogTrigger asChild>
              <Button variant="link" className="px-0 h-auto text-xs text-amber-600 hover:text-amber-700">
                Learn More About Our Data Sources →
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>How Provider Intel Works</DialogTitle>
                <DialogDescription className="space-y-4 text-left">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Data Collection</h4>
                    <p>
                      Provider Intel ratings are generated from user-submitted medical bills and reviews. 
                      When you upload a bill, our AI analyzes it for potential billing errors. You then 
                      confirm whether the flagged items are actual errors. Only confirmed errors count 
                      toward a provider's Billing Accuracy Score.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Rating System</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Billing Accuracy Score:</strong> Based on confirmed billing errors</li>
                      <li><strong>Experience Ratings:</strong> User-rated care quality, transparency, etc.</li>
                      <li><strong>Cost Fairness:</strong> Comparison to regional medians when available</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Limitations</h4>
                    <p>
                      Data accuracy depends on sample size. Providers with fewer than 5 bills may not 
                      have reliable statistics. Insurance plans, deductible status, and network participation 
                      significantly affect costs and billing practices.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Your Responsibility</h4>
                    <p>
                      This tool is for informational purposes only. You should always verify billing 
                      accuracy with your provider and insurance company. Wellth is not responsible for 
                      medical decisions, treatment choices, or billing disputes based on this data.
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === "detail") {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>📊 Data Transparency</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
            <li><strong>Billing Accuracy Score:</strong> Based on {billCount} analyzed bills</li>
            <li><strong>Experience Rating:</strong> Based on {reviewCount} user reviews</li>
            {insurancePlanType && (
              <li><strong>Cost Data:</strong> Reflects patients with {insurancePlanType} insurance</li>
            )}
          </ul>
          <p className="mt-3 text-xs">
            This data may not reflect your specific situation due to different insurance plans, 
            deductible status, individual medical circumstances, or changes in provider billing practices.
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-2">
              Last Updated: {lastUpdated.toLocaleDateString()}
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === "review") {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Review Submission Guidelines</strong>
          <p className="mt-2 text-xs">
            By submitting a review, you confirm that:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
            <li>Your review is based on personal experience</li>
            <li>You will not include protected health information (PHI)</li>
            <li>Your review complies with our Community Guidelines</li>
            <li>We may contact you to verify billing errors</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Reviews are moderated and may be removed if they violate our policies.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
