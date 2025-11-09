import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableCardProps {
  id: string;
  children: React.ReactNode;
  isDragging?: boolean;
}

export function SortableCard({ id, children, isDragging }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBeingDragged = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isBeingDragged && "opacity-50 z-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute -left-8 top-4 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity",
          "touch-none"
        )}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground" />
      </div>
      <div className={cn(isBeingDragged && "shadow-lg")}>
        {children}
      </div>
    </div>
  );
}
