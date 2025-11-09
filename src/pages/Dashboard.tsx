import { useState, useEffect } from "react";
import { BillReviewCard } from "@/components/bills/BillReviewCard";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, MessageCircle, DollarSign, FileText, TrendingUp, Wallet, LayoutDashboard, CreditCard } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { ProgressTracker } from "@/components/dashboard/ProgressTracker";
import { FriendlyStatsCards } from "@/components/dashboard/FriendlyStatsCards";
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
import { useDashboardLayout } from "@/contexts/DashboardLayoutContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureTooltip } from "@/components/onboarding/FeatureTooltip";
import { WelcomeDialog } from "@/components/onboarding/WelcomeDialog";
import { DashboardCustomization } from "@/components/dashboard/DashboardCustomization";
import { SortableCard } from "@/components/dashboard/SortableCard";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DashboardCompactHeader } from "@/components/dashboard/DashboardCompactHeader";
import { QuickActionBar } from "@/components/dashboard/QuickActionBar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { hasHSA, hsaOpenedDate, refreshHSAStatus } = useHSA();
  const onboarding = useOnboarding();
  const layout = useDashboardLayout();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showWelcome, setShowWelcome] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = layout.cardOrder.indexOf(active.id as string);
      const newIndex = layout.cardOrder.indexOf(over.id as string);
      
      const newOrder = [...layout.cardOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);
      
      layout.setCardOrder(newOrder);
    }
  };
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
        .select("*")
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
        .eq('review_status', 'pending')
        .order('analyzed_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      // Fetch error counts for each review
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

      setPendingReviews(reviewsWithCounts);
    } catch (error) {
      console.error("Failed to fetch bill reviews:", error);
    }
  };

  const fetchDisputeStats = async () => {
    setDisputeStats({
      recentWins: 0,
      totalSavings: 0,
    });
  };

  if (loading) {
    return (
      <AuthenticatedLayout unreviewedTransactions={0}>
        <DashboardSkeleton />
      </AuthenticatedLayout>
    );
  }

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

  // Show welcome dialog for first-time users
  useEffect(() => {
    if (!loading && !isNewUser && stats.expenseCount <= 3 && !onboarding.hasCompletedOnboarding) {
      const timer = setTimeout(() => setShowWelcome(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, isNewUser, stats.expenseCount, onboarding.hasCompletedOnboarding]);

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
        <div id="main-content" className="container mx-auto px-4 py-4 pb-24 md:pb-8 space-y-4">
          {!hsaOpenedDate && stats.expenseCount > 0 && <MissingHSADateBanner onDateSet={fetchStats} />}
          
          {isNewUser ? (
            <EmptyStateOnboarding />
          ) : (
            <>
              <DashboardCompactHeader firstName={firstName} stats={headerStats} />

              <WelcomeDialog
                open={showWelcome}
                onClose={() => {
                  setShowWelcome(false);
                  onboarding.completeOnboarding();
                }}
                firstName={firstName}
                hasHSA={hasHSA}
              />

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                  <TabsTrigger value="overview" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  
                  <FeatureTooltip
                    title="Bill Intelligence"
                    description="Upload medical bills to automatically detect errors, overcharges, and billing mistakes. We'll help you dispute incorrect charges."
                    show={activeTab === "bills" && !onboarding.hasSeenBillIntelligence}
                    onDismiss={() => onboarding.markAsSeen("hasSeenBillIntelligence")}
                    position="bottom"
                    ctaText="Upload First Bill"
                    onCtaClick={() => navigate("/bill-review")}
                  >
                    <TabsTrigger value="bills" className="gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Bill Intelligence</span>
                      {pendingReviews.length > 0 && (
                        <Badge variant="destructive" className="ml-1 h-5 px-1 text-xs">
                          {pendingReviews.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </FeatureTooltip>
                  
                  {hasHSA && (
                    <FeatureTooltip
                      title="HSA Optimization"
                      description="Track HSA-eligible expenses, calculate tax savings, and optimize when to claim reimbursements for maximum investment growth."
                      show={activeTab === "hsa" && !onboarding.hasSeenHSAFeatures}
                      onDismiss={() => onboarding.markAsSeen("hasSeenHSAFeatures")}
                      position="bottom"
                      ctaText="Learn More"
                      onCtaClick={() => navigate("/hsa-eligibility")}
                    >
                      <TabsTrigger value="hsa" className="gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="hidden sm:inline">HSA & Money</span>
                      </TabsTrigger>
                    </FeatureTooltip>
                  )}
                  
                  <FeatureTooltip
                    title="Smart Transaction Review"
                    description="Connect your bank to automatically import transactions, then categorize medical expenses with AI-powered suggestions."
                    show={activeTab === "transactions" && !onboarding.hasSeenTransactions}
                    onDismiss={() => onboarding.markAsSeen("hasSeenTransactions")}
                    position="bottom"
                    ctaText="Connect Bank"
                    onCtaClick={() => navigate("/bank-accounts")}
                  >
                    <TabsTrigger value="transactions" className="gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="hidden sm:inline">Transactions</span>
                      {stats.unreviewedTransactions > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                          {stats.unreviewedTransactions}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </FeatureTooltip>
                </TabsList>
                <DashboardCustomization currentTab={activeTab} hasHSA={hasHSA} />
              </div>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={layout.getVisibleCardsForCategory("overview")}
                      strategy={verticalListSortingStrategy}
                    >
                      {layout.isCardVisible("quick-actions") && (
                        <SortableCard id="quick-actions">
                          <QuickActionBar 
                            hasHSA={hasHSA} 
                            hsaClaimable={stats.hsaClaimableAmount}
                            unreviewedTransactions={stats.unreviewedTransactions}
                          />
                        </SortableCard>
                      )}

                      {layout.isCardVisible("value-spotlight") && (
                        <SortableCard id="value-spotlight">
                          <FeatureTooltip
                            title="Provider Directory"
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
                              onReviewClick={() => navigate("/bill-reviews")}
                              onDisputeClick={() => navigate("/disputes")}
                              onProviderClick={() => navigate("/providers")}
                            />
                          </FeatureTooltip>
                        </SortableCard>
                      )}
                    </SortableContext>
                  </DndContext>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">
                      {layout.isCardVisible("key-metrics") && (
                        <SortableCard id="key-metrics">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Key Metrics</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <FriendlyStatsCards
                                taxSavings={stats.taxSavings}
                                hsaClaimable={stats.hsaClaimableAmount}
                                rewardsEarned={stats.rewardsEarned}
                                totalExpenses={stats.totalExpenses}
                                disputeSavings={stats.disputeSavings}
                                hasHSA={hasHSA}
                              />
                            </CardContent>
                          </Card>
                        </SortableCard>
                      )}

                      {layout.isCardVisible("recent-bills") && recentExpenses.length > 0 && (
                        <SortableCard id="recent-bills">
                          <ActionCard
                          icon="🏥"
                          title="Recent Medical Bills"
                          count={recentExpenses.length}
                          actions={
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate("/invoices")}
                            >
                              View All
                            </Button>
                          }
                          buttonText="Show recent bills"
                        >
                          <div className="space-y-3">
                            {recentExpenses.slice(0, 3).map((expense) => (
                              <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
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
                        </SortableCard>
                      )}
                    </div>

                    <div className="space-y-4">
                      {layout.isCardVisible("progress-tracker") && (
                        <SortableCard id="progress-tracker">
                          <ProgressTracker steps={progressSteps} />
                        </SortableCard>
                      )}
                      {layout.isCardVisible("wellbie-tip") && (
                        <SortableCard id="wellbie-tip">
                          <WellbieTip 
                            unreviewedCount={stats.unreviewedTransactions}
                            hasExpenses={stats.expenseCount > 0}
                          />
                        </SortableCard>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Bill Intelligence Tab */}
                <TabsContent value="bills" className="space-y-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={layout.getVisibleCardsForCategory("bills")}
                      strategy={verticalListSortingStrategy}
                    >
                      {layout.isCardVisible("pending-reviews") && pendingReviews.length > 0 && (
                        <SortableCard id="pending-reviews">
                          <ActionCard
                      icon="🔍"
                      title="Bills Requiring Review"
                      count={pendingReviews.length}
                      buttonText="View All Reviews"
                      actions={
                        <Button onClick={() => navigate("/bill-reviews")}>
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
                        </SortableCard>
                      )}

                      {layout.isCardVisible("pending-reviews") && pendingReviews.length === 0 && (
                        <SortableCard id="pending-reviews">
                          <Card>
                            <CardHeader>
                              <CardTitle>No Bills to Review</CardTitle>
                              <CardDescription>Upload a medical bill to get started with error detection</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Button onClick={() => navigate("/bill-review")}>
                                Upload First Bill
                              </Button>
                            </CardContent>
                          </Card>
                        </SortableCard>
                      )}
                    </SortableContext>
                  </DndContext>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {layout.isCardVisible("active-disputes") && (
                      <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span>⚖️</span>
                          Active Disputes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          Track your dispute progress and potential savings
                        </p>
                        <Button variant="outline" onClick={() => navigate("/disputes")} className="w-full">
                          View Disputes
                        </Button>
                      </CardContent>
                      </Card>
                    )}

                    {layout.isCardVisible("provider-insights") && (
                      <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span>🏥</span>
                          Provider Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          Check billing accuracy before your next visit
                        </p>
                        <Button variant="outline" onClick={() => navigate("/providers")} className="w-full">
                          View Providers
                        </Button>
                      </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* HSA & Money Tab */}
                {hasHSA && (
                  <TabsContent value="hsa" className="space-y-4">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={layout.getVisibleCardsForCategory("hsa")}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {layout.isCardVisible("hsa-claimable") && (
                            <SortableCard id="hsa-claimable">
                              <Card className="bg-success/5 border-success/20">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Available to Claim
                          </CardTitle>
                        </CardHeader>
                                <CardContent>
                                  <p className="text-3xl font-bold text-success">${stats.hsaClaimableAmount.toFixed(2)}</p>
                                  <p className="text-sm text-muted-foreground mt-1">From eligible expenses</p>
                                </CardContent>
                              </Card>
                            </SortableCard>
                          )}

                          {layout.isCardVisible("hsa-tax-savings") && (
                            <SortableCard id="hsa-tax-savings">
                              <Card className="bg-accent/5 border-accent/20">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Tax Savings
                          </CardTitle>
                        </CardHeader>
                                <CardContent>
                                  <p className="text-3xl font-bold text-accent">${stats.taxSavings.toFixed(2)}</p>
                                  <p className="text-sm text-muted-foreground mt-1">This quarter</p>
                                </CardContent>
                              </Card>
                            </SortableCard>
                          )}
                        </div>

                        {layout.isCardVisible("reimbursement-requests") && stats.hsaClaimableAmount > 0 && (
                          <SortableCard id="reimbursement-requests">
                            <ActionCard
                        icon="💰"
                        title="Money You Can Claim from HSA"
                        buttonText="Show all reimbursement requests"
                        actions={
                          <Button onClick={() => navigate("/hsa-reimbursement")}>
                            Create Request
                          </Button>
                        }
                        defaultOpen={true}
                      >
                        <div className="space-y-3">
                          <div className="bg-primary/5 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground mb-1">Available to Claim</p>
                            <p className="text-2xl font-bold text-primary">
                              ${stats.hsaClaimableAmount.toFixed(2)}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            💡 These are expenses you paid out-of-pocket that you can now reimburse from your HSA
                              </p>
                            </div>
                          </ActionCard>
                          </SortableCard>
                        )}

                        {layout.isCardVisible("reimbursement-requests") && (
                          <SortableCard id="reimbursement-requests">
                            <ActionCard
                      icon="📋"
                      title="Reimbursement Requests"
                      count={reimbursementRequests.length}
                      actions={
                        <Button onClick={() => navigate("/reimbursement-requests")}>
                          View All
                        </Button>
                      }
                      buttonText="Show requests"
                    >
                      {reimbursementRequests.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No reimbursement requests yet. Create your first one!
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {reimbursementRequests.map((request) => (
                            <div
                              key={request.id}
                              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold">${Number(request.total_amount).toFixed(2)}</p>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    request.status === 'completed' 
                                      ? 'bg-green-500/10 text-green-600' 
                                      : request.status === 'submitted'
                                      ? 'bg-blue-500/10 text-blue-600'
                                      : 'bg-amber-500/10 text-amber-600'
                                  }`}>
                                    {request.status}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(request.created_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/reimbursement-details/${request.id}`)}
                              >
                                View
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ActionCard>

                    {vaultedExpenses > 0 && (
                      <ActionCard
                        icon="💎"
                        title="Investment Vault"
                        count={vaultedExpenses}
                        actions={
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigate("/vault-tracker")}
                          >
                            View Vault
                          </Button>
                        }
                      >
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Track expenses held for long-term HSA investment growth
                              </p>
                            </div>
                          </ActionCard>
                          </SortableCard>
                        )}

                        {layout.isCardVisible("hsa-eligibility") && (
                          <SortableCard id="hsa-eligibility">
                            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          HSA Eligibility Reference
                        </CardTitle>
                        <CardDescription>
                          Common HSA-eligible expenses at a glance
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Not sure if an expense qualifies for HSA reimbursement? Browse our comprehensive reference guide or ask Wellbie for personalized help.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            onClick={() => navigate("/hsa-eligibility")}
                            className="flex-1"
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Browse Guide
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('openWellbieChat'));
                            }}
                            className="flex-1"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Ask Wellbie
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                          </SortableCard>
                        )}
                      </SortableContext>
                    </DndContext>
                  </TabsContent>
                )}

                {/* Transactions Tab */}
                <TabsContent value="transactions" className="space-y-4">
                  {stats.unreviewedTransactions > 0 ? (
                    <ActionCard
                      icon="📋"
                      title="Transactions Need Review"
                      count={stats.unreviewedTransactions}
                      defaultOpen={true}
                      actions={
                        <Button onClick={() => navigate("/transactions")}>
                          Review All
                        </Button>
                      }
                    >
                      <div className="space-y-2">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {stats.unreviewedTransactions} transaction{stats.unreviewedTransactions !== 1 ? 's' : ''} waiting for your review
                          </AlertDescription>
                        </Alert>
                        <p className="text-sm text-muted-foreground">
                          Review and categorize your transactions to track healthcare expenses accurately
                        </p>
                        <Button 
                          className="w-full mt-2"
                          onClick={() => navigate("/transactions?tab=review")}
                        >
                          Review {stats.unreviewedTransactions} Transaction{stats.unreviewedTransactions === 1 ? '' : 's'}
                            </Button>
                          </div>
                        </ActionCard>
                        </SortableCard>
                      )}

                      {layout.isCardVisible("transactions-review") && stats.unreviewedTransactions === 0 && (
                        <SortableCard id="transactions-review">
                          <Card>
                            <CardHeader>
                              <CardTitle>All Caught Up! 🎉</CardTitle>
                              <CardDescription>No transactions need review at the moment</CardDescription>
                            </CardHeader>
                          </Card>
                        </SortableCard>
                      )}
                    </SortableContext>
                  </DndContext>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {layout.isCardVisible("bank-connections") && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            Bank Connections
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Status:</span>
                              <Badge variant={hasConnectedBank ? "success" : "secondary"}>
                                {hasConnectedBank ? "Connected" : "Not Connected"}
                              </Badge>
                            </div>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => navigate("/bank-accounts")}
                            >
                              Manage Connections
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {layout.isCardVisible("recent-expenses") && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Recent Expenses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">
                            {recentExpenses.length > 0 
                              ? `${recentExpenses.length} recent expenses tracked`
                              : "No expenses tracked yet"}
                          </p>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => navigate("/expenses")}
                          >
                            View All Expenses
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </AuthenticatedLayout>
    </ErrorBoundary>
  );
};

export default Dashboard;
