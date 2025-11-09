import { Card } from "@/components/ui/card";
import { StatBadge } from "./StatBadge";

interface DashboardCompactHeaderProps {
  firstName: string;
  stats: Array<{
    icon: string;
    value: string | number;
    label: string;
    variant?: "default" | "success" | "accent" | "info";
  }>;
}

export function DashboardCompactHeader({ firstName, stats }: DashboardCompactHeaderProps) {
  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold">👋 Hi {firstName}!</h1>
        
        <div className="flex flex-wrap gap-2">
          {stats.map((stat, index) => (
            <StatBadge
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              variant={stat.variant}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
