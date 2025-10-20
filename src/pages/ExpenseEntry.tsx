import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload, Sparkles, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { getPaymentRecommendation } from "@/lib/paymentRecommendation";
import { PaymentRecommendation } from "@/components/expense/PaymentRecommendation";
import { ReceiptGallery } from "@/components/expense/ReceiptGallery";
import { DocumentChecklist } from "@/components/expense/DocumentChecklist";
import { MultiFileUpload } from "@/components/expense/MultiFileUpload";
import { PaymentPlanFields } from "@/components/expense/PaymentPlanFields";

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
    if (isEditMode && id) {
      loadExpense(id);
    }
  }, [id, isEditMode]);

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
              expense_id: expense.id,
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

              <MultiFileUpload
                onFilesChange={setNewFiles}
                disabled={loading}
              />

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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update Expense" : "Add Expense")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpenseEntry;
