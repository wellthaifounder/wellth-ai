import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DisputeErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export const DisputeErrorState = ({ 
  title = "Error Loading Dispute",
  message = "We encountered an error while loading the dispute details. Please try again.",
  onRetry,
  showHomeButton = true
}: DisputeErrorStateProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-muted-foreground">{message}</p>
          </div>

          <div className="flex gap-3 justify-center">
            {onRetry && (
              <Button onClick={onRetry} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            {showHomeButton && (
              <Button onClick={() => navigate('/disputes')} variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Back to Disputes
              </Button>
            )}
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              If the problem persists, please contact support or check your network connection.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
