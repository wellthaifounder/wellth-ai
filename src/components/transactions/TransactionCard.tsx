import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link2, Eye, Tag } from "lucide-react";
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
  onMarkMedical: () => void;
  onLinkToInvoice: () => void;
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
}: TransactionCardProps) {
  const getStatusBadge = () => {
    switch (reconciliationStatus) {
      case "linked_to_invoice":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Tracked</Badge>;
      case "unlinked":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">Needs Linking</Badge>;
      case "ignored":
        return <Badge variant="outline">Ignored</Badge>;
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
    <Card className="p-4 hover:shadow-md transition-shadow">
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
            {isMedical && (
              <Badge variant="secondary">Medical</Badge>
            )}
            {isHsaEligible && (
              <Badge className="bg-primary/10 text-primary">HSA Eligible</Badge>
            )}
          </div>

          {vendor && vendor !== description && (
            <p className="text-sm text-muted-foreground truncate">{description}</p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-lg font-semibold text-foreground mb-2">
            ${Math.abs(amount).toFixed(2)}
          </p>
          
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onViewDetails}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {!isMedical && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onMarkMedical}
                className="h-8 w-8 p-0"
              >
                <Tag className="h-4 w-4" />
              </Button>
            )}
            
            {reconciliationStatus === "unlinked" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onLinkToInvoice}
                className="h-8 w-8 p-0"
              >
                <Link2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
