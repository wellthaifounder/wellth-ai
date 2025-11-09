import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HSAContextType {
  hasHSA: boolean;
  hsaOpenedDate: string | null;
  loading: boolean;
  refreshHSAStatus: () => Promise<void>;
}

const HSAContext = createContext<HSAContextType | undefined>(undefined);

export function HSAProvider({ children }: { children: ReactNode }) {
  const [hasHSA, setHasHSA] = useState(false);
  const [hsaOpenedDate, setHsaOpenedDate] = useState<string | null>(null);
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
        .select("hsa_opened_date")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.warn("Error fetching HSA status:", error);
        setHasHSA(false);
        setHsaOpenedDate(null);
      } else {
        const date = profile?.hsa_opened_date || null;
        setHsaOpenedDate(date);
        setHasHSA(!!date);
      }
    } catch (error) {
      console.error("Failed to refresh HSA status:", error);
      setHasHSA(false);
      setHsaOpenedDate(null);
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
    <HSAContext.Provider value={{ hasHSA, hsaOpenedDate, loading, refreshHSAStatus }}>
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
