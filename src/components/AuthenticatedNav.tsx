import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { WellthLogo } from "@/components/WellthLogo";
import { LogOut, Calculator, Receipt, FileText, BarChart3, Wallet, Plus } from "lucide-react";
import { toast } from "sonner";

interface AuthenticatedNavProps {
  unreviewedTransactions?: number;
}

export const AuthenticatedNav = ({ unreviewedTransactions = 0 }: AuthenticatedNavProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
    }
  };

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-2">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <WellthLogo size="sm" showTagline />
          </button>
          
          <div className="flex items-center gap-1 md:gap-2">
            <div className="hidden lg:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/decision-tool")}>
                <Calculator className="h-4 w-4 mr-2" />
                Decision Tool
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/transactions")}>
                <Receipt className="h-4 w-4 mr-2" />
                Transactions
                {unreviewedTransactions > 0 && (
                  <span className="ml-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {unreviewedTransactions}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
                <FileText className="h-4 w-4 mr-2" />
                Invoices
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/documents")}>
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/analytics")}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/payment-methods")}>
                <Wallet className="h-4 w-4 mr-2" />
                Payment Methods
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/reimbursement-requests")}>
                <FileText className="h-4 w-4 mr-2" />
                Requests
              </Button>
            </div>
            <Button className="hidden sm:flex" variant="default" size="sm" onClick={() => navigate("/expenses/new")}>
              New Entry
            </Button>
            <Button className="sm:hidden" variant="default" size="icon" onClick={() => navigate("/expenses/new")}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline ml-2">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
