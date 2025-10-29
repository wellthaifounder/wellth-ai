import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { SetHSADateDialog } from "@/components/profile/SetHSADateDialog";

interface MissingHSADateBannerProps {
  onDateSet?: () => void;
}

export function MissingHSADateBanner({ onDateSet }: MissingHSADateBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/20">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-900 dark:text-yellow-100">
          Important: Set your HSA opened date
        </AlertTitle>
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <div className="flex items-center justify-between gap-4">
            <span>We need to know when you opened your HSA to accurately track which expenses are reimbursable.</span>
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                size="sm" 
                onClick={() => setDialogOpen(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Set HSA Date
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissed(true)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <SetHSADateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDismissed(true);
          onDateSet?.();
        }}
      />
    </>
  );
}
