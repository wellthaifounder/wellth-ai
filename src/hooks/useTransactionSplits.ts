import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SplitFormData } from "@/lib/transactionSplitUtils";

export function useTransactionSplits(transactionId: string | null) {
  const queryClient = useQueryClient();

  // Fetch splits for a transaction
  const { data: splits, isLoading } = useQuery({
    queryKey: ["transaction-splits", transactionId],
    queryFn: async () => {
      if (!transactionId) return [];

      const { data, error } = await supabase
        .from("transaction_splits")
        .select("*")
        .eq("parent_transaction_id", transactionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!transactionId,
  });

  // Create splits (batch operation)
  const createSplits = useMutation({
    mutationFn: async ({
      transactionId,
      splits,
    }: {
      transactionId: string;
      splits: SplitFormData[];
    }) => {
      // First, mark the parent transaction as split
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ is_split: true })
        .eq("id", transactionId);

      if (updateError) throw updateError;

      // Insert all splits
      const splitsToInsert = splits.map((split) => ({
        parent_transaction_id: transactionId,
        hsa_account_id: split.hsa_account_id,
        amount: split.amount,
        description: split.description,
        notes: split.notes || null,
      }));

      const { error: insertError } = await supabase
        .from("transaction_splits")
        .insert(splitsToInsert);

      if (insertError) throw insertError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transaction-splits", variables.transactionId] });
      queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
      toast.success("Transaction split successfully");
    },
    onError: (error) => {
      console.error("Error creating splits:", error);
      toast.error("Failed to split transaction");
    },
  });

  // Update a single split
  const updateSplit = useMutation({
    mutationFn: async ({
      splitId,
      updates,
    }: {
      splitId: string;
      updates: Partial<SplitFormData>;
    }) => {
      const { error } = await supabase
        .from("transaction_splits")
        .update(updates)
        .eq("id", splitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction-splits", transactionId] });
      toast.success("Split updated");
    },
    onError: (error) => {
      console.error("Error updating split:", error);
      toast.error("Failed to update split");
    },
  });

  // Delete all splits (unsplit transaction)
  const deleteSplits = useMutation({
    mutationFn: async (transactionId: string) => {
      // Delete all splits
      const { error: deleteError } = await supabase
        .from("transaction_splits")
        .delete()
        .eq("parent_transaction_id", transactionId);

      if (deleteError) throw deleteError;

      // Mark parent transaction as not split
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ is_split: false })
        .eq("id", transactionId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, transactionId) => {
      queryClient.invalidateQueries({ queryKey: ["transaction-splits", transactionId] });
      queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
      toast.success("Transaction unsplit");
    },
    onError: (error) => {
      console.error("Error deleting splits:", error);
      toast.error("Failed to unsplit transaction");
    },
  });

  return {
    splits,
    isLoading,
    createSplits,
    updateSplit,
    deleteSplits,
  };
}
