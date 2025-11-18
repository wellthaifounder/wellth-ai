import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getEligibleHSAAccounts } from "@/lib/hsaAccountUtils";
import type { HSAAccount } from "@/lib/hsaAccountUtils";

type HSAEligibilityResult = {
  isEligible: boolean;
  eligibleAccounts: HSAAccount[];
  requiresAccountSelection: boolean;
  message: string | null;
};

/**
 * Hook to determine HSA eligibility for a given bill date
 * Checks both new hsa_accounts table and legacy profiles.hsa_opened_date
 */
export function useHSAEligibility(billDate: string | Date | null): HSAEligibilityResult & { isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["hsa-eligibility", billDate],
    queryFn: async () => {
      if (!billDate) {
        return {
          isEligible: false,
          eligibleAccounts: [],
          requiresAccountSelection: false,
          message: "No bill date provided",
        };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          isEligible: false,
          eligibleAccounts: [],
          requiresAccountSelection: false,
          message: "User not authenticated",
        };
      }

      // First, check for HSA accounts in the new table
      const { data: accounts, error: accountsError } = await supabase
        .from("hsa_accounts")
        .select("*")
        .eq("user_id", user.id);

      if (accountsError) {
        console.error("Error fetching HSA accounts:", accountsError);
      }

      if (accounts && accounts.length > 0) {
        // Use new multi-account system
        const eligibleAccounts = getEligibleHSAAccounts(billDate, accounts);
        
        if (eligibleAccounts.length === 0) {
          return {
            isEligible: false,
            eligibleAccounts: [],
            requiresAccountSelection: false,
            message: "Bill date does not fall within any HSA account period",
          };
        }

        if (eligibleAccounts.length === 1) {
          return {
            isEligible: true,
            eligibleAccounts,
            requiresAccountSelection: false,
            message: `Eligible for ${eligibleAccounts[0].account_name}`,
          };
        }

        // Multiple accounts eligible - user needs to select
        return {
          isEligible: true,
          eligibleAccounts,
          requiresAccountSelection: true,
          message: `Eligible for ${eligibleAccounts.length} HSA accounts - selection required`,
        };
      }

      // Fall back to legacy hsa_opened_date from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("hsa_opened_date")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return {
          isEligible: false,
          eligibleAccounts: [],
          requiresAccountSelection: false,
          message: "Error checking HSA eligibility",
        };
      }

      if (!profile?.hsa_opened_date) {
        return {
          isEligible: false,
          eligibleAccounts: [],
          requiresAccountSelection: false,
          message: "No HSA account configured",
        };
      }

      // Check if bill date is on or after HSA opened date
      const billDateObj = new Date(billDate);
      const hsaOpenedDateObj = new Date(profile.hsa_opened_date);
      
      if (billDateObj >= hsaOpenedDateObj) {
        // Create a virtual account for legacy data
        const legacyAccount: HSAAccount = {
          id: "legacy",
          user_id: user.id,
          account_name: "Primary HSA (Legacy)",
          opened_date: profile.hsa_opened_date,
          closed_date: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return {
          isEligible: true,
          eligibleAccounts: [legacyAccount],
          requiresAccountSelection: false,
          message: "Eligible (legacy HSA date)",
        };
      }

      return {
        isEligible: false,
        eligibleAccounts: [],
        requiresAccountSelection: false,
        message: `Bill date is before HSA opened date (${hsaOpenedDateObj.toLocaleDateString()})`,
      };
    },
    enabled: !!billDate,
  });

  return {
    isEligible: data?.isEligible ?? false,
    eligibleAccounts: data?.eligibleAccounts ?? [],
    requiresAccountSelection: data?.requiresAccountSelection ?? false,
    message: data?.message ?? null,
    isLoading,
  };
}
