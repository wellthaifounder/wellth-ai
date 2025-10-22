import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { WellthLogo } from "@/components/WellthLogo";
import { LogOut, Calculator, Receipt, FileText, BarChart3, Wallet, Plus, Menu, Settings, X, Home } from "lucide-react";
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
    { icon: FileText, label: "Invoices", path: "/invoices" },
    { icon: FileText, label: "Documents", path: "/documents" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Wallet, label: "Payment Methods", path: "/payment-methods" },
    { icon: FileText, label: "HSA Requests", path: "/reimbursement-requests" },
    { icon: Settings, label: "Account Settings", path: "/settings" },
  ];

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-2">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <WellthLogo size="sm" showTagline className="hidden sm:block" />
            <WellthLogo variant="icon" size="sm" className="sm:hidden" />
          </button>
          
          <div className="flex items-center gap-2">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {menuItems.slice(0, -1).map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className="relative"
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <span className="ml-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Button>
              ))}
            </div>

            {/* Quick Add Button */}
            <Button className="hidden sm:flex" variant="default" size="sm" onClick={() => navigate("/expenses/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
            <Button className="sm:hidden" variant="default" size="icon" onClick={() => navigate("/expenses/new")}>
              <Plus className="h-4 w-4" />
            </Button>

            {/* Desktop Settings & Sign Out */}
            <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="hidden lg:flex">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden sm:flex">
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background z-[100]">
                <SheetHeader className="border-b pb-4 mb-4">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2">
                  {menuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className="justify-start w-full"
                      onClick={() => handleNavigation(item.path)}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
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
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
