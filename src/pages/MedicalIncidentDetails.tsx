import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WellthLogo } from "@/components/WellthLogo";
import { ArrowLeft, Plus, DollarSign, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { calculateHSAEligibility } from "@/lib/hsaCalculations";

const MedicalIncidentDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const addFirst = searchParams.get("addFirst") === "true";
  
  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchIncidentDetails();
    }
  }, [id]);

  useEffect(() => {
    if (addFirst && !loading && incident) {
      navigate(`/invoice/new?incident=${id}`);
    }
  }, [addFirst, loading, incident, id]);

  const fetchIncidentDetails = async () => {
    try {
      const { data: incidentData, error: incidentError } = await supabase
        .from("medical_incidents")
        .select("*")
        .eq("id", id)
        .single();

      if (incidentError) throw incidentError;
      setIncident(incidentData);

      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select(`
          *,
          payment_transactions (
            id,
            payment_date,
            amount,
            payment_source,
            payment_method_id,
            notes
          )
        `)
        .eq("medical_incident_id", id)
        .order("invoice_date", { ascending: false });

      if (invoiceError) throw invoiceError;
      setInvoices(invoiceData || []);
    } catch (error) {
      toast.error("Failed to load incident details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const aggregateStats = () => {
    let totalInvoiced = 0;
    let totalPaidHSA = 0;
    let totalPaidOther = 0;
    let totalUnpaid = 0;

    invoices.forEach(invoice => {
      const breakdown = calculateHSAEligibility(
        invoice,
        invoice.payment_transactions || []
      );
      totalInvoiced += breakdown.totalInvoiced;
      totalPaidHSA += breakdown.paidViaHSA;
      totalPaidOther += breakdown.paidViaOther;
      totalUnpaid += breakdown.unpaidBalance;
    });

    return { totalInvoiced, totalPaidHSA, totalPaidOther, totalUnpaid };
  };

  const stats = aggregateStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8">
          <CardTitle className="mb-2">Incident Not Found</CardTitle>
          <CardDescription>The medical incident you're looking for doesn't exist.</CardDescription>
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <button 
              onClick={() => navigate("/dashboard")}
              className="hover:opacity-80 transition-opacity"
            >
              <WellthLogo size="sm" showTagline />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/invoices")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Invoices
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{incident.title}</CardTitle>
                <CardDescription className="text-base">
                  {incident.incident_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} • {new Date(incident.incident_date).toLocaleDateString()}
                </CardDescription>
                {incident.description && (
                  <p className="text-sm text-muted-foreground mt-2">{incident.description}</p>
                )}
              </div>
              {incident.is_hsa_eligible && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  HSA Eligible
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Invoiced</p>
                <p className="text-2xl font-bold">${stats.totalInvoiced.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Paid via HSA</p>
                <p className="text-2xl font-bold text-primary">${stats.totalPaidHSA.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Paid via Other</p>
                <p className="text-2xl font-bold text-yellow-600">${stats.totalPaidOther.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Unpaid Balance</p>
                <p className="text-2xl font-bold text-red-600">${stats.totalUnpaid.toFixed(2)}</p>
              </div>
            </div>

            {incident.is_hsa_eligible && (stats.totalPaidOther > 0 || stats.totalUnpaid > 0) && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-primary">HSA Reimbursement Opportunity</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ${(stats.totalPaidOther + stats.totalUnpaid).toFixed(2)} eligible for HSA optimization
                      {stats.totalPaidOther > 0 && <> (${stats.totalPaidOther.toFixed(2)} already paid, recoverable)</>}
                      {stats.totalUnpaid > 0 && <> + ${stats.totalUnpaid.toFixed(2)} unpaid (strategic pay opportunity)</>}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Invoices & Payments</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/payment/new?incident=${id}`)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
            <Button onClick={() => navigate(`/invoice/new?incident=${id}`)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Invoice
            </Button>
          </div>
        </div>

        {invoices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">No invoices added yet</p>
              <Button onClick={() => navigate(`/invoice/new?incident=${id}`)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Invoice
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => {
              const breakdown = calculateHSAEligibility(
                invoice,
                invoice.payment_transactions || []
              );

              return (
                <Card key={invoice.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{invoice.vendor}</h3>
                        <p className="text-sm text-muted-foreground">
                          {invoice.category} • {new Date(invoice.invoice_date || invoice.date).toLocaleDateString()}
                          {invoice.invoice_number && <> • {invoice.invoice_number}</>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">${breakdown.totalInvoiced.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3 mb-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Paid via HSA</p>
                        <p className="text-lg font-semibold text-primary">${breakdown.paidViaHSA.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Paid via Other</p>
                        <p className="text-lg font-semibold text-yellow-600">${breakdown.paidViaOther.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Unpaid Balance</p>
                        <p className="text-lg font-semibold text-red-600">${breakdown.unpaidBalance.toFixed(2)}</p>
                      </div>
                    </div>

                    {invoice.payment_transactions && invoice.payment_transactions.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm mb-2">Payment History</h4>
                        <div className="space-y-2">
                          {invoice.payment_transactions.map((payment: any) => (
                            <div key={payment.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-2">
                              <div className="flex items-center gap-2">
                                {payment.payment_source === 'hsa_direct' ? (
                                  <Badge variant="outline" className="bg-primary/10 text-primary">HSA</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">Other</Badge>
                                )}
                                <span className="text-muted-foreground">
                                  {new Date(payment.payment_date).toLocaleDateString()}
                                </span>
                              </div>
                              <span className="font-semibold">${Number(payment.amount).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/payment/new?invoice=${invoice.id}`)}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Record Payment
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/invoice/${invoice.id}`)}
                      >
                        Edit Invoice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {invoices.length > 0 && incident.is_hsa_eligible && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Ready to get reimbursed?</h3>
                  <p className="text-sm text-muted-foreground">
                    Create an HSA reimbursement request for this incident
                  </p>
                </div>
                <Button onClick={() => navigate("/hsa-reimbursement")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Reimbursement Request
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MedicalIncidentDetails;