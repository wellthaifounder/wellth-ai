import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/utils/errorHandler";

export interface ClaimableCareEvent {
  collection_id: string;
  title: string;
  hsa_eligible_amount: number;
  total_paid: number;
  paid_via_hsa: number;
  oop_claimable: number;
  invoice_count: number;
  unreimbursed_invoice_ids: string[];
}

export function useClaimableEvents(threshold = 50) {
  return useQuery({
    queryKey: ["claimable-care-events", threshold],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc(
        "detect_claimable_care_events",
        {
          p_user_id: user.id,
          p_threshold: threshold,
        },
      );

      if (error) {
        logError("Claimable care events query failed", error);
        throw error;
      }

      return (data || []) as ClaimableCareEvent[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
