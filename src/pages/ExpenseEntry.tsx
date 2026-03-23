import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle } from "lucide-react";
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
import { celebrateFirstExpense } from "@/lib/confettiUtils";
import { logError } from "@/utils/errorHandler";

const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  vendor: z.string().trim().min(1, "Vendor is required").max(100),
  amount: z.number({ invalid_type_error: "Amount is required" }).positive("Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  notes: z.string().max(500).optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const HSA_ELIGIBLE_CATEGORIES = [
  "Doctor Visit", "Prescription", "Dental", "Vision", "Medical Equipment",
  "Lab Tests", "Hospital", "Physical Therapy", "Mental Health", "Other Medical",
];

interface Receipt {
  id: string;
  file_path: string;
  file_type: string;
  document_type: string;
  description: string | null;
  display_order: number | null;
  invoice_id: string;
}

interface NewFile {
  file: File;
  documentType: string;
  description?: string;
}

const ExpenseEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      vendor: "",
      category: "",
      notes: "",
    },
  });

  const watchedDate = watch("date");
  const watchedAmount = watch("amount");
  const watchedCategory = watch("category");

  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [newFiles, setNewFiles] = useState<NewFile[]>([]);
  const [success, setSuccess] = useState(false);
  const [hasPaymentPlan, setHasPaymentPlan] = useState(false);
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [useReimbursementStrategy, setUseReimbursementStrategy] = useState(false);
  const [reimbursementStrategy, setReimbursementStrategy] = useState<"immediate" | "medium" | "vault">("immediate");
  const [plannedReimbursementDate, setPlannedReimbursementDate] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [cardPayoffMonths, setCardPayoffMonths] = useState(0);
  const [investmentNotes, setInvestmentNotes] = useState("");
  const [hsaOpenedDate, setHsaOpenedDate] = useState<string | null>(null);
  const [hsaDateDialogOpen, setHsaDateDialogOpen] = useState(false);
  const [selectedHSAAccount, setSelectedHSAAccount] = useState<string>("");
  const [paymentPlanData, setPaymentPlanData] = useState({
    totalAmount: "",
    installments: "",
    notes: "",
  });

  const recommendation =
    watchedAmount > 0 && watchedCategory
      ? getPaymentRecommendation({
          amount: watchedAmount,
          category: watchedCategory,
          isHsaEligible: HSA_ELIGIBLE_CATEGORIES.includes(watchedCategory),
        })
      : null;

  useEffect(() => {
    loadHsaOpenedDate();
    if (isEditMode && id) {
      loadExpense(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  useEffect(() => {
    if (watchedDate && useReimbursementStrategy && !isEditMode) {
      setPlannedReimbursementDate(getDefaultReimbursementDate(reimbursementStrategy, watchedDate));
    }
  }, [watchedDate, reimbursementStrategy, useReimbursementStrategy, isEditMode]);

  const loadHsaOpenedDate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("hsa_opened_date")
        .eq("id", user.id)
        .single();
      if (profile) setHsaOpenedDate(profile.hsa_opened_date);
    } catch (error) {
      logError("Error loading HSA opened date", error);
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
        reset({
          date: data.date,
          vendor: data.vendor,
          amount: data.amount,
          category: data.category,
          notes: data.notes || "",
        });
        setPaymentPlanData({
          totalAmount: data.payment_plan_total_amount?.toString() || "",
          installments: data.payment_plan_installments?.toString() || "",
          notes: data.payment_plan_notes || "",
        });
        setHasPaymentPlan(!!data.payment_plan_total_amount);
        if (data.hsa_account_id) setSelectedHSAAccount(data.hsa_account_id);
        if (data.reimbursement_strategy && data.reimbursement_strategy !== "immediate") {
          setUseReimbursementStrategy(true);
          setReimbursementStrategy(data.reimbursement_strategy as "immediate" | "medium" | "vault");
          setPlannedReimbursementDate(data.planned_reimbursement_date || "");
          setReminderDate(data.reimbursement_reminder_date || "");
          setCardPayoffMonths(data.card_payoff_months || 0);
          setInvestmentNotes(data.investment_notes || "");
        }
        const { data: receiptsData } = await supabase
          .from("receipts")
          .select("id, file_path, file_type, document_type, description, display_order, invoice_id")
          .eq("invoice_id", expenseId)
          .order("display_order");
        if (receiptsData) setReceipts(receiptsData);
      }
    } catch (error) {
      logError("Error loading expense", error);
      toast.error("Failed to load expense");
      navigate("/expenses");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (validatedData: ExpenseFormValues) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const isHsaEligible = HSA_ELIGIBLE_CATEGORIES.includes(validatedData.category);
      let isTrulyReimbursable = isHsaEligible;
      if (isHsaEligible && hsaOpenedDate) {
        isTrulyReimbursable = new Date(validatedData.date) >= new Date(hsaOpenedDate);
      }

      const formattedDate = new Date(validatedData.date + "T00:00:00").toISOString().split("T")[0];

      let savedExpense;

      if (isEditMode && id) {
        const { data, error: expenseError } = await supabase
          .from("invoices")
          .update({
            date: formattedDate,
            vendor: validatedData.vendor,
            amount: validatedData.amount,
            category: validatedData.category,
            notes: validatedData.notes || null,
            is_hsa_eligible: isTrulyReimbursable,
            payment_plan_total_amount:
              hasPaymentPlan && paymentPlanData.totalAmount
                ? parseFloat(paymentPlanData.totalAmount)
                : null,
            payment_plan_installments:
              hasPaymentPlan && paymentPlanData.installments
                ? parseInt(paymentPlanData.installments)
                : null,
            payment_plan_notes: hasPaymentPlan ? paymentPlanData.notes : null,
            reimbursement_strategy: useReimbursementStrategy ? reimbursementStrategy : "immediate",
            planned_reimbursement_date: useReimbursementStrategy ? plannedReimbursementDate : null,
            reimbursement_reminder_date: useReimbursementStrategy ? reminderDate : null,
            card_payoff_months: useReimbursementStrategy ? cardPayoffMonths : 0,
            investment_notes: useReimbursementStrategy ? investmentNotes : null,
            hsa_account_id: selectedHSAAccount || null,
          })
          .eq("id", id)
          .select()
          .single();
        if (expenseError) throw expenseError;
        savedExpense = data;
      } else {
        const { data, error: expenseError } = await supabase
          .from("invoices")
          .insert({
            user_id: user.id,
            date: formattedDate,
            vendor: validatedData.vendor,
            amount: validatedData.amount,
            category: validatedData.category,
            notes: validatedData.notes || null,
            is_hsa_eligible: isTrulyReimbursable,
            is_reimbursed: false,
            payment_plan_total_amount:
              hasPaymentPlan && paymentPlanData.totalAmount
                ? parseFloat(paymentPlanData.totalAmount)
                : null,
            payment_plan_installments:
              hasPaymentPlan && paymentPlanData.installments
                ? parseInt(paymentPlanData.installments)
                : null,
            payment_plan_notes: hasPaymentPlan ? paymentPlanData.notes : null,
            reimbursement_strategy: useReimbursementStrategy ? reimbursementStrategy : "immediate",
            planned_reimbursement_date: useReimbursementStrategy ? plannedReimbursementDate : null,
            reimbursement_reminder_date: useReimbursementStrategy ? reminderDate : null,
            card_payoff_months: useReimbursementStrategy ? cardPayoffMonths : 0,
            investment_notes: useReimbursementStrategy ? investmentNotes : null,
          })
          .select()
          .single();
        if (expenseError) throw expenseError;
        savedExpense = data;
      }

      if (newFiles.length > 0 && savedExpense) {
        for (let i = 0; i < newFiles.length; i++) {
          const fileData = newFiles[i];
          const fileExt = fileData.file.name.split(".").pop();
          const timestamp = Date.now();
          const filePath = `${user.id}/${savedExpense.id}/${fileData.documentType}_${timestamp}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("receipts")
            .upload(filePath, fileData.file);
          if (uploadError) throw uploadError;
          const { error: receiptError } = await supabase.from("receipts").insert({
            user_id: user.id,
            invoice_id: savedExpense.id,
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

      if (!isEditMode) {
        const { count: expenseCount } = await supabase
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id);
        if (expenseCount === 1) celebrateFirstExpense();
      }

      setTimeout(() => {
        setSuccess(false);
        navigate("/expenses");
      }, 2000);
    } catch (error) {
      toast.error("Failed to save expense");
      logError("ExpenseEntry submit", error);
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
          <CardDescription>Redirecting to expenses...</CardDescription>
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
            <form onSubmit={rhfHandleSubmit(onSubmit)} className="space-y-6">
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
                <MultiFileUpload onFilesChange={setNewFiles} disabled={loading} />
              </div>

              <PaymentPlanFields
                hasPaymentPlan={hasPaymentPlan}
                onHasPaymentPlanChange={setHasPaymentPlan}
                totalAmount={paymentPlanData.totalAmount}
                onTotalAmountChange={(value) =>
                  setPaymentPlanData((prev) => ({ ...prev, totalAmount: value }))
                }
                installments={paymentPlanData.installments}
                onInstallmentsChange={(value) =>
                  setPaymentPlanData((prev) => ({ ...prev, installments: value }))
                }
                notes={paymentPlanData.notes}
                onNotesChange={(value) =>
                  setPaymentPlanData((prev) => ({ ...prev, notes: value }))
                }
                currentAmount={watchedAmount?.toString() || ""}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" {...register("date")} />
                  {errors.date && (
                    <p className="text-sm text-destructive">{errors.date.message}</p>
                  )}

                  {watchedDate && hsaOpenedDate && new Date(watchedDate) < new Date(hsaOpenedDate) && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Not HSA-Reimbursable</AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p>
                          This expense occurred on {new Date(watchedDate).toLocaleDateString()}, but
                          your HSA opened on {new Date(hsaOpenedDate).toLocaleDateString()}. You can
                          only reimburse expenses that occur after your HSA was opened.
                        </p>
                        <p className="text-sm">
                          You can still save this expense for record-keeping, but it won't be eligible
                          for HSA reimbursement.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {!hsaOpenedDate &&
                    watchedCategory &&
                    HSA_ELIGIBLE_CATEGORIES.includes(watchedCategory) && (
                      <Alert className="mt-2 bg-yellow-500/10 border-yellow-500/20">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm">
                              Set your HSA opened date to verify this expense is eligible for
                              reimbursement.
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setHsaDateDialogOpen(true)}
                              type="button"
                            >
                              Set Date
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("amount", { valueAsNumber: true })}
                  />
                  {errors.amount && (
                    <p className="text-sm text-destructive">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  placeholder="e.g., CVS Pharmacy"
                  maxLength={100}
                  {...register("vendor")}
                />
                {errors.vendor && (
                  <p className="text-sm text-destructive">{errors.vendor.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional details..."
                  maxLength={500}
                  {...register("notes")}
                />
              </div>

              {watchedCategory && watchedAmount > 0 && (
                <DocumentChecklist
                  category={watchedCategory}
                  amount={watchedAmount}
                  receipts={[...receipts, ...newFiles]}
                  hasPaymentPlan={hasPaymentPlan}
                />
              )}

              {recommendation && !isEditMode && (
                <PaymentRecommendation recommendation={recommendation} />
              )}

              {watchedCategory &&
                HSA_ELIGIBLE_CATEGORIES.includes(watchedCategory) &&
                !isEditMode && (
                  <>
                    {hsaOpenedDate && watchedDate && new Date(watchedDate) < new Date(hsaOpenedDate) && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                          ⚠️ Expense before HSA opened
                        </p>
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                          This expense occurred before your HSA was opened (
                          {new Date(hsaOpenedDate).toLocaleDateString()}). It cannot be reimbursed
                          from your HSA.
                        </p>
                      </div>
                    )}

                    {(!hsaOpenedDate ||
                      (watchedDate && new Date(watchedDate) >= new Date(hsaOpenedDate))) && (
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
                        expenseDate={watchedDate}
                      />
                    )}
                  </>
                )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading
                    ? isEditMode
                      ? "Updating..."
                      : "Adding..."
                    : isEditMode
                    ? "Update Expense"
                    : "Add Expense"}
                </Button>
              </div>
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

      <SetHSADateDialog
        open={hsaDateDialogOpen}
        onOpenChange={setHsaDateDialogOpen}
        onSuccess={() => { loadHsaOpenedDate(); }}
      />
    </div>
  );
};

export default ExpenseEntry;
