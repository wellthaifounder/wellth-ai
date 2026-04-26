import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CheckCircle2, Upload, Paperclip } from "lucide-react";
import { z } from "zod";
import { getPaymentRecommendation } from "@/lib/paymentRecommendation";
import { PaymentRecommendation } from "@/components/expense/PaymentRecommendation";
import { ReceiptGallery } from "@/components/expense/ReceiptGallery";
import { MultiFileUpload } from "@/components/expense/MultiFileUpload";
import { PaymentPlanFields } from "@/components/expense/PaymentPlanFields";
import { AttachDocumentDialog } from "@/components/documents/AttachDocumentDialog";
import { LabelSelector } from "@/components/labels/LabelSelector";
import { Badge } from "@/components/ui/badge";
import { LinkTransactionDialog } from "@/components/bills/LinkTransactionDialog";
import { Link2 } from "lucide-react";
import { useHSAEligibility } from "@/hooks/useHSAEligibility";
import { logError } from "@/utils/errorHandler";

const invoiceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  vendor: z.string().trim().min(1, "Vendor is required").max(100),
  totalAmount: z
    .number({ invalid_type_error: "Amount is required" })
    .positive("Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  notes: z.string().max(500).optional(),
  invoiceNumber: z.string().max(50).optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

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
  "Other Medical",
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
  id?: string;
}

const InvoiceEntry = () => {
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
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      vendor: "",
      category: "",
      notes: "",
      invoiceNumber: "",
    },
  });

  const watchedDate = watch("date");
  const watchedAmount = watch("totalAmount");
  const watchedCategory = watch("category");
  const watchedVendor = watch("vendor");

  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [newFiles, setNewFiles] = useState<NewFile[]>([]);
  const [success, setSuccess] = useState(false);
  const [hasPaymentPlan, setHasPaymentPlan] = useState(false);
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [showLinkTransactionDialog, setShowLinkTransactionDialog] =
    useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedHSAAccount, setSelectedHSAAccount] = useState<string>("");
  const [isHsaEligible, setIsHsaEligible] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [npiNumber, setNpiNumber] = useState("");
  const [insurancePlanType, setInsurancePlanType] = useState("");
  const [insurancePlanName, setInsurancePlanName] = useState("");
  const [networkStatus, setNetworkStatus] = useState("");
  const [paymentPlanData, setPaymentPlanData] = useState({
    totalAmount: "",
    installments: "",
    notes: "",
  });

  const { eligibleAccounts } = useHSAEligibility(watchedDate);

  const recommendation =
    watchedAmount > 0 && watchedCategory
      ? getPaymentRecommendation({
          amount: watchedAmount,
          category: watchedCategory,
          isHsaEligible,
        })
      : null;

  useEffect(() => {
    if (isEditMode && id) {
      loadInvoice(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  // Auto-set HSA eligibility based on category selection (for new invoices)
  useEffect(() => {
    if (!isEditMode && watchedCategory) {
      setIsHsaEligible(HSA_ELIGIBLE_CATEGORIES.includes(watchedCategory));
    }
  }, [watchedCategory, isEditMode]);

  // Auto-select HSA account if only one eligible account
  useEffect(() => {
    if (eligibleAccounts.length === 1 && !selectedHSAAccount) {
      setSelectedHSAAccount(eligibleAccounts[0].id);
    }
  }, [eligibleAccounts, selectedHSAAccount]);

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
        reset({
          date: data.date,
          vendor: data.vendor,
          totalAmount: data.total_amount ?? data.amount ?? 0,
          category: data.category || "",
          notes: data.notes || "",
          invoiceNumber: data.invoice_number || "",
        });
        setInvoiceDate(data.invoice_date || data.date);
        setIsHsaEligible(data.is_hsa_eligible || false);
        setNpiNumber(data.npi_number || "");
        setInsurancePlanType(data.insurance_plan_type || "");
        setInsurancePlanName(data.insurance_plan_name || "");
        setNetworkStatus(data.network_status || "");
        setPaymentPlanData({
          totalAmount: data.payment_plan_total_amount?.toString() || "",
          installments: data.payment_plan_installments?.toString() || "",
          notes: data.payment_plan_notes || "",
        });
        setHasPaymentPlan(!!data.payment_plan_total_amount);
        if (data.hsa_account_id) setSelectedHSAAccount(data.hsa_account_id);

        const { data: receiptsData } = await supabase
          .from("receipts")
          .select(
            "id, file_path, file_type, document_type, description, display_order, invoice_id",
          )
          .eq("invoice_id", invoiceId)
          .order("display_order");
        if (receiptsData) setReceipts(receiptsData);
      }
    } catch (error) {
      logError("Error loading invoice", error);
      toast.error("Failed to load invoice");
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (validatedData: InvoiceFormValues) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const formattedDate = new Date(validatedData.date + "T00:00:00")
        .toISOString()
        .split("T")[0];
      const formattedInvoiceDate = new Date(invoiceDate + "T00:00:00")
        .toISOString()
        .split("T")[0];

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
            invoice_number: validatedData.invoiceNumber || null,
            invoice_date: formattedInvoiceDate,
            is_hsa_eligible: isHsaEligible,
            npi_number: npiNumber || null,
            insurance_plan_type: insurancePlanType || null,
            insurance_plan_name: insurancePlanName || null,
            network_status: networkStatus || null,
            hsa_account_id: selectedHSAAccount || null,
            payment_plan_total_amount:
              hasPaymentPlan && paymentPlanData.totalAmount
                ? parseFloat(paymentPlanData.totalAmount)
                : null,
            payment_plan_installments:
              hasPaymentPlan && paymentPlanData.installments
                ? parseInt(paymentPlanData.installments)
                : null,
            payment_plan_notes: hasPaymentPlan ? paymentPlanData.notes : null,
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
            invoice_number: validatedData.invoiceNumber || null,
            invoice_date: formattedInvoiceDate,
            is_hsa_eligible: isHsaEligible,
            is_reimbursed: false,
            npi_number: npiNumber || null,
            insurance_plan_type: insurancePlanType || null,
            insurance_plan_name: insurancePlanName || null,
            network_status: networkStatus || null,
            payment_plan_total_amount:
              hasPaymentPlan && paymentPlanData.totalAmount
                ? parseFloat(paymentPlanData.totalAmount)
                : null,
            payment_plan_installments:
              hasPaymentPlan && paymentPlanData.installments
                ? parseInt(paymentPlanData.installments)
                : null,
            payment_plan_notes: hasPaymentPlan ? paymentPlanData.notes : null,
          })
          .select()
          .single();
        if (invoiceError) throw invoiceError;
        expenseReport = data;
      }

      if (newFiles.length > 0 && expenseReport) {
        for (let i = 0; i < newFiles.length; i++) {
          const fileData = newFiles[i];
          const fileExt = fileData.file.name.split(".").pop();
          const timestamp = Date.now();
          const filePath = `${user.id}/${expenseReport.id}/${fileData.documentType}_${timestamp}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("receipts")
            .upload(filePath, fileData.file);
          if (uploadError) throw uploadError;
          const { error: receiptError } = await supabase
            .from("receipts")
            .insert({
              user_id: user.id,
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
      toast.success(
        isEditMode ? "Bill updated successfully!" : "Bill added successfully!",
      );
      setTimeout(() => {
        setSuccess(false);
        navigate("/invoices");
      }, 2000);
    } catch (error) {
      toast.error("Failed to save bill");
      logError("InvoiceEntry submit", error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="mb-2">
            {isEditMode ? "Bill Updated!" : "Bill Added!"}
          </CardTitle>
          <CardDescription>Redirecting to bills...</CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={() => navigate("/dashboard")}
            className="hover:text-foreground"
          >
            Dashboard
          </button>
          <span>/</span>
          <button
            onClick={() => navigate("/invoices")}
            className="hover:text-foreground"
          >
            Bills
          </button>
          <span>/</span>
          <span className="text-foreground">
            {isEditMode ? "Edit Bill" : "Add Bill"}
          </span>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>
                  {isEditMode ? "Edit Bill" : "Add New Bill"}
                </CardTitle>
                <CardDescription>
                  {isEditMode
                    ? "Update your bill details"
                    : "Track medical bills for strategic payment optimization"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={rhfHandleSubmit(onSubmit)} className="space-y-6">
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

              {isEditMode && (
                <div className="space-y-4">
                  <Label>Documents</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        id="file-upload"
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        onChange={(e) => {
                          if (!e.target.files) return;
                          const newFilesArray = Array.from(e.target.files).map(
                            (file) => ({
                              file,
                              documentType: "receipt" as const,
                              description: "",
                              id: Math.random().toString(36).substring(7),
                            }),
                          );
                          setNewFiles((prev) => [...prev, ...newFilesArray]);
                          e.target.value = "";
                        }}
                        disabled={loading}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("file-upload")?.click()
                        }
                        disabled={loading}
                        className="flex-1"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Documents
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAttachDialog(true)}
                      className="flex-1"
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach Existing Documents
                    </Button>
                  </div>
                  {newFiles.length > 0 && (
                    <div className="mt-2">
                      <Badge variant="secondary">
                        {newFiles.length} file{newFiles.length !== 1 ? "s" : ""}{" "}
                        selected
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {isEditMode && (
                <div className="space-y-2">
                  <Label>Transaction Linking</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLinkTransactionDialog(true)}
                    className="w-full"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Link to Transactions
                  </Button>
                </div>
              )}

              {!isEditMode && (
                <MultiFileUpload
                  onFilesChange={setNewFiles}
                  disabled={loading}
                />
              )}

              <PaymentPlanFields
                hasPaymentPlan={hasPaymentPlan}
                onHasPaymentPlanChange={setHasPaymentPlan}
                totalAmount={paymentPlanData.totalAmount}
                onTotalAmountChange={(value) =>
                  setPaymentPlanData((prev) => ({
                    ...prev,
                    totalAmount: value,
                  }))
                }
                installments={paymentPlanData.installments}
                onInstallmentsChange={(value) =>
                  setPaymentPlanData((prev) => ({
                    ...prev,
                    installments: value,
                  }))
                }
                notes={paymentPlanData.notes}
                onNotesChange={(value) =>
                  setPaymentPlanData((prev) => ({ ...prev, notes: value }))
                }
                currentAmount={watchedAmount?.toString() || ""}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Bill Date</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Bill Number (Optional)</Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="e.g., INV-12345"
                    maxLength={50}
                    {...register("invoiceNumber")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Provider/Vendor</Label>
                <Input
                  id="vendor"
                  placeholder="e.g., City Hospital"
                  maxLength={100}
                  {...register("vendor")}
                />
                {errors.vendor && (
                  <p className="text-sm text-destructive">
                    {errors.vendor.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="npiNumber">NPI Number (Optional)</Label>
                <Input
                  id="npiNumber"
                  placeholder="e.g., 1234567890"
                  value={npiNumber}
                  onChange={(e) => setNpiNumber(e.target.value)}
                  maxLength={10}
                  pattern="[0-9]*"
                />
                <p className="text-xs text-muted-foreground">
                  National Provider Identifier — helps improve provider insights
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
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
                    )}
                  />
                  {errors.category && (
                    <p className="text-sm text-destructive">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Bill Amount</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("totalAmount", { valueAsNumber: true })}
                  />
                  {errors.totalAmount && (
                    <p className="text-sm text-destructive">
                      {errors.totalAmount.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Insurance Plan Type (Optional)</Label>
                  <Select
                    value={insurancePlanType}
                    onValueChange={setInsurancePlanType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HMO">HMO</SelectItem>
                      <SelectItem value="PPO">PPO</SelectItem>
                      <SelectItem value="EPO">EPO</SelectItem>
                      <SelectItem value="POS">POS</SelectItem>
                      <SelectItem value="HDHP">HDHP</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Network Status (Optional)</Label>
                  <Select
                    value={networkStatus}
                    onValueChange={setNetworkStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select network status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In-Network">In-Network</SelectItem>
                      <SelectItem value="Out-of-Network">
                        Out-of-Network
                      </SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurancePlanName">
                  Insurance Plan Name (Optional)
                </Label>
                <Input
                  id="insurancePlanName"
                  placeholder="e.g., Blue Cross Blue Shield - Silver Plan"
                  value={insurancePlanName}
                  onChange={(e) => setInsurancePlanName(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="hsaEligible" className="text-base">
                    HSA Eligible
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mark this bill as eligible for HSA reimbursement
                  </p>
                </div>
                <Switch
                  id="hsaEligible"
                  checked={isHsaEligible}
                  onCheckedChange={setIsHsaEligible}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional details about this invoice..."
                  maxLength={500}
                  {...register("notes")}
                />
              </div>

              {isEditMode && (
                <div className="space-y-2">
                  <Label>Labels</Label>
                  <LabelSelector
                    resourceId={id!}
                    resourceType="invoice"
                    selectedLabels={selectedLabels}
                    onLabelsChange={setSelectedLabels}
                  />
                </div>
              )}

              {recommendation && !isEditMode && (
                <PaymentRecommendation recommendation={recommendation} />
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? isEditMode
                    ? "Updating..."
                    : "Adding..."
                  : isEditMode
                    ? "Update Bill"
                    : "Add Bill"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isEditMode && (
          <AttachDocumentDialog
            invoiceId={id!}
            open={showAttachDialog}
            onOpenChange={setShowAttachDialog}
            onAttached={() => loadInvoice(id!)}
          />
        )}

        {isEditMode && watchedVendor && (
          <LinkTransactionDialog
            open={showLinkTransactionDialog}
            onOpenChange={setShowLinkTransactionDialog}
            invoice={{
              id: id!,
              vendor: watchedVendor,
              amount: watchedAmount || 0,
              total_amount: watchedAmount || 0,
              date: watchedDate,
            }}
            onSuccess={() => {
              toast.success("Transactions updated");
              loadInvoice(id!);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default InvoiceEntry;
