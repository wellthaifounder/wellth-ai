import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  title: string;
  description: string | null;
  total_billed: number;
  total_paid: number;
  user_responsibility_override: number | null;
  hsa_eligible_amount: number;
  icon: string;
  color: string;
  created_at: string;
  document_count?: number;
  invoice_count?: number;
}

interface CollectionCardProps {
  collection: Collection;
  onClick?: () => void;
}

export function CollectionCard({ collection, onClick }: CollectionCardProps) {
  const outstandingBalance = collection.user_responsibility_override !== null
    ? collection.user_responsibility_override
    : collection.total_billed - collection.total_paid;

  const paymentProgress = collection.total_billed > 0
    ? Math.min((collection.total_paid / collection.total_billed) * 100, 100)
    : 0;

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{collection.title}</CardTitle>
            {collection.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {collection.description}
              </p>
            )}
          </div>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-sm"
            style={{ backgroundColor: collection.color || '#3B82F6' }}
          >
            {collection.icon === 'folder' ? '📁' : collection.icon || '📁'}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Financial Summary */}
        {collection.total_billed > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Progress</span>
              <span className="font-medium">{paymentProgress.toFixed(0)}%</span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Billed</p>
            <p className="text-lg font-semibold">${collection.total_billed.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className={cn(
              "text-lg font-semibold",
              outstandingBalance > 0 ? "text-destructive" : "text-green-600"
            )}>
              ${outstandingBalance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* HSA Eligibility */}
        {collection.hsa_eligible_amount > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">HSA Eligible</span>
              <span className="text-sm font-medium text-green-600">
                ${collection.hsa_eligible_amount.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Document/Invoice Count */}
        <div className="flex items-center gap-4 pt-2 border-t text-sm text-muted-foreground">
          {collection.invoice_count !== undefined && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {collection.invoice_count} bill{collection.invoice_count !== 1 ? "s" : ""}
            </span>
          )}
          {collection.document_count !== undefined && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {collection.document_count} doc{collection.document_count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
