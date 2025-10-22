import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WellthLogo } from "@/components/WellthLogo";
import { ArrowLeft, Plus, DollarSign, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { calculateHSAEligibility } from "@/lib/hsaCalculations";

const InvoicePaymentListEnhanced = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  
  // Filter states
  const [hideFullyReimbursed, setHideFullyReimbursed] = useState(true);
  const [hideFullyPaid, setHideFullyPaid] = useState(true);
  const [showOnlyHSAEligible, setShowOnlyHSAEligible] = useState(false);
  const [minUnpaidBalance, setMinUnpaidBalance] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select(`
          *,
          payment_transactions (
            id,
            payment_date,
            amount,
            payment_source,
            is_reimbursed,
            reimbursed_date
          )
        `)
        .order("date", { ascending: false });

      if (invoicesError) throw invoicesError;
      setExpenses(invoicesData || []);
    } catch (error) {
      toast.error("Failed to load expenses");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusEmoji = (paidHSA: number, paidOther: number, unpaid: number, total: number) => {
    if (paidHSA === total && total > 0) return "🟢";
    if (paidOther > 0 && unpaid === 0) return "🟡";
    if (unpaid > 0) return "🔴";
    if (paidHSA > 0 && paidOther > 0) return "⚪";
    return "🚫";
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const breakdown = calculateHSAEligibility(expense, expense.payment_transactions || []);
      
      if (hideFullyReimbursed && breakdown.paidViaHSA === breakdown.totalInvoiced && breakdown.totalInvoiced > 0) {
        return false;
      }
      
      if (hideFullyPaid && breakdown.unpaidBalance === 0 && breakdown.totalInvoiced > 0) {
        return false;
      }
      
      if (showOnlyHSAEligible && !expense.is_hsa_eligible) {
        return false;
      }
      
      if (minUnpaidBalance > 0 && breakdown.unpaidBalance < minUnpaidBalance) {
        return false;
      }
      
      return true;
    });
  }, [expenses, hideFullyReimbursed, hideFullyPaid, showOnlyHSAEligible, minUnpaidBalance]);

  const aggregateStats = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaidHSA = 0;
    let totalPaidOther = 0;
    let totalUnpaid = 0;
    let totalHSAEligible = 0;

    expenses.forEach(expense => {
      const breakdown = calculateHSAEligibility(expense, expense.payment_transactions || []);
      totalInvoiced += breakdown.totalInvoiced;
      totalPaidHSA += breakdown.paidViaHSA;
      totalPaidOther += breakdown.paidViaOther;
      totalUnpaid += breakdown.unpaidBalance;
      totalHSAEligible += breakdown.hsaReimbursementEligible;
    });

    return { totalInvoiced, totalPaidHSA, totalPaidOther, totalUnpaid, totalHSAEligible };
  }, [expenses]);

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
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <button 
              onClick={() => navigate("/dashboard")}
              className="hover:opacity-80 transition-opacity"
            >
              <WellthLogo size="sm" showTagline />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${aggregateStats.totalInvoiced.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Paid via HSA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${aggregateStats.totalPaidHSA.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Paid Other</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">${aggregateStats.totalPaidOther.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${aggregateStats.totalUnpaid.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Customize which invoices to display</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hideReimbursed"
                  checked={hideFullyReimbursed}
                  onCheckedChange={(checked) => setHideFullyReimbursed(checked as boolean)}
                />
                <Label htmlFor="hideReimbursed" className="cursor-pointer">
                  Hide Fully Reimbursed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hidePaid"
                  checked={hideFullyPaid}
                  onCheckedChange={(checked) => setHideFullyPaid(checked as boolean)}
                />
                <Label htmlFor="hidePaid" className="cursor-pointer">
                  Hide Fully Paid
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hsaOnly"
                  checked={showOnlyHSAEligible}
                  onCheckedChange={(checked) => setShowOnlyHSAEligible(checked as boolean)}
                />
                <Label htmlFor="hsaOnly" className="cursor-pointer">
                  HSA Eligible Only
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>All Invoices</CardTitle>
                <CardDescription>
                  {filteredExpenses.length} invoice{filteredExpenses.length !== 1 ? 's' : ''} shown
                </CardDescription>
              </div>
              <Button onClick={() => navigate("/invoice/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Invoice
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No invoices match your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExpenses.map((expense) => {
                  const breakdown = calculateHSAEligibility(expense, expense.payment_transactions || []);
                  const emoji = getStatusEmoji(
                    breakdown.paidViaHSA,
                    breakdown.paidViaOther,
                    breakdown.unpaidBalance,
                    breakdown.totalInvoiced
                  );

                  return (
                    <div
                      key={expense.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/invoice/${expense.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{emoji}</span>
                            <h4 className="font-medium">{expense.vendor}</h4>
                            {expense.is_hsa_eligible && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                HSA
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {expense.category} • {new Date(expense.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${breakdown.totalInvoiced.toFixed(2)}</p>
                          {breakdown.unpaidBalance > 0 && (
                            <p className="text-sm text-red-600">
                              ${breakdown.unpaidBalance.toFixed(2)} unpaid
                            </p>
                          )}
                          {breakdown.hsaReimbursementEligible > 0 && (
                            <p className="text-sm text-amber-600">
                              ${breakdown.hsaReimbursementEligible.toFixed(2)} eligible
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoicePaymentListEnhanced;
