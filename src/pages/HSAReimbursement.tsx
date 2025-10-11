import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WellbieAvatar } from '@/components/WellbieAvatar';
import { ArrowLeft, FileText, Download, Send, CheckCircle2 } from 'lucide-react';
import { generateReimbursementPDF } from '@/lib/pdfGenerator';

interface HSAExpense {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  notes: string | null;
}

const HSA_PROVIDERS = [
  'HSA Bank',
  'HealthEquity',
  'Fidelity HSA',
  'Optum Bank',
  'Lively',
  'WageWorks',
  'PayFlex',
  'Further',
  'Other',
];

export default function HSAReimbursement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<HSAExpense[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [hsaProvider, setHsaProvider] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchHSAExpenses();
  }, []);

  const fetchHSAExpenses = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      setUser(currentUser);

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('is_hsa_eligible', true)
        .eq('is_reimbursed', false)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching HSA expenses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load HSA expenses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleExpense = (expenseId: string) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedExpenses(newSelected);
  };

  const calculateTotal = () => {
    return expenses
      .filter(e => selectedExpenses.has(e.id))
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const generatePDF = async () => {
    if (selectedExpenses.size === 0) {
      toast({
        title: 'No expenses selected',
        description: 'Please select at least one expense',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingPDF(true);
    try {
      const selectedExpensesList = expenses.filter(e => selectedExpenses.has(e.id));
      
      const pdfBlob = await generateReimbursementPDF({
        expenses: selectedExpensesList,
        totalAmount: calculateTotal(),
        notes,
        hsaProvider: hsaProvider || undefined,
        userName: user?.user_metadata?.full_name || user?.email || 'HSA Member',
        userEmail: user?.email || '',
      });

      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HSA-Reimbursement-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF Generated',
        description: 'Your reimbursement package has been downloaded',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (selectedExpenses.size === 0) {
      toast({
        title: 'No expenses selected',
        description: 'Please select at least one expense',
        variant: 'destructive',
      });
      return;
    }

    if (!hsaProvider) {
      toast({
        title: 'HSA Provider Required',
        description: 'Please select your HSA provider',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const total = calculateTotal();

      // Generate PDF first
      const selectedExpensesList = expenses.filter(e => selectedExpenses.has(e.id));
      const pdfBlob = await generateReimbursementPDF({
        expenses: selectedExpensesList,
        totalAmount: total,
        notes,
        hsaProvider,
        userName: currentUser?.user_metadata?.full_name || currentUser?.email || 'HSA Member',
        userEmail: currentUser?.email || '',
      });

      // Create reimbursement request
      const { data: request, error: requestError } = await supabase
        .from('reimbursement_requests')
        .insert({
          user_id: currentUser.id,
          total_amount: total,
          status: 'pending',
          notes,
          hsa_provider: hsaProvider,
          submission_method: 'manual',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create reimbursement items
      const items = Array.from(selectedExpenses).map(expenseId => ({
        reimbursement_request_id: request.id,
        expense_id: expenseId,
      }));

      const { error: itemsError } = await supabase
        .from('reimbursement_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // Mark expenses as reimbursed
      const { error: updateError } = await supabase
        .from('expenses')
        .update({ is_reimbursed: true })
        .in('id', Array.from(selectedExpenses));

      if (updateError) throw updateError;

      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HSA-Reimbursement-${request.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Reimbursement request created and PDF downloaded',
      });

      // Show success state briefly before redirecting
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error submitting reimbursement:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit reimbursement request',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(expenses.map(e => e.category));
    return Array.from(cats).sort();
  }, [expenses]);

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses.filter(exp => {
      if (categoryFilter !== "all" && exp.category !== categoryFilter) return false;
      if (searchTerm && !exp.vendor.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "amount") {
        comparison = Number(a.amount) - Number(b.amount);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [expenses, categoryFilter, searchTerm, sortBy, sortOrder]);

  const exportToCSV = () => {
    const selected = expenses.filter(e => selectedExpenses.has(e.id));
    const headers = ['Date', 'Vendor', 'Category', 'Amount', 'Notes'];
    const rows = selected.map(e => [
      e.date,
      e.vendor,
      e.category,
      e.amount.toString(),
      e.notes || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      `Total,,,${calculateTotal()}`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hsa-expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <WellbieAvatar size="sm" />
              <span className="text-xl font-heading font-bold whitespace-nowrap">Wellth.ai</span>
            </button>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-foreground">HSA Reimbursement</span>
        </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">HSA Reimbursement Request</h1>
        <p className="text-muted-foreground">
          Select expenses and generate a professional reimbursement package
        </p>
      </div>

      {expenses.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground mb-4">
            No unreimbursed HSA-eligible expenses found
          </p>
          <Button onClick={() => navigate('/expenses/new')}>
            Add Expense
          </Button>
        </Card>
      ) : (
        <>
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Select Expenses to Reimburse</h2>
            
            {/* Filters */}
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <Input
                placeholder="Search vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(val) => {
                const [sort, order] = val.split('-');
                setSortBy(sort as "date" | "amount");
                setSortOrder(order as "asc" | "desc");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                  <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                  <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {filteredAndSortedExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedExpenses.has(expense.id)}
                    onCheckedChange={() => toggleExpense(expense.id)}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{expense.vendor}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.category} • {new Date(expense.date).toLocaleDateString()}
                        </p>
                        {expense.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{expense.notes}</p>
                        )}
                      </div>
                      <p className="font-semibold">${Number(expense.amount).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {selectedExpenses.size > 0 && (
            <>
              <Card className="p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Reimbursement Details</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hsa-provider">HSA Provider *</Label>
                    <Select value={hsaProvider} onValueChange={setHsaProvider}>
                      <SelectTrigger id="hsa-provider" className="mt-1">
                        <SelectValue placeholder="Select your HSA provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {HSA_PROVIDERS.map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      This helps generate provider-specific instructions
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any additional notes for this reimbursement request..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-lg font-semibold">Total Amount:</p>
                    <p className="text-2xl font-bold text-primary">
                      ${calculateTotal().toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="bg-muted/50 border rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">What happens next?</h3>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>A professional PDF package will be generated with all expense details</li>
                      <li>The PDF will include provider-specific submission instructions</li>
                      <li>Your expenses will be marked as submitted in the system</li>
                      <li>You'll need to submit the PDF to your HSA provider</li>
                    </ol>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3">
            {selectedExpenses.size > 0 && (
              <>
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  onClick={generatePDF}
                  variant="outline"
                  disabled={generatingPDF}
                  className="flex-1"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {generatingPDF ? 'Generating...' : 'Generate PDF Only'}
                </Button>
                <Button
                  onClick={handleSubmitRequest}
                  disabled={submitting || !hsaProvider}
                  className="flex-1"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? 'Submitting...' : 'Submit & Download Package'}
                </Button>
              </>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
