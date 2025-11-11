import { Calculator, Receipt, FileText, BarChart3, Wallet, Building2, BookOpen, Settings, MessageSquare, Shield } from "lucide-react";
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

// Organized menu structure with logical grouping
const billsMenuItems: MenuItem[] = [
  { icon: Receipt, label: "Bills", path: "/bills", badgeKey: null },
];

const toolsMenuItems: MenuItem[] = [
  { icon: Calculator, label: "Savings Calculator", path: "/savings-calculator", badgeKey: null, hsaOnly: true },
  { icon: FileText, label: "Documents", path: "/documents", badgeKey: null },
  { icon: BookOpen, label: "HSA Eligibility", path: "/hsa-eligibility", badgeKey: null, hsaOnly: true },
  { icon: Wallet, label: "HSA Requests", path: "/reimbursement-requests", badgeKey: null, hsaOnly: true },
];

export function AppSidebar({ unreviewedTransactions = 0, pendingReviews = 0, activeDisputes = 0 }: AppSidebarProps) {
  const { open } = useSidebar();
  const { hasHSA } = useHSA();
  const { isAdmin } = useIsAdmin();

  const getBadgeCount = (badgeKey: string | null) => {
    if (!badgeKey) return 0;
    if (badgeKey === "unreviewedTransactions") return unreviewedTransactions;
    if (badgeKey === "pendingReviews") return pendingReviews;
    if (badgeKey === "activeDisputes") return activeDisputes;
    return 0;
  };

  const renderMenuSection = (items: MenuItem[], label: string) => {
    // Filter HSA-only items if user doesn't have HSA
    const filteredItems = items.filter(item => !item.hsaOnly || hasHSA);
    
    if (filteredItems.length === 0) return null;
    
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
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
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        {renderMenuSection(billsMenuItems, "Bills")}
        {renderMenuSection(toolsMenuItems, "Tools")}
        
        <SidebarGroup>
          <SidebarGroupLabel>Provider Ratings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Provider Ratings">
                  <NavLink to="/providers" className="relative">
                    <Building2 className="h-4 w-4" />
                    <span className="flex items-center gap-2">
                      Provider Ratings
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">Beta</Badge>
                    </span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Reports">
                  <NavLink to="/reports">
                    <BarChart3 className="h-4 w-4" />
                    <span>Reports</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Manage Reviews">
                    <NavLink to="/admin/reviews">
                      <Shield className="h-4 w-4" />
                      <span className="flex items-center gap-2">
                        Manage Reviews
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">Admin</Badge>
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Share Your Feedback">
                  <NavLink to="/user-reviews">
                    <MessageSquare className="h-4 w-4" />
                    <span>Share Feedback</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
