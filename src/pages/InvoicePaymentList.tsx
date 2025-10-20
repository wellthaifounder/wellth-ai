import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { WellthLogo } from "@/components/WellthLogo";
import { ArrowLeft, Plus, DollarSign, CreditCard, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { calculateHSAEligibility, getPaymentStatusBadge } from "@/lib/hsaCalculations";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const InvoicePaymentList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data: invoiceData, error } = await supabase
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
        .order("invoice_date", { ascending: false });

      if (error) throw error;
      setInvoices(invoiceData || []);
    } catch (error) {
      toast.error("Failed to load invoices");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const aggregateStats = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaidHSA = 0;
    let totalPaidOther = 0;
    let totalUnpaid = 0;
    let totalHSAEligible = 0;

    invoices.forEach(invoice => {
      const breakdown = calculateHSAEligibility(
        invoice,
        invoice.payment_transactions || []
      );
      totalInvoiced += breakdown.totalInvoiced;
      totalPaidHSA += breakdown.paidViaHSA;
      totalPaidOther += breakdown.paidViaOther;
      totalUnpaid += breakdown.unpaidBalance;
      totalHSAEligible += breakdown.hsaReimbursementEligible;
    });

    return { totalInvoiced, totalPaidHSA, totalPaidOther, totalUnpaid, totalHSAEligible };
  }, [invoices]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/payment/new")}>
              <DollarSign className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
            <Button onClick={() => navigate("/invoice/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Invoice
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${aggregateStats.totalInvoiced.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid via HSA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${aggregateStats.totalPaidHSA.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid via Other</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">${aggregateStats.totalPaidOther.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${aggregateStats.totalUnpaid.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary">HSA Eligible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${aggregateStats.totalHSAEligible.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Can be reimbursed</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Medical Invoices & Payments</CardTitle>
            <CardDescription>
              Track invoice balances and payment history for HSA reimbursement optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No invoices yet</p>
                <Button onClick={() => navigate("/invoice/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Invoice
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.map((invoice) => {
                  const breakdown = calculateHSAEligibility(
                    invoice,
                    invoice.payment_transactions || []
                  );
                  const statusBadge = getPaymentStatusBadge(
                    breakdown.totalInvoiced,
                    breakdown.paidViaHSA,
                    breakdown.paidViaOther
                  );
                  const isExpanded = expandedRows.has(invoice.id);

                  return (
                    <Collapsible key={invoice.id} open={isExpanded} onOpenChange={() => toggleRow(invoice.id)}>
                      <Card className="overflow-hidden">
                        <CollapsibleTrigger className="w-full">
                          <div className="p-4 hover:bg-accent/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                {isExpanded ? (
                                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                )}
                                <div className="text-left">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">{invoice.vendor}</p>
                                    {invoice.is_hsa_eligible && (
                                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                        HSA Eligible
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                    <span>{invoice.category}</span>
                                    <span>•</span>
                                    <span>{new Date(invoice.invoice_date || invoice.date).toLocaleDateString()}</span>
                                    {invoice.invoice_number && (
                                      <>
                                        <span>•</span>
                                        <span>{invoice.invoice_number}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-lg font-bold">${breakdown.totalInvoiced.toFixed(2)}</div>
                                  <Badge className={statusBadge.color}>
                                    {statusBadge.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="border-t bg-muted/20 p-4 space-y-4">
                            <div className="grid gap-3 md:grid-cols-3">
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

                            {invoice.is_hsa_eligible && breakdown.hsaReimbursementEligible > 0 && (
                              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                                  <div className="flex-1">
                                    <p className="font-semibold text-primary">HSA Reimbursement Opportunity</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      <span className="font-semibold">${breakdown.hsaReimbursementEligible.toFixed(2)}</span> eligible for reimbursement
                                      {breakdown.alreadyPaidRecoverable > 0 && (
                                        <> (${breakdown.alreadyPaidRecoverable.toFixed(2)} already paid, recoverable)</>
                                      )}
                                      {breakdown.unpaidStrategicOpportunity > 0 && (
                                        <> + ${breakdown.unpaidStrategicOpportunity.toFixed(2)} unpaid (pay with rewards card, then reimburse!)</>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {invoice.payment_transactions && invoice.payment_transactions.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Payment History</h4>
                                <div className="space-y-2">
                                  {invoice.payment_transactions.map((payment: any) => (
                                    <div key={payment.id} className="flex items-center justify-between text-sm bg-background rounded-lg p-2">
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

                            <div className="flex gap-2 pt-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/payment/new?invoice=${invoice.id}`);
                                }}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Record Payment
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/invoice/${invoice.id}`);
                                }}
                              >
                                Edit Invoice
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoicePaymentList;
