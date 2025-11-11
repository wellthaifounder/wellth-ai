import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/lib/analytics";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, TrendingUp, TrendingDown, Star, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdvancedFilters, FilterState } from "@/components/bills/AdvancedFilters";
import { ProviderIntelDisclaimer } from "@/components/provider/ProviderIntelDisclaimer";

export default function ProviderDirectory() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: 'all',
    dateRange: { from: undefined, to: undefined },
    amountRange: [0, 10000],
    provider: '',
    savingsMin: 0
  });
  const [insurancePlanFilter, setInsurancePlanFilter] = useState('all');

  const { data: providers, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('billing_accuracy_score', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Apply filters
  const filteredProviders = useMemo(() => {
    if (!providers) return [];

    return providers.filter(provider => {
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = provider.name.toLowerCase().includes(query);
        const matchesCity = provider.city?.toLowerCase().includes(query);
        if (!matchesName && !matchesCity) return false;
      }

      // Provider filter (duplicate but kept for consistency)
      if (filters.provider && !provider.name.toLowerCase().includes(filters.provider.toLowerCase())) {
        return false;
      }
      
      // Insurance plan filter
      if (insurancePlanFilter !== 'all') {
        const hasInsurance = provider.insurance_networks?.includes(insurancePlanFilter);
        if (!hasInsurance) return false;
      }

      return true;
    });
  }, [providers, filters, insurancePlanFilter]);

  const topPerformers = filteredProviders?.slice(0, 5) || [];
  const avgAccuracy = filteredProviders?.reduce((sum, p) => sum + Number(p.billing_accuracy_score), 0) / (filteredProviders?.length || 1);

  useEffect(() => {
    analytics.pageView('/providers');
  }, []);

  useEffect(() => {
    if (filters.searchQuery) {
      analytics.providerSearch(filters.searchQuery);
    }
  }, [filters.searchQuery]);

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Provider Intel</h1>
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </div>
          <p className="text-muted-foreground mb-4">
            Track billing accuracy, average charges, and dispute history for healthcare providers
          </p>
          
          <div className="mb-4">
            <ProviderIntelDisclaimer variant="homepage" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredProviders?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Accuracy Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgAccuracy.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Bills Analyzed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredProviders?.reduce((sum, p) => sum + p.total_bills_analyzed, 0) || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Overcharges Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${filteredProviders?.reduce((sum, p) => sum + Number(p.total_overcharges_found), 0).toFixed(2) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <AdvancedFilters 
            onFiltersChange={setFilters}
            showAmountFilter={false}
            showProviderFilter={true}
            showSavingsFilter={false}
            statusOptions={[]}
          />
          
          {/* Insurance Plan Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Insurance Plan Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={insurancePlanFilter} onValueChange={setInsurancePlanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Insurance Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Insurance Plans</SelectItem>
                  <SelectItem value="PPO">PPO</SelectItem>
                  <SelectItem value="HMO">HMO</SelectItem>
                  <SelectItem value="EPO">EPO</SelectItem>
                  <SelectItem value="POS">POS</SelectItem>
                  <SelectItem value="HDHP">High Deductible Health Plan (HDHP)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Top Performing Providers
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Providers with the highest billing accuracy scores
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((provider, index) => (
                  <div
                    key={provider.id}
                    className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate(`/providers/${provider.id}`)}
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{provider.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {provider.city}, {provider.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {Number(provider.billing_accuracy_score).toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {provider.total_bills_analyzed} bills analyzed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Providers List */}
        <Card>
          <CardHeader>
            <CardTitle>All Providers ({filteredProviders?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!filteredProviders || filteredProviders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No providers found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProviders.map((provider) => {
                  const accuracyScore = Number(provider.billing_accuracy_score);
                  const isHighAccuracy = accuracyScore >= 90;
                  const isLowAccuracy = accuracyScore < 70;

                  return (
                    <div
                      key={provider.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/providers/${provider.id}`)}
                    >
                      <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-primary" />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{provider.name}</h3>
                            {provider.provider_type && (
                              <Badge variant="outline" className="mt-1">
                                {provider.provider_type}
                              </Badge>
                            )}
                            {provider.city && provider.state && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {provider.city}, {provider.state}
                              </p>
                            )}
                          </div>

                          {provider.overall_rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              <span className="font-semibold">{Number(provider.overall_rating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Billing Accuracy</p>
                            <div className="flex items-center gap-2">
                              {isHighAccuracy ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : isLowAccuracy ? (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-orange-600" />
                              )}
                              <span className={`font-bold ${
                                isHighAccuracy ? 'text-green-600' : 
                                isLowAccuracy ? 'text-red-600' : 'text-orange-600'
                              }`}>
                                {accuracyScore.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Bills Analyzed</p>
                            <p className="font-semibold">{provider.total_bills_analyzed}</p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Disputes Filed</p>
                            <p className="font-semibold">{provider.total_disputes_filed}</p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Overcharges Found</p>
                            <p className="font-semibold text-orange-600">
                              ${Number(provider.total_overcharges_found).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <Progress value={accuracyScore} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
