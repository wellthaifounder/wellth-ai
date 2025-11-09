import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface DisputeSuccessPredictorProps {
  errorTypes: string[];
  potentialSavings: number;
  providerHistory?: {
    successRate: number;
    avgResolutionDays: number;
  };
  hasDocumentation: boolean;
  hasInsuranceVerification: boolean;
}

export const DisputeSuccessPredictor = ({
  errorTypes,
  potentialSavings,
  providerHistory,
  hasDocumentation,
  hasInsuranceVerification,
}: DisputeSuccessPredictorProps) => {
  // Calculate success probability based on multiple factors
  let successScore = 50; // Base score

  // Strong error types increase success rate
  const strongErrorTypes = ['duplicate_charge', 'incorrect_coding', 'upcoding'];
  const hasStrongErrors = errorTypes.some(type => strongErrorTypes.includes(type));
  if (hasStrongErrors) successScore += 20;

  // Multiple errors increase success rate
  if (errorTypes.length > 2) successScore += 10;

  // Documentation increases success
  if (hasDocumentation) successScore += 15;
  if (hasInsuranceVerification) successScore += 10;

  // Provider history matters
  if (providerHistory) {
    if (providerHistory.successRate > 70) successScore += 10;
    if (providerHistory.successRate < 30) successScore -= 10;
  }

  // Savings amount matters
  if (potentialSavings > 1000) successScore += 5;

  // Cap at 95%
  successScore = Math.min(successScore, 95);

  const getSuccessLevel = () => {
    if (successScore >= 75) return { label: "High", color: "text-green-600", variant: "default" as const };
    if (successScore >= 50) return { label: "Medium", color: "text-yellow-600", variant: "secondary" as const };
    return { label: "Low", color: "text-red-600", variant: "destructive" as const };
  };

  const successLevel = getSuccessLevel();

  const factors = [
    {
      label: "Strong Evidence",
      present: hasStrongErrors,
      impact: "high",
    },
    {
      label: "Complete Documentation",
      present: hasDocumentation,
      impact: "high",
    },
    {
      label: "Insurance Verified",
      present: hasInsuranceVerification,
      impact: "medium",
    },
    {
      label: "Multiple Error Types",
      present: errorTypes.length > 2,
      impact: "medium",
    },
    {
      label: "Favorable Provider History",
      present: providerHistory && providerHistory.successRate > 70,
      impact: "medium",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Success Prediction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <span className={`text-4xl font-bold ${successLevel.color}`}>
              {successScore}%
            </span>
            <Badge variant={successLevel.variant}>{successLevel.label} Probability</Badge>
          </div>
          <Progress value={successScore} className="h-3" />
          <p className="text-sm text-muted-foreground">
            Based on {factors.filter(f => f.present).length} positive factors
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Success Factors</h4>
          {factors.map((factor) => (
            <div
              key={factor.label}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-2">
                {factor.present ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">{factor.label}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {factor.impact} impact
              </Badge>
            </div>
          ))}
        </div>

        {successScore < 50 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-900">Consider Improving Your Case</p>
              <p className="text-xs text-yellow-700">
                Add more documentation or insurance verification to strengthen your dispute
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
