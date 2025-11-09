import { Badge } from "@/components/ui/badge";

interface TabHeaderProps {
  title: string;
  icon?: string;
  badges?: Array<{
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  }>;
}

export function TabHeader({ title, icon, badges }: TabHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
        {icon && <span className="text-2xl">{icon}</span>}
        {title}
      </h2>
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, index) => (
            <Badge key={index} variant={badge.variant || "default"}>
              {badge.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
