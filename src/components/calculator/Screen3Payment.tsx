import { Button } from "@/components/ui/button";
import { CalculatorData } from "@/pages/Calculator";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Screen3Props {
  data: CalculatorData;
  updateData: (field: keyof CalculatorData, value: number | string) => void;
  onNext: () => void;
  onBack: () => void;
}

const TAX_BRACKETS = [
  { value: 10, label: "10%", income: "Up to $11,600" },
  { value: 12, label: "12%", income: "$11,601 - $47,150" },
  { value: 22, label: "22%", income: "$47,151 - $100,525" },
  { value: 24, label: "24%", income: "$100,526 - $191,950" },
  { value: 32, label: "32%", income: "$191,951 - $243,725" },
  { value: 35, label: "35%", income: "$243,726 - $609,350" },
  { value: 37, label: "37%", income: "Over $609,350" },
];

export const Screen3Payment = ({ data, updateData, onNext, onBack }: Screen3Props) => {
  return (
    <div className="space-y-8 rounded-2xl bg-card p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">What's your tax bracket?</h1>
        <p className="text-muted-foreground">
          This determines how much you save by using pre-tax dollars for healthcare
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="block text-lg font-medium">
            Federal tax bracket
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Your marginal tax rate — the rate on your last dollar of income. If you're unsure, 22% is a common bracket for most working adults.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid gap-2">
          {TAX_BRACKETS.map((bracket) => (
            <button
              key={bracket.value}
              onClick={() => updateData("taxBracket", bracket.value)}
              className={`flex w-full items-center justify-between rounded-lg border-2 px-5 py-3 text-left transition-all hover:scale-[1.01] ${
                data.taxBracket === bracket.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background"
              }`}
            >
              <span className="text-lg font-bold">{bracket.label}</span>
              <span className="text-sm text-muted-foreground">{bracket.income}</span>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Single filer brackets shown. Not sure? 22% is a common default.
        </p>
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
};
