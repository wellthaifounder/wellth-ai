import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WellthLogo } from "@/components/WellthLogo";
import { ArrowLeft, Plus, DollarSign, AlertCircle, ChevronDown, ChevronUp, FolderHeart } from "lucide-react";
import { toast } from "sonner";
import { calculateHSAEligibility } from "@/lib/hsaCalculations";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LinkToIncidentDialog } from "@/components/expense/LinkToIncidentDialog";

const InvoicePaymentListEnhanced = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [simpleExpenses, setSimpleExpenses] = useState<any[]>([]);
  const [expandedIncidents, setExpandedIncidents] = useState<Set<string>>(new Set());
  
  // Filter states
  const [hideFullyReimbursed, setHideFullyReimbursed] = useState(true);
  const [hideFullyPaid, setHideFullyPaid] = useState(true);
  const [showOnlyHSAEligible, setShowOnlyHSAEligible] = useState(false);
  const [minUnpaidBalance, setMinUnpaidBalance] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch medical incidents with their invoices
      const { data: incidentData, error: incidentError } = await supabase
        .from("medical_incidents")
        .select(`
          *,
          invoices (
            *,
            payment_transactions (
              id,
              payment_date,
              amount,
              payment_source,
              is_reimbursed,
              reimbursed_date
            )
          )
        `)
        .order("incident_date", { ascending: false });

      if (incidentError) throw incidentError;

      // Fetch simple expenses (not linked to incidents)
      const { data: simpleData, error: simpleError } = await supabase
        .from("invoices")
        .select(`
          *,
          payment_transactions (
            id,
            payment_date,
            amount,
            payment_source,
            is_reimbursed,
            reimbursed_date
          )
        `)
        .is("medical_incident_id", null)
        .order("date", { ascending: false });

      if (simpleError) throw simpleError;

      setIncidents(incidentData || []);
      setSimpleExpenses(simpleData || []);
    } catch (error) {
      toast.error("Failed to load expenses");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleIncident = (id: string) => {
    const newExpanded = new Set(expandedIncidents);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIncidents(newExpanded);
  };

  const getIncidentStats = (incident: any) => {
    let totalInvoiced = 0;
    let totalPaidHSA = 0;
    let totalPaidOther = 0;
    let totalUnpaid = 0;

    incident.invoices?.forEach((invoice: any) => {
      const breakdown = calculateHSAEligibility(invoice, invoice.payment_transactions || []);
      totalInvoiced += breakdown.totalInvoiced;
      totalPaidHSA += breakdown.paidViaHSA;
      totalPaidOther += breakdown.paidViaOther;
      totalUnpaid += breakdown.unpaidBalance;
    });

    return { totalInvoiced, totalPaidHSA, totalPaidOther, totalUnpaid };
  };

  const getStatusEmoji = (paidHSA: number, paidOther: number, unpaid: number, total: number) => {
    if (paidHSA === total && total > 0) return "🟢"; // Fully reimbursed via HSA
    if (paidOther > 0 && unpaid === 0) return "🟡"; // Paid via other, recoverable
    if (unpaid > 0) return "🔴"; // Unpaid - strategic opportunity
    if (paidHSA > 0 && paidOther > 0) return "⚪"; // Partially paid mix
    return "🚫"; // Not HSA eligible or no data
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const stats = getIncidentStats(incident);
      
      if (hideFullyReimbursed && stats.totalPaidHSA === stats.totalInvoiced && stats.totalInvoiced > 0) {
        return false;
      }
      
      if (hideFullyPaid && stats.totalUnpaid === 0 && stats.totalInvoiced > 0) {
        return false;
      }
      
      if (showOnlyHSAEligible && !incident.is_hsa_eligible) {
        return false;
      }
      
      if (minUnpaidBalance > 0 && stats.totalUnpaid < minUnpaidBalance) {
        return false;
      }
      
      return true;
    });
  }, [incidents, hideFullyReimbursed, hideFullyPaid, showOnlyHSAEligible, minUnpaidBalance]);

  const filteredSimpleExpenses = useMemo(() => {
    return simpleExpenses.filter(expense => {
      const breakdown = calculateHSAEligibility(expense, expense.payment_transactions || []);
      
      if (hideFullyReimbursed && breakdown.paidViaHSA === breakdown.totalInvoiced && breakdown.totalInvoiced > 0) {
        return false;
      }
      
      if (hideFullyPaid && breakdown.unpaidBalance === 0 && breakdown.totalInvoiced > 0) {
        return false;
      }
      
      if (showOnlyHSAEligible && !expense.is_hsa_eligible) {
        return false;
      }
      
      if (minUnpaidBalance > 0 && breakdown.unpaidBalance < minUnpaidBalance) {
        return false;
      }
      
      return true;
    });
  }, [simpleExpenses, hideFullyReimbursed, hideFullyPaid, showOnlyHSAEligible, minUnpaidBalance]);

  const aggregateStats = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaidHSA = 0;
    let totalPaidOther = 0;
    let totalUnpaid = 0;
    let totalHSAEligible = 0;

    incidents.forEach(incident => {
      incident.invoices?.forEach((invoice: any) => {
        const breakdown = calculateHSAEligibility(invoice, invoice.payment_transactions || []);
        totalInvoiced += breakdown.totalInvoiced;
        totalPaidHSA += breakdown.paidViaHSA;
        totalPaidOther += breakdown.paidViaOther;
        totalUnpaid += breakdown.unpaidBalance;
        totalHSAEligible += breakdown.hsaReimbursementEligible;
      });
    });

    simpleExpenses.forEach(expense => {
      const breakdown = calculateHSAEligibility(expense, expense.payment_transactions || []);
      totalInvoiced += breakdown.totalInvoiced;
      totalPaidHSA += breakdown.paidViaHSA;
      totalPaidOther += breakdown.paidViaOther;
      totalUnpaid += breakdown.unpaidBalance;
      totalHSAEligible += breakdown.hsaReimbursementEligible;
    });

    return { totalInvoiced, totalPaidHSA, totalPaidOther, totalUnpaid, totalHSAEligible };
  }, [incidents, simpleExpenses]);

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
            <Button onClick={() => navigate("/expenses/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Invoice
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5 mb-6">
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

        {/* Filter Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Filter Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hideFullyReimbursed"
                  checked={hideFullyReimbursed}
                  onCheckedChange={(checked) => setHideFullyReimbursed(checked as boolean)}
                />
                <Label htmlFor="hideFullyReimbursed" className="text-sm cursor-pointer">
                  Hide fully reimbursed
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hideFullyPaid"
                  checked={hideFullyPaid}
                  onCheckedChange={(checked) => setHideFullyPaid(checked as boolean)}
                />
                <Label htmlFor="hideFullyPaid" className="text-sm cursor-pointer">
                  Hide fully paid invoices
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showOnlyHSAEligible"
                  checked={showOnlyHSAEligible}
                  onCheckedChange={(checked) => setShowOnlyHSAEligible(checked as boolean)}
                />
                <Label htmlFor="showOnlyHSAEligible" className="text-sm cursor-pointer">
                  Show only HSA-eligible
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="minUnpaidBalance" className="text-sm whitespace-nowrap">
                  Min unpaid: $
                </Label>
                <input
                  id="minUnpaidBalance"
                  type="number"
                  min="0"
                  step="10"
                  value={minUnpaidBalance}
                  onChange={(e) => setMinUnpaidBalance(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-sm border rounded"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Incidents Section */}
        {filteredIncidents.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Medical Incidents (Grouped)</CardTitle>
              <CardDescription>
                Complex medical events with multiple invoices and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredIncidents.map((incident) => {
                  const stats = getIncidentStats(incident);
                  const isExpanded = expandedIncidents.has(incident.id);
                  const emoji = getStatusEmoji(stats.totalPaidHSA, stats.totalPaidOther, stats.totalUnpaid, stats.totalInvoiced);

                  return (
                    <Collapsible key={incident.id} open={isExpanded} onOpenChange={() => toggleIncident(incident.id)}>
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
                                <FolderHeart className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">{emoji} {incident.title}</p>
                                    {incident.is_hsa_eligible && (
                                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                        HSA Eligible
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                    <span>{incident.incident_type.replace('_', ' ')}</span>
                                    <span>•</span>
                                    <span>{new Date(incident.incident_date).toLocaleDateString()}</span>
                                    <span>•</span>
                                     <span>{incident.invoices?.length || 0} invoice(s)</span>
                                   </div>
                                 </div>
                               </div>

                              <div className="text-right">
                                <div className="text-lg font-bold">${stats.totalInvoiced.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  HSA: ${stats.totalPaidHSA.toFixed(2)} • Other: ${stats.totalPaidOther.toFixed(2)} • Unpaid: ${stats.totalUnpaid.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="border-t bg-muted/20 p-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/incident/${incident.id}`);
                              }}
                            >
                              View Full Details
                            </Button>
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Simple Expenses Section */}
        {filteredSimpleExpenses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Simple Invoices (Flat List)</CardTitle>
              <CardDescription>
                Standalone medical bills and invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredSimpleExpenses.map((expense) => {
                  const breakdown = calculateHSAEligibility(expense, expense.payment_transactions || []);
                  const emoji = getStatusEmoji(breakdown.paidViaHSA, breakdown.paidViaOther, breakdown.unpaidBalance, breakdown.totalInvoiced);

                  return (
                    <div 
                      key={expense.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/invoice/${expense.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{emoji}</span>
                          <p className="font-medium">{expense.vendor}</p>
                          {expense.is_hsa_eligible && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                              HSA
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {expense.category} • {new Date(expense.date).toLocaleDateString()}
                          {breakdown.paidViaHSA > 0 && <> • Paid via HSA: ${breakdown.paidViaHSA.toFixed(2)}</>}
                          {breakdown.paidViaOther > 0 && <> • Paid via Other: ${breakdown.paidViaOther.toFixed(2)} (💰 Recoverable)</>}
                          {breakdown.unpaidBalance > 0 && <> • Unpaid: ${breakdown.unpaidBalance.toFixed(2)} (🎯 Pay & Reimburse)</>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">${breakdown.totalInvoiced.toFixed(2)}</p>
                      <LinkToIncidentDialog 
                        invoiceId={expense.id}
                        currentIncidentId={expense.medical_incident_id}
                        onLinked={fetchData}
                      />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {filteredIncidents.length === 0 && filteredSimpleExpenses.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {incidents.length === 0 && simpleExpenses.length === 0
                  ? "No expenses yet. Start tracking your medical expenses!"
                  : "No expenses match your current filters. Try adjusting the filters above."}
              </p>
              <Button onClick={() => navigate("/expenses/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Expense
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InvoicePaymentListEnhanced;