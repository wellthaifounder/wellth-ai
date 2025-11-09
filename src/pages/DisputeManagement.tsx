import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { AdvancedFilters, FilterState } from "@/components/bills/AdvancedFilters";
import { useState, useMemo } from "react";

export default function DisputeManagement() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: 'all',
    dateRange: { from: undefined, to: undefined },
    amountRange: [0, 10000],
    provider: '',
    savingsMin: 0
  });

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bill_disputes')
        .select(`
          *,
          invoices (
            vendor,
            amount
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Apply filters to disputes
  const filteredDisputes = useMemo(() => {
    if (!disputes) return [];

    return disputes.filter(dispute => {
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesProvider = dispute.provider_name.toLowerCase().includes(query);
        const matchesClaim = dispute.claim_number?.toLowerCase().includes(query);
        if (!matchesProvider && !matchesClaim) return false;
      }

      // Status filter
      if (filters.status !== 'all' && dispute.dispute_status !== filters.status) {
        return false;
      }

      // Provider filter
      if (filters.provider && !dispute.provider_name.toLowerCase().includes(filters.provider.toLowerCase())) {
        return false;
      }

      // Amount range
      const amount = Number(dispute.original_amount);
      if (amount < filters.amountRange[0] || amount > filters.amountRange[1]) {
        return false;
      }

      // Date range
      if (filters.dateRange.from) {
        const disputeDate = new Date(dispute.created_at);
        if (disputeDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && disputeDate > filters.dateRange.to) return false;
      }

      return true;
    });
  }, [disputes, filters]);

  const statusConfig = {
    draft: { label: "Draft", variant: "secondary" as const, icon: FileText },
    submitted: { label: "Submitted", variant: "default" as const, icon: Clock },
    provider_reviewing: { label: "Under Review", variant: "default" as const, icon: Clock },
    awaiting_response: { label: "Awaiting Response", variant: "outline" as const, icon: Clock },
    resolved_favorable: { label: "Resolved - Favorable", variant: "default" as const, icon: CheckCircle2 },
    resolved_unfavorable: { label: "Resolved - Unfavorable", variant: "destructive" as const, icon: Clock },
    withdrawn: { label: "Withdrawn", variant: "secondary" as const, icon: FileText }
  };

  const activeDisputes = filteredDisputes?.filter(d => 
    !['resolved_favorable', 'resolved_unfavorable', 'withdrawn'].includes(d.dispute_status)
  ) || [];

  const resolvedDisputes = filteredDisputes?.filter(d => 
    ['resolved_favorable', 'resolved_unfavorable', 'withdrawn'].includes(d.dispute_status)
  ) || [];

  const totalSavings = filteredDisputes?.reduce((sum, d) => 
    d.savings_achieved ? sum + Number(d.savings_achieved) : sum, 0
  ) || 0;

  const DisputeCard = ({ dispute }: { dispute: any }) => {
    const config = statusConfig[dispute.dispute_status as keyof typeof statusConfig];
    const StatusIcon = config.icon;

    return (
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate(`/disputes/${dispute.id}`)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{dispute.provider_name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Created {format(new Date(dispute.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <Badge variant={config.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Original Amount</p>
              <p className="text-lg font-semibold">${dispute.original_amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disputed Amount</p>
              <p className="text-lg font-semibold text-orange-500">
                ${dispute.disputed_amount.toFixed(2)}
              </p>
            </div>
          </div>

          {dispute.savings_achieved && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">Savings Achieved</p>
              <p className="text-xl font-bold text-green-600">
                ${dispute.savings_achieved.toFixed(2)}
              </p>
            </div>
          )}

          {dispute.response_deadline && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Response due: {format(new Date(dispute.response_deadline), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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
          <h1 className="text-3xl font-bold mb-2">Dispute Management</h1>
          <p className="text-muted-foreground">
            Track and manage your medical bill disputes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Disputes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDisputes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalSavings.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resolved Disputes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedDisputes.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <AdvancedFilters 
          onFiltersChange={setFilters}
          showAmountFilter={true}
          showProviderFilter={true}
          showSavingsFilter={false}
          statusOptions={[
            { value: 'all', label: 'All Statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'provider_reviewing', label: 'Under Review' },
            { value: 'awaiting_response', label: 'Awaiting Response' },
            { value: 'resolved_favorable', label: 'Resolved - Favorable' },
            { value: 'resolved_unfavorable', label: 'Resolved - Unfavorable' },
            { value: 'withdrawn', label: 'Withdrawn' }
          ]}
        />

        {/* Disputes List */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeDisputes.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedDisputes.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({filteredDisputes?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-6">
            {activeDisputes.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Disputes</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any active disputes at the moment
                </p>
                <Button onClick={() => navigate('/invoices')}>
                  View Bills
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeDisputes.map(dispute => (
                  <DisputeCard key={dispute.id} dispute={dispute} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4 mt-6">
            {resolvedDisputes.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Resolved Disputes</h3>
                <p className="text-muted-foreground">
                  You haven't resolved any disputes yet
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {resolvedDisputes.map(dispute => (
                  <DisputeCard key={dispute.id} dispute={dispute} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-6">
            {!filteredDisputes || filteredDisputes.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Disputes</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't created any disputes yet
                </p>
                <Button onClick={() => navigate('/invoices')}>
                  View Bills
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredDisputes.map(dispute => (
                  <DisputeCard key={dispute.id} dispute={dispute} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
