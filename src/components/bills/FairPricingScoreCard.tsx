import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface FairPricingScoreCardProps {
  score: number | null;
  regionalPercentile?: number | null;
  lastUpdated?: string | null;
}

export function FairPricingScoreCard({ 
  score, 
  regionalPercentile,
  lastUpdated 
}: FairPricingScoreCardProps) {
  if (score === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Fair Pricing Score
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Fair Pricing Score measures how a provider's charges compare to regional averages. Higher scores indicate more competitive pricing.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Not enough data yet</p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 75) return "text-blue-600 dark:text-blue-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: "Excellent", variant: "default" as const };
    if (score >= 75) return { label: "Good", variant: "secondary" as const };
    if (score >= 60) return { label: "Fair", variant: "outline" as const };
    return { label: "Above Average", variant: "destructive" as const };
  };

  const badge = getScoreBadge(score);

  const getPercentileIcon = () => {
    if (!regionalPercentile) return <Minus className="h-4 w-4" />;
    if (regionalPercentile < 50) return <TrendingDown className="h-4 w-4 text-green-600" />;
    if (regionalPercentile > 50) return <TrendingUp className="h-4 w-4 text-orange-600" />;
    return <Minus className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Fair Pricing Score
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Fair Pricing Score measures how a provider's charges compare to regional averages. 100 = at regional median, higher scores indicate better pricing.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score.toFixed(0)}
            </div>
            <p className="text-sm text-muted-foreground">out of 100</p>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price Competitiveness</span>
            <span className="font-medium">{score.toFixed(0)}%</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        {regionalPercentile !== null && regionalPercentile !== undefined && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getPercentileIcon()}
              <span className="text-sm">Regional Percentile</span>
            </div>
            <span className="font-semibold">{regionalPercentile}%</span>
          </div>
        )}

        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(lastUpdated).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
