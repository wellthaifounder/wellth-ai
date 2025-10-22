import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface LabelBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
  className?: string;
}

export const LabelBadge = ({ name, color, onRemove, className }: LabelBadgeProps) => {
  return (
    <Badge
      variant="secondary"
      className={className}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}40`,
      }}
    >
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:opacity-70"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
};
