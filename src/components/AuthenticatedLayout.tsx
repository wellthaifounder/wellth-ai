import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthenticatedNav } from "@/components/AuthenticatedNav";
import { BottomTabNavigation } from "@/components/BottomTabNavigation";
import { WellbieChat } from "@/components/WellbieChat";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  unreviewedTransactions?: number;
  pendingReviews?: number;
}

export const AuthenticatedLayout = ({
  children,
  unreviewedTransactions = 0,
  pendingReviews = 0,
}: AuthenticatedLayoutProps) => {
  // Enable session timeout for security (15 min inactivity, 2 min warning)
  useSessionTimeout(15, 2);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block">
      <AppSidebar
        unreviewedTransactions={unreviewedTransactions}
        pendingReviews={pendingReviews}
      />
        </div>

        <div className="flex-1 flex flex-col w-full">
          {/* Top Navigation Bar */}
          <AuthenticatedNav
            unreviewedTransactions={unreviewedTransactions}
            pendingReviews={pendingReviews}
          />
          
          {/* Desktop Sidebar Trigger - visible on desktop */}
          <div className="hidden lg:block border-b border-border/40 px-4 py-2">
            <SidebarTrigger className="-ml-1" />
          </div>

          {/* Main Content */}
          <main className="flex-1 pb-20 lg:pb-0">
            {children}
          </main>

          {/* Bottom Tab Navigation - mobile only */}
          <BottomTabNavigation unreviewedTransactions={unreviewedTransactions} />
        </div>
      </div>
      
      {/* Wellbie Chat - only for authenticated users */}
      <WellbieChat />
    </SidebarProvider>
  );
};
