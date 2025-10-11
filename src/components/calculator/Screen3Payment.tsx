import { Button } from "@/components/ui/button";
import { CalculatorData } from "@/pages/Calculator";
import { CreditCard, Banknote, Wallet, DollarSign } from "lucide-react";

interface Screen3Props {
  data: CalculatorData;
  updateData: (field: keyof CalculatorData, value: number | string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen3Payment = ({ data, updateData, onNext, onBack }: Screen3Props) => {
  const paymentOptions = [
    { value: "credit", label: "Credit Card", icon: CreditCard },
    { value: "debit", label: "Debit Card", icon: Wallet },
    { value: "hsa", label: "HSA Card", icon: DollarSign },
    { value: "cash", label: "Cash/Check", icon: Banknote },
  ];

  const rewardsOptions = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "not_sure", label: "Not sure" },
  ];

  return (
    <div className="space-y-8 rounded-2xl bg-card p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">💳 How do you usually pay?</h1>
        <p className="text-muted-foreground">
          We'll show you how to maximize rewards
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="block text-lg font-medium">
            How do you usually pay for medical expenses?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => updateData("paymentMethod", option.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-6 transition-all hover:scale-[1.02] ${
                    data.paymentMethod === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background"
                  }`}
                >
                  <Icon className="h-8 w-8" />
                  <span className="font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {data.paymentMethod && data.paymentMethod !== "cash" && (
          <div className="space-y-3 animate-fade-in">
            <label className="block text-lg font-medium">
              Do your cards earn rewards?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {rewardsOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateData("hasRewards", option.value)}
                  className={`rounded-lg border-2 p-4 text-center transition-all hover:scale-105 ${
                    data.hasRewards === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!data.paymentMethod || (data.paymentMethod !== "cash" && !data.hasRewards)}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
