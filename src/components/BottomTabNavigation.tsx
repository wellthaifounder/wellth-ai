import { NavLink } from "@/components/NavLink";
import { Home, FileText, Receipt, BarChart3 } from "lucide-react";

interface BottomTabNavigationProps {
  unreviewedTransactions?: number;
}

export const BottomTabNavigation = ({ unreviewedTransactions = 0 }: BottomTabNavigationProps) => {
  const tabs = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: FileText, label: "Bills", path: "/invoices" },
    { icon: Receipt, label: "Transactions", path: "/transactions", badge: unreviewedTransactions },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
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
            <div className="relative">
              <tab.icon className="h-5 w-5" aria-hidden="true" />
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-xs">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
