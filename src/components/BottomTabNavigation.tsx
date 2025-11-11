import { NavLink } from "@/components/NavLink";
import { Home, FileText, Receipt, BarChart3, Building2 } from "lucide-react";

interface BottomTabNavigationProps {
  unreviewedTransactions?: number;
}

export const BottomTabNavigation = ({ unreviewedTransactions = 0 }: BottomTabNavigationProps) => {
  const tabs = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: FileText, label: "Bills", path: "/bills" },
    { icon: Receipt, label: "Transactions", path: "/transactions", badge: unreviewedTransactions },
    { icon: BarChart3, label: "Reports", path: "/reports" },
    { icon: Building2, label: "Intel", path: "/providers" },
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
