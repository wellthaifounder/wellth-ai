import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface TimelineEvent {
  date: string;
  status: string;
  note: string;
}

interface DisputeTimelineProps {
  timeline: TimelineEvent[];
  currentStatus: string;
}

const statusConfig = {
  draft: { label: "Draft", icon: Circle, color: "text-muted-foreground" },
  submitted: { label: "Submitted", icon: Clock, color: "text-blue-500" },
  provider_reviewing: { label: "Provider Reviewing", icon: Clock, color: "text-yellow-500" },
  awaiting_response: { label: "Awaiting Response", icon: Clock, color: "text-orange-500" },
  resolved_favorable: { label: "Resolved - Favorable", icon: CheckCircle2, color: "text-green-500" },
  resolved_unfavorable: { label: "Resolved - Unfavorable", icon: AlertCircle, color: "text-red-500" },
  withdrawn: { label: "Withdrawn", icon: Circle, color: "text-muted-foreground" }
};

export function DisputeTimeline({ timeline, currentStatus }: DisputeTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispute Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((event, index) => {
            const config = statusConfig[event.status as keyof typeof statusConfig] || statusConfig.draft;
            const StatusIcon = config.icon;
            const isLast = index === timeline.length - 1;

            return (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center ${
                    event.status === currentStatus 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-border bg-background'
                  }`}>
                    <StatusIcon className={`h-5 w-5 ${event.status === currentStatus ? '' : config.color}`} />
                  </div>
                  {!isLast && (
                    <div className="w-[2px] h-12 bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{config.label}</h4>
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(event.date), 'MMM d, yyyy')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
