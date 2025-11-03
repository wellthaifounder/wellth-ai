import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface BillsHeroMetricsProps {
  totalBilled: number;
  paidViaHSA: number;
  paidOther: number;
  unpaidBalance: number;
}

export function BillsHeroMetrics({
  totalBilled,
  paidViaHSA,
  paidOther,
  unpaidBalance,
}: BillsHeroMetricsProps) {
  const hsaEligible = paidOther + unpaidBalance;
  
  // Calculate percentages
  const paidViaHSAPercent = totalBilled > 0 ? (paidViaHSA / totalBilled) * 100 : 0;
  const paidOtherPercent = totalBilled > 0 ? (paidOther / totalBilled) * 100 : 0;
  const unpaidPercent = totalBilled > 0 ? (unpaidBalance / totalBilled) * 100 : 0;

  // Data for the stacked bar chart
  const chartData = [
    {
      name: "Total",
      paidViaHSA,
      paidOther,
      unpaid: unpaidBalance,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-sm">
                {entry.name}: ${entry.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Payment Status Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {/* Stacked Bar Chart */}
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={chartData} layout="vertical" barSize={40}>
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="paidViaHSA" 
                  stackId="a" 
                  fill="hsl(142 76% 36%)" 
                  radius={[4, 0, 0, 4]}
                  minPointSize={totalBilled === 0 ? 0 : 1}
                />
                <Bar 
                  dataKey="paidOther" 
                  stackId="a" 
                  fill="hsl(38 92% 50%)"
                  minPointSize={totalBilled === 0 ? 0 : 1}
                />
                <Bar 
                  dataKey="unpaid" 
                  stackId="a" 
                  fill="hsl(25 95% 53%)" 
                  radius={[0, 4, 4, 0]}
                  minPointSize={totalBilled === 0 ? 40 : 1}
                />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(142 76% 36%)" }} />
                <span className="text-muted-foreground">Paid via HSA ({paidViaHSAPercent.toFixed(0)}%) - Tax savings maximized ✓</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(38 92% 50%)" }} />
                <span className="text-muted-foreground">Paid Other ({paidOtherPercent.toFixed(0)}%) - Ready to reimburse</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(25 95% 53%)" }} />
                <span className="text-muted-foreground">Unpaid ({unpaidPercent.toFixed(0)}%) - Opportunity for rewards</span>
              </div>
            </div>
          </div>

          {/* Summary Values */}
          <div className="flex flex-col gap-3 min-w-[200px]">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Billed</p>
              <p className="text-2xl font-bold">${totalBilled.toFixed(2)}</p>
            </div>
            <div className="text-right border-t pt-3">
              <p className="text-sm text-muted-foreground mb-1">Eligible for HSA Reimbursement</p>
              <p className="text-3xl font-bold" style={{ color: "hsl(38 92% 50%)" }}>${hsaEligible.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalBilled > 0 ? ((hsaEligible / totalBilled) * 100).toFixed(0) : 0}% of total
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
