import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Receipt, CreditCard, PiggyBank } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TotalValueCardProps {
  taxSavings: number;
  disputeSavings: number;
  rewardsEarned: number;
  paymentOptimizations: number;
  hasHSA: boolean;
}

export function TotalValueCard({
  taxSavings,
  disputeSavings,
  rewardsEarned,
  paymentOptimizations,
  hasHSA
}: TotalValueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate total value created
  const totalValue = hasHSA
    ? taxSavings + disputeSavings + rewardsEarned + paymentOptimizations
    : disputeSavings + rewardsEarned;

  return (
    <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Value Created
              </CardTitle>
              <div className="text-4xl font-black text-foreground mt-1">
                ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs">
                {isExpanded ? 'Hide' : 'View'} Breakdown
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        <CardDescription className="mt-2">
          Your total savings and benefits from using Wellth.ai
        </CardDescription>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3 border-t pt-4">
              {disputeSavings > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Errors Found & Disputed</p>
                      <p className="text-xs text-muted-foreground">Billing overcharges recovered</p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${disputeSavings.toLocaleString()}
                  </div>
                </div>
              )}

              {rewardsEarned > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Rewards Earned</p>
                      <p className="text-xs text-muted-foreground">Credit card rewards</p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    ${rewardsEarned.toLocaleString()}
                  </div>
                </div>
              )}

              {paymentOptimizations > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Payment Optimizations</p>
                      <p className="text-xs text-muted-foreground">Smart payment strategies</p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ${paymentOptimizations.toLocaleString()}
                  </div>
                </div>
              )}

              {hasHSA && taxSavings > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <PiggyBank className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">HSA Tax Savings</p>
                      <p className="text-xs text-muted-foreground">Tax-free healthcare benefits</p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    ${taxSavings.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
