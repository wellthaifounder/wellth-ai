import { NavLink } from "@/components/NavLink";
import {
  Home,
  Receipt,
  BookOpen,
  FolderHeart,
  Settings,
  DollarSign,
  MessageCircle,
} from "lucide-react";
import { FF } from "@/lib/featureFlags";

interface BottomTabNavigationProps {
  unreviewedTransactions?: number;
  showHSAFeatures?: boolean;
}

export const BottomTabNavigation = ({
  showHSAFeatures = false,
}: BottomTabNavigationProps) => {
  // Wave 4 IA-collapse experiment: when the flag is on, the Ledger tab points
  // at /bills?view=ledger so the bottom nav and the IA stay consistent.
  const ledgerPath = FF.BILLS_LEDGER_IA_COLLAPSE
    ? "/bills?view=ledger"
    : "/ledger";

  const tabs = showHSAFeatures
    ? [
        { icon: Home, label: "Home", path: "/dashboard", badge: 0 },
        { icon: BookOpen, label: "Ledger", path: ledgerPath, badge: 0 },
        {
          icon: DollarSign,
          label: "HSA",
          path: "/reimbursement-requests",
          badge: 0,
        },
        { icon: Settings, label: "Account", path: "/settings", badge: 0 },
      ]
    : [
        { icon: Home, label: "Home", path: "/dashboard", badge: 0 },
        { icon: BookOpen, label: "Ledger", path: ledgerPath, badge: 0 },
        {
          icon: FolderHeart,
          label: "Care Events",
          path: "/collections",
          badge: 0,
        },
        { icon: Settings, label: "Account", path: "/settings", badge: 0 },
      ];

  const handleOpenWellbie = () => {
    window.dispatchEvent(new Event("openWellbieChat"));
  };

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
        <button
          onClick={handleOpenWellbie}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-lg transition-colors hover:bg-accent/50 text-muted-foreground"
          aria-label="Ask Wellbie AI assistant"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs">Wellbie</span>
        </button>
      </div>
    </nav>
  );
};
