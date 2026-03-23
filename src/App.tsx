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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
                <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/calculator" element={<Calculator />} />
                    <Route path="/tripwire-offer" element={<TripwireOffer />} />
                    <Route path="/tripwire-success" element={<TripwireSuccess />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/install" element={<Install />} />

                    {/* Protected routes */}
                    <Route path="/dashboard" element={<ProtectedRoute><ErrorBoundary><Dashboard /></ErrorBoundary></ProtectedRoute>} />

                    {/* Unified Bills Management Routes */}
                    <Route path="/bills" element={<ProtectedRoute><ErrorBoundary><Bills /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/bills/new" element={<ProtectedRoute><ErrorBoundary><NewBillUpload /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/bills/upload" element={<ProtectedRoute><ErrorBoundary><NewBillUpload /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/bills/:id" element={<ProtectedRoute><ErrorBoundary><BillDetail /></ErrorBoundary></ProtectedRoute>} />

                    {/* Bill Review & Dispute features archived - redirected to bills */}
                    <Route path="/bill-reviews/:invoiceId" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
                    <Route path="/disputes/:id" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
                    <Route path="/bills/:invoiceId/dispute" element={<ProtectedRoute><Bills /></ProtectedRoute>} />

                    {/* Legacy redirects */}
                    <Route path="/invoices" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
                    <Route path="/bill-reviews" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
                    <Route path="/disputes" element={<ProtectedRoute><Bills /></ProtectedRoute>} />

                    {/* Decision Tool renamed to Savings Calculator (HSA only) */}
                    <Route path="/savings-calculator" element={<ProtectedRoute><ErrorBoundary><PrePurchaseDecision /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/decision-tool" element={<ProtectedRoute><PrePurchaseDecision /></ProtectedRoute>} />

                    {/* HSA Routes */}
                    <Route path="/hsa-eligibility" element={<ProtectedRoute><ErrorBoundary><HSAEligibility /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/reimbursement-requests" element={<ProtectedRoute><ErrorBoundary><ReimbursementRequests /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/reimbursement/:id" element={<ProtectedRoute><ErrorBoundary><ReimbursementDetails /></ErrorBoundary></ProtectedRoute>} />

                    {/* Transactions Route */}
                    <Route path="/transactions" element={<ProtectedRoute><ErrorBoundary><Transactions /></ErrorBoundary></ProtectedRoute>} />

                    {/* Collections Routes */}
                    <Route path="/collections" element={<ProtectedRoute><ErrorBoundary><Collections /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/collections/new" element={<ProtectedRoute><ErrorBoundary><NewCollection /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/collections/:id" element={<ProtectedRoute><ErrorBoundary><CollectionDetail /></ErrorBoundary></ProtectedRoute>} />

                    {/* Legacy redirects for medical events */}
                    <Route path="/medical-events" element={<ProtectedRoute><Collections /></ProtectedRoute>} />
                    <Route path="/medical-events/new" element={<ProtectedRoute><NewCollection /></ProtectedRoute>} />
                    <Route path="/medical-events/:id" element={<ProtectedRoute><CollectionDetail /></ProtectedRoute>} />

                    {/* Supporting Routes */}
                    <Route path="/documents" element={<ProtectedRoute><ErrorBoundary><Documents /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><ErrorBoundary><Settings /></ErrorBoundary></ProtectedRoute>} />

                    {/* Reports (formerly Analytics) */}
                    <Route path="/reports" element={<ProtectedRoute><ErrorBoundary><Reports /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/analytics" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

                    {/* User Feedback */}
                    <Route path="/user-reviews" element={<ProtectedRoute><ErrorBoundary><UserReviews /></ErrorBoundary></ProtectedRoute>} />

                    {/* Admin Routes */}
                    <Route path="/admin/reviews" element={<ProtectedRoute><ErrorBoundary><AdminReviews /></ErrorBoundary></ProtectedRoute>} />

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                </ErrorBoundary>
              </BrowserRouter>
            </DashboardLayoutProvider>
          </OnboardingProvider>
        </HSAProvider>
      </SubscriptionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
