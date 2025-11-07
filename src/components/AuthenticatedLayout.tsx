import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthenticatedNav } from "@/components/AuthenticatedNav";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  unreviewedTransactions?: number;
}

export const AuthenticatedLayout = ({ 
  children, 
  unreviewedTransactions = 0 
}: AuthenticatedLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <AppSidebar unreviewedTransactions={unreviewedTransactions} />
        </div>

        <div className="flex-1 flex flex-col w-full">
          {/* Top Navigation Bar */}
          <AuthenticatedNav unreviewedTransactions={unreviewedTransactions} />
          
          {/* Desktop Sidebar Trigger - visible on desktop */}
          <div className="hidden lg:block border-b border-border/40 px-4 py-2">
            <SidebarTrigger className="-ml-1" />
          </div>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
