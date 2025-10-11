import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CalculatorData } from "@/pages/Calculator";

interface Screen1Props {
  data: CalculatorData;
  updateData: (field: keyof CalculatorData, value: number | string) => void;
  onNext: () => void;
}

export const Screen1Healthcare = ({ data, updateData, onNext }: Screen1Props) => {
  const householdOptions = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-8 rounded-2xl bg-card p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">🎯 Let's find your hidden savings</h1>
        <p className="text-muted-foreground">
          Just a few quick questions to get started
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <label className="block text-lg font-medium">
            Roughly how much do you spend on healthcare each month?
          </label>
          <div className="space-y-2">
            <Slider
              value={[data.monthlySpending]}
              onValueChange={(value) => updateData("monthlySpending", value[0])}
              min={0}
              max={2000}
              step={50}
              className="w-full"
            />
            <div className="text-center">
              <span className="text-3xl font-bold text-primary">
                ${data.monthlySpending}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-lg font-medium">
            How many people are in your household?
          </label>
          <div className="grid grid-cols-5 gap-3">
            {householdOptions.map((size) => (
              <button
                key={size}
                onClick={() => updateData("householdSize", size)}
                className={`rounded-lg border-2 p-4 text-center transition-all hover:scale-105 ${
                  data.householdSize === size
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background"
                }`}
              >
                <div className="text-2xl font-bold">{size}</div>
                {size === 5 && <div className="text-xs text-muted-foreground">+</div>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="w-full">
        Continue
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        🔒 We never share your info — your data stays safe with us
      </p>
    </div>
  );
};
