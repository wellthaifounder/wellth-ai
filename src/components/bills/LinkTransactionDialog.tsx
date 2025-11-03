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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Transaction {
  id: string;
  transaction_date: string;
  vendor: string | null;
  amount: number;
  description: string;
  category: string | null;
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
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (open && invoice) {
      fetchUnlinkedTransactions();
    } else {
      setTransactions([]);
      setSelectedTransactionIds([]);
    }
  }, [open, invoice]);

  const fetchUnlinkedTransactions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch transactions that are not linked to any invoice via payment_transactions
      const { data: linkedTransactions } = await supabase
        .from("payment_transactions")
        .select("transaction_id")
        .not("transaction_id", "is", null);

      const linkedIds = linkedTransactions?.map(pt => pt.transaction_id) || [];

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .is("invoice_id", null)
        .not("id", "in", `(${linkedIds.join(",")})`)
        .order("transaction_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching unlinked transactions:", error);
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
      
      onSuccess();
      onOpenChange(false);
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

  const sortedTransactions = [...transactions].sort((a, b) => {
    return getSimilarityScore(b) - getSimilarityScore(a);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Link Transactions to Bill</DialogTitle>
          <DialogDescription>
            Select transactions to link to <strong>{invoice?.vendor}</strong> (
            ${(invoice?.total_amount || invoice?.amount || 0).toFixed(2)})
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No unlinked transactions available
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
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
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLinkTransactions}
            disabled={selectedTransactionIds.length === 0 || linking}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
