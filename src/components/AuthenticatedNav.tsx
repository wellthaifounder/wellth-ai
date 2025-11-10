import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { WellthLogo } from "@/components/WellthLogo";
import { LogOut, Calculator, Receipt, FileText, BarChart3, Wallet, Plus, Menu, Settings, X, Home, Building2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface AuthenticatedNavProps {
  unreviewedTransactions?: number;
}

export const AuthenticatedNav = ({ unreviewedTransactions = 0 }: AuthenticatedNavProps) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Calculator, label: "Decision Tool", path: "/decision-tool" },
    { icon: Receipt, label: "Transactions", path: "/transactions", badge: unreviewedTransactions },
    { icon: FileText, label: "Bills", path: "/bills" },
    { icon: FileText, label: "Documents", path: "/documents" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: BookOpen, label: "HSA Eligibility", path: "/hsa-eligibility" },
    { icon: Wallet, label: "Payment Methods", path: "/payment-methods" },
    { icon: Building2, label: "Bank Accounts", path: "/bank-accounts" },
    { icon: FileText, label: "HSA Requests", path: "/reimbursement-requests" },
    { icon: Settings, label: "Account Settings", path: "/settings" },
  ];

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-[60] shadow-sm" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-2">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Go to dashboard"
          >
            <WellthLogo size="sm" showTagline className="hidden sm:block" />
            <WellthLogo variant="icon" size="sm" className="sm:hidden" />
          </button>
          
          <div className="flex items-center gap-2" role="group">
            {/* Quick Add Button */}
            <Button className="hidden sm:flex" variant="default" size="sm" onClick={() => navigate("/expenses/new")} aria-label="Add new expense entry">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              New Entry
            </Button>
            <Button className="sm:hidden" variant="default" size="icon" onClick={() => navigate("/expenses/new")} aria-label="Add new expense entry">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>

            {/* Mobile Menu - only visible on mobile/tablet */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu" aria-expanded={mobileMenuOpen}>
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background z-[70]">
                <SheetHeader className="border-b pb-4 mb-4">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2" aria-label="Mobile navigation menu">
                  {menuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className="justify-start w-full"
                      onClick={() => handleNavigation(item.path)}
                      aria-label={item.label}
                    >
                      <item.icon className="h-5 w-5 mr-3" aria-hidden="true" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  ))}
                  <div className="border-t mt-4 pt-4">
                    <Button
                      variant="outline"
                      className="justify-start w-full"
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      aria-label="Sign out of your account"
                    >
                      <LogOut className="h-5 w-5 mr-3" aria-hidden="true" />
                      Sign Out
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
