import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ALLOWED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES = 10;

const CATEGORIES = [
  "Medical",
  "Dental",
  "Vision",
  "Mental Health",
  "Pharmacy",
  "Lab / Imaging",
  "Physical Therapy",
  "Other",
];

interface BillUploadWizardProps {
  onComplete?: (invoiceId: string) => void;
  onCancel?: () => void;
}

type Step = "form" | "uploading" | "complete" | "error";

export function BillUploadWizard({ onComplete, onCancel }: BillUploadWizardProps) {
  const [step, setStep] = useState<Step>("form");
  const [files, setFiles] = useState<File[]>([]);
  const [provider, setProvider] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Medical");
  const [errorMessage, setErrorMessage] = useState("");
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const oversized = acceptedFiles.filter((f) => f.size > MAX_FILE_SIZE);
      if (oversized.length > 0) {
        toast({
          title: "File too large",
          description: `${oversized[0].name} exceeds 10MB`,
          variant: "destructive",
        });
      }
      const valid = acceptedFiles.filter((f) => f.size <= MAX_FILE_SIZE);
      setFiles((prev) => {
        const combined = [...prev, ...valid];
        return combined.slice(0, MAX_FILES);
      });
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!provider.trim() || !amount) return;

    setStep("uploading");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to upload bills");

      // Create the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          description: provider.trim(),
          amount: parseFloat(amount),
          status: "pending",
          category,
          ...(date ? { service_date: date } : {}),
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Upload all files and create receipt records
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${user.id}/${invoice.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: receiptError } = await supabase
          .from("receipts")
          .insert({
            invoice_id: invoice.id,
            file_path: filePath,
            file_type: file.type,
            user_id: user.id,
          });

        if (receiptError) throw receiptError;
      }

      setSavedInvoiceId(invoice.id);
      setStep("complete");

      if (onComplete) {
        onComplete(invoice.id);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      setStep("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setProvider("");
    setAmount("");
    setDate("");
    setCategory("Medical");
    setErrorMessage("");
    setSavedInvoiceId(null);
    setStep("form");
  };

  const isValid = provider.trim() && amount && parseFloat(amount) > 0;

  // ── Form Step ──────────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Drop zone */}
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
                "h-10 w-10 mx-auto mb-3",
                isDragActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <p className="font-medium mb-1">
              {isDragActive ? "Drop files here" : "Upload documents"}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to browse · PDF, PNG, JPG up to 10MB · up to {MAX_FILES} files
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <ul className="space-y-2">
              {files.map((file, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted"
                >
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <span className="flex-1 text-sm truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={() => removeFile(i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {/* Bill details form */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Bill Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="provider">Provider / Description <span className="text-destructive">*</span></Label>
                <Input
                  id="provider"
                  placeholder="e.g. City Medical Center"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date">Service Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="flex-1"
            >
              Save Bill
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Uploading Step ─────────────────────────────────────────────────────────
  if (step === "uploading") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Saving your bill…</h3>
          <p className="text-sm text-muted-foreground">
            Uploading {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""}` : "bill details"}…
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Complete Step ──────────────────────────────────────────────────────────
  if (step === "complete") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Bill Saved!</h3>
          <p className="text-muted-foreground mb-6">
            Your bill has been saved
            {files.length > 0 && ` with ${files.length} document${files.length > 1 ? "s" : ""}`}.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleReset}>
              Upload Another
            </Button>
            {savedInvoiceId && (
              <Button onClick={() => (window.location.href = `/bills/${savedInvoiceId}`)}>
                View Bill
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Error Step ─────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Upload Failed</h3>
        <p className="text-muted-foreground mb-6">{errorMessage}</p>
        <div className="flex gap-3 justify-center">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleReset}>Try Again</Button>
        </div>
      </CardContent>
    </Card>
  );
}
