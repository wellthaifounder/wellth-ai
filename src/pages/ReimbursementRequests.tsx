import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WellthLogo } from "@/components/WellthLogo";
import { ArrowLeft, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { TableColumnHeader } from "@/components/ui/table-column-header";

type ReimbursementRequest = {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  hsa_provider: string | null;
  submitted_at: string | null;
  notes: string | null;
};

const ReimbursementRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ReimbursementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<any>(null);
  const [amountFilter, setAmountFilter] = useState("");
  const [statusColumnFilter, setStatusColumnFilter] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "provider" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("reimbursement_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      toast.error("Failed to load reimbursement requests");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for autocomplete
  const uniqueProviders = useMemo(() => {
    return Array.from(new Set(requests.map(r => r.hsa_provider).filter(Boolean) as string[])).sort();
  }, [requests]);

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(requests.map(r => r.status.charAt(0).toUpperCase() + r.status.slice(1)))).sort();
  }, [requests]);

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests.filter(req => {
      if (statusFilter !== "all" && req.status !== statusFilter) return false;
      
      // Provider filter
      if (providerFilter && req.hsa_provider && !req.hsa_provider.toLowerCase().includes(providerFilter.toLowerCase())) return false;
      
      // Date filter
      if (dateFilter) {
        const reqDate = new Date(req.submitted_at || req.created_at);
        if (dateFilter.from && dateFilter.to) {
          const from = new Date(dateFilter.from);
          const to = new Date(dateFilter.to);
          if (reqDate < from || reqDate > to) return false;
        } else if (dateFilter instanceof Date) {
          const filterDate = new Date(dateFilter);
          if (reqDate.toDateString() !== filterDate.toDateString()) return false;
        }
      }
      
      // Amount filter
      if (amountFilter && !req.total_amount.toString().includes(amountFilter)) return false;
      
      // Status column filter
      if (statusColumnFilter && !req.status.toLowerCase().includes(statusColumnFilter.toLowerCase())) return false;
      
      return true;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "amount") {
        comparison = Number(a.total_amount) - Number(b.total_amount);
      } else if (sortBy === "provider") {
        comparison = (a.hsa_provider || "").localeCompare(b.hsa_provider || "");
      } else if (sortBy === "status") {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [requests, statusFilter, providerFilter, dateFilter, amountFilter, statusColumnFilter, sortBy, sortOrder]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <button 
              onClick={() => navigate("/dashboard")}
              className="hover:opacity-80 transition-opacity"
            >
              <WellthLogo size="sm" showTagline />
            </button>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Reimbursement Requests</h1>
            <p className="text-muted-foreground">
              Track and manage your HSA reimbursement submissions and their status
            </p>
          </div>
          <Button onClick={() => navigate("/hsa-reimbursement")}>
            <FileText className="h-4 w-4 mr-2" />
            New Reimbursement
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Requests</CardTitle>
            <CardDescription>
              Showing {filteredAndSortedRequests.length} of {requests.length} request(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No reimbursement requests yet</p>
                <Button onClick={() => navigate("/hsa-reimbursement")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Create First Request
                </Button>
              </div>
            ) : (
              <>
                {/* Quick Filter */}
                <div className="mb-6">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <TableColumnHeader
                          title="Date"
                          sortable
                          filterable
                          filterType="date"
                          currentSort={sortBy === "date" ? sortOrder : null}
                          onSort={(direction) => {
                            setSortBy("date");
                            setSortOrder(direction);
                          }}
                          onFilter={setDateFilter}
                        />
                      </TableHead>
                      <TableHead>
                        <TableColumnHeader
                          title="HSA Provider"
                          sortable
                          filterable
                          filterType="text"
                          filterOptions={uniqueProviders}
                          currentSort={sortBy === "provider" ? sortOrder : null}
                          onSort={(direction) => {
                            setSortBy("provider");
                            setSortOrder(direction);
                          }}
                          onFilter={(value) => setProviderFilter(value || "")}
                          filterValue={providerFilter}
                        />
                      </TableHead>
                      <TableHead>
                        <TableColumnHeader
                          title="Amount"
                          sortable
                          filterable
                          filterType="text"
                          currentSort={sortBy === "amount" ? sortOrder : null}
                          onSort={(direction) => {
                            setSortBy("amount");
                            setSortOrder(direction);
                          }}
                          onFilter={(value) => setAmountFilter(value || "")}
                          filterValue={amountFilter}
                        />
                      </TableHead>
                      <TableHead>
                        <TableColumnHeader
                          title="Status"
                          sortable
                          filterable
                          filterType="text"
                          filterOptions={uniqueStatuses}
                          currentSort={sortBy === "status" ? sortOrder : null}
                          onSort={(direction) => {
                            setSortBy("status");
                            setSortOrder(direction);
                          }}
                          onFilter={(value) => setStatusColumnFilter(value || "")}
                          filterValue={statusColumnFilter}
                        />
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {new Date(request.submitted_at || request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{request.hsa_provider || "N/A"}</TableCell>
                        <TableCell>${Number(request.total_amount).toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/reimbursement/${request.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReimbursementRequests;
