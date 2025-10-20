import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WellthLogo } from "@/components/WellthLogo";
import { ArrowLeft, TrendingUp, DollarSign, PieChart } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { HSAInvestmentTracker } from "@/components/analytics/HSAInvestmentTracker";
import { ReimbursementTimingOptimizer } from "@/components/analytics/ReimbursementTimingOptimizer";
import { RewardsOptimizationDashboard } from "@/components/analytics/RewardsOptimizationDashboard";
import { YearOverYearComparison } from "@/components/analytics/YearOverYearComparison";

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    hsaEligible: 0,
    projectedSavings: 0,
    actualSavings: 0,
    avgMonthly: 0,
    unreimbursedHsaTotal: 0
  });
  const [paymentMethodsRewards, setPaymentMethodsRewards] = useState<any[]>([]);
  const [yearlyData, setYearlyData] = useState<any[]>([]);

  const COLORS = ['hsl(186 100% 40%)', 'hsl(27 96% 61%)', 'hsl(214 95% 50%)', 'hsl(120 60% 50%)', 'hsl(0 84% 60%)'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: expenses, error } = await supabase
        .from("expense_reports")
        .select("*")
        .order("date", { ascending: true });

      const { data: paymentMethods } = await supabase
        .from("payment_methods")
        .select("*");

      if (error) throw error;

      // Calculate monthly trends
      const monthlyTotals: Record<string, number> = {};
      const categoryTotals: Record<string, number> = {};
      let hsaTotal = 0;
      let unreimbursedHsaTotal = 0;
      let reimbursedHsaTotal = 0;

      expenses?.forEach(exp => {
        const month = new Date(exp.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(exp.amount);
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + Number(exp.amount);
        if (exp.is_hsa_eligible) {
          hsaTotal += Number(exp.amount);
          if (exp.is_reimbursed) {
            reimbursedHsaTotal += Number(exp.amount);
          } else {
            unreimbursedHsaTotal += Number(exp.amount);
          }
        }
      });

      const monthlyChartData = Object.entries(monthlyTotals).map(([month, total]) => ({
        month,
        total: Number(total.toFixed(2))
      }));

      const categoryChartData = Object.entries(categoryTotals)
        .map(([category, total]) => ({
          category,
          total: Number(total.toFixed(2))
        }))
        .sort((a, b) => b.total - a.total);

      const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const avgMonthly = monthlyChartData.length > 0 ? totalExpenses / monthlyChartData.length : 0;

      setMonthlyData(monthlyChartData);
      setCategoryData(categoryChartData);
      setStats({
        totalExpenses,
        hsaEligible: hsaTotal,
        projectedSavings: unreimbursedHsaTotal * 0.3,
        actualSavings: reimbursedHsaTotal * 0.3,
        avgMonthly,
        unreimbursedHsaTotal
      });

      // Calculate rewards by payment method
      if (paymentMethods && expenses) {
        const rewardsByMethod = paymentMethods.map(pm => {
          const pmExpenses = expenses.filter(exp => exp.payment_method_id === pm.id);
          const totalSpent = pmExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
          const rewardsEarned = totalSpent * (Number(pm.rewards_rate) / 100);
          
          return {
            name: pm.name,
            rewardsEarned,
            rewardsRate: Number(pm.rewards_rate),
            totalSpent,
          };
        });
        setPaymentMethodsRewards(rewardsByMethod);
      }

      // Calculate yearly data
      if (expenses) {
        const yearlyStats = expenses.reduce((acc: any, exp) => {
          const year = new Date(exp.date).getFullYear();
          if (!acc[year]) {
            acc[year] = {
              year,
              totalExpenses: 0,
              taxSavings: 0,
              rewardsEarned: 0,
              hsaEligible: 0,
            };
          }
          
          const amount = Number(exp.amount);
          acc[year].totalExpenses += amount;
          acc[year].rewardsEarned += amount * 0.02;
          
          if (exp.is_hsa_eligible) {
            acc[year].hsaEligible += amount;
            acc[year].taxSavings += amount * 0.22;
          }
          
          return acc;
        }, {});

        setYearlyData(Object.values(yearlyStats).sort((a: any, b: any) => a.year - b.year));
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <button 
            onClick={() => navigate("/dashboard")}
            className="hover:opacity-80 transition-opacity"
          >
            <WellthLogo size="sm" showTagline />
          </button>
          
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Insights into your spending and HSA savings
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">HSA Eligible</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.hsaEligible.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.projectedSavings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Not yet reimbursed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actual Savings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.actualSavings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From reimbursements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Monthly</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.avgMonthly.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending Trend</CardTitle>
              <CardDescription>Your expenses over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Total Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Breakdown of your expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="total" name="Amount">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={400}>
              <RechartsPie>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="hsl(var(--primary))"
                  dataKey="total"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }} 
                />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HSAInvestmentTracker unreimbursedTotal={stats.unreimbursedHsaTotal} />
            <ReimbursementTimingOptimizer unreimbursedTotal={stats.unreimbursedHsaTotal} />
          </div>
          
          <RewardsOptimizationDashboard paymentMethods={paymentMethodsRewards} />
          
          <YearOverYearComparison yearlyData={yearlyData} />
        </div>
      </main>
    </div>
  );
};

export default Analytics;
