import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AIExtractionCard } from "./AIExtractionCard";
import { BillErrorCard } from "./BillErrorCard";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExtractedField {
  value: string | number | null;
  confidence: number;
  source?: string;
}

interface BillMetadata {
  provider_name?: ExtractedField;
  total_amount?: ExtractedField;
  service_date?: ExtractedField;
  bill_date?: ExtractedField;
  invoice_number?: ExtractedField;
  category?: ExtractedField;
}

interface BillError {
  id: string;
  error_type: string;
  error_category: string;
  description: string;
  line_item_reference?: string;
  potential_savings: number;
  evidence: Record<string, unknown>;
  status: string;
}

interface AnalysisResult {
  success: boolean;
  metadata?: BillMetadata;
  errors?: BillError[];
  totalPotentialSavings?: number;
  confidenceScore?: number;
  warnings?: string[];
  invoiceId?: string;
  receiptId?: string;
}

type WizardStep = "upload" | "analyzing" | "review" | "complete" | "error";

const ALLOWED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface BillUploadWizardProps {
  onComplete?: (invoiceId: string) => void;
  onCancel?: () => void;
}

export function BillUploadWizard({ onComplete, onCancel }: BillUploadWizardProps) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [editedMetadata, setEditedMetadata] = useState<BillMetadata | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  const startAnalysis = async () => {
    if (!file) return;

    setStep("analyzing");
    setAnalysisProgress(0);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to upload bills");

      // Progress: Creating invoice
      setAnalysisProgress(10);

      // Create temporary invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          description: `Pending analysis: ${file.name}`,
          amount: 0,
          status: "pending",
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      setAnalysisProgress(20);

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${invoice.id}/bill.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setAnalysisProgress(40);

      // Create receipt record
      const { data: receipt, error: receiptError } = await supabase
        .from("receipts")
        .insert({
          invoice_id: invoice.id,
          file_path: filePath,
          file_type: file.type,
          user_id: user.id,
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      setAnalysisProgress(50);

      // Get public URL for analysis
      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(filePath);

      setAnalysisProgress(60);

      // Call analyze-medical-bill edge function
      const { data: analysisData, error: analysisError } = await supabase.functions
        .invoke("analyze-medical-bill", {
          body: {
            receiptId: receipt.id,
            imageUrl: urlData.publicUrl,
            invoiceId: invoice.id,
          },
        });

      if (analysisError) throw analysisError;

      setAnalysisProgress(90);

      // Update invoice with extracted metadata
      if (analysisData.success && analysisData.metadata) {
        const metadata = analysisData.metadata;
        await supabase
          .from("invoices")
          .update({
            description: metadata.provider_name?.value || "Medical Bill",
            amount: metadata.total_amount?.value || 0,
            status: "pending_review",
            category: metadata.category?.value || "Medical",
          })
          .eq("id", invoice.id);
      }

      setAnalysisProgress(100);

      const result: AnalysisResult = {
        success: analysisData.success,
        metadata: analysisData.metadata,
        errors: analysisData.errors || [],
        totalPotentialSavings: analysisData.totalPotentialSavings,
        confidenceScore: analysisData.confidenceScore,
        warnings: analysisData.warnings,
        invoiceId: invoice.id,
        receiptId: receipt.id,
      };

      setAnalysisResult(result);
      setEditedMetadata(result.metadata || null);
      setStep("review");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Analysis failed");
      setStep("error");
    }
  };

  const handleFieldUpdate = (field: keyof BillMetadata, value: string | number) => {
    if (!editedMetadata) return;
    setEditedMetadata({
      ...editedMetadata,
      [field]: {
        ...editedMetadata[field],
        value,
        confidence: 1.0, // User-verified
      },
    });
  };

  const handleConfirm = async () => {
    if (!analysisResult?.invoiceId || !editedMetadata) return;

    try {
      // Update invoice with confirmed metadata
      await supabase
        .from("invoices")
        .update({
          description: editedMetadata.provider_name?.value || "Medical Bill",
          amount: editedMetadata.total_amount?.value || 0,
          status: "reviewed",
          category: editedMetadata.category?.value || "Medical",
        })
        .eq("id", analysisResult.invoiceId);

      setStep("complete");
      toast({
        title: "Bill saved successfully",
        description: "Your bill has been analyzed and saved to your account.",
      });

      if (onComplete) {
        onComplete(analysisResult.invoiceId);
      }
    } catch (error) {
      toast({
        title: "Error saving bill",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    setFile(null);
    setAnalysisResult(null);
    setEditedMetadata(null);
    setErrorMessage("");
    setStep("upload");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span className={cn(step === "upload" && "text-primary font-medium")}>
          1. Upload
        </span>
        <ArrowRight className="h-4 w-4" />
        <span className={cn(step === "analyzing" && "text-primary font-medium")}>
          2. Analyzing
        </span>
        <ArrowRight className="h-4 w-4" />
        <span className={cn(step === "review" && "text-primary font-medium")}>
          3. Review
        </span>
        <ArrowRight className="h-4 w-4" />
        <span className={cn(step === "complete" && "text-primary font-medium")}>
          4. Done
        </span>
      </div>

      {/* Upload step */}
      {step === "upload" && (
        <Card>
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              <Upload
                className={cn(
                  "h-12 w-12 mx-auto mb-4",
                  isDragActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <p className="text-lg font-medium mb-1">
                {isDragActive ? "Drop your bill here" : "Upload your medical bill"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF, PNG, JPG up to 10MB
              </p>
            </div>

            {file && (
              <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button
                onClick={startAnalysis}
                disabled={!file}
                className="flex-1 gap-2"
              >
                Analyze Bill
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analyzing step */}
      {step === "analyzing" && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analyzing your bill...</h3>
            <p className="text-muted-foreground mb-4">
              Our AI is extracting information and checking for errors
            </p>
            <Progress value={analysisProgress} className="max-w-xs mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">
              {analysisProgress < 50
                ? "Uploading and processing..."
                : analysisProgress < 90
                  ? "Running AI analysis..."
                  : "Finishing up..."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review step */}
      {step === "review" && analysisResult && editedMetadata && (
        <div className="space-y-6">
          <AIExtractionCard
            metadata={editedMetadata}
            overallConfidence={analysisResult.confidenceScore || 0}
            warnings={analysisResult.warnings}
            onFieldUpdate={handleFieldUpdate}
            onConfirm={handleConfirm}
            isEditable
          />

          {analysisResult.errors && analysisResult.errors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Potential Issues Found
                </h3>
                {analysisResult.totalPotentialSavings ? (
                  <span className="text-green-600 font-semibold">
                    ${analysisResult.totalPotentialSavings.toFixed(2)} potential
                    savings
                  </span>
                ) : null}
              </div>
              {analysisResult.errors.map((error) => (
                <BillErrorCard key={error.id} error={error} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Complete step */}
      {step === "complete" && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Bill Saved Successfully!</h3>
            <p className="text-muted-foreground mb-6">
              Your bill has been analyzed and saved to your account.
              {analysisResult?.errors && analysisResult.errors.length > 0 && (
                <span className="block mt-2 text-yellow-700">
                  We found {analysisResult.errors.length} potential issue
                  {analysisResult.errors.length > 1 ? "s" : ""} to review.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleRetry}>
                Upload Another
              </Button>
              {analysisResult?.invoiceId && (
                <Button
                  onClick={() =>
                    (window.location.href = `/bills/${analysisResult.invoiceId}`)
                  }
                >
                  View Bill Details
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error step */}
      {step === "error" && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Analysis Failed</h3>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <div className="flex gap-3 justify-center">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
