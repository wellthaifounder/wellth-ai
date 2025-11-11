import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, AlertTriangle, Loader2, FileText, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { calculateHSAEligibility } from "@/lib/hsaCalculations";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { BillsHeroMetrics } from "@/components/bills/BillsHeroMetrics";
import { BillReviewCard } from "@/components/bills/BillReviewCard";
import { DisputeAnalyticsDashboard } from "@/components/bills/DisputeAnalyticsDashboard";

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

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const, icon: FileText },
  submitted: { label: "Submitted", variant: "default" as const, icon: Clock },
  provider_reviewing: { label: "Under Review", variant: "default" as const, icon: Clock },
  awaiting_response: { label: "Awaiting Response", variant: "outline" as const, icon: Clock },
  resolved_favorable: { label: "Resolved - Favorable", variant: "default" as const, icon: CheckCircle2 },
  resolved_unfavorable: { label: "Resolved - Unfavorable", variant: "destructive" as const, icon: Clock },
  withdrawn: { label: "Withdrawn", variant: "secondary" as const, icon: FileText }
};

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
          ),
          bill_reviews (
            id,
            review_status,
            total_potential_savings,
            confidence_score
          )
        `)
        .eq('user_id', user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as BillWithReview[];
    }
  });

  // Fetch reviews data
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['bill-reviews-list'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: reviews, error } = await supabase
        .from('bill_reviews')
        .select(`
          *,
          invoices (
            vendor,
            amount
          )
        `)
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false });

      if (error) throw error;

      const reviewsWithCounts = await Promise.all(
        (reviews || []).map(async (review) => {
          const { data: errors } = await supabase
            .from('bill_errors')
            .select('id')
            .eq('bill_review_id', review.id)
            .eq('status', 'identified');

          return {
            ...review,
            errorCount: errors?.length || 0
          };
        })
      );

      return reviewsWithCounts;
    }
  });

  // Fetch disputes data
  const { data: disputes, isLoading: disputesLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bill_disputes')
        .select(`
          *,
          invoices (
            vendor,
            amount
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

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

  const pendingReviews = reviewsData?.filter(r => r.review_status === 'pending') || [];
  const activeDisputes = disputes?.filter(d => 
    !['resolved_favorable', 'resolved_unfavorable', 'withdrawn'].includes(d.dispute_status)
  ) || [];
  const resolvedItems = [
    ...(reviewsData?.filter(r => r.review_status === 'resolved') || []).map(r => ({ ...r, type: 'review' })),
    ...(disputes?.filter(d => ['resolved_favorable', 'resolved_unfavorable', 'withdrawn'].includes(d.dispute_status)) || []).map(d => ({ ...d, type: 'dispute' }))
  ];

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

  const DisputeCard = ({ dispute }: { dispute: any }) => {
    const config = statusConfig[dispute.dispute_status as keyof typeof statusConfig];
    const StatusIcon = config.icon;

    return (
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate(`/disputes/${dispute.id}`)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{dispute.provider_name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Created {format(new Date(dispute.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <Badge variant={config.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Original Amount</p>
              <p className="text-lg font-semibold">${dispute.original_amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disputed Amount</p>
              <p className="text-lg font-semibold text-orange-500">
                ${dispute.disputed_amount.toFixed(2)}
              </p>
            </div>
          </div>

          {dispute.savings_achieved && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">Savings Achieved</p>
              <p className="text-xl font-bold text-green-600">
                ${dispute.savings_achieved.toFixed(2)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (billsLoading || reviewsLoading || disputesLoading) {
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
            Upload, track, and manage your medical bills with AI-powered error detection
          </p>
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">AI-Powered Bill Review</p>
              <p className="text-sm text-muted-foreground">
                Upload medical bills or EOBs to automatically trigger AI analysis for potential errors and overcharges.
              </p>
            </div>
          </div>
        </div>

        {/* Hero Metrics */}
        <BillsHeroMetrics
          totalBilled={aggregateStats.totalInvoiced}
          paidViaHSA={aggregateStats.totalPaidHSA}
          paidOther={aggregateStats.totalPaidOther}
          unpaidBalance={aggregateStats.totalUnpaid}
        />

        {/* Tabbed Interface */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All Bills ({filteredBills.length})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Pending Reviews ({pendingReviews.length})
            </TabsTrigger>
            <TabsTrigger value="disputes">
              Active Disputes ({activeDisputes.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedItems.length})
            </TabsTrigger>
          </TabsList>

          {/* All Bills Tab */}
          <TabsContent value="all" className="space-y-4 mt-6">
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
          </TabsContent>

          {/* Pending Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4 mt-6">
            {pendingReviews.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Reviews</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any pending bill reviews at the moment
                </p>
                <Button onClick={() => navigate('/bills/new')}>
                  Add New Bill
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingReviews.map(review => (
                  <BillReviewCard 
                    key={review.id} 
                    review={review as any} 
                    errorCount={review.errorCount}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Active Disputes Tab */}
          <TabsContent value="disputes" className="space-y-4 mt-6">
            <DisputeAnalyticsDashboard disputes={disputes || []} isLoading={disputesLoading} />
            
            {activeDisputes.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Disputes</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any active disputes at the moment
                </p>
                <Button onClick={() => navigate('/bills/new')}>
                  Add New Bill
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeDisputes.map(dispute => (
                  <DisputeCard key={dispute.id} dispute={dispute} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Resolved Tab */}
          <TabsContent value="resolved" className="space-y-4 mt-6">
            {resolvedItems.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Resolved Items</h3>
                <p className="text-muted-foreground">
                  You haven't resolved any reviews or disputes yet
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {resolvedItems.map((item: any) => (
                  item.type === 'review' ? (
                    <BillReviewCard 
                      key={item.id} 
                      review={item as any} 
                      errorCount={item.errorCount}
                    />
                  ) : (
                    <DisputeCard key={item.id} dispute={item} />
                  )
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
};

export default Bills;