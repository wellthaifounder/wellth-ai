import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TripwireOffer as TripwireOfferComponent } from "@/components/calculator/TripwireOffer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { CalculatorData } from "./Calculator";

const TripwireOfferPage = () => {
  const navigate = useNavigate();
  const [estimatedSavings, setEstimatedSavings] = useState<number>(0);
  const [calculatorData, setCalculatorData] = useState<CalculatorData | null>(null);

  useEffect(() => {
    // Load data from sessionStorage
    const savedSavings = sessionStorage.getItem('estimatedSavings');
    const savedData = sessionStorage.getItem('calculatorData');
    
    if (savedSavings) {
      setEstimatedSavings(parseFloat(savedSavings));
    }
    
    if (savedData) {
      try {
        setCalculatorData(JSON.parse(savedData));
      } catch (error) {
        console.error('Error parsing calculator data:', error);
      }
    }
    
    // If no data found, redirect to calculator
    if (!savedSavings || !savedData) {
      navigate('/calculator');
    }
  }, [navigate]);

  const handleSkip = () => {
    navigate('/dashboard');
  };

  if (!estimatedSavings || !calculatorData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold">🎉 One More Thing...</h1>
            <p className="text-lg text-muted-foreground">
              Before you start tracking your ${estimatedSavings.toLocaleString()} in annual savings
            </p>
          </div>

          {/* Tripwire Offer */}
          <TripwireOfferComponent 
            estimatedSavings={estimatedSavings} 
            calculatorData={calculatorData} 
          />

          {/* Skip Option */}
          <div className="text-center space-y-4">
            <Button
              onClick={handleSkip}
              variant="outline"
              size="lg"
              className="w-full"
            >
              No Thanks, Continue to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              This offer expires in 20 minutes and won't be available again
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripwireOfferPage;
