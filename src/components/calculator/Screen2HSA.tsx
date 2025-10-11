import { Button } from "@/components/ui/button";
import { CalculatorData } from "@/pages/Calculator";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Screen2Props {
  data: CalculatorData;
  updateData: (field: keyof CalculatorData, value: number | string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen2HSA = ({ data, updateData, onNext, onBack }: Screen2Props) => {
  const options = [
    { value: "yes", label: "Yes, I have one", emoji: "✅" },
    { value: "no", label: "No, I don't", emoji: "❌" },
    { value: "not_sure", label: "Not sure", emoji: "🤔" },
  ];

  const handleSelect = (value: string) => {
    updateData("hasHSA", value);
  };

  return (
    <div className="space-y-8 rounded-2xl bg-card p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Do you currently have an HSA account?</h1>
        <p className="text-muted-foreground">
          Health Savings Accounts can save you thousands
        </p>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`flex w-full items-center gap-4 rounded-xl border-2 p-6 text-left transition-all hover:scale-[1.02] ${
              data.hasHSA === option.value
                ? "border-primary bg-primary/10"
                : "border-border bg-background"
            }`}
          >
            <span className="text-3xl">{option.emoji}</span>
            <span className="flex-1 text-lg font-medium">{option.label}</span>
            {option.value === "not_sure" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">We'll help you find out if you're eligible</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} disabled={!data.hasHSA} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
};
