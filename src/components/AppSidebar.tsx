import { useState } from "react";
import { Calculator, Receipt, FileText, BarChart3, Wallet, Building2, BookOpen, Settings, MessageSquare, Shield, DollarSign, Home, TrendingUp, ChevronDown, ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useHSA } from "@/contexts/HSAContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AppSidebarProps {
  unreviewedTransactions?: number;
  pendingReviews?: number;
  activeDisputes?: number;
}

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  badgeKey: string | null;
  hsaOnly?: boolean;
}

// Consolidated 5-category navigation structure
const moneyMenuItems: MenuItem[] = [
  { icon: Home, label: "Dashboard", path: "/dashboard", badgeKey: null },
  { icon: Wallet, label: "Transactions", path: "/transactions", badgeKey: "unreviewedTransactions" },
  { icon: Calculator, label: "Savings Tools", path: "/savings-calculator", badgeKey: null },
];

const billsMenuItems: MenuItem[] = [
  { icon: Receipt, label: "Bills", path: "/bills", badgeKey: "pendingReviews" },
  { icon: FileText, label: "Documents", path: "/documents", badgeKey: null },
];

const insightsMenuItems: MenuItem[] = [
  { icon: BarChart3, label: "Reports", path: "/reports", badgeKey: null },
];

const providersMenuItems: MenuItem[] = [
  { icon: Building2, label: "Provider Directory", path: "/providers", badgeKey: null },
];

export function AppSidebar({ unreviewedTransactions = 0, pendingReviews = 0, activeDisputes = 0 }: AppSidebarProps) {
  const { open } = useSidebar();
  const { hasHSA } = useHSA();
  const { isAdmin } = useIsAdmin();

  // State for collapsible sections - default all open
  const [openSections, setOpenSections] = useState({
    money: true,
    bills: true,
    insights: true,
    providers: true,
    account: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getBadgeCount = (badgeKey: string | null) => {
    if (!badgeKey) return 0;
    if (badgeKey === "unreviewedTransactions") return unreviewedTransactions;
    if (badgeKey === "pendingReviews") return pendingReviews;
    if (badgeKey === "activeDisputes") return activeDisputes;
    return 0;
  };

  const renderMenuSection = (items: MenuItem[], label: string, sectionKey: keyof typeof openSections) => {
    // Filter HSA-only items if user doesn't have HSA
    const filteredItems = items.filter(item => !item.hsaOnly || hasHSA);

    if (filteredItems.length === 0) return null;

    const isOpen = openSections[sectionKey];

    return (
      <Collapsible open={isOpen} onOpenChange={() => toggleSection(sectionKey)}>
        <SidebarGroup>
          <CollapsibleTrigger className="w-full">
            <SidebarGroupLabel className="flex items-center justify-between w-full cursor-pointer hover:bg-sidebar-accent/50 rounded-md px-2 py-1.5 transition-colors">
              <span>{label}</span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredItems.map((item) => {
                  const badgeCount = getBadgeCount(item.badgeKey);
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <NavLink
                          to={item.path}
                          end={item.path === "/dashboard"}
                          className="relative"
                        >
                          <item.icon className="h-4 w-4" />
                          {open && <span>{item.label}</span>}
                          {badgeCount > 0 && open && (
                            <span className="ml-auto bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                              {badgeCount}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="overflow-y-auto">
        {renderMenuSection(moneyMenuItems, "Money", "money")}
        {renderMenuSection(billsMenuItems, "Bills", "bills")}
        {renderMenuSection(insightsMenuItems, "Insights", "insights")}
        {renderMenuSection(providersMenuItems, "Providers", "providers")}

        <Collapsible open={openSections.account} onOpenChange={() => toggleSection("account")} className="mt-auto">
          <SidebarGroup>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between w-full cursor-pointer hover:bg-sidebar-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <span>Account</span>
                {openSections.account ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Manage Reviews">
                        <NavLink to="/admin/reviews">
                          <Shield className="h-4 w-4" />
                          {open && (
                            <span className="flex items-center gap-2">
                              Manage Reviews
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">Admin</Badge>
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Share Your Feedback">
                      <NavLink to="/user-reviews">
                        <MessageSquare className="h-4 w-4" />
                        {open && <span>Share Feedback</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Settings">
                      <NavLink to="/settings">
                        <Settings className="h-4 w-4" />
                        {open && <span>Settings</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
    </Sidebar>
  );
}
