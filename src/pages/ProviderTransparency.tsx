import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, TrendingUp, Users, DollarSign, MapPin, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProviderTransparency() {
  const navigate = useNavigate();

  // Fetch transparency metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ["transparency-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transparency_metrics")
        .select("*")
        .order("metric_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch top transparent providers
  const { data: topProvidersData, isLoading: providersLoading } = useQuery({
    queryKey: ["top-transparent-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .not("transparency_score", "is", null)
        .order("transparency_score", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Fetch aggregate stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["provider-stats"],
    queryFn: async () => {
      const { count: totalProviders } = await supabase
        .from("providers")
        .select("*", { count: "exact", head: true });

      const { count: totalReviews } = await supabase
        .from("provider_reviews")
        .select("*", { count: "exact", head: true });

      const { count: verifiedReviews } = await supabase
        .from("provider_reviews")
        .select("*", { count: "exact", head: true })
        .eq("is_verified_patient", true);

      const { data: savingsData } = await supabase
        .from("bill_disputes")
        .select("savings_achieved")
        .not("savings_achieved", "is", null);

      const totalSavings = savingsData?.reduce((sum, row) => sum + (row.savings_achieved || 0), 0) || 0;

      return {
        totalProviders: totalProviders || 0,
        totalReviews: totalReviews || 0,
        verifiedReviews: verifiedReviews || 0,
        totalSavings,
      };
    },
  });

  const isLoading = metricsLoading || providersLoading || statsLoading;

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Provider Transparency Dashboard</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Discover healthcare providers with fair pricing, accurate billing, and transparent practices — powered by real patient data.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Providers Analyzed</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{statsData?.totalProviders || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Reviews</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{statsData?.verifiedReviews || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                of {statsData?.totalReviews || 0} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">
                  ${(statsData?.totalSavings || 0).toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground">from disputes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Transparency</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {providersLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {topProvidersData && topProvidersData.length > 0
                    ? (
                        topProvidersData.reduce((sum, p) => sum + (p.transparency_score || 0), 0) /
                        topProvidersData.length
                      ).toFixed(0)
                    : "N/A"}
                </div>
              )}
              <p className="text-xs text-muted-foreground">out of 100</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Transparent Providers */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Most Transparent Providers</CardTitle>
            <CardDescription>
              Healthcare providers with the highest transparency scores based on billing accuracy, fair pricing, and patient feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            {providersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !topProvidersData || topProvidersData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No provider data available yet.</p>
                <p className="text-sm mt-2">Upload bills to start building provider transparency insights.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topProvidersData.map((provider, index) => (
                  <Card key={provider.id} className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate(`/providers/${provider.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{provider.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              {provider.provider_type && (
                                <Badge variant="outline">{provider.provider_type}</Badge>
                              )}
                              {provider.city && provider.state && (
                                <span>{provider.city}, {provider.state}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {provider.transparency_score?.toFixed(0) || "N/A"}
                          </div>
                          <p className="text-xs text-muted-foreground">Transparency</p>
                          {provider.billing_accuracy_score && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {provider.billing_accuracy_score.toFixed(0)}% accuracy
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Common Overcharge Trends */}
        {metricsData?.common_overcharge_trends && Array.isArray(metricsData.common_overcharge_trends) && metricsData.common_overcharge_trends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Common Overcharge Trends</CardTitle>
              <CardDescription>
                Procedures and services with the most frequent billing discrepancies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metricsData.common_overcharge_trends.map((trend: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{trend.procedure_name || trend.category}</p>
                      <p className="text-sm text-muted-foreground">{trend.description}</p>
                    </div>
                    <Badge variant="destructive">{trend.frequency || trend.count} cases</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold">Help Build Healthcare Transparency</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload your medical bills to contribute to our community database. Your anonymized data helps others understand fair pricing and identify billing errors.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/bills/upload")}>
                Upload a Bill
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/providers")}>
                Browse Providers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
