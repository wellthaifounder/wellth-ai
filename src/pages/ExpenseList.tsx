import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { WellthLogo } from "@/components/WellthLogo";
import { ArrowLeft, Plus, Download, Trash2, Edit, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { TableColumnHeader } from "@/components/ui/table-column-header";

type Expense = Tables<"expenses">;

const ExpenseList = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<any>(null);
  const [amountFilter, setAmountFilter] = useState<any>(null);
  
  // Sort
  const [sortBy, setSortBy] = useState<"date" | "amount" | "vendor" | "category" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusColumnFilter, setStatusColumnFilter] = useState("");

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          *,
          reimbursement_items(
            reimbursement_request_id,
            reimbursement_requests(status)
          )
        `)
        .order("date", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      toast.error("Failed to load expenses");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Expense deleted");
      fetchExpenses();
    } catch (error) {
      toast.error("Failed to delete expense");
      console.error(error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .in("id", Array.from(selectedIds));

      if (error) throw error;
      toast.success(`Deleted ${selectedIds.size} expense(s)`);
      setSelectedIds(new Set());
      fetchExpenses();
    } catch (error) {
      toast.error("Failed to delete expenses");
      console.error(error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedExpenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedExpenses.map(e => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const categories = useMemo(() => {
    const cats = new Set(expenses.map(e => e.category));
    return Array.from(cats).sort();
  }, [expenses]);

  // Get unique values for autocomplete
  const uniqueVendors = useMemo(() => {
    return Array.from(new Set(expenses.map(e => e.vendor))).sort();
  }, [expenses]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(expenses.map(e => e.category))).sort();
  }, [expenses]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    expenses.forEach(exp => {
      const reimbursementStatus = (exp as any).reimbursement_items?.[0]?.reimbursement_requests?.status;
      if (reimbursementStatus) {
        statuses.add(reimbursementStatus.charAt(0).toUpperCase() + reimbursementStatus.slice(1));
      } else if (exp.is_hsa_eligible) {
        statuses.add("HSA Eligible");
      } else {
        statuses.add("Not Submitted");
      }
    });
    return Array.from(statuses).sort();
  }, [expenses]);

  // Get min and max amounts for the filter
  const { minAmount, maxAmount } = useMemo(() => {
    if (expenses.length === 0) return { minAmount: 0, maxAmount: 1000 };
    const amounts = expenses.map(e => Number(e.amount));
    return {
      minAmount: Math.min(...amounts),
      maxAmount: Math.max(...amounts)
    };
  }, [expenses]);

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses.filter(exp => {
      // Category filter
      if (categoryFilter !== "all" && exp.category !== categoryFilter) return false;
      
      // Status filter
      if (statusFilter === "hsa" && !exp.is_hsa_eligible) return false;
      if (statusFilter === "reimbursed" && !exp.is_reimbursed) return false;
      if (statusFilter === "pending" && exp.is_reimbursed) return false;
      
      // Vendor filter
      if (vendorFilter && !exp.vendor.toLowerCase().includes(vendorFilter.toLowerCase())) return false;
      
      // Date filter
      if (dateFilter) {
        const expDate = new Date(exp.date);
        if (dateFilter.from && dateFilter.to) {
          const from = new Date(dateFilter.from);
          const to = new Date(dateFilter.to);
          if (expDate < from || expDate > to) return false;
        } else if (dateFilter instanceof Date) {
          const filterDate = new Date(dateFilter);
          if (expDate.toDateString() !== filterDate.toDateString()) return false;
        }
      }
      
      // Amount filter
      if (amountFilter) {
        const amount = Number(exp.amount);
        if (amountFilter.from !== undefined && amount < amountFilter.from) return false;
        if (amountFilter.to !== undefined && amount > amountFilter.to) return false;
      }
      
      // Status column filter
      if (statusColumnFilter) {
        const reimbursementStatus = (exp as any).reimbursement_items?.[0]?.reimbursement_requests?.status;
        const status = reimbursementStatus || (exp.is_hsa_eligible ? "hsa-eligible" : "not-submitted");
        if (!status.toLowerCase().includes(statusColumnFilter.toLowerCase())) return false;
      }
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "amount") {
        comparison = Number(a.amount) - Number(b.amount);
      } else if (sortBy === "vendor") {
        comparison = a.vendor.localeCompare(b.vendor);
      } else if (sortBy === "category") {
        comparison = a.category.localeCompare(b.category);
      } else if (sortBy === "status") {
        const statusA = (a as any).reimbursement_items?.[0]?.reimbursement_requests?.status || (a.is_hsa_eligible ? "hsa-eligible" : "not-submitted");
        const statusB = (b as any).reimbursement_items?.[0]?.reimbursement_requests?.status || (b.is_hsa_eligible ? "hsa-eligible" : "not-submitted");
        comparison = statusA.localeCompare(statusB);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [expenses, categoryFilter, statusFilter, vendorFilter, dateFilter, amountFilter, statusColumnFilter, sortBy, sortOrder]);

  const exportToCSV = () => {
    const headers = ["Date", "Vendor", "Category", "Amount", "HSA Eligible", "Reimbursed", "Notes"];
    const rows = expenses.map(exp => [
      exp.date,
      exp.vendor,
      exp.category,
      exp.amount,
      exp.is_hsa_eligible ? "Yes" : "No",
      exp.is_reimbursed ? "Yes" : "No",
      exp.notes || ""
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Exported to CSV");
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedIds.size})
              </Button>
            )}
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => navigate("/expenses/import")}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
            <Button onClick={() => navigate("/expenses/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Expenses</CardTitle>
            <CardDescription>
              Showing {filteredAndSortedExpenses.length} of {expenses.length} expense(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No expenses yet</p>
                <Button onClick={() => navigate("/expenses/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Expense
                </Button>
              </div>
            ) : (
              <>
                {/* Quick Filters */}
                <div className="mb-6 grid gap-4 md:grid-cols-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="hsa">HSA Eligible</SelectItem>
                      <SelectItem value="reimbursed">Reimbursed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.size === filteredAndSortedExpenses.length && filteredAndSortedExpenses.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
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
                          title="Vendor"
                          sortable
                          filterable
                          filterType="text"
                          filterOptions={uniqueVendors}
                          currentSort={sortBy === "vendor" ? sortOrder : null}
                          onSort={(direction) => {
                            setSortBy("vendor");
                            setSortOrder(direction);
                          }}
                          onFilter={(value) => setVendorFilter(value || "")}
                          filterValue={vendorFilter}
                        />
                      </TableHead>
                      <TableHead>
                        <TableColumnHeader
                          title="Category"
                          sortable
                          filterable
                          filterType="text"
                          filterOptions={uniqueCategories}
                          currentSort={sortBy === "category" ? sortOrder : null}
                          onSort={(direction) => {
                            setSortBy("category");
                            setSortOrder(direction);
                          }}
                          onFilter={(value) => setCategoryFilter(value === "" ? "all" : value)}
                        />
                      </TableHead>
                      <TableHead>
                        <TableColumnHeader
                          title="Amount"
                          sortable
                          filterable
                          filterType="number"
                          minValue={minAmount}
                          maxValue={maxAmount}
                          currentSort={sortBy === "amount" ? sortOrder : null}
                          onSort={(direction) => {
                            setSortBy("amount");
                            setSortOrder(direction);
                          }}
                          onFilter={setAmountFilter}
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
                    {filteredAndSortedExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(expense.id)}
                            onCheckedChange={() => toggleSelect(expense.id)}
                          />
                        </TableCell>
                        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell>{expense.vendor}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>${Number(expense.amount).toFixed(2)}</TableCell>
                        <TableCell>
                          {(() => {
                            const reimbursementStatus = (expense as any).reimbursement_items?.[0]?.reimbursement_requests?.status;
                            if (reimbursementStatus) {
                              return (
                                <Badge variant={
                                  reimbursementStatus === "approved" ? "default" :
                                  reimbursementStatus === "submitted" ? "secondary" :
                                  reimbursementStatus === "denied" ? "destructive" : "outline"
                                }>
                                  {reimbursementStatus.charAt(0).toUpperCase() + reimbursementStatus.slice(1)}
                                </Badge>
                              );
                            }
                            if (expense.is_hsa_eligible) {
                              return <Badge variant="secondary">HSA Eligible</Badge>;
                            }
                            return <Badge variant="outline">Not Submitted</Badge>;
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

export default ExpenseList;
