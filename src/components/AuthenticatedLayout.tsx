import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthenticatedNav } from "@/components/AuthenticatedNav";
import { BottomTabNavigation } from "@/components/BottomTabNavigation";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  unreviewedTransactions?: number;
  pendingReviews?: number;
  activeDisputes?: number;
}

export const AuthenticatedLayout = ({ 
  children, 
  unreviewedTransactions = 0,
  pendingReviews = 0,
  activeDisputes = 0
}: AuthenticatedLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block">
      <AppSidebar 
        unreviewedTransactions={unreviewedTransactions}
        pendingReviews={pendingReviews}
        activeDisputes={activeDisputes}
      />
        </div>

        <div className="flex-1 flex flex-col w-full">
          {/* Top Navigation Bar */}
          <AuthenticatedNav 
            unreviewedTransactions={unreviewedTransactions}
            pendingReviews={pendingReviews}
            activeDisputes={activeDisputes}
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
    </SidebarProvider>
  );
};
