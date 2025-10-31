import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BenchmarkingProps {
  userStats: {
    savingsRate: number; // percentage of expenses saved
    rewardsRate: number; // average rewards rate across cards
    hsaUtilization: number; // percentage of HSA-eligible expenses
    avgMonthlyExpenses: number;
  };
}

// Industry benchmarks (these could be dynamic in a real app)
const BENCHMARKS = {
  savingsRate: {
    average: 15,
    good: 25,
    excellent: 35,
  },
  rewardsRate: {
    average: 1.5,
    good: 2.5,
    excellent: 4,
  },
  hsaUtilization: {
    average: 40,
    good: 70,
    excellent: 90,
  },
};

export const Benchmarking = ({ userStats }: BenchmarkingProps) => {
  const getPerformanceLevel = (value: number, benchmark: typeof BENCHMARKS.savingsRate) => {
    if (value >= benchmark.excellent) return { level: "Excellent", color: "text-green-600", icon: Award };
    if (value >= benchmark.good) return { level: "Good", color: "text-primary", icon: TrendingUp };
    if (value >= benchmark.average) return { level: "Average", color: "text-orange-600", icon: Minus };
    return { level: "Below Average", color: "text-destructive", icon: TrendingDown };
  };

  const savingsPerf = getPerformanceLevel(userStats.savingsRate, BENCHMARKS.savingsRate);
  const rewardsPerf = getPerformanceLevel(userStats.rewardsRate, BENCHMARKS.rewardsRate);
  const hsaPerf = getPerformanceLevel(userStats.hsaUtilization, BENCHMARKS.hsaUtilization);

  const benchmarks = [
    {
      metric: "Savings Rate",
      userValue: userStats.savingsRate,
      benchmark: BENCHMARKS.savingsRate.average,
      goodTarget: BENCHMARKS.savingsRate.good,
      excellentTarget: BENCHMARKS.savingsRate.excellent,
      performance: savingsPerf,
      unit: "%",
      description: "Percentage of medical expenses converted to savings",
    },
    {
      metric: "Rewards Optimization",
      userValue: userStats.rewardsRate,
      benchmark: BENCHMARKS.rewardsRate.average,
      goodTarget: BENCHMARKS.rewardsRate.good,
      excellentTarget: BENCHMARKS.rewardsRate.excellent,
      performance: rewardsPerf,
      unit: "%",
      description: "Average rewards rate across payment methods",
    },
    {
      metric: "HSA Utilization",
      userValue: userStats.hsaUtilization,
      benchmark: BENCHMARKS.hsaUtilization.average,
      goodTarget: BENCHMARKS.hsaUtilization.good,
      excellentTarget: BENCHMARKS.hsaUtilization.excellent,
      performance: hsaPerf,
      unit: "%",
      description: "Percentage of eligible expenses tracked for HSA",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Performance Benchmarks
        </CardTitle>
        <CardDescription>
          See how you compare to optimal strategies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {benchmarks.map((item) => {
          const Icon = item.performance.icon;
          const progressValue = Math.min((item.userValue / item.excellentTarget) * 100, 100);
          
          return (
            <div key={item.metric} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{item.metric}</h4>
                    <Badge variant="outline" className={item.performance.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {item.performance.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    Your Score: {item.userValue.toFixed(1)}{item.unit}
                  </span>
                  <span className="text-muted-foreground">
                    Target: {item.excellentTarget}{item.unit}
                  </span>
                </div>
                <Progress value={progressValue} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Below Avg: &lt;{item.benchmark}{item.unit}</span>
                  <span>Good: {item.goodTarget}{item.unit}</span>
                  <span>Excellent: {item.excellentTarget}{item.unit}+</span>
                </div>
              </div>

              {item.userValue < item.goodTarget && (
                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">💡 Improvement Tip:</p>
                  <p className="text-muted-foreground">
                    {item.metric === "Savings Rate" && 
                      "Increase HSA contributions and use higher rewards cards for medical expenses."}
                    {item.metric === "Rewards Optimization" && 
                      "Switch to cards with higher rewards rates (2-5%) for medical spending."}
                    {item.metric === "HSA Utilization" && 
                      "Track all HSA-eligible expenses, even if you don't plan to reimburse immediately."}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <h4 className="font-semibold text-sm mb-2">Benchmark Methodology</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Benchmarks are based on optimal HSA and rewards strategies. "Excellent" performers maximize tax-advantaged 
            accounts, delay reimbursements for investment growth, and use premium rewards cards strategically.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
