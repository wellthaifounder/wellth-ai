import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CalculatorData } from "@/pages/Calculator";

interface Screen2Props {
  data: CalculatorData;
  updateData: (field: keyof CalculatorData, value: number | string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen2HSA = ({ data, updateData, onNext, onBack }: Screen2Props) => {
  const householdOptions = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-8 rounded-2xl bg-card p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">How much do you spend on healthcare?</h1>
        <p className="text-muted-foreground">
          Include doctor visits, prescriptions, dental, vision — anything medical
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <label className="block text-lg font-medium">
            Estimated annual healthcare spending
          </label>
          <div className="space-y-2">
            <Slider
              value={[data.annualSpending]}
              onValueChange={(value) => updateData("annualSpending", value[0])}
              min={500}
              max={20000}
              step={500}
              className="w-full"
            />
            <div className="text-center">
              <span className="text-3xl font-bold text-primary">
                ${data.annualSpending.toLocaleString()}
              </span>
              <span className="text-muted-foreground">/year</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>$500</span>
              <span>$20,000</span>
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
