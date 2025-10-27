import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { DashboardAction } from "@/lib/dashboardActions";

interface DashboardHeaderProps {
  firstName: string;
  primaryAction: DashboardAction;
}

export function DashboardHeader({ firstName, primaryAction }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const Icon = primaryAction.icon;

  return (
    <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">👋 Hi {firstName}!</h1>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <h2 className="text-xl font-semibold">Your Next Step:</h2>
          </div>
          
          <Button 
            size="lg" 
            className="w-full sm:w-auto text-lg h-auto py-4 px-8"
            onClick={() => navigate(primaryAction.route)}
          >
            <Icon className="mr-2 h-5 w-5" />
            {primaryAction.buttonText}
          </Button>

          {primaryAction.timeEstimate && (
            <p className="text-sm text-muted-foreground">
              → Takes about {primaryAction.timeEstimate}
            </p>
          )}
        </div>

        {primaryAction.priority !== 4 && (
          <div className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/expenses/new")}
              className="bg-background/80"
            >
              Or add a new expense
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
