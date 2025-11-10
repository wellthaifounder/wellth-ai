import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, FileText, AlertTriangle, CreditCard, Scale, Upload, Link2, CheckCircle2, Plus } from "lucide-react";
import { AuthenticatedNav } from "@/components/AuthenticatedNav";
import { BillErrorCard } from "@/components/bills/BillErrorCard";
import { PriceBenchmarking } from "@/components/bills/PriceBenchmarking";
import { ProviderPerformanceCard } from "@/components/bills/ProviderPerformanceCard";
import { ReceiptGallery } from "@/components/expense/ReceiptGallery";
import { MultiFileUpload } from "@/components/expense/MultiFileUpload";
import { LinkTransactionDialog } from "@/components/bills/LinkTransactionDialog";
import { calculateHSAEligibility } from "@/lib/hsaCalculations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

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

export default function BillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewBill = id === 'new';
  const [activeTab, setActiveTab] = useState("overview");
  const [newFiles, setNewFiles] = useState<any[]>([]);
  const [showLinkTransactionDialog, setShowLinkTransactionDialog] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vendor: "",
    totalAmount: "",
    category: "",
    notes: "",
    invoiceNumber: "",
    isHsaEligible: false,
  });

  // Fetch bill data
  const { data: bill, isLoading, refetch } = useQuery({
    queryKey: ['bill', id],
    queryFn: async () => {
      if (isNewBill) return null;
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          payment_transactions (
            id,
            payment_date,
            amount,
            payment_source,
            is_reimbursed,
            reimbursed_date
          ),
          bill_reviews (
            id,
            review_status,
            total_potential_savings,
            confidence_score,
            analyzed_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !isNewBill && !!id
  });

  // Fetch receipts/documents
  const { data: receipts, refetch: refetchReceipts } = useQuery({
    queryKey: ['receipts', id],
    queryFn: async () => {
      if (isNewBill) return [];
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('invoice_id', id)
        .order('display_order');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !isNewBill && !!id
  });

  // Fetch bill errors
  const { data: errors } = useQuery({
    queryKey: ['bill-errors', bill?.bill_reviews?.[0]?.id],
    queryFn: async () => {
      const reviewId = bill?.bill_reviews?.[0]?.id;
      if (!reviewId) return [];
      
      const { data, error } = await supabase
        .from('bill_errors')
        .select('*')
        .eq('bill_review_id', reviewId)
        .order('error_category', { ascending: true })
        .order('potential_savings', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!bill?.bill_reviews?.[0]?.id
  });

  // Fetch provider data
  const { data: providerData } = useQuery({
    queryKey: ['provider-for-bill', bill?.vendor],
    queryFn: async () => {
      if (!bill?.vendor) return null;
      const { data } = await supabase
        .from('providers')
        .select('*')
        .ilike('name', bill.vendor)
        .maybeSingle();
      return data;
    },
    enabled: !!bill?.vendor
  });

  // Load bill data into form when editing
  useEffect(() => {
    if (bill && !isNewBill) {
      setFormData({
        date: bill.date,
        vendor: bill.vendor,
        totalAmount: bill.total_amount?.toString() || bill.amount?.toString() || "",
        category: bill.category,
        notes: bill.notes || "",
        invoiceNumber: bill.invoice_number || "",
        isHsaEligible: bill.is_hsa_eligible || false,
      });
    }
  }, [bill, isNewBill]);

  // Auto-set HSA eligibility based on category (for new bills)
  useEffect(() => {
    if (isNewBill && formData.category) {
      const isEligible = HSA_ELIGIBLE_CATEGORIES.includes(formData.category);
      setFormData(prev => ({ ...prev, isHsaEligible: isEligible }));
    }
  }, [formData.category, isNewBill]);

  const handleSaveBill = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const amount = parseFloat(formData.totalAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const billData = {
        user_id: user.id,
        date: formData.date,
        vendor: formData.vendor,
        amount: amount,
        total_amount: amount,
        category: formData.category,
        notes: formData.notes || null,
        invoice_number: formData.invoiceNumber || null,
        is_hsa_eligible: formData.isHsaEligible,
      };

      let billId = id;

      if (isNewBill) {
        const { data, error } = await supabase
          .from('invoices')
          .insert(billData)
          .select()
          .single();

        if (error) throw error;
        billId = data.id;
        
        toast.success("Bill created successfully!");
        navigate(`/bills/${billId}`);
      } else {
        const { error } = await supabase
          .from('invoices')
          .update(billData)
          .eq('id', id);

        if (error) throw error;
        toast.success("Bill updated successfully!");
        refetch();
      }

      // Upload new files if any
      if (newFiles.length > 0 && billId) {
        for (let i = 0; i < newFiles.length; i++) {
          const fileData = newFiles[i];
          const fileExt = fileData.file.name.split('.').pop();
          const timestamp = Date.now();
          const filePath = `${user.id}/${billId}/${fileData.documentType}_${timestamp}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(filePath, fileData.file);

          if (uploadError) throw uploadError;

          const { error: receiptError } = await supabase
            .from('receipts')
            .insert({
              user_id: user.id,
              invoice_id: billId,
              file_path: filePath,
              file_type: fileData.file.type,
              document_type: fileData.documentType,
              description: fileData.description || null,
              display_order: i,
            });

          if (receiptError) throw receiptError;
        }
        setNewFiles([]);
        refetchReceipts();
        
        // If this is a medical bill document, trigger AI review
        const hasMedicalBill = newFiles.some(f => f.documentType === 'bill' || f.documentType === 'eob');
        if (hasMedicalBill) {
          toast.info("AI review will be triggered automatically");
        }
      }
    } catch (error) {
      console.error("Error saving bill:", error);
      toast.error("Failed to save bill");
    }
  };

  const handleStartDispute = () => {
    navigate(`/bills/${id}/dispute`);
  };

  const handleMarkCorrect = async () => {
    const reviewId = bill?.bill_reviews?.[0]?.id;
    if (!reviewId) return;
    
    try {
      const { error } = await supabase
        .from('bill_reviews')
        .update({ review_status: 'resolved' })
        .eq('id', reviewId);

      if (error) throw error;
      
      toast.success("Bill marked as correct");
      refetch();
    } catch (error) {
      console.error('Error updating bill review:', error);
      toast.error("Failed to update bill status");
    }
  };

  if (isLoading && !isNewBill) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const review = bill?.bill_reviews?.[0];
  const breakdown = bill ? calculateHSAEligibility(bill, (bill.payment_transactions || []) as any) : null;
  const errorCount = errors?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNav />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/bills")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bills
          </Button>
        </div>

        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {isNewBill ? "Add New Bill" : bill?.vendor || "Bill Details"}
                  </CardTitle>
                  <CardDescription>
                    {isNewBill ? "Track your medical bill and manage payments" : `Bill #${bill?.invoice_number || 'N/A'}`}
                  </CardDescription>
                </div>
                {!isNewBill && review && (
                  <Badge variant={errorCount > 0 ? "destructive" : "default"}>
                    {errorCount > 0 ? `${errorCount} Issues Found` : "Verified"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">
                    <FileText className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="documents">
                    <Upload className="h-4 w-4 mr-2" />
                    Documents
                  </TabsTrigger>
                  {!isNewBill && review && (
                    <TabsTrigger value="ai-review">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      AI Review
                    </TabsTrigger>
                  )}
                  {!isNewBill && (
                    <TabsTrigger value="payments">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Payments
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="date">Bill Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invoiceNumber">Bill Number (Optional)</Label>
                      <Input
                        id="invoiceNumber"
                        placeholder="e.g., INV-12345"
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
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
                      <Label htmlFor="totalAmount">Total Amount</Label>
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

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hsaEligible"
                      checked={formData.isHsaEligible}
                      onCheckedChange={(checked) => setFormData({ ...formData, isHsaEligible: checked })}
                    />
                    <Label htmlFor="hsaEligible">HSA Eligible</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                    />
                  </div>

                  {!isNewBill && breakdown && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Billed</p>
                        <p className="text-lg font-semibold">${breakdown.totalInvoiced.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Paid via HSA</p>
                        <p className="text-lg font-semibold text-green-600">${breakdown.paidViaHSA.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Paid Other</p>
                        <p className="text-lg font-semibold">${breakdown.paidViaOther.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Unpaid</p>
                        <p className="text-lg font-semibold text-red-600">${breakdown.unpaidBalance.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button onClick={handleSaveBill}>
                      {isNewBill ? "Create Bill" : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/bills")}>
                      Cancel
                    </Button>
                  </div>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6 mt-6">
                  {!isNewBill && receipts && receipts.length > 0 && (
                    <div className="space-y-2">
                      <Label>Existing Documents</Label>
                      <ReceiptGallery 
                        expenseId={id!} 
                        receipts={receipts}
                        onReceiptDeleted={refetchReceipts}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Upload New Documents</Label>
                    <MultiFileUpload
                      onFilesChange={setNewFiles}
                      disabled={false}
                    />
                    {newFiles.length > 0 && (
                      <Button onClick={handleSaveBill} className="mt-4">
                        Upload {newFiles.length} Document{newFiles.length !== 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                </TabsContent>

                {/* AI Review Tab */}
                {!isNewBill && review && (
                  <TabsContent value="ai-review" className="space-y-6 mt-6">
                    {errorCount > 0 ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                <span className="font-semibold">Total Issues</span>
                              </div>
                              <p className="text-3xl font-bold">{errorCount}</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 mb-2">
                                <Scale className="h-5 w-5 text-green-600" />
                                <span className="font-semibold">Potential Savings</span>
                              </div>
                              <p className="text-3xl font-bold text-green-600">
                                ${(review.total_potential_savings || 0).toFixed(2)}
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">Confidence</span>
                              </div>
                              <p className="text-3xl font-bold">
                                {((review.confidence_score || 0) * 100).toFixed(0)}%
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {providerData && <ProviderPerformanceCard provider={providerData} />}
                        <PriceBenchmarking 
                          invoiceAmount={bill?.amount || 0}
                          category={bill?.category}
                        />

                        <div className="space-y-4">
                          <h3 className="text-xl font-bold">Identified Issues</h3>
                          {errors?.map((error) => (
                            <BillErrorCard key={error.id} error={error} />
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <Button onClick={handleStartDispute}>
                            Start Dispute Process
                          </Button>
                          <Button variant="outline" onClick={handleMarkCorrect}>
                            Mark as Correct
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">No Issues Found</h3>
                        <p className="text-muted-foreground">
                          This bill appears to be accurate. No billing errors were detected.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                )}

                {/* Payments Tab */}
                {!isNewBill && (
                  <TabsContent value="payments" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Payment History</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLinkTransactionDialog(true)}
                          >
                            <Link2 className="h-4 w-4 mr-2" />
                            Link Transaction
                          </Button>
                          <Button size="sm" onClick={() => navigate(`/payment/new?invoiceId=${id}`)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Payment
                          </Button>
                        </div>
                      </div>

                      {bill?.payment_transactions && bill.payment_transactions.length > 0 ? (
                        <div className="space-y-2">
                          {bill.payment_transactions.map((payment: any) => (
                            <Card key={payment.id}>
                              <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">${payment.amount.toFixed(2)}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {payment.payment_source} • {new Date(payment.payment_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {payment.is_reimbursed && (
                                    <Badge variant="default">Reimbursed</Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">No payments recorded yet</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <LinkTransactionDialog
        open={showLinkTransactionDialog}
        onOpenChange={setShowLinkTransactionDialog}
        invoice={bill}
        onSuccess={() => {
          refetch();
          setShowLinkTransactionDialog(false);
        }}
      />
    </div>
  );
}
