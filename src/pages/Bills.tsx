import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { calculateHSAEligibility } from "@/lib/hsaCalculations";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { BillsHeroMetrics } from "@/components/bills/BillsHeroMetrics";
// Bill review feature archived
// import { BillReviewCard } from "@/components/bills/BillReviewCard";
// import { DisputeAnalyticsDashboard } from "@/components/bills/DisputeAnalyticsDashboard";

interface Bill {
  id: string;
  vendor: string;
  category: string;
  date: string;
  amount: number;
  total_amount?: number;
  is_hsa_eligible: boolean;
  payment_transactions: any[];
}

const Bills = () => {
  const navigate = useNavigate();
  
  // Filter states
  const [hideFullyReimbursed, setHideFullyReimbursed] = useState(true);
  const [hideFullyPaid, setHideFullyPaid] = useState(true);
  const [showOnlyHSAEligible, setShowOnlyHSAEligible] = useState(false);

  // Fetch bills data
  const { data: bills, isLoading: billsLoading, refetch: refetchBills } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
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
        .eq('user_id', user.id)
        .order("date", { ascending: false })
        .limit(500); // Limit to most recent 500 bills for performance

      if (error) throw error;
      return data as Bill[];
    }
  });

  // Bill review feature archived - removed review and dispute queries

  const toggleHSAEligibility = async (billId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ is_hsa_eligible: !currentStatus })
        .eq("id", billId);

      if (error) throw error;
      refetchBills();
      toast.success(`HSA eligibility ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error("Error toggling HSA eligibility:", error);
      toast.error("Failed to update HSA eligibility");
    }
  };

  const filteredBills = useMemo(() => {
    if (!bills) return [];
    return bills.filter(bill => {
      const breakdown = calculateHSAEligibility(bill as any, bill.payment_transactions || []);
      
      if (hideFullyReimbursed && breakdown.paidViaHSA === breakdown.totalInvoiced && breakdown.totalInvoiced > 0) {
        return false;
      }
      
      if (hideFullyPaid && breakdown.unpaidBalance === 0 && breakdown.totalInvoiced > 0) {
        return false;
      }
      
      if (showOnlyHSAEligible && !bill.is_hsa_eligible) {
        return false;
      }
      
      return true;
    });
  }, [bills, hideFullyReimbursed, hideFullyPaid, showOnlyHSAEligible]);

  // Bill review feature archived - removed review/dispute aggregations

  const aggregateStats = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaidHSA = 0;
    let totalPaidOther = 0;
    let totalUnpaid = 0;
    let totalHSAEligible = 0;

    filteredBills.forEach(bill => {
      const breakdown = calculateHSAEligibility(bill as any, bill.payment_transactions || []);
      totalInvoiced += breakdown.totalInvoiced;
      totalPaidHSA += breakdown.paidViaHSA;
      totalPaidOther += breakdown.paidViaOther;
      totalUnpaid += breakdown.unpaidBalance;
      totalHSAEligible += breakdown.hsaReimbursementEligible;
    });

    return { totalInvoiced, totalPaidHSA, totalPaidOther, totalUnpaid, totalHSAEligible };
  }, [filteredBills]);

  if (billsLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Bills</h1>
          <p className="text-muted-foreground">
            Upload, track, and manage your medical bills and expenses
          </p>
        </div>

        {/* Hero Metrics */}
        <BillsHeroMetrics
          totalBilled={aggregateStats.totalInvoiced}
          paidViaHSA={aggregateStats.totalPaidHSA}
          paidOther={aggregateStats.totalPaidOther}
          unpaidBalance={aggregateStats.totalUnpaid}
        />

        {/* Bills List */}
        <div className="space-y-4">{""}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Customize which bills to display</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
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

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Bills</CardTitle>
                <Button onClick={() => navigate("/bills/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bill
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredBills.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No bills match your filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/bills/${bill.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{bill.vendor}</h4>
                          <p className="text-sm text-muted-foreground">
                            {bill.category} • {new Date(bill.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${Number(bill.amount).toFixed(2)}</p>
                          {bill.is_hsa_eligible && (
                            <Badge variant="secondary" className="mt-1">HSA Eligible</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Bills;