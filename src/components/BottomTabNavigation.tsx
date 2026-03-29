import { NavLink } from "@/components/NavLink";
import { Home, Receipt, FolderHeart, TrendingUp, Settings, CreditCard } from "lucide-react";

interface BottomTabNavigationProps {
  unreviewedTransactions?: number;
  showHSAFeatures?: boolean;
}

export const BottomTabNavigation = ({
  unreviewedTransactions = 0,
  showHSAFeatures = false,
}: BottomTabNavigationProps) => {
  const tabs = showHSAFeatures
    ? [
        { icon: Home,        label: "Home",         path: "/dashboard",    badge: 0 },
        { icon: Receipt,     label: "Bills",        path: "/bills",        badge: 0 },
        { icon: CreditCard,  label: "Transactions", path: "/transactions", badge: unreviewedTransactions },
        { icon: TrendingUp,  label: "Insights",     path: "/reports",      badge: 0 },
        { icon: Settings,    label: "Account",      path: "/settings",     badge: 0 },
      ]
    : [
        { icon: Home,        label: "Home",     path: "/dashboard",   badge: 0 },
        { icon: Receipt,     label: "Bills",    path: "/bills",       badge: 0 },
        { icon: FolderHeart, label: "Events",   path: "/collections", badge: 0 },
        { icon: TrendingUp,  label: "Insights", path: "/reports",     badge: 0 },
        { icon: Settings,    label: "Account",  path: "/settings",    badge: 0 },
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
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-lg transition-colors hover:bg-accent/50 relative"
            activeClassName="text-primary"
          >
            <div className="relative">
              <tab.icon className="h-5 w-5" aria-hidden="true" />
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
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
