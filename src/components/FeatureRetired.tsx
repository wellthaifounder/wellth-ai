import { useNavigate } from "react-router-dom";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Archive, ArrowRight } from "lucide-react";

interface FeatureRetiredProps {
  /** What the user typed/clicked to land here, e.g. "Bill Review" */
  feature: string;
  /** Where to send them now */
  returnTo: string;
  /** Optional human label for the destination */
  returnLabel?: string;
}

/**
 * Renders an explanatory interstitial in place of a silent redirect when a
 * retired feature's URL is hit. Tells the user where their data lives now.
 */
export function FeatureRetired({
  feature,
  returnTo,
  returnLabel = "Bills",
}: FeatureRetiredProps) {
  const navigate = useNavigate();

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Archive className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">{feature} was retired</h1>
              <p className="text-muted-foreground">
                We've consolidated this feature into{" "}
                <strong>{returnLabel}</strong>. Your data is preserved and
                accessible there.
              </p>
            </div>
            <Button onClick={() => navigate(returnTo)} className="mt-4">
              Go to {returnLabel}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
