import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

type BudgetAlert = {
  id: string;
  category: string;
  monthly_limit: number;
  current_month_total: number;
  alert_threshold: number;
};

const BudgetAlerts = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Form state
  const [newCategory, setNewCategory] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [newThreshold, setNewThreshold] = useState("80");

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("category");

      if (error) throw error;
      const uniqueCategories = Array.from(new Set(data?.map(e => e.category) || []));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchBudgets = async () => {
    try {
      // Get current month start and end
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch budget settings from localStorage for now
      const savedBudgets = localStorage.getItem("budgetAlerts");
      const budgetSettings = savedBudgets ? JSON.parse(savedBudgets) : [];

      // Calculate current month totals
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("category, amount")
        .gte("date", startOfMonth.toISOString().split('T')[0])
        .lte("date", endOfMonth.toISOString().split('T')[0]);

      if (error) throw error;

      const categoryTotals = expenses?.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
        return acc;
      }, {} as Record<string, number>) || {};

      const enrichedBudgets = budgetSettings.map((budget: any) => ({
        ...budget,
        current_month_total: categoryTotals[budget.category] || 0,
      }));

      setBudgets(enrichedBudgets);
    } catch (error) {
      toast.error("Failed to load budget alerts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = () => {
    if (!newCategory || !newLimit) {
      toast.error("Please select a category and enter a budget limit");
      return;
    }

    const newBudget = {
      id: crypto.randomUUID(),
      category: newCategory,
      monthly_limit: Number(newLimit),
      alert_threshold: Number(newThreshold),
      current_month_total: 0,
    };

    const savedBudgets = localStorage.getItem("budgetAlerts");
    const budgetSettings = savedBudgets ? JSON.parse(savedBudgets) : [];
    budgetSettings.push(newBudget);
    localStorage.setItem("budgetAlerts", JSON.stringify(budgetSettings));

    setNewCategory("");
    setNewLimit("");
    setNewThreshold("80");
    fetchBudgets();
    toast.success("Budget alert created");
  };

  const handleDeleteBudget = (id: string) => {
    const savedBudgets = localStorage.getItem("budgetAlerts");
    const budgetSettings = savedBudgets ? JSON.parse(savedBudgets) : [];
    const filtered = budgetSettings.filter((b: any) => b.id !== id);
    localStorage.setItem("budgetAlerts", JSON.stringify(filtered));
    fetchBudgets();
    toast.success("Budget alert deleted");
  };

  const getAlertStatus = (budget: BudgetAlert) => {
    const percentage = (budget.current_month_total / budget.monthly_limit) * 100;
    if (percentage >= 100) return { color: "destructive", message: "Budget exceeded!" };
    if (percentage >= budget.alert_threshold) return { color: "warning", message: "Approaching limit" };
    return { color: "success", message: "On track" };
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create Budget Alert</CardTitle>
              <CardDescription>
                Set monthly spending limits and get notified when approaching them
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit ($)</Label>
                <Input
                  type="number"
                  placeholder="500.00"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Alert Threshold (%)</Label>
                <Input
                  type="number"
                  placeholder="80"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  You'll be alerted when you reach this percentage of your budget
                </p>
              </div>
              <Button onClick={handleAddBudget} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Budget Alert
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Budget Alerts</CardTitle>
              <CardDescription>
                Current month spending vs. your budget limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {budgets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No budget alerts set</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgets.map((budget) => {
                    const status = getAlertStatus(budget);
                    const percentage = (budget.current_month_total / budget.monthly_limit) * 100;
                    
                    return (
                      <div key={budget.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{budget.category}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${budget.current_month_total.toFixed(2)} / ${budget.monthly_limit.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBudget(budget.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{percentage.toFixed(0)}% used</span>
                            <span className={percentage >= budget.alert_threshold ? "text-destructive font-medium" : ""}>
                              {status.message}
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                percentage >= 100 ? "bg-destructive" :
                                percentage >= budget.alert_threshold ? "bg-yellow-500" :
                                "bg-primary"
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>

                        {percentage >= budget.alert_threshold && (
                          <Alert variant={percentage >= 100 ? "destructive" : "default"}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              {percentage >= 100 
                                ? `You've exceeded your ${budget.category} budget by $${(budget.current_month_total - budget.monthly_limit).toFixed(2)}`
                                : `You're approaching your ${budget.category} budget limit`
                              }
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BudgetAlerts;
