import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface GenericSkeletonProps {
  rows?: number;
  showHeader?: boolean;
  className?: string;
}

/**
 * Generic skeleton loader for content areas
 * Use instead of spinners for better UX
 */
export const GenericSkeleton = ({ 
  rows = 3, 
  showHeader = true,
  className = "" 
}: GenericSkeletonProps) => {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

/**
 * Skeleton for stat cards
 */
export const StatCardSkeleton = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
};

/**
 * Skeleton for list items
 */
export const ListItemSkeleton = () => {
  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-9 w-20" />
    </div>
  );
};

/**
 * Skeleton for form fields
 */
export const FormFieldSkeleton = () => {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
};

/**
 * Skeleton for tables
 */
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 pb-2 border-b">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
};
