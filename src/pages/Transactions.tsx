import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Plus, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TransactionCard } from "@/components/transactions/TransactionCard";
import { TransactionDetailDialog } from "@/components/transactions/TransactionDetailDialog";
import { TransactionInlineDetail } from "@/components/transactions/TransactionInlineDetail";
import { QuickAddTransactionDialog } from "@/components/transactions/QuickAddTransactionDialog";
import { ReviewQueue } from "@/components/transactions/ReviewQueue";
import { AdvancedFilters, type FilterCriteria } from "@/components/transactions/AdvancedFilters";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { MissingHSADateBanner } from "@/components/dashboard/MissingHSADateBanner";
import { TransactionsSkeleton } from "@/components/skeletons/TransactionsSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

type Transaction = {
  id: string;
  transaction_date: string;
  vendor: string | null;
  amount: number;
  description: string;
  category: string;
  is_medical: boolean;
  reconciliation_status: string;
  is_hsa_eligible: boolean;
  notes: string | null;
  payment_method_id: string | null;
  invoice_id: string | null;
  payment_methods?: {
    is_hsa_account: boolean;
  } | null;
};

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [advancedFilters, setAdvancedFilters] = useState<FilterCriteria>({});
  const [hsaOpenedDate, setHsaOpenedDate] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchHSADate();
  }, []);

  const fetchHSADate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("hsa_opened_date")
        .eq("id", user.id)
        .maybeSingle();

      if (error) console.warn("No profile found or error fetching profile", error);
      setHsaOpenedDate(profile?.hsa_opened_date || null);
    } catch (e) {
      console.error("fetchHSADate failed", e);
      setHsaOpenedDate(null);
    }
  };

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, activeTab, advancedFilters]);

  useEffect(() => {
    // Default to review queue if there are unlinked transactions
    if (transactions.length > 0 && activeTab === "all") {
      const unlinkedCount = transactions.filter(t => t.reconciliation_status === "unlinked").length;
      if (unlinkedCount > 0) {
        setActiveTab("review");
      }
    }
  }, [transactions]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchTransactions();
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          payment_methods (
            is_hsa_account
          )
        `)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by tab
    if (activeTab === "medical") {
      filtered = filtered.filter((t) => t.is_medical);
    } else if (activeTab === "non-medical") {
      filtered = filtered.filter((t) => t.is_medical === false);
    } else if (activeTab === "all") {
      // Show all transactions including ignored ones
      // No filtering needed
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.vendor?.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.amount.toString().includes(query)
      );
    }

    // Apply advanced filters
    if (advancedFilters.amountOperator) {
      const { amountOperator, amountMin, amountMax } = advancedFilters;
      filtered = filtered.filter((t) => {
        const amount = Number(t.amount);
        if (amountOperator === "gt" && amountMin !== undefined) {
          return amount > amountMin;
        }
        if (amountOperator === "lt" && amountMin !== undefined) {
          return amount < amountMin;
        }
        if (amountOperator === "equal" && amountMin !== undefined) {
          return Math.abs(amount - amountMin) < 0.01;
        }
        if (amountOperator === "between" && amountMin !== undefined && amountMax !== undefined) {
          return amount >= amountMin && amount <= amountMax;
        }
        return true;
      });
    }

    if (advancedFilters.dateOperator && advancedFilters.dateStart) {
      const { dateOperator, dateStart, dateEnd } = advancedFilters;
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.transaction_date);
        const startDate = new Date(dateStart);
        
        if (dateOperator === "after") {
          return transactionDate > startDate;
        }
        if (dateOperator === "before") {
          return transactionDate < startDate;
        }
        if (dateOperator === "on") {
          return transactionDate.toDateString() === startDate.toDateString();
        }
        if (dateOperator === "between" && dateEnd) {
          const endDate = new Date(dateEnd);
          return transactionDate >= startDate && transactionDate <= endDate;
        }
        return true;
      });
    }

    setFilteredTransactions(filtered);
  };

  const handleViewDetails = (transaction: Transaction) => {
    if (expandedTransactionId === transaction.id) {
      setExpandedTransactionId(null);
    } else {
      setExpandedTransactionId(transaction.id);
    }
  };

  const handleToggleMedical = async (transaction: Transaction) => {
    try {
      const newIsMedical = !transaction.is_medical;
      
      // Check if transaction is before HSA opened date
      let isHsaEligible = newIsMedical;
      if (newIsMedical && hsaOpenedDate) {
        const transactionDate = new Date(transaction.transaction_date);
        const hsaDate = new Date(hsaOpenedDate);
        if (transactionDate < hsaDate) {
          isHsaEligible = false;
          toast.warning(`This transaction occurred before your HSA was opened (${new Date(hsaOpenedDate).toLocaleDateString()}). It's marked as medical but not HSA-eligible.`);
        }
      }
      
      const { error } = await supabase
        .from("transactions")
        .update({ 
          is_medical: newIsMedical,
          is_hsa_eligible: isHsaEligible,
          category: newIsMedical ? "medical" : transaction.category,
          reconciliation_status: newIsMedical ? "unlinked" : "ignored"
        })
        .eq("id", transaction.id);

      if (error) throw error;
      toast.success(newIsMedical ? "Marked as medical expense" : "Marked as non-medical");
      fetchTransactions();
    } catch (error) {
      console.error("Error toggling medical:", error);
      toast.error("Failed to update transaction");
    }
  };

  const handleMarkMedical = async (transaction: Transaction) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ 
          is_medical: true,
          is_hsa_eligible: true,
          category: "medical"
        })
        .eq("id", transaction.id);

      if (error) throw error;
      toast.success("Marked as medical expense");
      fetchTransactions();
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
    }
  };

  const handleLinkToInvoice = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    // TODO: Implement link to bill dialog
    toast.info("Link to bill feature coming soon");
  };

  const handleIgnore = async (transaction: Transaction) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          reconciliation_status: "ignored",
          is_medical: false
        })
        .eq("id", transaction.id);

      if (error) throw error;
      toast.success("Transaction ignored");
      fetchTransactions();
    } catch (error) {
      console.error("Error ignoring transaction:", error);
      toast.error("Failed to ignore transaction");
    }
  };

  const handleUnignore = async (transaction: Transaction) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          reconciliation_status: "unlinked"
        })
        .eq("id", transaction.id);

      if (error) throw error;
      toast.success("Transaction moved back to review queue");
      fetchTransactions();
    } catch (error) {
      console.error("Error unignoring transaction:", error);
      toast.error("Failed to update transaction");
    }
  };

  const handleAddToReviewQueue = async (transaction: Transaction) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          reconciliation_status: "unlinked",
          is_medical: false
        })
        .eq("id", transaction.id);

      if (error) throw error;
      toast.success("Transaction added back to review queue");
      fetchTransactions();
    } catch (error) {
      console.error("Error adding to review queue:", error);
      toast.error("Failed to update transaction");
    }
  };

  const stats = {
    total: transactions.length,
    medical: transactions.filter((t) => t.is_medical).length,
    unlinked: transactions.filter((t) => t.reconciliation_status === "unlinked").length,
    totalAmount: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
    medicalAmount: transactions
      .filter((t) => t.is_medical)
      .reduce((sum, t) => sum + Number(t.amount), 0),
  };

  if (loading) {
    return (
      <AuthenticatedLayout unreviewedTransactions={0}>
        <TransactionsSkeleton />
      </AuthenticatedLayout>
    );
  }

  return (
    <ErrorBoundary
      fallbackTitle="Transactions Error"
      fallbackDescription="We encountered an error loading your transactions. Your data is safe. Please try again."
      onReset={() => {
        setLoading(true);
        fetchTransactions();
      }}
    >
      <AuthenticatedLayout unreviewedTransactions={stats.unlinked}>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {!hsaOpenedDate && <MissingHSADateBanner onDateSet={fetchHSADate} />}
          
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
                <p className="text-muted-foreground mt-1">
                  Track and categorize all your financial transactions
                </p>
              </div>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Medical</p>
              <p className="text-2xl font-bold text-primary">{stats.medical}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Needs Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.unlinked}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Medical Total</p>
              <p className="text-2xl font-bold text-foreground">
                ${stats.medicalAmount.toFixed(2)}
              </p>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by vendor, description, or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <AdvancedFilters 
              onFilterChange={setAdvancedFilters}
              activeFilters={advancedFilters}
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="review">
                Review Queue {stats.unlinked > 0 && `(${stats.unlinked})`}
              </TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="non-medical">Non-Medical</TabsTrigger>
            </TabsList>

            <TabsContent value="review" className="space-y-4">
              <ReviewQueue />
            </TabsContent>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredTransactions.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No transactions found</p>
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Transaction
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((transaction) => (
                    <div key={transaction.id}>
                      <TransactionCard
                        id={transaction.id}
                        date={transaction.transaction_date}
                        vendor={transaction.vendor || "Unknown"}
                        amount={transaction.amount}
                        description={transaction.description}
                        isMedical={transaction.is_medical}
                        reconciliationStatus={transaction.reconciliation_status as any}
                        isHsaEligible={transaction.is_hsa_eligible}
                        isFromHsaAccount={transaction.payment_methods?.is_hsa_account || false}
                        onViewDetails={() => handleViewDetails(transaction)}
                        onMarkMedical={() => handleMarkMedical(transaction)}
                        onLinkToInvoice={() => handleLinkToInvoice(transaction)}
                        onToggleMedical={() => handleToggleMedical(transaction)}
                        onIgnore={() => handleIgnore(transaction)}
                        onUnignore={() => handleUnignore(transaction)}
                        onAddToReviewQueue={() => handleAddToReviewQueue(transaction)}
                      />
                      {expandedTransactionId === transaction.id && (
                        <TransactionInlineDetail
                          transaction={transaction}
                          onClose={() => setExpandedTransactionId(null)}
                          onUpdate={fetchTransactions}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <QuickAddTransactionDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSuccess={fetchTransactions}
        />
      </AuthenticatedLayout>
    </ErrorBoundary>
  );
}
