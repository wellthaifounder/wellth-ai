import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, ArrowLeft, Link2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { calculateHSAEligibility } from "@/lib/hsaCalculations";
import { AuthenticatedNav } from "@/components/AuthenticatedNav";
import { BillsHeroMetrics } from "@/components/bills/BillsHeroMetrics";
import { LinkTransactionDialog } from "@/components/bills/LinkTransactionDialog";

interface BillWithReview {
  id: string;
  vendor: string;
  category: string;
  date: string;
  amount: number;
  total_amount?: number;
  is_hsa_eligible: boolean;
  payment_transactions: any[];
  bill_reviews?: Array<{
    id: string;
    review_status: string;
    total_potential_savings: number;
    confidence_score: number;
  }>;
}

const Bills = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<BillWithReview[]>([]);
  
  // Filter states
  const [hideFullyReimbursed, setHideFullyReimbursed] = useState(true);
  const [hideFullyPaid, setHideFullyPaid] = useState(true);
  const [showOnlyHSAEligible, setShowOnlyHSAEligible] = useState(false);
  const [filterByReviewStatus, setFilterByReviewStatus] = useState<string | null>(
    searchParams.get('review_status')
  );

  // Link transaction dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedBillForLinking, setSelectedBillForLinking] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: billsData, error: billsError } = await supabase
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
          ),
          bill_reviews (
            id,
            review_status,
            total_potential_savings,
            confidence_score
          )
        `)
        .order("date", { ascending: false });

      if (billsError) throw billsError;
      setBills(billsData || []);
    } catch (error) {
      toast.error("Failed to load bills");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHSAEligibility = async (billId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ is_hsa_eligible: !currentStatus })
        .eq("id", billId);

      if (error) throw error;

      setBills(prev => prev.map(bill => 
        bill.id === billId ? { ...bill, is_hsa_eligible: !currentStatus } : bill
      ));

      toast.success(`HSA eligibility ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error("Error toggling HSA eligibility:", error);
      toast.error("Failed to update HSA eligibility");
    }
  };

  const handleOpenLinkDialog = (bill: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBillForLinking(bill);
    setLinkDialogOpen(true);
  };

  const handleLinkSuccess = () => {
    fetchData();
  };

  const getStatusBadge = (bill: BillWithReview) => {
    const breakdown = calculateHSAEligibility(bill as any, bill.payment_transactions || []);
    const review = bill.bill_reviews?.[0];
    
    const paymentStatus = 
      breakdown.unpaidBalance === 0 && breakdown.totalInvoiced > 0 
        ? "Paid" 
        : breakdown.unpaidBalance > 0 
        ? "Unpaid" 
        : "Unknown";
    
    const reviewStatus = review
      ? review.review_status === 'pending' && review.total_potential_savings > 0
        ? "Errors Found"
        : review.review_status === 'resolved'
        ? "Verified"
        : "Pending Review"
      : "Not Reviewed";

    return { paymentStatus, reviewStatus, review };
  };

  const filteredBills = useMemo(() => {
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

      if (filterByReviewStatus) {
        const review = bill.bill_reviews?.[0];
        if (filterByReviewStatus === 'errors_found') {
          return review?.review_status === 'pending' && (review?.total_potential_savings || 0) > 0;
        }
      }
      
      return true;
    });
  }, [bills, hideFullyReimbursed, hideFullyPaid, showOnlyHSAEligible, filterByReviewStatus]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNav />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Hero Metrics */}
        <BillsHeroMetrics
          totalBilled={aggregateStats.totalInvoiced}
          paidViaHSA={aggregateStats.totalPaidHSA}
          paidOther={aggregateStats.totalPaidOther}
          unpaidBalance={aggregateStats.totalUnpaid}
        />

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Customize which bills to display</CardDescription>
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

        {/* Bills List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>All Bills</CardTitle>
                <CardDescription>
                  {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''} shown
                </CardDescription>
              </div>
              <Button onClick={() => navigate("/bills/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bill
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredBills.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No bills match your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBills.map((bill) => {
                  const breakdown = calculateHSAEligibility(bill as any, bill.payment_transactions || []);
                  const { paymentStatus, reviewStatus, review } = getStatusBadge(bill);

                  return (
                    <div
                      key={bill.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/bills/${bill.id}`)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-medium">{bill.vendor}</h4>
                            <Badge 
                              variant={paymentStatus === "Paid" ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {paymentStatus}
                            </Badge>
                            <Badge 
                              variant={
                                reviewStatus === "Errors Found" ? "destructive" : 
                                reviewStatus === "Verified" ? "default" : 
                                "secondary"
                              }
                              className="text-xs"
                            >
                              {reviewStatus === "Errors Found" && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {reviewStatus === "Verified" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {reviewStatus}
                            </Badge>
                            {bill.is_hsa_eligible && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                HSA
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {bill.category} • {new Date(bill.date).toLocaleDateString()}
                          </p>
                          {review && review.total_potential_savings > 0 && (
                            <p className="text-sm text-orange-600 mt-1">
                              💰 ${review.total_potential_savings.toFixed(2)} potential savings
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => handleOpenLinkDialog(bill, e)}
                            title="Link Transaction"
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <div 
                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/50 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Label 
                              htmlFor={`hsa-toggle-${bill.id}`} 
                              className="text-xs cursor-pointer whitespace-nowrap"
                            >
                              HSA Eligible
                            </Label>
                            <Switch
                              id={`hsa-toggle-${bill.id}`}
                              checked={bill.is_hsa_eligible}
                              onCheckedChange={(checked) => toggleHSAEligibility(bill.id, bill.is_hsa_eligible, {} as any)}
                              onClick={(e) => toggleHSAEligibility(bill.id, bill.is_hsa_eligible, e)}
                            />
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
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Link Transaction Dialog */}
        <LinkTransactionDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          invoice={selectedBillForLinking}
          onSuccess={handleLinkSuccess}
        />
      </div>
    </div>
  );
};

export default Bills;
