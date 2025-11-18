import { Split } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SplitIndicatorProps {
  splitCount?: number;
}

export function SplitIndicator({ splitCount }: SplitIndicatorProps) {
  if (!splitCount) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="gap-1">
            <Split className="h-3 w-3" />
            {splitCount}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Split into {splitCount} parts across different HSA accounts</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
