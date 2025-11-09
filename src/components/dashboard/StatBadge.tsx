import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatBadgeProps {
  icon: string;
  value: string | number;
  label: string;
  variant?: "default" | "success" | "accent" | "info";
  className?: string;
}

export function StatBadge({ icon, value, label, variant = "default", className }: StatBadgeProps) {
  return (
    <Card className={cn(
      "px-3 py-2 flex items-center gap-2 border-border/50",
      variant === "success" && "bg-success/5 border-success/20",
      variant === "accent" && "bg-accent/5 border-accent/20",
      variant === "info" && "bg-primary/5 border-primary/20",
      className
    )}>
      <span className="text-xl">{icon}</span>
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-none">{value}</span>
        <span className="text-xs text-muted-foreground leading-none mt-0.5">{label}</span>
      </div>
    </Card>
  );
}
