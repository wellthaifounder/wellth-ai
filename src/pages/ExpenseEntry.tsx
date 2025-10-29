import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { ArrowLeft, Upload, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { getPaymentRecommendation } from "@/lib/paymentRecommendation";
import { PaymentRecommendation } from "@/components/expense/PaymentRecommendation";
import { ReceiptGallery } from "@/components/expense/ReceiptGallery";
import { DocumentChecklist } from "@/components/expense/DocumentChecklist";
import { MultiFileUpload } from "@/components/expense/MultiFileUpload";
import { PaymentPlanFields } from "@/components/expense/PaymentPlanFields";
import { AttachDocumentDialog } from "@/components/documents/AttachDocumentDialog";
import { ReimbursementStrategySelector } from "@/components/expense/ReimbursementStrategySelector";
import { SetHSADateDialog } from "@/components/profile/SetHSADateDialog";
import { getDefaultReimbursementDate } from "@/lib/vaultCalculations";

const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  vendor: z.string().trim().min(1, "Vendor is required").max(100),
  amount: z.number().positive("Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  notes: z.string().max(500).optional(),
});

const HSA_ELIGIBLE_CATEGORIES = [
  "Doctor Visit",
  "Prescription",
  "Dental",
  "Vision",
  "Medical Equipment",
  "Lab Tests",
  "Hospital",
  "Physical Therapy",
  "Mental Health",
  "Other Medical"
];

const ExpenseEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [processingOCR, setProcessingOCR] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [newFiles, setNewFiles] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  const [hasPaymentPlan, setHasPaymentPlan] = useState(false);
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [useReimbursementStrategy, setUseReimbursementStrategy] = useState(false);
  const [reimbursementStrategy, setReimbursementStrategy] = useState<'immediate' | 'medium' | 'vault'>('immediate');
  const [plannedReimbursementDate, setPlannedReimbursementDate] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [cardPayoffMonths, setCardPayoffMonths] = useState(0);
  const [investmentNotes, setInvestmentNotes] = useState("");
  const [hsaOpenedDate, setHsaOpenedDate] = useState<string | null>(null);
  const [hsaDateDialogOpen, setHsaDateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vendor: "",
    amount: "",
    category: "",
    notes: "",
    paymentPlanTotalAmount: "",
    paymentPlanInstallments: "",
    paymentPlanNotes: "",
  });

  // Generate payment recommendation when amount and category are set
  const recommendation = formData.amount && formData.category && parseFloat(formData.amount) > 0
    ? getPaymentRecommendation({
        amount: parseFloat(formData.amount),
        category: formData.category,
        isHsaEligible: HSA_ELIGIBLE_CATEGORIES.includes(formData.category),
      })
    : null;

  useEffect(() => {
    loadHsaOpenedDate();
    if (isEditMode && id) {
      loadExpense(id);
    }
  }, [id, isEditMode]);

  // Auto-set planned reimbursement date when date changes
  useEffect(() => {
    if (formData.date && useReimbursementStrategy && !isEditMode) {
      setPlannedReimbursementDate(getDefaultReimbursementDate(reimbursementStrategy, formData.date));
    }
  }, [formData.date, reimbursementStrategy, useReimbursementStrategy, isEditMode]);

  const loadHsaOpenedDate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("hsa_opened_date")
        .eq("id", user.id)
        .single();

      if (profile) {
        setHsaOpenedDate(profile.hsa_opened_date);
      }
    } catch (error) {
      console.error("Error loading HSA opened date:", error);
    }
  };

  const loadExpense = async (expenseId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", expenseId)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          date: data.date,
          vendor: data.vendor,
          amount: data.amount.toString(),
          category: data.category,
          notes: data.notes || "",
          paymentPlanTotalAmount: data.payment_plan_total_amount?.toString() || "",
          paymentPlanInstallments: data.payment_plan_installments?.toString() || "",
          paymentPlanNotes: data.payment_plan_notes || "",
        });
        setHasPaymentPlan(!!data.payment_plan_total_amount);
        
        // Load reimbursement strategy
        if (data.reimbursement_strategy && data.reimbursement_strategy !== 'immediate') {
          setUseReimbursementStrategy(true);
          setReimbursementStrategy(data.reimbursement_strategy as 'immediate' | 'medium' | 'vault');
          setPlannedReimbursementDate(data.planned_reimbursement_date || "");
          setReminderDate(data.reimbursement_reminder_date || "");
          setCardPayoffMonths(data.card_payoff_months || 0);
          setInvestmentNotes(data.investment_notes || "");
        }
        
        // Load existing receipts
        const { data: receiptsData } = await supabase
          .from("receipts")
          .select("*")
          .eq("invoice_id", expenseId)
          .order("display_order");
        
        if (receiptsData) {
          setReceipts(receiptsData);
        }
      }
    } catch (error) {
      console.error("Error loading expense:", error);
      toast.error("Failed to load expense");
      navigate("/expenses");
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = expenseSchema.parse({
        ...formData,
        amount: parseFloat(formData.amount),
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const isHsaEligible = HSA_ELIGIBLE_CATEGORIES.includes(validatedData.category);
      
      // Check if expense is before HSA opened date
      let isTrulyReimbursable = isHsaEligible;
      if (isHsaEligible && hsaOpenedDate) {
        isTrulyReimbursable = new Date(validatedData.date) >= new Date(hsaOpenedDate);
      }

      // Format date to ensure it's stored consistently in UTC
      const dateObj = new Date(validatedData.date + 'T00:00:00');
      const formattedDate = dateObj.toISOString().split('T')[0];

      let expense;
      
      if (isEditMode && id) {
        // Update existing expense
        const { data, error: expenseError } = await supabase
          .from("invoices")
          .update({
            date: formattedDate,
            vendor: validatedData.vendor,
            amount: validatedData.amount,
            category: validatedData.category,
            notes: validatedData.notes || null,
            is_hsa_eligible: isHsaEligible,
            payment_plan_total_amount: hasPaymentPlan && formData.paymentPlanTotalAmount 
              ? parseFloat(formData.paymentPlanTotalAmount) 
              : null,
            payment_plan_installments: hasPaymentPlan && formData.paymentPlanInstallments 
              ? parseInt(formData.paymentPlanInstallments) 
              : null,
            payment_plan_notes: hasPaymentPlan ? formData.paymentPlanNotes : null,
            reimbursement_strategy: useReimbursementStrategy ? reimbursementStrategy : 'immediate',
            planned_reimbursement_date: useReimbursementStrategy ? plannedReimbursementDate : null,
            reimbursement_reminder_date: useReimbursementStrategy ? reminderDate : null,
            card_payoff_months: useReimbursementStrategy ? cardPayoffMonths : 0,
            investment_notes: useReimbursementStrategy ? investmentNotes : null,
          })
          .eq("id", id)
          .select()
          .single();

        if (expenseError) throw expenseError;
        expense = data;
      } else {
        // Create new expense
        const { data, error: expenseError } = await supabase
          .from("invoices")
          .insert({
            user_id: user.id,
            date: formattedDate,
            vendor: validatedData.vendor,
            amount: validatedData.amount,
            category: validatedData.category,
            notes: validatedData.notes || null,
            is_hsa_eligible: isHsaEligible,
            is_reimbursed: false,
            payment_plan_total_amount: hasPaymentPlan && formData.paymentPlanTotalAmount 
              ? parseFloat(formData.paymentPlanTotalAmount) 
              : null,
            payment_plan_installments: hasPaymentPlan && formData.paymentPlanInstallments 
              ? parseInt(formData.paymentPlanInstallments) 
              : null,
            payment_plan_notes: hasPaymentPlan ? formData.paymentPlanNotes : null,
            reimbursement_strategy: useReimbursementStrategy ? reimbursementStrategy : 'immediate',
            planned_reimbursement_date: useReimbursementStrategy ? plannedReimbursementDate : null,
            reimbursement_reminder_date: useReimbursementStrategy ? reminderDate : null,
            card_payoff_months: useReimbursementStrategy ? cardPayoffMonths : 0,
            investment_notes: useReimbursementStrategy ? investmentNotes : null,
          })
          .select()
          .single();

        if (expenseError) throw expenseError;
        expense = data;
      }

      // Upload new files
      if (newFiles.length > 0 && expense) {
        for (let i = 0; i < newFiles.length; i++) {
          const fileData = newFiles[i];
          const fileExt = fileData.file.name.split('.').pop();
          const timestamp = Date.now();
          const filePath = `${user.id}/${expense.id}/${fileData.documentType}_${timestamp}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(filePath, fileData.file);

          if (uploadError) throw uploadError;

          const { error: receiptError } = await supabase
            .from("receipts")
            .insert({
              user_id: user.id,
              invoice_id: expense.id,
              file_path: filePath,
              file_type: fileData.file.type,
              document_type: fileData.documentType,
              description: fileData.description || null,
              display_order: i,
            });

          if (receiptError) throw receiptError;
        }
      }

      setSuccess(true);
      toast.success(isEditMode ? "Expense updated successfully!" : "Expense added successfully!");
      
      // Reset form after 2 seconds or navigate
      setTimeout(() => {
        setSuccess(false);
        navigate("/expenses");
      }, 2000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to add expense");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="mb-2">{isEditMode ? "Expense Updated!" : "Expense Added!"}</CardTitle>
          <CardDescription>
            Redirecting to expenses...
          </CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate("/dashboard")} className="hover:text-foreground">
            Dashboard
          </button>
          <span>/</span>
          <span className="text-foreground">{isEditMode ? "Edit Expense" : "Add Expense"}</span>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{isEditMode ? "Edit Expense" : "Add New Expense"}</CardTitle>
            <CardDescription>
              {isEditMode ? "Update your expense details" : "Track your medical expenses and receipts"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {isEditMode && receipts.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing Documents</Label>
                  <ReceiptGallery 
                    expenseId={id!} 
                    receipts={receipts}
                    onReceiptDeleted={() => loadExpense(id!)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Documents</Label>
                  {isEditMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAttachDialog(true)}
                    >
                      Attach Existing Documents
                    </Button>
                  )}
                </div>
                <MultiFileUpload
                  onFilesChange={setNewFiles}
                  disabled={loading}
                />
              </div>

              <PaymentPlanFields
                hasPaymentPlan={hasPaymentPlan}
                onHasPaymentPlanChange={setHasPaymentPlan}
                totalAmount={formData.paymentPlanTotalAmount}
                onTotalAmountChange={(value) => setFormData({ ...formData, paymentPlanTotalAmount: value })}
                installments={formData.paymentPlanInstallments}
                onInstallmentsChange={(value) => setFormData({ ...formData, paymentPlanInstallments: value })}
                notes={formData.paymentPlanNotes}
                onNotesChange={(value) => setFormData({ ...formData, paymentPlanNotes: value })}
                currentAmount={formData.amount}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  placeholder="e.g., CVS Pharmacy"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {HSA_ELIGIBLE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  maxLength={500}
                />
              </div>

              {formData.category && formData.amount && parseFloat(formData.amount) > 0 && (
                <DocumentChecklist
                  category={formData.category}
                  amount={parseFloat(formData.amount)}
                  receipts={[...receipts, ...newFiles]}
                  hasPaymentPlan={hasPaymentPlan}
                />
              )}

              {recommendation && !isEditMode && (
                <PaymentRecommendation recommendation={recommendation} />
              )}

              {formData.category && HSA_ELIGIBLE_CATEGORIES.includes(formData.category) && !isEditMode && (
                <>
                  {hsaOpenedDate && new Date(formData.date) < new Date(hsaOpenedDate) && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        ⚠️ Expense before HSA opened
                      </p>
                      <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                        This expense occurred before your HSA was opened ({new Date(hsaOpenedDate).toLocaleDateString()}). 
                        It cannot be reimbursed from your HSA.
                      </p>
                    </div>
                  )}
                  
                  {(!hsaOpenedDate || new Date(formData.date) >= new Date(hsaOpenedDate)) && (
                    <ReimbursementStrategySelector
                      enabled={useReimbursementStrategy}
                      onEnabledChange={setUseReimbursementStrategy}
                      strategy={reimbursementStrategy}
                      onStrategyChange={setReimbursementStrategy}
                      plannedDate={plannedReimbursementDate}
                      onPlannedDateChange={setPlannedReimbursementDate}
                      reminderDate={reminderDate}
                      onReminderDateChange={setReminderDate}
                      cardPayoffMonths={cardPayoffMonths}
                      onCardPayoffMonthsChange={setCardPayoffMonths}
                      notes={investmentNotes}
                      onNotesChange={setInvestmentNotes}
                      expenseDate={formData.date}
                    />
                  )}
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update Expense" : "Add Expense")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {isEditMode && (
        <AttachDocumentDialog
          invoiceId={id!}
          open={showAttachDialog}
          onOpenChange={setShowAttachDialog}
          onAttached={() => loadExpense(id!)}
        />
      )}
    </div>
  );
};

export default ExpenseEntry;
