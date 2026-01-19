import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Building2,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface MedicalEvent {
  id: string;
  title: string;
  event_date: string | null;
  event_type: string;
  primary_provider: string | null;
  description: string | null;
  total_billed: number;
  total_paid: number;
  user_responsibility_override: number | null;
  hsa_eligible_amount: number;
  status: string;
  created_at: string;
  document_count?: number;
  invoice_count?: number;
}

interface EventCardProps {
  event: MedicalEvent;
  onClick?: () => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  surgery: "Surgery",
  office_visit: "Office Visit",
  emergency: "Emergency",
  ongoing_treatment: "Ongoing Treatment",
  lab_test: "Lab Test",
  imaging: "Imaging",
  physical_therapy: "Physical Therapy",
  dental: "Dental",
  vision: "Vision",
  prescription: "Prescription",
  other: "Other",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  active: { label: "Active", variant: "default", icon: Clock },
  resolved: { label: "Resolved", variant: "secondary", icon: CheckCircle2 },
  disputed: { label: "Disputed", variant: "destructive", icon: AlertCircle },
  archived: { label: "Archived", variant: "outline", icon: FileText },
};

export function EventCard({ event, onClick }: EventCardProps) {
  const outstandingBalance = event.user_responsibility_override !== null
    ? event.user_responsibility_override
    : event.total_billed - event.total_paid;

  const paymentProgress = event.total_billed > 0
    ? Math.min((event.total_paid / event.total_billed) * 100, 100)
    : 0;

  const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all cursor-pointer",
        event.status === "disputed" && "border-destructive/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{event.title}</CardTitle>
            {event.event_date && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(event.event_date), "MMM d, yyyy")}
              </p>
            )}
          </div>
          <Badge variant={statusConfig.variant} className="shrink-0">
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event Details */}
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="outline" className="font-normal">
            {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
          </Badge>
          {event.primary_provider && (
            <Badge variant="outline" className="font-normal">
              <Building2 className="h-3 w-3 mr-1" />
              {event.primary_provider}
            </Badge>
          )}
        </div>

        {/* Financial Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment Progress</span>
            <span className="font-medium">{paymentProgress.toFixed(0)}%</span>
          </div>
          <Progress value={paymentProgress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Billed</p>
            <p className="text-lg font-semibold">${event.total_billed.toFixed(2)}</p>
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
        {event.hsa_eligible_amount > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">HSA Eligible</span>
              <span className="text-sm font-medium text-green-600">
                ${event.hsa_eligible_amount.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Document/Invoice Count */}
        <div className="flex items-center gap-4 pt-2 border-t text-sm text-muted-foreground">
          {event.invoice_count !== undefined && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {event.invoice_count} bill{event.invoice_count !== 1 ? "s" : ""}
            </span>
          )}
          {event.document_count !== undefined && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {event.document_count} doc{event.document_count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
