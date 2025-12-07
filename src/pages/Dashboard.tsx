import { useState, useEffect } from "react";
import { BillReviewCard } from "@/components/bills/BillReviewCard";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/lib/analytics";
import { logError } from "@/utils/errorHandler";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { ProgressTracker } from "@/components/dashboard/ProgressTracker";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { WellbieTip } from "@/components/dashboard/WellbieTip";
import { EmptyStateOnboarding } from "@/components/dashboard/EmptyStateOnboarding";
import { MissingHSADateBanner } from "@/components/dashboard/MissingHSADateBanner";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getNextAction } from "@/lib/dashboardActions";
import { calculateProgress, getProgressSteps } from "@/lib/userProgress";
import { ValueSpotlight } from "@/components/dashboard/ValueSpotlight";
import { useHSA } from "@/contexts/HSAContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { FeatureTooltip } from "@/components/onboarding/FeatureTooltip";
import { WelcomeDialog } from "@/components/onboarding/WelcomeDialog";
import { QuickActionBar } from "@/components/dashboard/QuickActionBar";
import { HSAAccountPerformance } from "@/components/dashboard/HSAAccountPerformance";

const Dashboard = () => {
  const navigate = useNavigate();
  const { hasHSA, hsaOpenedDate } = useHSA();
  const onboarding = useOnboarding();
  const [user, setUser] = useState<User | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    taxSavings: 0,
    rewardsEarned: 0,
    expenseCount: 0,
    unreviewedTransactions: 0,
    hsaClaimableAmount: 0,
    disputeSavings: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [reimbursementRequests, setReimbursementRequests] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [hasConnectedBank, setHasConnectedBank] = useState(false);
  const [disputeStats, setDisputeStats] = useState({
    recentWins: 0,
    totalSavings: 0,
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      setLoading(false);
    };

    checkUser();
    fetchStats();
    fetchReimbursementRequests();
    fetchTransactionStats();
    fetchBillReviews();
    checkBankConnection();
    fetchDisputeStats();
    analytics.pageView('/dashboard');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("id, amount, is_hsa_eligible, invoice_date, date")
        .order("date", { ascending: false });

      if (error) throw error;

      const totalInvoiced = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
      const hsaEligible = invoices?.filter(inv => inv.is_hsa_eligible)
        .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
      
      // Calculate HSA claimable amount (HSA-eligible expenses that haven't been reimbursed)
      const { data: reimbursedInvoices } = await supabase
        .from("reimbursement_items")
        .select("invoice_id");
      
      const reimbursedIds = new Set(reimbursedInvoices?.map(r => r.invoice_id) || []);
      const hsaClaimable = invoices
        ?.filter(inv => {
          if (!inv.is_hsa_eligible || reimbursedIds.has(inv.id)) return false;
          if (hsaOpenedDate) {
            const rawDate = inv.invoice_date || inv.date;
            if (!rawDate) return false;
            const invoiceDate = new Date(rawDate);
            const hsaDate = new Date(hsaOpenedDate);
            return !isNaN(invoiceDate.getTime()) && invoiceDate >= hsaDate;
          }
          return true;
        })
        .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
      
      const taxSavings = hsaEligible * 0.3;
      const rewardsEarned = totalInvoiced * 0.02;

      setStats(prev => ({
        ...prev,
        totalExpenses: totalInvoiced,
        taxSavings,
        rewardsEarned,
        expenseCount: invoices?.length || 0,
        hsaClaimableAmount: hsaClaimable,
        disputeSavings: 0,
      }));

      setRecentExpenses(invoices?.slice(0, 5) || []);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const checkBankConnection = async () => {
    try {
      const { data: accounts, error } = await supabase
        .from("plaid_connections")
        .select("id")
        .limit(1);

      if (error) throw error;
      setHasConnectedBank((accounts?.length || 0) > 0);
    } catch (error) {
      console.error("Failed to check bank connection:", error);
    }
  };

  const fetchReimbursementRequests = async () => {
    try {
      const { data: requests, error } = await supabase
        .from("reimbursement_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setReimbursementRequests(requests || []);
    } catch (error) {
      console.error("Failed to fetch reimbursement requests:", error);
    }
  };

  const fetchTransactionStats = async () => {
    try {
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("reconciliation_status")
        .eq("reconciliation_status", "unlinked");

      if (error) throw error;
      setStats(prev => ({
        ...prev,
        unreviewedTransactions: transactions?.length || 0
      }));
    } catch (error) {
      console.error("Failed to fetch transaction stats:", error);
    }
  };

  const fetchBillReviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch pending reviews with error counts in a single efficient query
      const { data: reviews, error } = await supabase
        .from('bill_reviews')
        .select(`
          *,
          invoices (
            vendor,
            amount
          ),
          bill_errors!bill_review_id(id, status)
        `)
        .eq('user_id', user.id)
        .eq('review_status', 'pending')
        .order('analyzed_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      // Count identified errors from the joined data (no additional queries!)
      const reviewsWithCounts = (reviews || []).map((review: any) => {
        const identifiedErrors = (review.bill_errors || []).filter(
          (err: any) => err.status === 'identified'
        );

        return {
          ...review,
          errorCount: identifiedErrors.length,
          // Remove the raw bill_errors array to keep interface clean
          bill_errors: undefined
        };
      });

      setPendingReviews(reviewsWithCounts);
    } catch (error) {
      logError("Failed to fetch bill reviews", error);
    }
  };

  const fetchDisputeStats = async () => {
    setDisputeStats({
      recentWins: 0,
      totalSavings: 0,
    });
  };

  // Calculate derived values before early returns
  const userProgress = calculateProgress(
    hasConnectedBank,
    stats.expenseCount,
    stats.unreviewedTransactions,
    reimbursementRequests.length
  );
  const progressSteps = getProgressSteps(userProgress);

  const nextAction = getNextAction({
    unreviewedTransactions: stats.unreviewedTransactions,
    expenseCount: stats.expenseCount,
    hsaClaimableAmount: stats.hsaClaimableAmount,
    hasConnectedBank
  });

  const isNewUser = stats.expenseCount === 0 && recentExpenses.length === 0 && !hasConnectedBank;
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  // Show welcome dialog for first-time users - MUST be before early returns
  useEffect(() => {
    if (!loading && !isNewUser && stats.expenseCount <= 3 && !onboarding.hasCompletedOnboarding) {
      const timer = setTimeout(() => setShowWelcome(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, isNewUser, stats.expenseCount, onboarding.hasCompletedOnboarding]);

  if (loading) {
    return (
      <AuthenticatedLayout unreviewedTransactions={0}>
        <DashboardSkeleton />
      </AuthenticatedLayout>
    );
  }

  // Prepare compact header stats
  const headerStats = hasHSA 
    ? [
        { icon: "💰", value: `$${stats.hsaClaimableAmount.toFixed(0)}`, label: "Claimable", variant: "success" as const },
        { icon: "💸", value: `$${stats.taxSavings.toFixed(0)}`, label: "Tax Savings", variant: "accent" as const },
        { icon: "🏆", value: `$${stats.rewardsEarned.toFixed(0)}`, label: "Rewards", variant: "info" as const },
      ]
    : [
        { icon: "📊", value: `$${stats.totalExpenses.toFixed(0)}`, label: "Tracked", variant: "default" as const },
        { icon: "🎉", value: `$${stats.disputeSavings.toFixed(0)}`, label: "Saved", variant: "success" as const },
        { icon: "🏆", value: `$${stats.rewardsEarned.toFixed(0)}`, label: "Rewards", variant: "info" as const },
      ];

  const vaultedExpenses = recentExpenses.filter(e => e.reimbursement_strategy === 'vault' || e.reimbursement_strategy === 'medium').length;

  return (
    <ErrorBoundary
      fallbackTitle="Dashboard Error"
      fallbackDescription="We encountered an error loading your dashboard. Your data is safe. Please try again."
      onReset={() => window.location.reload()}
    >
      <AuthenticatedLayout unreviewedTransactions={stats.unreviewedTransactions}>
        <div id="main-content" className="container mx-auto max-w-7xl px-4 py-4 md:py-6 pb-8 md:pb-12 space-y-6">
          {!hsaOpenedDate && stats.expenseCount > 0 && <MissingHSADateBanner onDateSet={fetchStats} />}
          
          {isNewUser ? (
            <EmptyStateOnboarding />
          ) : (
            <>
              <WelcomeDialog
                open={showWelcome}
                onClose={() => {
                  setShowWelcome(false);
                  onboarding.completeOnboarding();
                }}
                firstName={firstName}
                hasHSA={hasHSA}
              />

              {/* Simplified Single-Page Dashboard */}
              <div className="space-y-4">
              {/* Welcome Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">Welcome back, {firstName}! 👋</h1>
                  <p className="text-muted-foreground mt-1">Here's what needs your attention</p>
                </div>
                <Button onClick={() => navigate("/reports")} variant="outline" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  View Reports
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="text-2xl font-bold">${stats.totalExpenses.toFixed(0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total Tracked</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="text-2xl font-bold text-green-600">${stats.disputeSavings.toFixed(0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Saved</p>
                  </CardContent>
                </Card>
                {hasHSA && (
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl font-bold text-primary">${stats.hsaClaimableAmount.toFixed(0)}</div>
                      <p className="text-xs text-muted-foreground mt-1">HSA Claimable</p>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="text-2xl font-bold text-amber-600">${stats.rewardsEarned.toFixed(0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Rewards Earned</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <QuickActionBar 
                hasHSA={hasHSA} 
                hsaClaimable={stats.hsaClaimableAmount}
                unreviewedTransactions={stats.unreviewedTransactions}
              />

              {/* HSA Account Performance */}
              {hasHSA && <HSAAccountPerformance />}

              {/* Value Spotlight */}
              <FeatureTooltip
                title="Provider Ratings"
                description="Check billing accuracy scores and dispute success rates for healthcare providers before scheduling your next appointment."
                show={!onboarding.hasSeenProviderDirectory && stats.expenseCount >= 2}
                onDismiss={() => onboarding.markAsSeen("hasSeenProviderDirectory")}
                position="top"
                ctaText="Browse Providers"
                onCtaClick={() => navigate("/providers")}
              >
                <ValueSpotlight
                  pendingReviews={pendingReviews.length}
                  totalPotentialSavings={0}
                  recentDisputeWins={disputeStats.recentWins}
                  disputeSavings={disputeStats.totalSavings}
                  onReviewClick={() => navigate("/bills")}
                  onDisputeClick={() => navigate("/bills")}
                  onProviderClick={() => navigate("/providers")}
                />
              </FeatureTooltip>

              {/* Recent Bills */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  {recentExpenses.length > 0 && (
                    <ActionCard
                      icon="🏥"
                      title="Recent Medical Bills"
                      count={recentExpenses.length}
                      actions={
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate("/bills")}
                        >
                          View All
                        </Button>
                      }
                      buttonText="Show recent bills"
                    >
                      <div className="space-y-3">
                        {recentExpenses.slice(0, 3).map((expense) => (
                          <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate(`/bills/${expense.id}`)}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{expense.vendor}</p>
                                {(() => {
                                  const rawDate = expense.invoice_date || expense.date;
                                  const eligibleAfter = expense.is_hsa_eligible && (!hsaOpenedDate || (rawDate && new Date(rawDate) >= new Date(hsaOpenedDate)));
                                  return eligibleAfter ? (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                      HSA-eligible ✓
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(expense.date).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="font-semibold">${Number(expense.amount).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </ActionCard>
                  )}

                  {/* Pending Reviews */}
                  {pendingReviews.length > 0 && (
                    <ActionCard
                      icon="🔍"
                      title="Bills Requiring Review"
                      count={pendingReviews.length}
                      buttonText="View All Reviews"
                      actions={
                        <Button onClick={() => navigate("/bills")}>
                          View All
                        </Button>
                      }
                      defaultOpen={true}
                    >
                      <div className="space-y-3">
                        {pendingReviews.map((review) => (
                          <BillReviewCard 
                            key={review.id}
                            review={review}
                            errorCount={review.errorCount}
                          />
                        ))}
                      </div>
                    </ActionCard>
                  )}
                </div>

                {/* Side Cards */}
                <div className="space-y-4">
                  <ProgressTracker steps={progressSteps} />
                  <WellbieTip 
                    unreviewedCount={stats.unreviewedTransactions}
                    hasExpenses={stats.expenseCount > 0}
                  />
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </AuthenticatedLayout>
    </ErrorBoundary>
  );
};

export default Dashboard;
