import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  Upload,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { EventTimeline } from "@/components/events/EventTimeline";

interface MedicalEvent {
  id: string;
  title: string;
  event_date: string | null;
  event_type: string;
  primary_provider: string | null;
  description: string | null;
  total_billed: number;
  total_paid: number;
  user_responsibility_override: number | null;
  hsa_eligible_amount: number;
  status: string;
  created_at: string;
}

interface LinkedInvoice {
  id: string;
  vendor: string;
  amount: number;
  total_amount: number | null;
  date: string;
  category: string;
  is_hsa_eligible: boolean;
  user_responsibility_amount: number | null;
}

interface LinkedDocument {
  id: string;
  file_path: string;
  document_type: string;
  description: string | null;
  uploaded_at: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_source: string;
  invoice_id: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  surgery: "Surgery",
  office_visit: "Office Visit",
  emergency: "Emergency",
  ongoing_treatment: "Ongoing Treatment",
  lab_test: "Lab Test",
  imaging: "Imaging",
  physical_therapy: "Physical Therapy",
  dental: "Dental",
  vision: "Vision",
  prescription: "Prescription",
  other: "Other",
};

export default function MedicalEventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [manualBalance, setManualBalance] = useState("");

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["medical-event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as MedicalEvent;
    },
    enabled: !!id,
  });

  // Fetch linked invoices
  const { data: invoices } = useQuery({
    queryKey: ["event-invoices", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, vendor, amount, total_amount, date, category, is_hsa_eligible, user_responsibility_amount")
        .eq("medical_event_id", id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as LinkedInvoice[];
    },
    enabled: !!id,
  });

  // Fetch linked documents
  const { data: documents } = useQuery({
    queryKey: ["event-documents", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select("id, file_path, document_type, description, uploaded_at")
        .eq("medical_event_id", id)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      return data as LinkedDocument[];
    },
    enabled: !!id,
  });

  // Fetch payments for linked invoices
  const { data: payments } = useQuery({
    queryKey: ["event-payments", id],
    queryFn: async () => {
      if (!invoices?.length) return [];

      const invoiceIds = invoices.map((i) => i.id);
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("id, amount, payment_date, payment_source, invoice_id")
        .in("invoice_id", invoiceIds)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!invoices?.length,
  });

  // Update balance override mutation
  const updateBalanceMutation = useMutation({
    mutationFn: async (newBalance: number | null) => {
      const { error } = await supabase
        .from("medical_events")
        .update({ user_responsibility_override: newBalance })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-event", id] });
      setIsEditingBalance(false);
      toast.success("Balance updated");
    },
    onError: () => {
      toast.error("Failed to update balance");
    },
  });

  // Calculate totals
  const calculatedBalance = (event?.total_billed || 0) - (event?.total_paid || 0);
  const displayBalance = event?.user_responsibility_override ?? calculatedBalance;
  const paymentProgress = event?.total_billed
    ? Math.min(((event?.total_paid || 0) / event.total_billed) * 100, 100)
    : 0;

  // Build timeline items
  const timelineItems = [
    ...(invoices?.map((inv) => ({
      id: inv.id,
      type: "invoice" as const,
      title: inv.vendor,
      description: inv.category,
      amount: inv.total_amount || inv.amount,
      date: inv.date,
      status: inv.is_hsa_eligible ? "HSA Eligible" : undefined,
    })) || []),
    ...(payments?.map((pay) => ({
      id: pay.id,
      type: "payment" as const,
      title: `Payment - ${pay.payment_source}`,
      amount: pay.amount,
      date: pay.payment_date,
    })) || []),
    ...(documents?.map((doc) => ({
      id: doc.id,
      type: "document" as const,
      title: doc.description || doc.document_type.replace(/_/g, " "),
      document_type: doc.document_type,
      date: doc.uploaded_at,
    })) || []),
  ];

  if (eventLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!event) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
          <Button onClick={() => navigate("/medical-events")}>Back to Events</Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate("/medical-events")} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline">
                {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
              </Badge>
              {event.event_date && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.event_date), "MMMM d, yyyy")}
                </span>
              )}
              {event.primary_provider && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {event.primary_provider}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/bills/new?eventId=${id}`)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bill
            </Button>
            <Button onClick={() => navigate(`/documents?eventId=${id}`)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Doc
            </Button>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Billed</span>
              </div>
              <p className="text-2xl font-bold">${event.total_billed.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Total Paid</span>
              </div>
              <p className="text-2xl font-bold text-green-600">${event.total_paid.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">Outstanding</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setManualBalance(displayBalance.toString());
                    setIsEditingBalance(true);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
              {isEditingBalance ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={manualBalance}
                    onChange={(e) => setManualBalance(e.target.value)}
                    className="h-8"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const val = parseFloat(manualBalance);
                      updateBalanceMutation.mutate(isNaN(val) ? null : val);
                    }}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-destructive">${displayBalance.toFixed(2)}</p>
                  {event.user_responsibility_override !== null && (
                    <p className="text-xs text-muted-foreground">
                      Calculated: ${calculatedBalance.toFixed(2)}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">HSA Eligible</span>
              </div>
              <p className="text-2xl font-bold text-primary">${event.hsa_eligible_amount.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Payment Progress</span>
              <span className="font-medium">{paymentProgress.toFixed(0)}%</span>
            </div>
            <Progress value={paymentProgress} className="h-3" />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList>
            <TabsTrigger value="timeline">
              <FileText className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="bills">
              <Receipt className="h-4 w-4 mr-2" />
              Bills ({invoices?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents ({documents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="h-4 w-4 mr-2" />
              Payments ({payments?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>All bills, payments, and documents related to this event</CardDescription>
              </CardHeader>
              <CardContent>
                <EventTimeline
                  items={timelineItems}
                  onItemClick={(item) => {
                    if (item.type === "invoice") {
                      navigate(`/bills/${item.id}`);
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bills" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Linked Bills</CardTitle>
                  <Button size="sm" onClick={() => navigate(`/bills/new?eventId=${id}`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bill
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {invoices?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No bills linked to this event yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices?.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/bills/${invoice.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{invoice.vendor}</p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.category} • {format(new Date(invoice.date), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              ${(invoice.total_amount || invoice.amount).toFixed(2)}
                            </p>
                            {invoice.is_hsa_eligible && (
                              <Badge variant="secondary" className="text-xs">HSA</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Linked Documents</CardTitle>
                  <Button size="sm" onClick={() => navigate(`/documents?eventId=${id}`)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {documents?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No documents linked to this event yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents?.map((doc) => (
                      <div key={doc.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {doc.description || doc.document_type.replace(/_/g, " ")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(doc.uploaded_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{doc.document_type.replace(/_/g, " ")}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {payments?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments?.map((payment) => (
                      <div key={payment.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{payment.payment_source}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(payment.payment_date), "MMM d, yyyy")}
                            </p>
                          </div>
                          <p className="font-semibold text-green-600">
                            -${payment.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
