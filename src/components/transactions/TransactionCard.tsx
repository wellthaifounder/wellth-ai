import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Tag, Link2, XCircle, RotateCcw, ListRestart } from "lucide-react";
import { format } from "date-fns";

interface TransactionCardProps {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  description: string;
  isMedical: boolean;
  reconciliationStatus: "unlinked" | "linked_to_invoice" | "ignored";
  isHsaEligible: boolean;
  onViewDetails: () => void;
  onMarkMedical?: () => void;
  onLinkToInvoice?: () => void;
  onToggleMedical?: () => void;
  onIgnore?: () => void;
  onUnignore?: () => void;
  onAddToReviewQueue?: () => void;
}

export function TransactionCard({
  date,
  vendor,
  amount,
  description,
  isMedical,
  reconciliationStatus,
  isHsaEligible,
  onViewDetails,
  onMarkMedical,
  onLinkToInvoice,
  onToggleMedical,
  onIgnore,
  onUnignore,
  onAddToReviewQueue,
}: TransactionCardProps) {
  const getStatusBadge = () => {
    switch (reconciliationStatus) {
      case "linked_to_invoice":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Tracked</Badge>;
      case "unlinked":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">Needs Linking</Badge>;
      case "ignored":
        return (
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-muted transition-colors"
            onClick={onUnignore}
            title="Click to unignore"
          >
            Ignored ✕
          </Badge>
        );
    }
  };

  const getStatusIndicator = () => {
    switch (reconciliationStatus) {
      case "linked_to_invoice":
        return "🟢";
      case "unlinked":
        return "🟡";
      case "ignored":
        return "⚪";
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getStatusIndicator()}</span>
            <p className="font-medium text-foreground truncate">{vendor || description}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="text-sm text-muted-foreground">
              {format(new Date(date), "MMM d, yyyy")}
            </p>
            {getStatusBadge()}
            {isMedical ? (
              <Badge 
                variant="secondary" 
                className="cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={onToggleMedical}
                title="Click to toggle medical status"
              >
                Medical ✓
              </Badge>
            ) : (
              <Badge 
                variant="outline"
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={onToggleMedical}
                title="Click to mark as medical"
              >
                Mark Medical
              </Badge>
            )}
            {isHsaEligible && (
              <Badge className="bg-primary/10 text-primary">HSA Eligible</Badge>
            )}
          </div>

          {vendor && vendor !== description && (
            <p className="text-sm text-muted-foreground truncate">{description}</p>
          )}
        </div>

        <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
          <p className="text-lg font-semibold text-foreground">
            ${Math.abs(amount).toFixed(2)}
          </p>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background z-50">
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              
              {onMarkMedical && !isMedical && (
                <DropdownMenuItem onClick={onMarkMedical}>
                  <Tag className="h-4 w-4 mr-2" />
                  Mark as Medical
                </DropdownMenuItem>
              )}
              
              {onLinkToInvoice && reconciliationStatus === "unlinked" && (
                <DropdownMenuItem onClick={onLinkToInvoice}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Link to Bill
                </DropdownMenuItem>
              )}

              {reconciliationStatus !== "unlinked" && onAddToReviewQueue && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onAddToReviewQueue}>
                    <ListRestart className="h-4 w-4 mr-2" />
                    Add to Review Queue
                  </DropdownMenuItem>
                </>
              )}

              {reconciliationStatus === "ignored" && onUnignore && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onUnignore}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Unignore
                  </DropdownMenuItem>
                </>
              )}

              {onIgnore && reconciliationStatus !== "ignored" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onIgnore} className="text-destructive">
                    <XCircle className="h-4 w-4 mr-2" />
                    Ignore
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
