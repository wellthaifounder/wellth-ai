import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WellthLogo } from "@/components/WellthLogo";
import { ArrowLeft, Zap, FolderHeart } from "lucide-react";

const ExpenseDecision = () => {
  const navigate = useNavigate();

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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Add a Medical Invoice or Bill</h1>
          <p className="text-muted-foreground">
            Choose the right entry method based on your situation
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card 
            className="cursor-pointer hover:border-primary transition-all hover:shadow-lg group"
            onClick={() => navigate("/expense/quick")}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit group-hover:bg-primary/20 transition-colors">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Quick Add - Simple Invoice</CardTitle>
              <CardDescription>Perfect for straightforward bills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground font-medium">Best for:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Over-the-counter purchases (vitamins, bandages, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Single doctor copays</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Prescriptions from one pharmacy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Simple one-time invoices</span>
                </li>
              </ul>
              <div className="pt-4">
                <Button className="w-full" onClick={() => navigate("/expense/quick")}>
                  Quick Add (30 seconds)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary transition-all hover:shadow-lg group"
            onClick={() => navigate("/incident/new")}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit group-hover:bg-primary/20 transition-colors">
                <FolderHeart className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Medical Incident - Complex Event</CardTitle>
              <CardDescription>For events with multiple providers or payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground font-medium">Best for:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Surgeries or procedures (multiple bills expected)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Chronic condition treatment (ongoing invoices)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Emergency room visits (multiple providers)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Expenses you want to track together</span>
                </li>
              </ul>
              <div className="pt-4">
                <Button className="w-full" onClick={() => navigate("/incident/new")}>
                  Create Medical Incident
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">💡 Not sure which to choose?</h3>
          <p className="text-sm text-muted-foreground">
            Start with <strong>Quick Add</strong> for simple invoices. You can always create a Medical Incident later 
            to group related invoices together for better tracking and HSA reimbursement optimization.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDecision;