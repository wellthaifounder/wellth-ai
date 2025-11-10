import { Calculator, Receipt, FileText, BarChart3, Wallet, Home, Building2, BookOpen, Settings, AlertCircle, Scale, Award } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useHSA } from "@/contexts/HSAContext";
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

const menuItems: MenuItem[] = [
  { icon: Calculator, label: "Decision Tool", path: "/decision-tool", badgeKey: null },
  { icon: AlertCircle, label: "Bill Reviews", path: "/bill-reviews", badgeKey: "pendingReviews" },
  { icon: Scale, label: "Disputes", path: "/disputes", badgeKey: "activeDisputes" },
  { icon: Building2, label: "Providers", path: "/providers", badgeKey: null },
  { icon: Award, label: "Transparency", path: "/provider-transparency", badgeKey: null },
  { icon: FileText, label: "Documents", path: "/documents", badgeKey: null },
  { icon: BookOpen, label: "HSA Eligibility", path: "/hsa-eligibility", badgeKey: null, hsaOnly: true },
  { icon: FileText, label: "HSA Requests", path: "/reimbursement-requests", badgeKey: null, hsaOnly: true },
];

export function AppSidebar({ unreviewedTransactions = 0, pendingReviews = 0, activeDisputes = 0 }: AppSidebarProps) {
  const { open } = useSidebar();
  const { hasHSA } = useHSA();

  const getBadgeCount = (badgeKey: string | null) => {
    if (!badgeKey) return 0;
    if (badgeKey === "unreviewedTransactions") return unreviewedTransactions;
    if (badgeKey === "pendingReviews") return pendingReviews;
    if (badgeKey === "activeDisputes") return activeDisputes;
    return 0;
  };

  // Filter menu items based on HSA status
  const visibleMenuItems = menuItems.filter(item => {
    if (item.hsaOnly) {
      return hasHSA;
    }
    return true;
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => {
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
                        <span>{item.label}</span>
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
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <NavLink to="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
