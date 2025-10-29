import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";
import { AuthenticatedNav } from "@/components/AuthenticatedNav";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProgressTracker } from "@/components/dashboard/ProgressTracker";
import { FriendlyStatsCards } from "@/components/dashboard/FriendlyStatsCards";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { WellbieTip } from "@/components/dashboard/WellbieTip";
import { EmptyStateOnboarding } from "@/components/dashboard/EmptyStateOnboarding";
import { MissingHSADateBanner } from "@/components/dashboard/MissingHSADateBanner";
import { getNextAction } from "@/lib/dashboardActions";
import { calculateProgress, getProgressSteps } from "@/lib/userProgress";
import { calculateVaultSummary } from "@/lib/vaultCalculations";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    taxSavings: 0,
    rewardsEarned: 0,
    expenseCount: 0,
    unreviewedTransactions: 0,
    hsaClaimableAmount: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [reimbursementRequests, setReimbursementRequests] = useState<any[]>([]);
  const [hasConnectedBank, setHasConnectedBank] = useState(false);
  const [hsaOpenedDate, setHsaOpenedDate] = useState<string | null>(null);

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
    checkBankConnection();

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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("hsa_opened_date")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) console.warn("No profile row or error fetching profile", profileError);
      setHsaOpenedDate(profile?.hsa_opened_date || null);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate user progress
  const userProgress = calculateProgress(
    hasConnectedBank,
    stats.expenseCount,
    stats.unreviewedTransactions,
    reimbursementRequests.length
  );
  const progressSteps = getProgressSteps(userProgress);

  // Get next action
  const nextAction = getNextAction({
    unreviewedTransactions: stats.unreviewedTransactions,
    expenseCount: stats.expenseCount,
    hsaClaimableAmount: stats.hsaClaimableAmount,
    hasConnectedBank
  });

  // Check if this is a new user with no data
  const isNewUser = stats.expenseCount === 0 && recentExpenses.length === 0 && !hasConnectedBank;

  // Get user's first name
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNav unreviewedTransactions={stats.unreviewedTransactions} />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {!hsaOpenedDate && stats.expenseCount > 0 && <MissingHSADateBanner onDateSet={fetchStats} />}
        
        {isNewUser ? (
          <EmptyStateOnboarding />
        ) : (
          <>
            <DashboardHeader firstName={firstName} primaryAction={nextAction} />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <FriendlyStatsCards 
                  taxSavings={stats.taxSavings}
                  hsaClaimable={stats.hsaClaimableAmount}
                  rewardsEarned={stats.rewardsEarned}
                />

                {stats.hsaClaimableAmount > 0 && (
                  <ActionCard
                    icon="💵"
                    title="Money You Can Claim from HSA"
                    actions={
                      <Button onClick={() => navigate("/hsa-reimbursement")}>
                        Create Request
                      </Button>
                    }
                  >
                    <div className="space-y-4">
                      <div className="text-center py-6 bg-primary/5 rounded-lg">
                        <p className="text-lg font-semibold mb-2">
                          You have ${stats.hsaClaimableAmount.toFixed(2)} ready to reimburse!
                        </p>
                        <p className="text-sm text-muted-foreground">
                          This gets you your money back 💰
                        </p>
                      </div>
                    </div>
                  </ActionCard>
                )}

                {stats.unreviewedTransactions > 0 && (
                  <ActionCard
                    icon="📋"
                    title="Things to Review"
                    count={stats.unreviewedTransactions}
                    defaultOpen={true}
                  >
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Review your recent transactions to categorize medical expenses
                      </p>
                      <Button 
                        className="w-full"
                        onClick={() => navigate("/transactions?tab=review")}
                      >
                        Review {stats.unreviewedTransactions} Transaction{stats.unreviewedTransactions === 1 ? '' : 's'}
                      </Button>
                    </div>
                  </ActionCard>
                )}

                {recentExpenses.filter(e => e.reimbursement_strategy === 'vault' || e.reimbursement_strategy === 'medium').length > 0 && (
                  <ActionCard
                    icon="💎"
                    title="Investment Vault"
                    count={recentExpenses.filter(e => e.reimbursement_strategy === 'vault' || e.reimbursement_strategy === 'medium').length}
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
                )}

                {recentExpenses.length > 0 && (
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
                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => navigate("/expenses/new")}
                      >
                        + Add another bill
                      </Button>
                    </div>
                  </ActionCard>
                )}
              </div>

              <div className="space-y-6">
                <ProgressTracker steps={progressSteps} />
                <WellbieTip 
                  unreviewedCount={stats.unreviewedTransactions}
                  hasExpenses={stats.expenseCount > 0}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
