import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Calendar, DollarSign, Clock, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { AuthenticatedNav } from "@/components/AuthenticatedNav";
import { calculateVaultSummary, calculateExpenseProjectedValue, type VaultExpense } from "@/lib/vaultCalculations";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const VaultTracker = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<VaultExpense[]>([]);
  const [investmentReturn, setInvestmentReturn] = useState(0.08);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVaultExpenses();
  }, []);

  const loadVaultExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_hsa_eligible", true)
        .in("reimbursement_strategy", ["medium", "vault"])
        .order("planned_reimbursement_date", { ascending: true });

      if (error) throw error;
      
      // Map to VaultExpense type
      const vaultExpenses: VaultExpense[] = (data || []).map(invoice => ({
        id: invoice.id,
        date: invoice.date,
        vendor: invoice.vendor,
        amount: Number(invoice.amount),
        category: invoice.category,
        reimbursement_strategy: invoice.reimbursement_strategy as 'immediate' | 'medium' | 'vault',
        planned_reimbursement_date: invoice.planned_reimbursement_date,
        card_payoff_months: invoice.card_payoff_months || 0,
        investment_notes: invoice.investment_notes,
      }));
      
      setExpenses(vaultExpenses);
    } catch (error) {
      console.error("Error loading vault expenses:", error);
      toast.error("Failed to load vault expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReady = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ reimbursement_strategy: "immediate" })
        .eq("id", expenseId);

      if (error) throw error;
      toast.success("Expense marked as ready to reimburse");
      loadVaultExpenses();
    } catch (error) {
      console.error("Error marking expense:", error);
      toast.error("Failed to update expense");
    }
  };

  const handleBulkMarkReady = async () => {
    if (selectedExpenses.size === 0) {
      toast.error("Please select at least one expense");
      return;
    }

    try {
      const { error } = await supabase
        .from("invoices")
        .update({ reimbursement_strategy: "immediate" })
        .in("id", Array.from(selectedExpenses));

      if (error) throw error;
      toast.success(`${selectedExpenses.size} expense(s) marked as ready to reimburse`);
      setSelectedExpenses(new Set());
      loadVaultExpenses();
    } catch (error) {
      console.error("Error marking expenses:", error);
      toast.error("Failed to update expenses");
    }
  };

  const toggleExpense = (expenseId: string) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedExpenses(newSelected);
  };

  const toggleAll = () => {
    if (selectedExpenses.size === expenses.length) {
      setSelectedExpenses(new Set());
    } else {
      setSelectedExpenses(new Set(expenses.map(e => e.id)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const summary = calculateVaultSummary(expenses, investmentReturn);

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNav />

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <span>💎</span> Your Investment Vault
          </h1>
          <p className="text-muted-foreground">
            Track expenses held for long-term HSA investment growth
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total in Vault
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${summary.totalInVault.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.expenseCount} expense{summary.expenseCount !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Projected Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">${summary.projectedGrowth.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                At {(investmentReturn * 100).toFixed(0)}% annual return
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg. Time Invested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.averageYearsInvested.toFixed(1)} years</p>
              <p className="text-xs text-muted-foreground mt-1">
                Average hold period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Next Reminder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {summary.nextReminder 
                  ? new Date(summary.nextReminder).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'None'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.nextReminder ? 'Upcoming' : 'No reminders set'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Vault Expenses</CardTitle>
                <CardDescription>
                  Expenses held for long-term investment growth
                </CardDescription>
              </div>
              {expenses.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAll}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {selectedExpenses.size === expenses.length ? "Deselect All" : "Select All"}
                  </Button>
                  {selectedExpenses.size > 0 && (
                    <Button
                      size="sm"
                      onClick={handleBulkMarkReady}
                    >
                      Mark {selectedExpenses.size} Ready
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No expenses in your vault yet.</p>
                <p className="text-sm mt-2">
                  Add expenses with a long-term reimbursement strategy to start building your vault.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => {
                  const projectedValue = calculateExpenseProjectedValue(expense, investmentReturn);
                  const growth = projectedValue - expense.amount;
                  const yearsInvested = expense.planned_reimbursement_date
                    ? (new Date(expense.planned_reimbursement_date).getTime() - new Date(expense.date).getTime()) / (1000 * 60 * 60 * 24 * 365)
                    : 0;

                  return (
                    <div key={expense.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedExpenses.has(expense.id)}
                          onCheckedChange={() => toggleExpense(expense.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{expense.vendor}</p>
                            <Badge variant={expense.reimbursement_strategy === 'vault' ? 'default' : 'secondary'}>
                              {expense.reimbursement_strategy === 'vault' ? '💎 Vault' : 'Medium-term'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {expense.category} • {new Date(expense.date).toLocaleDateString()}
                          </p>
                          {expense.investment_notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {expense.investment_notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${expense.amount.toFixed(2)}</p>
                          <p className="text-sm text-primary">
                            +${growth.toFixed(2)} growth
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {yearsInvested.toFixed(1)} years
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Planned reimburse: </span>
                          <span className="font-medium">
                            {expense.planned_reimbursement_date
                              ? new Date(expense.planned_reimbursement_date).toLocaleDateString()
                              : 'Not set'}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkReady(expense.id)}
                        >
                          Ready to Reimburse
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Disclaimers */}
        <Card className="mt-6 border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <span>⚠️</span> Important Disclaimers
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>• Investment returns are not guaranteed and may vary. Past performance does not guarantee future results.</p>
            <p>• Keep all receipts and documentation for HSA reimbursement purposes.</p>
            <p>• Consult with a tax professional about HSA reimbursement timing strategies.</p>
            <p>• Make sure your HSA was open before the expense date to be eligible for reimbursement.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VaultTracker;
