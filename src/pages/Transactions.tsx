import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { TransactionCard } from "@/components/transactions/TransactionCard";
import { TransactionDetailDialog } from "@/components/transactions/TransactionDetailDialog";
import { QuickAddTransactionDialog } from "@/components/transactions/QuickAddTransactionDialog";
import { AuthenticatedNav } from "@/components/AuthenticatedNav";

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
};

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, activeTab]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchTransactions();
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
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
      filtered = filtered.filter((t) => !t.is_medical);
    } else if (activeTab === "unlinked") {
      filtered = filtered.filter((t) => t.reconciliation_status === "unlinked");
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

    setFilteredTransactions(filtered);
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailDialogOpen(true);
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
    // TODO: Implement link to invoice dialog
    toast.info("Link to invoice feature coming soon");
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNav unreviewedTransactions={stats.unlinked} />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by vendor, description, or amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="non-medical">Non-Medical</TabsTrigger>
            <TabsTrigger value="unlinked">
              Unlinked ({stats.unlinked})
            </TabsTrigger>
          </TabsList>

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
              filteredTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  id={transaction.id}
                  date={transaction.transaction_date}
                  vendor={transaction.vendor || "Unknown"}
                  amount={transaction.amount}
                  description={transaction.description}
                  isMedical={transaction.is_medical}
                  reconciliationStatus={transaction.reconciliation_status as any}
                  isHsaEligible={transaction.is_hsa_eligible}
                  onViewDetails={() => handleViewDetails(transaction)}
                  onMarkMedical={() => handleMarkMedical(transaction)}
                  onLinkToInvoice={() => handleLinkToInvoice(transaction)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <TransactionDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        transaction={selectedTransaction}
        onUpdate={fetchTransactions}
        onLinkToInvoice={() => {
          setDetailDialogOpen(false);
          handleLinkToInvoice(selectedTransaction!);
        }}
      />

      <QuickAddTransactionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
