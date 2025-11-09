import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Clock, Target, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface DisputeAnalyticsDashboardProps {
  disputes: any[];
  isLoading?: boolean;
}

export const DisputeAnalyticsDashboard = ({ disputes, isLoading = false }: DisputeAnalyticsDashboardProps) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalDisputes = disputes.length;
  const resolvedDisputes = disputes.filter(d => 
    ['resolved', 'settled', 'withdrawn'].includes(d.dispute_status)
  ).length;
  const wonDisputes = disputes.filter(d => 
    d.dispute_status === 'resolved' && d.savings_achieved > 0
  ).length;
  
  const totalSavings = disputes.reduce((sum, d) => sum + (d.savings_achieved || 0), 0);
  const totalDisputed = disputes.reduce((sum, d) => sum + d.disputed_amount, 0);
  const successRate = resolvedDisputes > 0 ? (wonDisputes / resolvedDisputes) * 100 : 0;
  const avgResolutionDays = disputes
    .filter(d => d.resolution_date && d.submitted_date)
    .reduce((sum, d, _, arr) => {
      const days = Math.floor(
        (new Date(d.resolution_date).getTime() - new Date(d.submitted_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days / arr.length;
    }, 0);

  const pendingDisputes = disputes.filter(d => 
    ['submitted', 'under_review', 'additional_info_requested'].includes(d.dispute_status)
  ).length;

  const metrics = [
    {
      title: "Total Savings",
      value: `$${totalSavings.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Success Rate",
      value: `${successRate.toFixed(0)}%`,
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Avg Resolution Time",
      value: `${Math.round(avgResolutionDays)} days`,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Pending Review",
      value: pendingDisputes,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold mt-2">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Dispute Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Resolution Rate</span>
              <span className="text-sm text-muted-foreground">
                {resolvedDisputes} of {totalDisputes} resolved
              </span>
            </div>
            <Progress value={(resolvedDisputes / totalDisputes) * 100} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Savings Recovery</span>
              <span className="text-sm text-muted-foreground">
                ${totalSavings.toLocaleString()} of ${totalDisputed.toLocaleString()}
              </span>
            </div>
            <Progress value={(totalSavings / totalDisputed) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
