import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Upload,
  Inbox,
  FolderHeart,
  ShieldCheck,
} from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";

const STEPS = [
  {
    icon: Upload,
    label: "Upload Bills",
    description: "Scan receipts or import from your bank",
  },
  {
    icon: Inbox,
    label: "Triage Inbox",
    description: "Classify transactions as medical or not",
  },
  {
    icon: FolderHeart,
    label: "Group into Care Events",
    description: "Organize related bills together",
  },
  {
    icon: ShieldCheck,
    label: "Claim HSA",
    description: "Generate reimbursement forms for eligible expenses",
  },
];

export function WorkflowGuideBanner() {
  const { hasSeenLedgerWorkflow, markAsSeen } = useOnboarding();

  if (hasSeenLedgerWorkflow) return null;

  return (
    <Card className="border-blue-500/20 bg-blue-500/5">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Your expense workflow</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STEPS.map((step, i) => (
            <div
              key={step.label}
              className="flex items-start gap-2 rounded-lg border bg-background/50 px-3 py-2"
            >
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                <step.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium leading-tight">
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAsSeen("hasSeenLedgerWorkflow")}
          >
            Got it
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
