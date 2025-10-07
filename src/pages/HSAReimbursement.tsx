import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText, Download } from 'lucide-react';

interface HSAExpense {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  notes: string | null;
}

export default function HSAReimbursement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<HSAExpense[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHSAExpenses();
  }, []);

  const fetchHSAExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
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

  const handleSubmitRequest = async () => {
    if (selectedExpenses.size === 0) {
      toast({
        title: 'No expenses selected',
        description: 'Please select at least one expense',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const total = calculateTotal();

      // Create reimbursement request
      const { data: request, error: requestError } = await supabase
        .from('reimbursement_requests')
        .insert({
          user_id: user.id,
          total_amount: total,
          status: 'pending',
          notes,
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

      toast({
        title: 'Success',
        description: 'Reimbursement request submitted successfully',
      });

      navigate('/dashboard');
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
    a.download = `hsa-reimbursement-${new Date().toISOString().split('T')[0]}.csv`;
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <h1 className="text-3xl font-bold mb-6">HSA Reimbursement Request</h1>

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
            <div className="space-y-3">
              {expenses.map((expense) => (
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
                      </div>
                      <p className="font-semibold">${Number(expense.amount).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {selectedExpenses.size > 0 && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Request Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Notes (Optional)
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes for this reimbursement request..."
                    rows={3}
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
                  onClick={handleSubmitRequest}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Submitting...' : 'Submit Reimbursement Request'}
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
