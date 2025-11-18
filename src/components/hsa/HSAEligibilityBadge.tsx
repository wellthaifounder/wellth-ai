import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { formatHSAAccountDateRange } from "@/lib/hsaAccountUtils";
import type { HSAAccount } from "@/lib/hsaAccountUtils";

type HSAEligibilityBadgeProps = {
  isEligible: boolean;
  eligibleAccounts: HSAAccount[];
  requiresSelection?: boolean;
  message?: string | null;
  compact?: boolean;
};

export function HSAEligibilityBadge({
  isEligible,
  eligibleAccounts,
  requiresSelection = false,
  message,
  compact = false,
}: HSAEligibilityBadgeProps) {
  if (!isEligible) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              {!compact && "Not Eligible"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{message || "Not eligible for HSA reimbursement"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (requiresSelection) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
              <AlertCircle className="h-3 w-3" />
              {!compact && "Select Account"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm font-medium mb-2">Multiple HSA accounts eligible:</p>
            <ul className="text-sm space-y-1">
              {eligibleAccounts.map((account) => (
                <li key={account.id}>
                  • {account.account_name}
                  <span className="text-muted-foreground ml-1">
                    ({formatHSAAccountDateRange(account)})
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Please select which account to use.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            {!compact && (eligibleAccounts.length === 1 ? eligibleAccounts[0].account_name : "HSA Eligible")}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {eligibleAccounts.length === 1 ? (
            <>
              <p className="text-sm font-medium">{eligibleAccounts[0].account_name}</p>
              <p className="text-sm text-muted-foreground">
                {formatHSAAccountDateRange(eligibleAccounts[0])}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium mb-2">Eligible HSA accounts:</p>
              <ul className="text-sm space-y-1">
                {eligibleAccounts.map((account) => (
                  <li key={account.id}>
                    • {account.account_name}
                    <span className="text-muted-foreground ml-1">
                      ({formatHSAAccountDateRange(account)})
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
