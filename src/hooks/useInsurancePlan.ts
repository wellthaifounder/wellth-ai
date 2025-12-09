import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InsurancePlan {
  carrier: string;
  plan_type: string;
  deductible?: number;
  deductible_met?: number;
  out_of_pocket_max?: number;
  out_of_pocket_met?: number;
  updated_at: string;
}

export function useInsurancePlan() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['insurance-plan'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('insurance_plan')
        .eq('id', user.id)
        .single();

      if (error) {
        // If no profile exists yet, return null
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    },
  });

  const insurancePlan = profile?.insurance_plan as InsurancePlan | null;
  const hasInsurancePlan = !!insurancePlan?.carrier && !!insurancePlan?.plan_type;

  // Calculate remaining amounts
  const deductibleRemaining = insurancePlan?.deductible && insurancePlan?.deductible_met
    ? Math.max(0, insurancePlan.deductible - insurancePlan.deductible_met)
    : null;

  const outOfPocketRemaining = insurancePlan?.out_of_pocket_max && insurancePlan?.out_of_pocket_met
    ? Math.max(0, insurancePlan.out_of_pocket_max - insurancePlan.out_of_pocket_met)
    : null;

  const deductibleMet = deductibleRemaining === 0;
  const outOfPocketMet = outOfPocketRemaining === 0;

  return {
    insurancePlan,
    hasInsurancePlan,
    deductibleRemaining,
    outOfPocketRemaining,
    deductibleMet,
    outOfPocketMet,
    isLoading,
  };
}
