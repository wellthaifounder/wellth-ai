import { lazy, Suspense } from "react";
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
import { Loader2 } from "lucide-react";

// Critical pages - load immediately
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

// Lazy load non-critical pages for better performance
const Calculator = lazy(() => import("./pages/Calculator"));
const Bills = lazy(() => import("./pages/Bills"));
const BillDetail = lazy(() => import("./pages/BillDetail"));
const Transactions = lazy(() => import("./pages/Transactions"));
const PrePurchaseDecision = lazy(() => import("./pages/PrePurchaseDecision"));
const HSAEligibility = lazy(() => import("./pages/HSAEligibility"));
const ReimbursementRequests = lazy(() => import("./pages/ReimbursementRequests"));
const ReimbursementDetails = lazy(() => import("./pages/ReimbursementDetails"));
const Documents = lazy(() => import("./pages/Documents"));
const Settings = lazy(() => import("./pages/Settings"));
const Install = lazy(() => import("./pages/Install"));
const Reports = lazy(() => import("./pages/Reports"));
const TripwireSuccess = lazy(() => import("./pages/TripwireSuccess"));
const TripwireOffer = lazy(() => import("./pages/TripwireOffer"));
const Checkout = lazy(() => import("./pages/Checkout"));
const NewBillUpload = lazy(() => import("./pages/NewBillUpload"));
// Bill Review & Dispute features archived - V2 feature
// const BillReviews = lazy(() => import("./pages/BillReviews"));
// const BillReview = lazy(() => import("./pages/BillReview"));
// const BillDispute = lazy(() => import("./pages/BillDispute"));
// const DisputeManagement = lazy(() => import("./pages/DisputeManagement"));
// const DisputeDetail = lazy(() => import("./pages/DisputeDetail"));

// Collections pages
const Collections = lazy(() => import("./pages/Collections"));
const CollectionDetail = lazy(() => import("./pages/CollectionDetail"));
const NewCollection = lazy(() => import("./pages/NewCollection"));
// Provider Directory removed - V2 feature
// const ProviderDirectory = lazy(() => import("./pages/ProviderDirectory"));
// const ProviderDetail = lazy(() => import("./pages/ProviderDetail"));
// const ProviderTransparency = lazy(() => import("./pages/ProviderTransparency"));
const UserReviews = lazy(() => import("./pages/UserReviews"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

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
                <PWAInstallPrompt />
                <PWAUpdatePrompt />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/calculator" element={<Calculator />} />
                    <Route path="/tripwire-offer" element={<TripwireOffer />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Unified Bills Management Routes */}
                    <Route path="/bills" element={<Bills />} />
                    <Route path="/bills/new" element={<NewBillUpload />} />
                    <Route path="/bills/upload" element={<NewBillUpload />} />
                    <Route path="/bills/:id" element={<BillDetail />} />
                    
                    {/* Bill Review & Dispute features archived - redirected to bills */}
                    <Route path="/bill-reviews/:invoiceId" element={<Bills />} />
                    <Route path="/disputes/:id" element={<Bills />} />
                    <Route path="/bills/:invoiceId/dispute" element={<Bills />} />

                    {/* Legacy redirects */}
                    <Route path="/invoices" element={<Bills />} />
                    <Route path="/bill-reviews" element={<Bills />} />
                    <Route path="/disputes" element={<Bills />} />
                    
                    {/* Decision Tool renamed to Savings Calculator (HSA only) */}
                    <Route path="/savings-calculator" element={<PrePurchaseDecision />} />
                    <Route path="/decision-tool" element={<PrePurchaseDecision />} /> {/* Legacy redirect */}
                    
                    {/* HSA Routes */}
                    <Route path="/hsa-eligibility" element={<HSAEligibility />} />
                    <Route path="/reimbursement-requests" element={<ReimbursementRequests />} />
                    <Route path="/reimbursement/:id" element={<ReimbursementDetails />} />
                    
                    {/* Transactions Route */}
                    <Route path="/transactions" element={<Transactions />} />

                    {/* Collections Routes */}
                    <Route path="/collections" element={<Collections />} />
                    <Route path="/collections/new" element={<NewCollection />} />
                    <Route path="/collections/:id" element={<CollectionDetail />} />

                    {/* Legacy redirects for medical events */}
                    <Route path="/medical-events" element={<Collections />} />
                    <Route path="/medical-events/new" element={<NewCollection />} />
                    <Route path="/medical-events/:id" element={<CollectionDetail />} />

                    {/* Supporting Routes */}
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/install" element={<Install />} />
                    
                    {/* Reports (formerly Analytics) */}
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/analytics" element={<Reports />} /> {/* Legacy redirect */}
                    
                    {/* Checkout & Onboarding */}
                    <Route path="/tripwire-success" element={<TripwireSuccess />} />
                    <Route path="/checkout" element={<Checkout />} />

                    {/* Provider Directory removed - V2 feature */}
                    {/* <Route path="/providers" element={<ProviderDirectory />} /> */}
                    {/* <Route path="/providers/:id" element={<ProviderDetail />} /> */}
                    {/* <Route path="/provider-transparency" element={<ProviderTransparency />} /> */}

                    {/* User Feedback */}
                    <Route path="/user-reviews" element={<UserReviews />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/reviews" element={<AdminReviews />} />
                    
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </DashboardLayoutProvider>
          </OnboardingProvider>
        </HSAProvider>
      </SubscriptionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
