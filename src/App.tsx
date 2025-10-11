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
import HSAReimbursement from "./pages/HSAReimbursement";
import ReimbursementDetails from "./pages/ReimbursementDetails";
import ReimbursementRequests from "./pages/ReimbursementRequests";
import PaymentMethods from "./pages/PaymentMethods";
import Analytics from "./pages/Analytics";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<ExpenseList />} />
          <Route path="/expenses/new" element={<ExpenseEntry />} />
          <Route path="/expenses/edit/:id" element={<ExpenseEntry />} />
          <Route path="/hsa-reimbursement" element={<HSAReimbursement />} />
          <Route path="/reimbursement/:id" element={<ReimbursementDetails />} />
          <Route path="/reimbursement-requests" element={<ReimbursementRequests />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
          <Route path="/analytics" element={<Analytics />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
