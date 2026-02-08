import { Button } from "@/components/ui/button";
import { CalculatorData } from "@/pages/Calculator";
import { Wallet, CreditCard, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Screen1Props {
  data: CalculatorData;
  updateData: (field: keyof CalculatorData, value: number | string) => void;
  onNext: () => void;
}

export const Screen1Healthcare = ({ data, updateData, onNext }: Screen1Props) => {
  const options = [
    {
      value: "hsa",
      label: "HSA (Health Savings Account)",
      description: "Tax-deductible contributions, tax-free growth, tax-free withdrawals for medical expenses",
      icon: Wallet,
    },
    {
      value: "fsa",
      label: "FSA (Flexible Spending Account)",
      description: "Pre-tax contributions through your employer, use-it-or-lose-it each year",
      icon: CreditCard,
    },
    {
      value: "neither",
      label: "Neither / Not sure",
      description: "We'll show you what you could save by opening one",
      icon: HelpCircle,
    },
  ];

  return (
    <div className="space-y-8 rounded-2xl bg-card p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Let's estimate your savings</h1>
        <p className="text-muted-foreground">
          First, tell us about your healthcare account
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-lg font-medium">
          Do you have an HSA, FSA, or neither?
        </label>
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => updateData("accountType", option.value)}
              className={`flex w-full items-start gap-4 rounded-xl border-2 p-5 text-left transition-all hover:scale-[1.02] ${
                data.accountType === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background"
              }`}
            >
              <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-base font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
              </div>
            </button>
          );
        })}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-center text-xs text-muted-foreground cursor-help underline decoration-dotted">
                What's the difference between an HSA and FSA?
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>HSAs are available with high-deductible health plans and funds roll over forever. FSAs are employer-sponsored and typically must be used each year.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Button onClick={onNext} disabled={!data.accountType} size="lg" className="w-full">
        Continue
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Your data stays private — we never share your information
      </p>
    </div>
  );
};
