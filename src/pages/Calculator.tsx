import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { ProgressBar } from "@/components/calculator/ProgressBar";
import { Screen1Healthcare } from "@/components/calculator/Screen1Healthcare";
import { Screen2HSA } from "@/components/calculator/Screen2HSA";
import { Screen3Payment } from "@/components/calculator/Screen3Payment";
import { Screen4Expenses } from "@/components/calculator/Screen4Expenses";
import { ResultsScreen } from "@/components/calculator/ResultsScreen";

export interface CalculatorData {
  monthlySpending: number;
  householdSize: number;
  hasHSA: string;
  paymentMethod: string;
  hasRewards: string;
  upcomingExpenses: string;
}

const Calculator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<CalculatorData>({
    monthlySpending: 200,
    householdSize: 1,
    hasHSA: "",
    paymentMethod: "",
    hasRewards: "",
    upcomingExpenses: "",
  });

  const totalSteps = 4;

  const updateData = (field: keyof CalculatorData, value: number | string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Save to session storage for use on auth page
      sessionStorage.setItem("calculatorResults", JSON.stringify(data));
      setCurrentStep(5); // Results screen
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12 lg:py-20">
        <div className="mx-auto max-w-2xl">
          {currentStep <= totalSteps && (
            <div className="mb-8">
              <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
            </div>
          )}

          <div className="animate-fade-in">
            {currentStep === 1 && (
              <Screen1Healthcare
                data={data}
                updateData={updateData}
                onNext={nextStep}
              />
            )}
            {currentStep === 2 && (
              <Screen2HSA
                data={data}
                updateData={updateData}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {currentStep === 3 && (
              <Screen3Payment
                data={data}
                updateData={updateData}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {currentStep === 4 && (
              <Screen4Expenses
                data={data}
                updateData={updateData}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {currentStep === 5 && <ResultsScreen data={data} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
