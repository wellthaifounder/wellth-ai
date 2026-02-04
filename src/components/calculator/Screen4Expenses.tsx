import { Button } from "@/components/ui/button";
import { CalculatorData } from "@/pages/Calculator";

interface Screen4Props {
  data: CalculatorData;
  updateData: (field: keyof CalculatorData, value: number | string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen4Expenses = ({ data, updateData, onNext, onBack }: Screen4Props) => {
  const trackingOptions = [
    { value: "spreadsheet", label: "Spreadsheet", description: "Excel, Google Sheets, etc." },
    { value: "shoebox", label: "Paper / folder", description: "Physical receipts and files" },
    { value: "app", label: "Another app", description: "Mint, YNAB, or similar" },
    { value: "none", label: "I don't track", description: "No system currently" },
  ];

  const priorityOptions = [
    { value: "taxes", label: "Saving on taxes", description: "Maximize deductions and pre-tax spending" },
    { value: "organizing", label: "Organizing receipts", description: "One place for all medical documents" },
    { value: "hsa_growth", label: "Maximizing HSA growth", description: "Invest and grow my HSA long-term" },
    { value: "all", label: "All of the above", description: "I want the full picture" },
  ];

  return (
    <div className="space-y-8 rounded-2xl bg-card p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Almost there — tell us about you</h1>
        <p className="text-muted-foreground">
          This helps us personalize your savings breakdown
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="block text-lg font-medium">
            How do you currently track medical expenses?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {trackingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateData("trackingMethod", option.value)}
                className={`flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.02] ${
                  data.trackingMethod === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background"
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-lg font-medium">
            What matters most to you?
          </label>
          <div className="grid gap-2">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateData("topPriority", option.value)}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.01] ${
                  data.topPriority === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!data.trackingMethod || !data.topPriority}
          className="flex-1"
        >
          See My Savings
        </Button>
      </div>
    </div>
  );
};
