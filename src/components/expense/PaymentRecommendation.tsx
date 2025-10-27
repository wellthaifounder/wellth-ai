import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CreditCard, Lightbulb } from "lucide-react";
import { PaymentRecommendation as PaymentRec } from "@/lib/paymentRecommendation";

interface PaymentRecommendationProps {
  recommendation: PaymentRec;
  className?: string;
}

export const PaymentRecommendation = ({ recommendation, className = "" }: PaymentRecommendationProps) => {
  const getIcon = () => {
    switch (recommendation.method) {
      case "hsa-invest":
        return <TrendingUp className="h-5 w-5 text-primary" />;
      case "rewards-card":
        return <CreditCard className="h-5 w-5 text-primary" />;
      default:
        return <Lightbulb className="h-5 w-5 text-primary" />;
    }
  };

  const getConfidenceBadge = () => {
    const variants = {
      high: "default" as const,
      medium: "secondary" as const,
      low: "outline" as const,
    };
    
    return (
      <Badge variant={variants[recommendation.confidence]} className="text-xs">
        {recommendation.confidence} confidence
      </Badge>
    );
  };

  return (
    <Card className={`border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {getIcon()}
            <div>
              <h3 className="font-semibold text-sm">{recommendation.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {recommendation.description}
              </p>
            </div>
          </div>
          {getConfidenceBadge()}
        </div>

        {recommendation.savingsAmount > 0 && (
          <div className="space-y-2">
            <div className="bg-background/50 rounded-lg p-3 border border-primary/10">
              <div className="text-2xl font-bold text-primary">
                ${recommendation.savingsAmount.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Estimated Total Benefit</div>
            </div>
            
            {recommendation.taxSavings && recommendation.taxSavings > 0 && (
              <div className="bg-accent/30 rounded-lg p-3 border border-primary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      + ${recommendation.taxSavings.toFixed(2)} Tax Savings
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Already saved when contributing to HSA (included in total benefit calculation)
                    </div>
                  </div>
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          {recommendation.reasoning.map((reason, index) => (
            <div key={index} className="flex items-start gap-2 text-xs">
              <span className="text-primary mt-0.5">•</span>
              <span className="text-muted-foreground">{reason}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
