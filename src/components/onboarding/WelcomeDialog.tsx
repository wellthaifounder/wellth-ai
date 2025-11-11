import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, FileSearch, Building2, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WelcomeDialogProps {
  open: boolean;
  onClose: () => void;
  firstName: string;
  hasHSA: boolean;
}

export function WelcomeDialog({ open, onClose, firstName, hasHSA }: WelcomeDialogProps) {
  const navigate = useNavigate();

  const features = [
    {
      icon: FileSearch,
      title: "Bill Intelligence",
      description: "Automatically detect errors and overcharges in your medical bills",
      color: "text-amber-500",
    },
    {
      icon: Building2,
      title: "Provider Ratings",
      description: "Check billing accuracy scores before your next appointment",
      color: "text-blue-500",
    },
    ...(hasHSA ? [{
      icon: DollarSign,
      title: "HSA Optimization",
      description: "Maximize tax savings and track reimbursement opportunities",
      color: "text-green-500",
    }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">Welcome to Wellth, {firstName}! 🎉</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Let's take a quick tour of the powerful features that will help you save money on healthcare.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex gap-3 items-start p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className={cn("p-2 rounded-full bg-background", feature.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onClose} size="lg">
            Start Exploring
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              onClose();
              navigate("/expenses/new");
            }}
          >
            Add Your First Expense →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
