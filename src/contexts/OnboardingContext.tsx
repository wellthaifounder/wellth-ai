import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface OnboardingState {
  hasSeenBillIntelligence: boolean;
  hasSeenProviderDirectory: boolean;
  hasSeenHSAFeatures: boolean;
  hasSeenTransactions: boolean;
  hasCompletedOnboarding: boolean;
}

interface OnboardingContextType extends OnboardingState {
  markAsSeen: (feature: keyof Omit<OnboardingState, 'hasCompletedOnboarding'>) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const STORAGE_KEY = 'wellth_onboarding_state';

const defaultState: OnboardingState = {
  hasSeenBillIntelligence: false,
  hasSeenProviderDirectory: false,
  hasSeenHSAFeatures: false,
  hasSeenTransactions: false,
  hasCompletedOnboarding: false,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultState, ...JSON.parse(stored) };
      } catch {
        return defaultState;
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const markAsSeen = (feature: keyof Omit<OnboardingState, 'hasCompletedOnboarding'>) => {
    setState(prev => ({ ...prev, [feature]: true }));
  };

  const completeOnboarding = () => {
    setState(prev => ({ ...prev, hasCompletedOnboarding: true }));
  };

  const resetOnboarding = () => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <OnboardingContext.Provider value={{ ...state, markAsSeen, completeOnboarding, resetOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
