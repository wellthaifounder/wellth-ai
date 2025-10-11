import { Button } from "@/components/ui/button";
import { CalculatorData } from "@/pages/Calculator";

interface Screen4Props {
  data: CalculatorData;
  updateData: (field: keyof CalculatorData, value: number | string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen4Expenses = ({ data, updateData, onNext, onBack }: Screen4Props) => {
  const options = [
    { value: "regular", label: "Regular visits", description: "Routine checkups, prescriptions", emoji: "🏥" },
    { value: "minor", label: "Minor procedure", description: "$500 - $2,000", emoji: "🩹" },
    { value: "major", label: "Major expense", description: "$2,000 - $10,000+", emoji: "🏥" },
    { value: "ongoing", label: "Ongoing treatment", description: "Recurring costs", emoji: "💊" },
    { value: "not_sure", label: "Not sure yet", description: "I'll track as I go", emoji: "🤷" },
  ];

  return (
    <div className="space-y-8 rounded-2xl bg-card p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">📅 Any big costs coming up?</h1>
        <p className="text-muted-foreground">
          This helps us show you the best timing strategies
        </p>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => updateData("upcomingExpenses", option.value)}
            className={`flex w-full items-start gap-4 rounded-xl border-2 p-6 text-left transition-all hover:scale-[1.02] ${
              data.upcomingExpenses === option.value
                ? "border-primary bg-primary/10"
                : "border-border bg-background"
            }`}
          >
            <span className="text-3xl">{option.emoji}</span>
            <div className="flex-1">
              <div className="text-lg font-medium">{option.label}</div>
              <div className="text-sm text-muted-foreground">{option.description}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} disabled={!data.upcomingExpenses} className="flex-1">
          See My Savings
        </Button>
      </div>
    </div>
  );
};
