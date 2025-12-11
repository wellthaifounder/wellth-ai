import { NavLink } from "@/components/NavLink";
import { DollarSign, Receipt, TrendingUp, Building2, Settings } from "lucide-react";

interface BottomTabNavigationProps {
  unreviewedTransactions?: number;
}

export const BottomTabNavigation = ({ unreviewedTransactions = 0 }: BottomTabNavigationProps) => {
  // Matching the 5-category structure: Money, Bills, Insights, Providers, Account
  const tabs = [
    { icon: DollarSign, label: "Money", path: "/dashboard" },
    { icon: Receipt, label: "Bills", path: "/bills" },
    { icon: TrendingUp, label: "Insights", path: "/reports" },
    { icon: Building2, label: "Providers", path: "/providers" },
    { icon: Settings, label: "Account", path: "/settings" },
  ];

  return (
    <nav 
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/40 safe-area-inset-bottom"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === "/dashboard"}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-lg transition-colors hover:bg-accent/50"
            activeClassName="text-primary"
          >
            <tab.icon className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
