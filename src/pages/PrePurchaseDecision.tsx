import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WellthLogo } from "@/components/WellthLogo";
import { ArrowLeft, TrendingUp, CreditCard, Calculator } from "lucide-react";
import { getPaymentRecommendation } from "@/lib/paymentRecommendation";
import { PaymentRecommendation } from "@/components/expense/PaymentRecommendation";

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
  const [hasHsaCard, setHasHsaCard] = useState<boolean | null>(null);
  const [rewardsRate, setRewardsRate] = useState("2");
  const [showRecommendation, setShowRecommendation] = useState(false);

  const handleCalculate = () => {
    if (!amount || !category) return;
    setShowRecommendation(true);
  };

  const recommendation = amount && category && parseFloat(amount) > 0
    ? getPaymentRecommendation({
        amount: parseFloat(amount),
        category,
        isHsaEligible: category !== "Not HSA Eligible",
        hasRewardsCard: true,
        rewardsRate: parseFloat(rewardsRate) / 100,
      })
    : null;

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
                    <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="rewards-rate">Your Credit Card Rewards Rate (%)</Label>
                <Input
                  id="rewards-rate"
                  type="number"
                  step="0.1"
                  placeholder="2.0"
                  value={rewardsRate}
                  onChange={(e) => setRewardsRate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your card's cash back or points earning rate (e.g., 2 for 2%)
                </p>
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
            <PaymentRecommendation recommendation={recommendation} />
          )}

          {showRecommendation && recommendation && (
            <Card className="bg-accent/50">
              <CardHeader>
                <CardTitle className="text-lg">Quick Action Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Make the purchase as recommended</p>
                    <p className="text-sm text-muted-foreground">
                      {recommendation.method === "hsa-invest" 
                        ? "Use your rewards credit card for this purchase"
                        : "Use your HSA card or preferred payment method"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Track the expense immediately</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate("/expenses/new")}
                      className="mt-2"
                    >
                      Add to Expense Tracker
                    </Button>
                  </div>
                </div>

                {recommendation.method === "hsa-invest" && (
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Save receipt for future reimbursement</p>
                      <p className="text-sm text-muted-foreground">
                        You can reimburse yourself from your HSA anytime in the future - even years later!
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrePurchaseDecision;
