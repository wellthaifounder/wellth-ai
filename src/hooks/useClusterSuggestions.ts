import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/utils/errorHandler";

export interface ClusterSuggestion {
  cluster_key: string;
  vendor: string;
  min_date: string;
  max_date: string;
  invoice_count: number;
  total_amount: number;
  invoice_ids: string[];
}

export function useClusterSuggestions() {
  return useQuery({
    queryKey: ["cluster-suggestions"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("suggest_invoice_clusters", {
        p_user_id: user.id,
      });

      if (error) {
        logError("Cluster suggestions query failed", error);
        throw error;
      }

      return (data || []) as ClusterSuggestion[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
