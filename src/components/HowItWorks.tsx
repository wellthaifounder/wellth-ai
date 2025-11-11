import { Camera, TrendingUp, AlertCircle, CreditCard, FileText, Wallet, Calculator, FileCheck, Sparkles } from "lucide-react";

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            How Wellth Works for Everyone
          </h2>
          <p className="text-lg text-muted-foreground sm:text-xl">
            Smart tools that save you money—with bonus features for HSA users
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          {/* Dual Timeline */}
          <div className="grid gap-12 md:grid-cols-2">
            {/* Left Column: Everyone */}
            <div className="space-y-8">
              <div className="sticky top-24">
                <h3 className="text-2xl font-bold mb-6 text-center md:text-left">
                  For Everyone
                </h3>
              </div>

              {/* Step 1 */}
              <div className="relative pl-8 border-l-2 border-primary/30">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <div className="pb-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="mb-2 text-lg font-semibold">Capture Expenses</h4>
                  <p className="text-sm text-muted-foreground">
                    Snap photos of receipts or connect your bank. We automatically extract and categorize everything.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative pl-8 border-l-2 border-primary/30">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <div className="pb-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <AlertCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="mb-2 text-lg font-semibold">Catch Billing Errors</h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI scans for duplicate charges, incorrect codes, and overcharges. We'll show you exactly what's wrong.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative pl-8 border-l-2 border-primary/30">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <div className="pb-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="mb-2 text-lg font-semibold">Optimize Payment Strategy</h4>
                  <p className="text-sm text-muted-foreground">
                    Get personalized recommendations on which card to use to maximize rewards and minimize interest.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative pl-8">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  4
                </div>
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="mb-2 text-lg font-semibold">Track & Report</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate tax-compliant reports, see spending trends, and claim every eligible deduction.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: HSA Bonus Features */}
            <div className="space-y-8 md:border-l-2 md:border-dashed md:border-primary/20 md:pl-8">
              <div className="sticky top-24">
                <h3 className="text-2xl font-bold mb-6 text-center md:text-left flex items-center gap-2">
                  <span>Bonus for HSA Users</span>
                  <Sparkles className="h-6 w-6 text-primary" />
                </h3>
              </div>

              {/* HSA Step 1 */}
              <div className="opacity-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="mb-2 font-semibold">Strategic Reimbursement</h4>
                  <p className="text-sm text-muted-foreground">
                    Get AI recommendations on when to reimburse (now vs. later) to maximize your HSA investment growth.
                  </p>
                </div>
              </div>

              {/* HSA Step 2 */}
              <div className="opacity-0 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="mb-2 font-semibold">Investment Vault Tracker</h4>
                  <p className="text-sm text-muted-foreground">
                    Track your HSA investment growth alongside eligible expenses. See your "vault" balance grow over time.
                  </p>
                </div>
              </div>

              {/* HSA Step 3 */}
              <div className="opacity-0 animate-fade-in" style={{ animationDelay: "0.6s" }}>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Calculator className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="mb-2 font-semibold">Savings Calculator</h4>
                  <p className="text-sm text-muted-foreground">
                    Model "what-if" scenarios: Should you pay from HSA or out-of-pocket? See the long-term tax impact.
                  </p>
                </div>
              </div>

              {/* HSA Step 4 */}
              <div className="opacity-0 animate-fade-in" style={{ animationDelay: "0.8s" }}>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <FileCheck className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="mb-2 font-semibold">One-Click Reimbursement PDFs</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate IRS-compliant reimbursement packets with receipts attached. Submit to your HSA provider instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mx-auto max-w-2xl text-center mt-16 p-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <h3 className="text-2xl font-bold mb-3">Start saving today—no HSA required</h3>
          <p className="text-muted-foreground mb-6">
            Join thousands of people who are taking control of their healthcare costs
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.href = "/auth"}
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started Free
            </button>
            <button
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              className="px-6 py-3 rounded-lg bg-background border border-border font-medium hover:bg-accent transition-colors"
            >
              View Pricing
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};