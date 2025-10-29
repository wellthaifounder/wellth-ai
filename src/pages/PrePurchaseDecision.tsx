import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getPaymentRecommendation } from "@/lib/paymentRecommendation";
import { PaymentRecommendation } from "@/components/expense/PaymentRecommendation";
import { ArrowLeft, CreditCard, Receipt, TrendingUp, ChevronDown, AlertCircle, Calculator, Save, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WellthLogo } from "@/components/WellthLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const HSA_CATEGORIES = [
  "Doctor Visit",
  "Prescription",
  "Dental",
  "Vision",
  "Medical Equipment",
  "Lab Tests",
  "Hospital",
  "Physical Therapy",
  "Mental Health",
  "Other Medical",
  "Not HSA Eligible"
];

const PrePurchaseDecision = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentStrategy, setPaymentStrategy] = useState("immediate");
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced settings
  const [rewardsRate, setRewardsRate] = useState("2");
  const [investmentReturn, setInvestmentReturn] = useState("7");
  const [taxRate, setTaxRate] = useState("22");
  const [cardPayoffMonths, setCardPayoffMonths] = useState("1");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [hsaInvestmentYears, setHsaInvestmentYears] = useState("5");
  
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCalculate = () => {
    if (!amount || !category) return;
    
    // Update cardPayoffMonths based on strategy
    if (paymentStrategy === "immediate") setCardPayoffMonths("1");
    else if (paymentStrategy === "6-month") setCardPayoffMonths("6");
    else if (paymentStrategy === "12-month") setCardPayoffMonths("12");
    else if (paymentStrategy === "18-month") setCardPayoffMonths("18");
    
    setShowRecommendation(true);
  };

  const recommendation = useMemo(() => {
    if (!amount || !category || parseFloat(amount) <= 0) return null;
    
    return getPaymentRecommendation({
      amount: parseFloat(amount),
      category,
      isHsaEligible: category !== "Not HSA Eligible",
      rewardsRate: parseFloat(rewardsRate) / 100,
      taxRate: parseFloat(taxRate) / 100,
      investmentReturnRate: parseFloat(investmentReturn) / 100,
      cardPayoffMonths: parseFloat(cardPayoffMonths),
      monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment) : 0,
      hsaInvestmentYears: parseFloat(hsaInvestmentYears),
    });
  }, [amount, category, rewardsRate, taxRate, investmentReturn, cardPayoffMonths, monthlyPayment, hsaInvestmentYears]);

  const handleSaveDecision = async () => {
    if (!recommendation) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to save decisions");
        return;
      }

      const { error } = await supabase
        .from('expense_decisions')
        .insert({
          user_id: user.id,
          expense_amount: parseFloat(amount),
          payment_strategy: {
            ...recommendation,
            inputs: {
              category,
              rewardsRate: parseFloat(rewardsRate),
              taxRate: parseFloat(taxRate),
              investmentReturn: parseFloat(investmentReturn),
              cardPayoffMonths: parseFloat(cardPayoffMonths),
              hsaInvestmentYears: parseFloat(hsaInvestmentYears),
            }
          }
        });

      if (error) throw error;
      
      toast.success("Decision saved! You can apply it when entering this expense.", {
        action: {
          label: "Enter Expense Now",
          onClick: () => navigate('/expenses/new', { 
            state: { 
              savedDecision: {
                amount,
                category,
                cardPayoffMonths,
                hsaInvestmentYears,
                recommendation
              }
            }
          })
        }
      });
    } catch (error) {
      console.error('Error saving decision:', error);
      toast.error("Failed to save decision");
    } finally {
      setSaving(false);
    }
  };

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
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <Calculator className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Pre-Purchase Decision Tool</h1>
            <p className="text-muted-foreground">
              Get instant recommendations on how to pay for maximum savings
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Enter Expense Details</CardTitle>
              <CardDescription>
                Tell us about your upcoming expense to get personalized payment advice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Expected Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Expense Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {HSA_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-strategy">Payment Strategy</Label>
                  <Select value={paymentStrategy} onValueChange={setPaymentStrategy}>
                    <SelectTrigger id="payment-strategy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Pay Immediately (30 days)</SelectItem>
                      <SelectItem value="6-month">0% APR for 6 months</SelectItem>
                      <SelectItem value="12-month">0% APR for 12 months</SelectItem>
                      <SelectItem value="18-month">0% APR for 18 months</SelectItem>
                      <SelectItem value="custom">Custom Timeline</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How long until you'll pay off the credit card?
                  </p>
                </div>

                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full flex items-center justify-between">
                      <span>Advanced Settings</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="rewards-rate">Credit Card Rewards Rate (%)</Label>
                      <Input
                        id="rewards-rate"
                        type="number"
                        step="0.1"
                        value={rewardsRate}
                        onChange={(e) => setRewardsRate(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Cash back or points value you earn
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tax-rate">Marginal Tax Rate (%)</Label>
                      <Input
                        id="tax-rate"
                        type="number"
                        step="0.1"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your federal + state tax bracket
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="investment-return">HSA Investment Return (% annual)</Label>
                      <Input
                        id="investment-return"
                        type="number"
                        step="0.1"
                        value={investmentReturn}
                        onChange={(e) => setInvestmentReturn(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Expected annual return during investment horizon (from purchase to reimbursement)
                      </p>
                    </div>

                    {paymentStrategy === "custom" && (
                      <div className="space-y-2">
                        <Label htmlFor="card-payoff">Card Payoff Period (months)</Label>
                        <Input
                          id="card-payoff"
                          type="number"
                          step="1"
                          min="1"
                          value={cardPayoffMonths}
                          onChange={(e) => setCardPayoffMonths(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          How many months to pay off the card
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="monthly-payment">Monthly Payment (optional)</Label>
                      <Input
                        id="monthly-payment"
                        type="number"
                        step="0.01"
                        placeholder="Leave empty if paying in full"
                        value={monthlyPayment}
                        onChange={(e) => setMonthlyPayment(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        If you'll make monthly payments, enter the amount. Calculation will use declining balance.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hsa-years">Investment Horizon (years)</Label>
                      <Input
                        id="hsa-years"
                        type="number"
                        step="1"
                        min="1"
                        value={hsaInvestmentYears}
                        onChange={(e) => setHsaInvestmentYears(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Years from now until you reimburse from HSA (can be decades later)
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <Button 
                onClick={handleCalculate} 
                disabled={!amount || !category || parseFloat(amount) <= 0}
                className="w-full"
                size="lg"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Get Recommendation
              </Button>
            </CardContent>
          </Card>

          {showRecommendation && recommendation && (
            <>
              <PaymentRecommendation recommendation={recommendation} />
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleSaveDecision}
                  disabled={saving}
                  variant="outline"
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save This Decision"}
                </Button>
                <Button 
                  onClick={() => navigate('/expenses/new', { 
                    state: { 
                      savedDecision: {
                        amount,
                        category,
                        cardPayoffMonths,
                        hsaInvestmentYears,
                        recommendation
                      }
                    }
                  })}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Enter Expense Now
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Action Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recommendation.method === "hsa-invest" && (
                    <>
                      <div className="flex items-start gap-2">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <CreditCard className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Use your rewards card</p>
                          <p className="text-xs text-muted-foreground">
                            Pay with your best rewards card to earn cash back immediately
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <Receipt className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Save all receipts</p>
                          <p className="text-xs text-muted-foreground">
                            Keep detailed records - you'll need them for HSA reimbursement
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Let your HSA grow</p>
                          <p className="text-xs text-muted-foreground">
                            Keep funds invested - reimburse yourself later for maximum benefit
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {recommendation.method === "rewards-card" && (
                    <div className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Use your rewards card</p>
                        <p className="text-xs text-muted-foreground">
                          Maximize your cash back since this isn't HSA-eligible
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                <CardHeader>
                  <CardTitle className="text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                    Important Disclaimers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    <strong>HSA Reimbursement Rules:</strong> You can only reimburse expenses incurred AFTER your HSA was opened. Keep receipts indefinitely - there's no time limit on when you can reimburse yourself.
                  </p>
                  <p>
                    <strong>Credit Card Warning:</strong> This strategy assumes you pay off your credit card on time. Late payments or interest charges will eliminate all benefits.
                  </p>
                  <p>
                    <strong>Investment Risk:</strong> Investment returns are not guaranteed. Actual returns may be higher or lower than estimates. HSA investments can lose value.
                  </p>
                  <p>
                    <strong>Tax Advice:</strong> This calculator provides estimates only. Consult a tax professional for advice specific to your situation.
                  </p>
                  <p>
                    <strong>Assumptions:</strong> Calculations assume constant investment returns and that you have sufficient HSA contributions to cover the expense. Your actual results will vary.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrePurchaseDecision;
