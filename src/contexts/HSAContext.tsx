import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HSAContextType {
  hasHSA: boolean;
  hsaOpenedDate: string | null;
  userIntent: 'billing' | 'hsa' | 'both' | null;
  loading: boolean;
  refreshHSAStatus: () => Promise<void>;
}

const HSAContext = createContext<HSAContextType | undefined>(undefined);

export function HSAProvider({ children }: { children: ReactNode }) {
  const [hasHSA, setHasHSA] = useState(false);
  const [hsaOpenedDate, setHsaOpenedDate] = useState<string | null>(null);
  const [userIntent, setUserIntent] = useState<'billing' | 'hsa' | 'both' | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshHSAStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasHSA(false);
        setHsaOpenedDate(null);
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("hsa_opened_date, user_intent")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.warn("Error fetching HSA status:", error);
        setHasHSA(false);
        setHsaOpenedDate(null);
        setUserIntent(null);
      } else {
        const date = profile?.hsa_opened_date || null;
        const intent = profile?.user_intent as 'billing' | 'hsa' | 'both' | null || null;
        setHsaOpenedDate(date);
        setHasHSA(!!date);
        setUserIntent(intent);
      }
    } catch (error) {
      console.error("Failed to refresh HSA status:", error);
      setHasHSA(false);
      setHsaOpenedDate(null);
      setUserIntent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshHSAStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshHSAStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <HSAContext.Provider value={{ hasHSA, hsaOpenedDate, userIntent, loading, refreshHSAStatus }}>
      {children}
    </HSAContext.Provider>
  );
}

export function useHSA() {
  const context = useContext(HSAContext);
  if (context === undefined) {
    throw new Error("useHSA must be used within an HSAProvider");
  }
  return context;
}
