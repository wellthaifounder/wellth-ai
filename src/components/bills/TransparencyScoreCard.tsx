import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, Info, Shield, Star } from "lucide-react";

interface TransparencyScoreCardProps {
  transparencyScore: number | null;
  billingAccuracyScore?: number | null;
  fairPricingScore?: number | null;
  overallRating?: number | null;
}

export function TransparencyScoreCard({
  transparencyScore,
  billingAccuracyScore,
  fairPricingScore,
  overallRating,
}: TransparencyScoreCardProps) {
  if (transparencyScore === null) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Provider Transparency Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Not enough data to calculate transparency score yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTransparencyBadge = (score: number) => {
    if (score >= 90) return { label: "Highly Transparent", icon: Shield, color: "text-green-600 dark:text-green-400" };
    if (score >= 75) return { label: "Transparent", icon: Award, color: "text-blue-600 dark:text-blue-400" };
    if (score >= 60) return { label: "Moderately Transparent", icon: Star, color: "text-yellow-600 dark:text-yellow-400" };
    return { label: "Needs Improvement", icon: Info, color: "text-orange-600 dark:text-orange-400" };
  };

  const badge = getTransparencyBadge(transparencyScore);
  const BadgeIcon = badge.icon;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Provider Transparency Score
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>Composite score calculated from:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Billing Accuracy (40%)</li>
                    <li>Fair Pricing (40%)</li>
                    <li>Patient Ratings (20%)</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Badge variant="outline" className={badge.color}>
            <BadgeIcon className="h-3 w-3 mr-1" />
            {badge.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg className="w-32 h-32" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
                opacity="0.2"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(transparencyScore / 100) * 339.292} 339.292`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                className={badge.color}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-3xl font-bold ${badge.color}`}>
                  {transparencyScore.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">out of 100</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Billing Accuracy</span>
              <span className="font-medium">{billingAccuracyScore?.toFixed(0) ?? 'N/A'}%</span>
            </div>
            <Progress value={billingAccuracyScore ?? 0} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fair Pricing</span>
              <span className="font-medium">{fairPricingScore?.toFixed(0) ?? 'N/A'}%</span>
            </div>
            <Progress value={fairPricingScore ?? 0} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Patient Satisfaction</span>
              <span className="font-medium">
                {overallRating ? `${(overallRating * 20).toFixed(0)}%` : 'N/A'}
              </span>
            </div>
            <Progress value={overallRating ? overallRating * 20 : 0} className="h-2" />
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Based on analysis of {billingAccuracyScore ? 'billing data, ' : ''}
            {fairPricingScore ? 'price comparisons, ' : ''}
            {overallRating ? 'and patient reviews' : ''}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
