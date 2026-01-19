import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Loader2,
  FolderOpen,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { EventCard } from "@/components/events/EventCard";
import { MigrationWizard } from "@/components/events/MigrationWizard";

interface MedicalEvent {
  id: string;
  title: string;
  event_date: string | null;
  event_type: string;
  primary_provider: string | null;
  description: string | null;
  total_billed: number;
  total_paid: number;
  user_responsibility_override: number | null;
  hsa_eligible_amount: number;
  status: string;
  created_at: string;
  invoice_count: number;
  document_count: number;
}

export default function MedicalEvents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMigrationWizard, setShowMigrationWizard] = useState(false);

  // Check if user has unorganized invoices (for migration prompt)
  const { data: unorganizedCount } = useQuery({
    queryKey: ["unorganized-invoices-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("medical_event_id", null);

      if (error) return 0;
      return count || 0;
    },
  });

  // Fetch medical events with counts
  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ["medical-events"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get events with invoice and document counts
      const { data, error } = await supabase
        .from("medical_events")
        .select(`
          *,
          invoices:invoices(count),
          receipts:receipts(count)
        `)
        .eq("user_id", user.id)
        .order("event_date", { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Transform the data to include counts
      return (data || []).map((event: any) => ({
        ...event,
        invoice_count: event.invoices?.[0]?.count || 0,
        document_count: event.receipts?.[0]?.count || 0,
      })) as MedicalEvent[];
    },
  });

  // Filter events by search query
  const filteredEvents = events?.filter((event) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(query) ||
      event.primary_provider?.toLowerCase().includes(query) ||
      event.event_type.toLowerCase().includes(query)
    );
  });

  // Group events by status
  const activeEvents = filteredEvents?.filter((e) => e.status === "active") || [];
  const disputedEvents = filteredEvents?.filter((e) => e.status === "disputed") || [];
  const resolvedEvents = filteredEvents?.filter((e) => ["resolved", "archived"].includes(e.status)) || [];

  // Calculate totals
  const totals = events?.reduce(
    (acc, event) => ({
      totalBilled: acc.totalBilled + event.total_billed,
      totalPaid: acc.totalPaid + event.total_paid,
      totalOutstanding: acc.totalOutstanding + (event.user_responsibility_override ?? (event.total_billed - event.total_paid)),
      hsaEligible: acc.hsaEligible + event.hsa_eligible_amount,
    }),
    { totalBilled: 0, totalPaid: 0, totalOutstanding: 0, hsaEligible: 0 }
  ) || { totalBilled: 0, totalPaid: 0, totalOutstanding: 0, hsaEligible: 0 };

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
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Medical Events</h1>
            <p className="text-muted-foreground">
              Track your medical care episodes and related expenses
            </p>
          </div>
          <Button onClick={() => navigate("/medical-events/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>

        {/* Migration Prompt */}
        {unorganizedCount && unorganizedCount > 0 && !showMigrationWizard && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Organize Your Existing Bills</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You have {unorganizedCount} bill{unorganizedCount > 1 ? "s" : ""} that aren't linked to a medical event.
                    Organizing them helps you track expenses by episode of care.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => setShowMigrationWizard(true)}>
                      Organize Now
                    </Button>
                    <Button size="sm" variant="ghost">
                      Maybe Later
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Events</span>
              </div>
              <p className="text-2xl font-bold">{events?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Billed</span>
              </div>
              <p className="text-2xl font-bold">${totals.totalBilled.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Outstanding</span>
              </div>
              <p className="text-2xl font-bold text-destructive">
                ${totals.totalOutstanding.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">HSA Eligible</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${totals.hsaEligible.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by title, provider, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Events Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeEvents.length})
            </TabsTrigger>
            <TabsTrigger value="disputed">
              Disputed ({disputedEvents.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeEvents.length === 0 ? (
              <Card className="p-8 text-center">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Events</h3>
                <p className="text-muted-foreground mb-4">
                  Create a new event to start tracking your medical expenses
                </p>
                <Button onClick={() => navigate("/medical-events/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => navigate(`/medical-events/${event.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="disputed" className="mt-6">
            {disputedEvents.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Disputed Events</h3>
                <p className="text-muted-foreground">
                  Events with active disputes will appear here
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {disputedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => navigate(`/medical-events/${event.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="mt-6">
            {resolvedEvents.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Resolved Events</h3>
                <p className="text-muted-foreground">
                  Completed episodes of care will appear here
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {resolvedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => navigate(`/medical-events/${event.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Migration Wizard Dialog */}
      {showMigrationWizard && (
        <MigrationWizard
          open={showMigrationWizard}
          onOpenChange={setShowMigrationWizard}
          onComplete={() => {
            setShowMigrationWizard(false);
            refetch();
          }}
        />
      )}
    </AuthenticatedLayout>
  );
}
