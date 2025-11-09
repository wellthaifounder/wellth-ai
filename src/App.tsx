import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SubscriptionProvider>
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
          
          {/* New Expense Management Routes */}
          <Route path="/invoices" element={<InvoicePaymentListEnhanced />} />
          <Route path="/invoice/new" element={<InvoiceEntry />} />
          <Route path="/invoice/:id" element={<InvoiceEntry />} />
          <Route path="/payment/new" element={<PaymentEntry />} />
          
          {/* Dual-Path Expense Entry */}
          <Route path="/expenses/new" element={<ExpenseDecision />} />
          <Route path="/expense/quick" element={<SimpleExpenseEntry />} />
          
          {/* Legacy Expense Routes (keep for backward compatibility) */}
          <Route path="/expenses" element={<ExpenseList />} />
          <Route path="/expenses/edit/:id" element={<ExpenseEntry />} />
          <Route path="/expenses/import" element={<BulkImport />} />
          <Route path="/decision-tool" element={<PrePurchaseDecision />} />
          <Route path="/hsa-reimbursement" element={<HSAReimbursement />} />
          <Route path="/reimbursement/:id" element={<ReimbursementDetails />} />
          <Route path="/reimbursement-requests" element={<ReimbursementRequests />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/install" element={<Install />} />
          <Route path="/bank-accounts" element={<BankAccounts />} />
          <Route path="/vault-tracker" element={<VaultTracker />} />
          <Route path="/hsa-eligibility" element={<HSAEligibility />} />
          <Route path="/tripwire-success" element={<TripwireSuccess />} />
          <Route path="/checkout" element={<Checkout />} />
          
          {/* Bill Review & Dispute Routes */}
          <Route path="/bills/:id/review" element={<BillReview />} />
          <Route path="/bills/:id/dispute" element={<BillDispute />} />
          
           {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </SubscriptionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
