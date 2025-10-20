import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { getPaymentRecommendation } from "@/lib/paymentRecommendation";
import { PaymentRecommendation } from "@/components/expense/PaymentRecommendation";
import { ReceiptGallery } from "@/components/expense/ReceiptGallery";
import { MultiFileUpload } from "@/components/expense/MultiFileUpload";
import { PaymentPlanFields } from "@/components/expense/PaymentPlanFields";
import { LinkToIncidentDialog } from "@/components/expense/LinkToIncidentDialog";

const invoiceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  vendor: z.string().trim().min(1, "Vendor is required").max(100),
  totalAmount: z.number().positive("Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  notes: z.string().max(500).optional(),
  invoiceNumber: z.string().max(50).optional(),
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

const InvoiceEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [newFiles, setNewFiles] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  const [hasPaymentPlan, setHasPaymentPlan] = useState(false);
  const [currentIncidentId, setCurrentIncidentId] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vendor: "",
    totalAmount: "",
    category: "",
    notes: "",
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentPlanTotalAmount: "",
    paymentPlanInstallments: "",
    paymentPlanNotes: "",
  });

  const recommendation = formData.totalAmount && formData.category && parseFloat(formData.totalAmount) > 0
    ? getPaymentRecommendation({
        amount: parseFloat(formData.totalAmount),
        category: formData.category,
        isHsaEligible: HSA_ELIGIBLE_CATEGORIES.includes(formData.category),
      })
    : null;

  useEffect(() => {
    if (isEditMode && id) {
      loadInvoice(id);
    }
  }, [id, isEditMode]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          date: data.date,
          vendor: data.vendor,
          totalAmount: data.total_amount?.toString() || data.amount?.toString() || "",
          category: data.category,
          notes: data.notes || "",
          invoiceNumber: data.invoice_number || "",
          invoiceDate: data.invoice_date || data.date,
          paymentPlanTotalAmount: data.payment_plan_total_amount?.toString() || "",
          paymentPlanInstallments: data.payment_plan_installments?.toString() || "",
          paymentPlanNotes: data.payment_plan_notes || "",
        });
        setHasPaymentPlan(!!data.payment_plan_total_amount);
        setCurrentIncidentId(data.medical_incident_id || undefined);
        
        const { data: receiptsData } = await supabase
          .from("receipts")
          .select("*")
          .eq("invoice_id", invoiceId)
          .order("display_order");
        
        if (receiptsData) {
          setReceipts(receiptsData);
        }
      }
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Failed to load invoice");
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = invoiceSchema.parse({
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const isHsaEligible = HSA_ELIGIBLE_CATEGORIES.includes(validatedData.category);

      const dateObj = new Date(validatedData.date + 'T00:00:00');
      const formattedDate = dateObj.toISOString().split('T')[0];
      
      const invoiceDateObj = new Date(formData.invoiceDate + 'T00:00:00');
      const formattedInvoiceDate = invoiceDateObj.toISOString().split('T')[0];

      let expenseReport;
      
      if (isEditMode && id) {
        const { data, error: invoiceError } = await supabase
          .from("invoices")
          .update({
            date: formattedDate,
            vendor: validatedData.vendor,
            amount: validatedData.totalAmount,
            total_amount: validatedData.totalAmount,
            category: validatedData.category,
            notes: validatedData.notes || null,
            invoice_number: formData.invoiceNumber || null,
            invoice_date: formattedInvoiceDate,
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

        if (invoiceError) throw invoiceError;
        expenseReport = data;
      } else {
        const { data, error: invoiceError } = await supabase
          .from("invoices")
          .insert({
            user_id: user.id,
            date: formattedDate,
            vendor: validatedData.vendor,
            amount: validatedData.totalAmount,
            total_amount: validatedData.totalAmount,
            category: validatedData.category,
            notes: validatedData.notes || null,
            invoice_number: formData.invoiceNumber || null,
            invoice_date: formattedInvoiceDate,
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

        if (invoiceError) throw invoiceError;
        expenseReport = data;
      }

      if (newFiles.length > 0 && expenseReport) {
        for (let i = 0; i < newFiles.length; i++) {
          const fileData = newFiles[i];
          const fileExt = fileData.file.name.split('.').pop();
          const timestamp = Date.now();
          const filePath = `${user.id}/${expenseReport.id}/${fileData.documentType}_${timestamp}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(filePath, fileData.file);

          if (uploadError) throw uploadError;

          const { error: receiptError } = await supabase
            .from("receipts")
            .insert({
              invoice_id: expenseReport.id,
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
      toast.success(isEditMode ? "Invoice updated successfully!" : "Invoice added successfully!");
      
      setTimeout(() => {
        setSuccess(false);
        navigate("/invoices");
      }, 2000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to save invoice");
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
          <CardTitle className="mb-2">{isEditMode ? "Invoice Updated!" : "Invoice Added!"}</CardTitle>
          <CardDescription>
            Redirecting to invoices...
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
          <span className="text-foreground">{isEditMode ? "Edit Invoice" : "Add Invoice/Bill"}</span>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{isEditMode ? "Edit Invoice" : "Add New Invoice/Bill"}</CardTitle>
                <CardDescription>
                  {isEditMode ? "Update your invoice details" : "Track medical bills and invoices for strategic payment optimization"}
                </CardDescription>
              </div>
              {isEditMode && (
                <LinkToIncidentDialog 
                  invoiceId={id!}
                  currentIncidentId={currentIncidentId}
                  onLinked={() => loadInvoice(id!)}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {isEditMode && receipts.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing Documents</Label>
                  <ReceiptGallery 
                    expenseId={id!} 
                    receipts={receipts}
                    onReceiptDeleted={() => loadInvoice(id!)}
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
                currentAmount={formData.totalAmount}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Invoice Date</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number (Optional)</Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="e.g., INV-12345"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Provider/Vendor</Label>
                <Input
                  id="vendor"
                  placeholder="e.g., City Hospital"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                  <Label htmlFor="totalAmount">Total Invoice Amount</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional details about this invoice..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  maxLength={500}
                />
              </div>

              {recommendation && !isEditMode && (
                <PaymentRecommendation recommendation={recommendation} />
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update Invoice" : "Add Invoice")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceEntry;
