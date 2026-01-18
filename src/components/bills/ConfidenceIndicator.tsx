import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConfidenceIndicatorProps {
  confidence: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const getConfidenceLevel = (confidence: number) => {
  if (confidence >= 0.9) {
    return {
      level: "high",
      label: "High confidence",
      description: "AI is confident this is correct",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
    };
  }
  if (confidence >= 0.7) {
    return {
      level: "medium",
      label: "Medium confidence",
      description: "AI is fairly confident, please verify",
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      borderColor: "border-yellow-200",
    };
  }
  return {
    level: "low",
    label: "Low confidence",
    description: "AI is uncertain, needs verification",
    icon: HelpCircle,
    color: "text-red-500",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
  };
};

const sizeClasses = {
  sm: {
    icon: "h-3.5 w-3.5",
    text: "text-xs",
    badge: "px-1.5 py-0.5",
  },
  md: {
    icon: "h-4 w-4",
    text: "text-sm",
    badge: "px-2 py-1",
  },
  lg: {
    icon: "h-5 w-5",
    text: "text-base",
    badge: "px-2.5 py-1.5",
  },
};

export function ConfidenceIndicator({
  confidence,
  showLabel = false,
  size = "md",
  className,
}: ConfidenceIndicatorProps) {
  const config = getConfidenceLevel(confidence);
  const Icon = config.icon;
  const sizes = sizeClasses[size];
  const percentage = Math.round(confidence * 100);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full border",
              config.bgColor,
              config.borderColor,
              sizes.badge,
              className
            )}
          >
            <Icon className={cn(sizes.icon, config.color)} />
            {showLabel && (
              <span className={cn(sizes.text, config.color, "font-medium")}>
                {percentage}%
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">
              {config.description}
            </p>
            <p className="text-xs mt-1">{percentage}% confidence</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ConfidenceBar({
  confidence,
  className,
}: {
  confidence: number;
  className?: string;
}) {
  const config = getConfidenceLevel(confidence);
  const percentage = Math.round(confidence * 100);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">AI Confidence</span>
        <span className={cn("font-medium", config.color)}>{percentage}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            confidence >= 0.9
              ? "bg-green-500"
              : confidence >= 0.7
                ? "bg-yellow-500"
                : "bg-red-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
