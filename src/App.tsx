import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { HSAProvider } from "@/contexts/HSAContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { DashboardLayoutProvider } from "@/contexts/DashboardLayoutContext";
import { WellbieChat } from "@/components/WellbieChat";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Calculator from "./pages/Calculator";
import Dashboard from "./pages/Dashboard";
import ExpenseEntry from "./pages/ExpenseEntry";
import ExpenseList from "./pages/ExpenseList";
import Install from "./pages/Install";
import ExpenseDecision from "./pages/ExpenseDecision";
import SimpleExpenseEntry from "./pages/SimpleExpenseEntry";
import InvoiceEntry from "./pages/InvoiceEntry";
import InvoicePaymentListEnhanced from "./pages/InvoicePaymentListEnhanced";
import Bills from "./pages/Bills";
import BillDetail from "./pages/BillDetail";
import PaymentEntry from "./pages/PaymentEntry";
import BulkImport from "./pages/BulkImport";
import PrePurchaseDecision from "./pages/PrePurchaseDecision";
import HSAReimbursement from "./pages/HSAReimbursement";
import ReimbursementDetails from "./pages/ReimbursementDetails";
import ReimbursementRequests from "./pages/ReimbursementRequests";
import PaymentMethods from "./pages/PaymentMethods";
import Analytics from "./pages/Analytics";
import TripwireSuccess from "./pages/TripwireSuccess";
import TripwireOffer from "./pages/TripwireOffer";
import Checkout from "./pages/Checkout";
import Documents from "./pages/Documents";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import BankAccounts from "./pages/BankAccounts";
import VaultTracker from "./pages/VaultTracker";
import HSAEligibility from "./pages/HSAEligibility";
import BillReview from "./pages/BillReview";
import BillDispute from "./pages/BillDispute";
import BillReviews from "./pages/BillReviews";
import DisputeManagement from "./pages/DisputeManagement";
import DisputeDetail from "./pages/DisputeDetail";
import ProviderDirectory from "./pages/ProviderDirectory";
import ProviderDetail from "./pages/ProviderDetail";
import ProviderTransparency from "./pages/ProviderTransparency";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SubscriptionProvider>
        <HSAProvider>
          <OnboardingProvider>
            <DashboardLayoutProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <WellbieChat />
              <PWAInstallPrompt />
              <PWAUpdatePrompt />
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/tripwire-offer" element={<TripwireOffer />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Unified Bills Management Routes */}
          <Route path="/bills" element={<Bills />} />
          <Route path="/bills/new" element={<BillDetail />} />
          <Route path="/bills/:id" element={<BillDetail />} />
          
          {/* Decision Tool */}
          <Route path="/decision-tool" element={<PrePurchaseDecision />} />
          {/* HSA Routes */}
          <Route path="/hsa-eligibility" element={<HSAEligibility />} />
          <Route path="/reimbursement-requests" element={<ReimbursementRequests />} />
          <Route path="/reimbursement/:id" element={<ReimbursementDetails />} />
          
          {/* Supporting Routes */}
          <Route path="/documents" element={<Documents />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/install" element={<Install />} />
          
          {/* Reports (formerly Analytics) */}
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Analytics />} />
          
          {/* Checkout & Onboarding */}
          <Route path="/tripwire-success" element={<TripwireSuccess />} />
          <Route path="/checkout" element={<Checkout />} />
          
          {/* Bill Review & Dispute Routes */}
          <Route path="/bill-reviews" element={<BillReviews />} />
          <Route path="/bills/:id/review" element={<BillReview />} />
          <Route path="/bills/:id/dispute" element={<BillDispute />} />
          <Route path="/disputes" element={<DisputeManagement />} />
          <Route path="/disputes/:id" element={<DisputeDetail />} />
          
          {/* Provider Intel Routes */}
          <Route path="/providers" element={<ProviderDirectory />} />
          <Route path="/providers/:id" element={<ProviderDetail />} />
          <Route path="/provider-transparency" element={<ProviderTransparency />} />
          
           {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
            </DashboardLayoutProvider>
          </OnboardingProvider>
        </HSAProvider>
      </SubscriptionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
