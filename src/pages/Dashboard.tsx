import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, LogOut, DollarSign, TrendingUp, CreditCard, FileText, BarChart3, Wallet, Plus, Bell } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    taxSavings: 0,
    rewardsEarned: 0,
    expenseCount: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [reimbursementRequests, setReimbursementRequests] = useState<any[]>([]);

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
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const hsaExpenses = expenses?.filter(exp => exp.is_hsa_eligible)
        .reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      
      const taxSavings = hsaExpenses * 0.3;
      const rewardsEarned = totalExpenses * 0.02;

      setStats({
        totalExpenses,
        taxSavings,
        rewardsEarned,
        expenseCount: expenses?.length || 0,
      });

      setRecentExpenses(expenses?.slice(0, 5) || []);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
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

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
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
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-2">
            <button 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Heart className="h-5 w-5 fill-current" />
              </div>
              <span className="text-lg md:text-xl font-bold whitespace-nowrap">HSA Buddy</span>
            </button>
            
            <div className="flex items-center gap-1 md:gap-2">
              <div className="hidden lg:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/analytics")}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/budget-alerts")}>
                  <Bell className="h-4 w-4 mr-2" />
                  Budgets
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/payment-methods")}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Payment Methods
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/reimbursement-requests")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Requests
                </Button>
              </div>
              <Button className="hidden sm:flex" variant="default" size="sm" onClick={() => navigate("/expenses/new")}>
                Add Expense
              </Button>
              <Button className="sm:hidden" variant="default" size="icon" onClick={() => navigate("/expenses/new")}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your expenses and maximize your HSA savings
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.expenseCount} {stats.expenseCount === 1 ? "expense" : "expenses"} tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tax Savings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.taxSavings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Estimated savings from HSA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewards Earned</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.rewardsEarned.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Estimated from payment rewards
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>
                  {recentExpenses.length > 0 ? "Your latest tracked expenses" : "You haven't tracked any expenses yet"}
                </CardDescription>
              </div>
              {recentExpenses.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate("/expenses")}>
                    View All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/hsa-reimbursement")}>
                    <FileText className="mr-2 h-4 w-4" />
                    HSA Reimbursement
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Start tracking expenses to see your savings potential
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate("/expenses/new")}>
                    Add Your First Expense
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/hsa-reimbursement")}>
                    <FileText className="mr-2 h-4 w-4" />
                    HSA Reimbursement
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{expense.vendor}</p>
                        {expense.is_hsa_eligible && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">HSA</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {expense.category} • {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-semibold">${Number(expense.amount).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Reimbursement Requests</CardTitle>
                <CardDescription>
                  {reimbursementRequests.length > 0 ? "Track your HSA reimbursement submissions" : "No reimbursement requests yet"}
                </CardDescription>
              </div>
              {reimbursementRequests.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate("/reimbursement-requests")}>
                    View All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/hsa-reimbursement")}>
                    New Request
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {reimbursementRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Create your first HSA reimbursement request
                </p>
                <Button onClick={() => navigate("/hsa-reimbursement")}>
                  Create Reimbursement Request
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {reimbursementRequests.map((request) => (
                  <div 
                    key={request.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/reimbursement/${request.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{request.hsa_provider || "HSA Provider"}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          request.status === 'submitted' ? 'bg-primary/10 text-primary' :
                          request.status === 'approved' ? 'bg-green-500/10 text-green-600' :
                          request.status === 'paid' ? 'bg-blue-500/10 text-blue-600' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-semibold">${Number(request.total_amount).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
