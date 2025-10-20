import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Calculator from "./pages/Calculator";
import Dashboard from "./pages/Dashboard";
import ExpenseEntry from "./pages/ExpenseEntry";
import ExpenseList from "./pages/ExpenseList";
import ExpenseDecision from "./pages/ExpenseDecision";
import SimpleExpenseEntry from "./pages/SimpleExpenseEntry";
import MedicalIncidentEntry from "./pages/MedicalIncidentEntry";
import MedicalIncidentDetails from "./pages/MedicalIncidentDetails";
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
import Checkout from "./pages/Checkout";
 
 import NotFound from "./pages/NotFound";
import { WellbieChat } from "./components/WellbieChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <WellbieChat />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* New Expense Management Routes */}
          <Route path="/invoices" element={<InvoicePaymentListEnhanced />} />
          <Route path="/invoice/new" element={<InvoiceEntry />} />
          <Route path="/invoice/:id" element={<InvoiceEntry />} />
          <Route path="/payment/new" element={<PaymentEntry />} />
          
          {/* Dual-Path Expense Entry */}
          <Route path="/expenses/new" element={<ExpenseDecision />} />
          <Route path="/expense/quick" element={<SimpleExpenseEntry />} />
          
          {/* Medical Incident Routes */}
          <Route path="/incident/new" element={<MedicalIncidentEntry />} />
          <Route path="/incident/:id" element={<MedicalIncidentDetails />} />
          
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
          <Route path="/tripwire-success" element={<TripwireSuccess />} />
          <Route path="/checkout" element={<Checkout />} />
          
           {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
