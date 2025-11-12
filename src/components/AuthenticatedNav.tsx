import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { WellthLogo } from "@/components/WellthLogo";
import { LogOut, Calculator, Receipt, FileText, BarChart3, Menu, Settings, Home, Building2, BookOpen } from "lucide-react";
import { WellbieAvatar } from "@/components/WellbieAvatar";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useHSA } from "@/contexts/HSAContext";

interface AuthenticatedNavProps {
  unreviewedTransactions?: number;
  pendingReviews?: number;
  activeDisputes?: number;
}

export const AuthenticatedNav = ({ 
  unreviewedTransactions = 0,
  pendingReviews = 0,
  activeDisputes = 0 
}: AuthenticatedNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hasHSA } = useHSA();

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

  // Main navigation items for header (desktop only)
  const mainNavItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: FileText, label: "Bills", path: "/bills" },
    { icon: Receipt, label: "Transactions", path: "/transactions", badge: unreviewedTransactions },
    { icon: BarChart3, label: "Reports", path: "/reports" },
    { icon: Building2, label: "Provider Ratings", path: "/providers" },
  ];

  // Tools menu items for mobile sidebar
  const toolsMenuItems = [
    { icon: Calculator, label: "Savings Calculator", path: "/savings-calculator" },
    { icon: Building2, label: "Providers", path: "/providers" },
    { icon: FileText, label: "Documents", path: "/documents" },
    { icon: BookOpen, label: "HSA Eligibility", path: "/hsa-eligibility", hsaOnly: true },
    { icon: FileText, label: "HSA Requests", path: "/reimbursement-requests", hsaOnly: true },
  ];

  const visibleToolsItems = toolsMenuItems.filter(item => {
    if (item.hsaOnly) return hasHSA;
    return true;
  });

  const isActivePath = (path: string) => {
    if (path === "/dashboard") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-[60] shadow-sm" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => navigate("/dashboard")}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
              aria-label="Go to dashboard"
            >
              <WellthLogo size="sm" showTagline className="hidden sm:block" />
              <WellthLogo variant="icon" size="sm" className="sm:hidden" />
            </button>
            
            {/* Desktop Navigation Links - hidden on mobile */}
            <div className="hidden lg:flex items-center gap-1" role="navigation">
              {mainNavItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActivePath(item.path)
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  aria-label={item.label}
                  aria-current={isActivePath(item.path) ? "page" : undefined}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2" role="group">
            {/* Wellbie Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.dispatchEvent(new Event('openWellbieChat'))}
              className="flex items-center gap-2"
              aria-label="Open Wellbie AI assistant"
            >
              <WellbieAvatar size="sm" />
              <span className="hidden sm:inline text-sm font-medium">Wellbie</span>
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
                <nav className="flex flex-col gap-4" aria-label="Mobile navigation menu">
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">Tools</h3>
                    {visibleToolsItems.map((item) => (
                      <Button
                        key={item.path}
                        variant="ghost"
                        className="justify-start w-full"
                        onClick={() => handleNavigation(item.path)}
                        aria-label={item.label}
                      >
                        <item.icon className="h-5 w-5 mr-3" aria-hidden="true" />
                        <span className="flex-1 text-left">{item.label}</span>
                      </Button>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4 space-y-2">
                    <Button
                      variant="ghost"
                      className="justify-start w-full"
                      onClick={() => handleNavigation("/settings")}
                      aria-label="Settings"
                    >
                      <Settings className="h-5 w-5 mr-3" aria-hidden="true" />
                      Settings
                    </Button>
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
