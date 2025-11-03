import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { AdvancedFilters, type FilterCriteria } from "@/components/transactions/AdvancedFilters";

interface Transaction {
  id: string;
  transaction_date: string;
  vendor: string | null;
  amount: number;
  description: string;
  category: string | null;
}

interface LinkedTransaction extends Transaction {
  payment_transaction_id: string;
}

interface Invoice {
  id: string;
  vendor: string;
  amount: number;
  total_amount: number;
  date: string;
}

interface LinkTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSuccess: () => void;
}

export function LinkTransactionDialog({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: LinkTransactionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [linkedTransactions, setLinkedTransactions] = useState<LinkedTransaction[]>([]);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [selectedLinkedIds, setSelectedLinkedIds] = useState<string[]>([]);
  const [linking, setLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<FilterCriteria>({});

  useEffect(() => {
    if (open && invoice) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setLinkedTransactions([]);
      setSelectedTransactionIds([]);
      setSelectedLinkedIds([]);
      setSearchQuery("");
      setAdvancedFilters({});
    }
  }, [open, invoice]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch linked transactions for this invoice
      const { data: linkedPayments, error: linkedError } = await supabase
        .from("payment_transactions")
        .select(`
          id,
          transaction_id,
          transactions (
            id,
            transaction_date,
            vendor,
            amount,
            description,
            category
          )
        `)
        .eq("invoice_id", invoice?.id)
        .not("transaction_id", "is", null);

      if (linkedError) throw linkedError;

      const linked = (linkedPayments || [])
        .filter(pt => pt.transactions)
        .map(pt => ({
          ...(pt.transactions as any),
          payment_transaction_id: pt.id,
        }));

      setLinkedTransactions(linked);

      // Fetch all linked transaction IDs to exclude from unlinked list
      const { data: allLinkedTransactions } = await supabase
        .from("payment_transactions")
        .select("transaction_id")
        .not("transaction_id", "is", null);

      const linkedIds = allLinkedTransactions?.map(pt => pt.transaction_id) || [];

      // Fetch unlinked transactions
      const query = supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .is("invoice_id", null)
        .order("transaction_date", { ascending: false })
        .limit(50);

      if (linkedIds.length > 0) {
        query.not("id", "in", `(${linkedIds.join(",")})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const toggleTransaction = (transactionId: string) => {
    setSelectedTransactionIds(prev =>
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const toggleLinkedTransaction = (transactionId: string) => {
    setSelectedLinkedIds(prev =>
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleUnlinkTransactions = async () => {
    if (selectedLinkedIds.length === 0) return;

    setLinking(true);
    try {
      // Find the payment transaction IDs for the selected linked transactions
      const paymentTransactionIds = linkedTransactions
        .filter(lt => selectedLinkedIds.includes(lt.id))
        .map(lt => lt.payment_transaction_id);

      // Delete the payment_transaction records
      const { error: deleteError } = await supabase
        .from("payment_transactions")
        .delete()
        .in("id", paymentTransactionIds);

      if (deleteError) throw deleteError;

      // Update the transactions to mark them as unlinked
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          invoice_id: null,
          reconciliation_status: "unlinked",
        })
        .in("id", selectedLinkedIds);

      if (updateError) throw updateError;

      toast.success(
        `Unlinked ${selectedLinkedIds.length} transaction${
          selectedLinkedIds.length > 1 ? "s" : ""
        } from bill`
      );
      
      fetchTransactions();
      setSelectedLinkedIds([]);
      onSuccess();
    } catch (error) {
      console.error("Error unlinking transactions:", error);
      toast.error("Failed to unlink transactions");
    } finally {
      setLinking(false);
    }
  };

  const handleLinkTransactions = async () => {
    if (!invoice || selectedTransactionIds.length === 0) return;

    setLinking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the selected transactions to calculate total amount
      const selectedTransactions = transactions.filter(t =>
        selectedTransactionIds.includes(t.id)
      );

      // Create payment_transaction records for each selected transaction
      const paymentTransactions = selectedTransactions.map(transaction => ({
        invoice_id: invoice.id,
        transaction_id: transaction.id,
        user_id: user.id,
        payment_date: transaction.transaction_date,
        amount: transaction.amount,
        payment_source: "out_of_pocket" as const,
        notes: `Linked from transaction: ${transaction.description}`,
      }));

      const { error: paymentError } = await supabase
        .from("payment_transactions")
        .insert(paymentTransactions);

      if (paymentError) throw paymentError;

      // Update the transactions to mark them as linked
      const { error: transactionError } = await supabase
        .from("transactions")
        .update({
          invoice_id: invoice.id,
          reconciliation_status: "linked_to_invoice",
        })
        .in("id", selectedTransactionIds);

      if (transactionError) throw transactionError;

      toast.success(
        `Linked ${selectedTransactionIds.length} transaction${
          selectedTransactionIds.length > 1 ? "s" : ""
        } to bill`
      );
      
      fetchTransactions();
      setSelectedTransactionIds([]);
      onSuccess();
    } catch (error) {
      console.error("Error linking transactions:", error);
      toast.error("Failed to link transactions");
    } finally {
      setLinking(false);
    }
  };

  const getSimilarityScore = (transaction: Transaction): number => {
    if (!invoice) return 0;
    
    let score = 0;
    
    // Amount similarity (within 10%)
    const amountDiff = Math.abs(transaction.amount - (invoice.total_amount || invoice.amount));
    const amountThreshold = (invoice.total_amount || invoice.amount) * 0.1;
    if (amountDiff <= amountThreshold) score += 40;
    
    // Vendor similarity
    const transactionVendor = (transaction.vendor || transaction.description).toLowerCase();
    const invoiceVendor = invoice.vendor.toLowerCase();
    if (transactionVendor.includes(invoiceVendor) || invoiceVendor.includes(transactionVendor)) {
      score += 40;
    }
    
    // Date proximity (within 7 days)
    const transactionDate = new Date(transaction.transaction_date);
    const invoiceDate = new Date(invoice.date);
    const daysDiff = Math.abs((transactionDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7) score += 20;
    
    return score;
  };

  const applyFilters = (allTransactions: Transaction[]): Transaction[] => {
    let filtered = [...allTransactions];

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

    return filtered;
  };

  const filteredTransactions = applyFilters(transactions);
  const filteredLinkedTransactions = applyFilters(linkedTransactions);
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    return getSimilarityScore(b) - getSimilarityScore(a);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Link Transactions to Bill</DialogTitle>
          <DialogDescription>
            Select transactions to link to <strong>{invoice?.vendor}</strong> (
            ${(invoice?.total_amount || invoice?.amount || 0).toFixed(2)})
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by vendor, description, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <AdvancedFilters
            onFilterChange={setAdvancedFilters}
            activeFilters={advancedFilters}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-4">
              {/* Linked Transactions Section */}
              {filteredLinkedTransactions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                    Already Linked ({filteredLinkedTransactions.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredLinkedTransactions.map((transaction) => {
                      const isSelected = selectedLinkedIds.includes(transaction.id);
                      
                      return (
                        <div
                          key={transaction.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            isSelected ? "bg-accent border-primary" : "bg-muted/30"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleLinkedTransaction(transaction.id)}
                            id={`linked-${transaction.id}`}
                          />
                          <label
                            htmlFor={`linked-${transaction.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">
                                    {transaction.vendor || transaction.description}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    Linked
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(transaction.transaction_date).toLocaleDateString()} •{" "}
                                  {transaction.category || "Uncategorized"}
                                </p>
                              </div>
                              <p className="font-semibold">${transaction.amount.toFixed(2)}</p>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Separator if both sections exist */}
              {filteredLinkedTransactions.length > 0 && filteredTransactions.length > 0 && (
                <Separator className="my-4" />
              )}

              {/* Unlinked Transactions Section */}
              {filteredTransactions.length === 0 && filteredLinkedTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery || Object.keys(advancedFilters).length > 0
                    ? "No transactions match your filters"
                    : "No transactions available"}
                </div>
              ) : filteredTransactions.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                    Available to Link ({filteredTransactions.length})
                  </h3>
                  <div className="space-y-2">
                    {sortedTransactions.map((transaction) => {
                      const isSelected = selectedTransactionIds.includes(transaction.id);
                      const similarityScore = getSimilarityScore(transaction);
                      const isHighMatch = similarityScore >= 60;

                      return (
                        <div
                          key={transaction.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            isSelected ? "bg-accent border-primary" : "hover:bg-accent/50"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleTransaction(transaction.id)}
                            id={`transaction-${transaction.id}`}
                          />
                          <label
                            htmlFor={`transaction-${transaction.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">
                                    {transaction.vendor || transaction.description}
                                  </p>
                                  {isHighMatch && (
                                    <Badge variant="secondary" className="text-xs">
                                      Likely Match
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(transaction.transaction_date).toLocaleDateString()} •{" "}
                                  {transaction.category || "Uncategorized"}
                                </p>
                              </div>
                              <p className="font-semibold">${transaction.amount.toFixed(2)}</p>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {selectedLinkedIds.length > 0 && (
            <Button
              onClick={handleUnlinkTransactions}
              disabled={linking}
              variant="destructive"
            >
              {linking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unlinking...
                </>
              ) : (
                `Unlink ${selectedLinkedIds.length} Transaction${
                  selectedLinkedIds.length !== 1 ? "s" : ""
                }`
              )}
            </Button>
          )}
          {selectedTransactionIds.length > 0 && (
            <Button
              onClick={handleLinkTransactions}
              disabled={linking}
            >
              {linking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                `Link ${selectedTransactionIds.length} Transaction${
                  selectedTransactionIds.length !== 1 ? "s" : ""
                }`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
