import { Calculator, Receipt, FileText, BarChart3, Wallet, Home, Building2, BookOpen, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
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
}

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Calculator, label: "Decision Tool", path: "/decision-tool" },
  { icon: Receipt, label: "Transactions", path: "/transactions" },
  { icon: FileText, label: "Bills", path: "/invoices" },
  { icon: FileText, label: "Documents", path: "/documents" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: BookOpen, label: "HSA Eligibility", path: "/hsa-eligibility" },
  { icon: Wallet, label: "Payment Methods", path: "/payment-methods" },
  { icon: Building2, label: "Bank Accounts", path: "/bank-accounts" },
  { icon: FileText, label: "HSA Requests", path: "/reimbursement-requests" },
];

export function AppSidebar({ unreviewedTransactions = 0 }: AppSidebarProps) {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink 
                      to={item.path} 
                      end={item.path === "/dashboard"}
                      className="relative"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.path === "/transactions" && unreviewedTransactions > 0 && open && (
                        <span className="ml-auto bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                          {unreviewedTransactions}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
