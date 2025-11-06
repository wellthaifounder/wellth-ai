import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const AnalyticsSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-7xl">
      {/* Back Button */}
      <div className="mb-6">
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-80" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-full max-w-2xl mt-4" />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Skeleton className="h-10 w-full max-w-3xl" />
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-28 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Large Chart */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
};
