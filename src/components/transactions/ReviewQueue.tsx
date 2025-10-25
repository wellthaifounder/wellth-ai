import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SuggestionCard } from "./SuggestionCard";
import { TransactionDetailDialog } from "./TransactionDetailDialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { getSuggestion, type Transaction as TransactionType, type Invoice } from "@/lib/transactionMatcher";
import { Loader2 } from "lucide-react";

export function ReviewQueue() {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [userPreferences, setUserPreferences] = useState<Array<{ vendor_pattern: string; is_medical: boolean }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (detailsOpen) return;
      
      if (e.key === 'm' || e.key === 'M') {
        handleConfirmMedical();
      } else if (e.key === 'n' || e.key === 'N') {
        handleNotMedical();
      } else if (e.key === 's' || e.key === 'S') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, detailsOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch unlinked transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('reconciliation_status', 'unlinked')
        .order('transaction_date', { ascending: false });

      if (txError) throw txError;

      // Fetch user's invoices for matching
      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .select('id, vendor, amount, date, invoice_date')
        .is('is_reimbursed', false);

      if (invError) throw invError;

      // Fetch user preferences
      const { data: prefData, error: prefError } = await supabase
        .from('user_vendor_preferences')
        .select('vendor_pattern, is_medical');

      if (prefError) throw prefError;

      setTransactions(txData || []);
      setInvoices(invData || []);
      setUserPreferences(prefData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  const savePreference = async (vendorPattern: string, isMedical: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_vendor_preferences')
        .upsert({
          user_id: user.id,
          vendor_pattern: vendorPattern,
          is_medical: isMedical,
          times_confirmed: 1
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  };

  const handleConfirmMedical = async () => {
    const transaction = transactions[currentIndex];
    if (!transaction) return;

    const suggestion = getSuggestion(transaction, invoices, userPreferences);

    try {
      const updates: any = {
        is_medical: true,
        is_hsa_eligible: true,
        reconciliation_status: 'linked'
      };

      if (suggestion.invoice) {
        updates.invoice_id = suggestion.invoice.id;
      }

      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', transaction.id);

      if (error) throw error;

      // Save preference
      await savePreference(transaction.vendor || transaction.description, true);

      toast.success('Marked as medical expense');
      moveToNext();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    }
  };

  const handleNotMedical = async () => {
    const transaction = transactions[currentIndex];
    if (!transaction) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          is_medical: false,
          reconciliation_status: 'ignored'
        })
        .eq('id', transaction.id);

      if (error) throw error;

      // Save preference
      await savePreference(transaction.vendor || transaction.description, false);

      toast.success('Marked as not medical');
      moveToNext();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    }
  };

  const handleSkip = () => {
    moveToNext();
  };

  const moveToNext = () => {
    if (currentIndex < transactions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Refresh to check for more
      fetchData();
      setCurrentIndex(0);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold">All caught up! 🎉</h3>
        <p className="text-muted-foreground mt-2">
          No unlinked transactions to review
        </p>
      </div>
    );
  }

  const currentTransaction = transactions[currentIndex];
  const suggestion = getSuggestion(currentTransaction, invoices, userPreferences);
  const progress = ((currentIndex + 1) / transactions.length) * 100;

  // Extend transaction with missing properties for dialog
  const extendedTransaction = currentTransaction ? {
    ...currentTransaction,
    category: currentTransaction.category || 'uncategorized',
    is_hsa_eligible: currentTransaction.is_hsa_eligible || false,
    notes: currentTransaction.notes || null,
    payment_method_id: currentTransaction.payment_method_id || null,
    invoice_id: currentTransaction.invoice_id || null,
    is_medical: currentTransaction.is_medical || false,
    reconciliation_status: currentTransaction.reconciliation_status || 'unlinked'
  } : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Review Progress</span>
          <span className="text-muted-foreground">
            {currentIndex + 1} of {transactions.length}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Suggestion Card */}
      <SuggestionCard
        transaction={currentTransaction}
        suggestion={suggestion}
        onConfirmMedical={handleConfirmMedical}
        onNotMedical={handleNotMedical}
        onSkip={handleSkip}
        onViewDetails={() => setDetailsOpen(true)}
      />

      {/* Detail Dialog */}
      {extendedTransaction && (
        <TransactionDetailDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          transaction={extendedTransaction}
          onUpdate={fetchData}
          onLinkToInvoice={() => {}}
        />
      )}
    </div>
  );
}
