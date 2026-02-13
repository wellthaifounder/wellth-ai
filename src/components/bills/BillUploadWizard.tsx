import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FolderHeart,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ── Constants ──────────────────────────────────────────────────────────────────

const ALLOWED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;

const HSA_ELIGIBLE_CATEGORIES = [
  "Medical",
  "Dental",
  "Vision",
  "Mental Health",
  "Pharmacy",
  "Lab / Imaging",
  "Physical Therapy",
];

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

const DOCUMENT_TYPES = [
  { value: "bill", label: "Medical Bill" },
  { value: "itemized_statement", label: "Itemized Statement" },
  { value: "eob", label: "Explanation of Benefits (EOB)" },
  { value: "payment_receipt", label: "Payment Receipt" },
  { value: "other", label: "Other" },
];

// ── Types ──────────────────────────────────────────────────────────────────────

interface FileEntry {
  file: File;
  objectUrl: string;
}

interface BillDraft {
  file: File;
  objectUrl: string;
  documentType: string;
  vendor: string;
  amount: string;
  date: string;
  category: string;
  invoiceNumber: string;
  collectionId: string | null;
  newCollectionTitle: string;
  isCreatingNewCollection: boolean;
  notes: string;
}

type Step = "upload" | "details" | "review" | "saving" | "complete" | "error";

interface BillUploadWizardProps {
  onComplete?: (invoiceId: string) => void;
  onCancel?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function BillUploadWizard({ onComplete, onCancel }: BillUploadWizardProps) {
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("upload");
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [drafts, setDrafts] = useState<BillDraft[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [collections, setCollections] = useState<{ id: string; title: string }[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [showCollectionSection, setShowCollectionSection] = useState(false);

  const [savingIndex, setSavingIndex] = useState(0);
  const [savedInvoices, setSavedInvoices] = useState<
    { id: string; vendor: string; amount: string }[]
  >([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync collection section visibility when navigating between drafts
  const prevIndexRef = useRef(-1);
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      prevIndexRef.current = currentIndex;
      const d = drafts[currentIndex];
      if (d) {
        setShowCollectionSection(
          !!d.collectionId || !!d.newCollectionTitle || d.isCreatingNewCollection
        );
      } else {
        setShowCollectionSection(false);
      }
    }
  }, [currentIndex, drafts]);

  // ── Dropzone ────────────────────────────────────────────────────────────────

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
      const newEntries: FileEntry[] = valid.map((f) => ({
        file: f,
        objectUrl: URL.createObjectURL(f),
      }));
      setFileEntries((prev) => {
        const combined = [...prev, ...newEntries];
        if (combined.length > MAX_FILES) {
          combined.slice(MAX_FILES).forEach((e) => URL.revokeObjectURL(e.objectUrl));
          return combined.slice(0, MAX_FILES);
        }
        return combined;
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
    URL.revokeObjectURL(fileEntries[index].objectUrl);
    setFileEntries((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Transition: upload → details ────────────────────────────────────────────

  const handleContinue = () => {
    const today = new Date().toISOString().split("T")[0];
    const newDrafts: BillDraft[] = fileEntries.map((entry) => ({
      file: entry.file,
      objectUrl: entry.objectUrl,
      documentType: "bill",
      vendor: "",
      amount: "",
      date: today,
      category: "Medical",
      invoiceNumber: "",
      collectionId: null,
      newCollectionTitle: "",
      isCreatingNewCollection: false,
      notes: "",
    }));
    setDrafts(newDrafts);
    setCurrentIndex(0);
    prevIndexRef.current = -1;
    setShowCollectionSection(false);
    setStep("details");
  };

  // ── Draft helpers ────────────────────────────────────────────────────────────

  const updateDraft = (index: number, updates: Partial<BillDraft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...updates } : d)));
  };

  const draft = drafts[currentIndex];
  const isLastFile = currentIndex === drafts.length - 1;
  const isDraftValid =
    draft &&
    draft.vendor.trim() !== "" &&
    draft.amount !== "" &&
    parseFloat(draft.amount) > 0 &&
    draft.date !== "" &&
    draft.category !== "";

  // ── Collections ─────────────────────────────────────────────────────────────

  const loadCollections = async () => {
    if (collectionsLoaded) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("collections")
        .select("id, title")
        .eq("user_id", user.id)
        .order("title");
      setCollections(data ?? []);
    } catch {
      // silently fail — user can still create a new collection
    } finally {
      setCollectionsLoaded(true);
    }
  };

  const handleToggleCollectionSection = () => {
    if (!showCollectionSection) loadCollections();
    setShowCollectionSection((v) => !v);
  };

  // ── Navigation ────────────────────────────────────────────────────────────────

  const handleBack = () => {
    if (currentIndex === 0) {
      setStep("upload");
    } else {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleNext = () => {
    if (isLastFile) {
      setStep("review");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setStep("saving");
    setSavingIndex(0);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to upload bills");

      const results: { id: string; vendor: string; amount: string }[] = [];

      for (let i = 0; i < drafts.length; i++) {
        setSavingIndex(i + 1);
        const d = drafts[i];

        // 1. Resolve collection_id — create new if needed
        let collectionId = d.collectionId;
        if (!collectionId && d.newCollectionTitle.trim()) {
          const { data: col, error: colErr } = await supabase
            .from("collections")
            .insert({ user_id: user.id, title: d.newCollectionTitle.trim() })
            .select("id")
            .single();
          if (colErr) throw colErr;
          collectionId = col.id;
        }

        // 2. Insert invoice
        const isHsaEligible = HSA_ELIGIBLE_CATEGORIES.includes(d.category);
        const { data: invoice, error: invoiceErr } = await supabase
          .from("invoices")
          .insert({
            user_id: user.id,
            vendor: d.vendor.trim(),
            amount: parseFloat(d.amount),
            date: d.date,
            category: d.category,
            invoice_number: d.invoiceNumber.trim() || null,
            collection_id: collectionId || null,
            notes: d.notes.trim() || null,
            is_hsa_eligible: isHsaEligible,
            status: "pending",
          })
          .select()
          .single();
        if (invoiceErr) throw invoiceErr;

        // 3. Upload file to storage
        const fileName = `${Date.now()}-${d.file.name}`;
        const filePath = `${user.id}/${invoice.id}/${fileName}`;
        const { error: uploadErr } = await supabase.storage
          .from("receipts")
          .upload(filePath, d.file);
        if (uploadErr) throw uploadErr;

        // 4. Insert receipt record
        const { error: receiptErr } = await supabase.from("receipts").insert({
          invoice_id: invoice.id,
          user_id: user.id,
          file_path: filePath,
          file_type: d.file.type,
          document_type: d.documentType,
        });
        if (receiptErr) throw receiptErr;

        results.push({ id: invoice.id, vendor: d.vendor.trim(), amount: d.amount });
      }

      setSavedInvoices(results);
      if (onComplete && results.length > 0) onComplete(results[0].id);
      setStep("complete");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      setStep("error");
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────────

  const handleReset = () => {
    fileEntries.forEach((e) => URL.revokeObjectURL(e.objectUrl));
    setStep("upload");
    setFileEntries([]);
    setDrafts([]);
    setCurrentIndex(0);
    prevIndexRef.current = -1;
    setCollections([]);
    setCollectionsLoaded(false);
    setShowCollectionSection(false);
    setSavingIndex(0);
    setSavedInvoices([]);
    setErrorMessage("");
  };

  const isImageFile = (file: File) => file.type.startsWith("image/");

  // ──────────────────────────────────────────────────────────────────────────────
  // STEP: Upload
  // ──────────────────────────────────────────────────────────────────────────────

  if (step === "upload") {
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

          {/* File preview grid */}
          {fileEntries.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{fileEntries.length}</span> file
                {fileEntries.length > 1 ? "s" : ""} selected — you'll enter details for each on
                the next step.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {fileEntries.map((entry, i) => (
                  <div
                    key={i}
                    className="relative group rounded-lg border overflow-hidden bg-muted"
                  >
                    {isImageFile(entry.file) ? (
                      <img
                        src={entry.objectUrl}
                        alt={entry.file.name}
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/90 border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="px-2 py-1.5 border-t">
                      <p className="text-xs truncate">{entry.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(entry.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button
              onClick={handleContinue}
              disabled={fileEntries.length === 0}
              className="flex-1"
            >
              Continue →
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // STEP: Details
  // ──────────────────────────────────────────────────────────────────────────────

  if (step === "details" && draft) {
    const collectionLabel = draft.collectionId
      ? collections.find((c) => c.id === draft.collectionId)?.title
      : draft.newCollectionTitle || null;

    return (
      <Card>
        <CardContent className="p-0">
          {/* Progress header */}
          <div className="border-b px-6 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Bill {currentIndex + 1} of {drafts.length}
            </span>
            <div className="flex items-center gap-1.5">
              {drafts.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-200",
                    i === currentIndex
                      ? "w-6 bg-primary"
                      : i < currentIndex
                      ? "w-3 bg-primary/50"
                      : "w-3 bg-muted-foreground/25"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Side-by-side body */}
          <div className="flex flex-col md:flex-row">
            {/* Left: Document preview */}
            <div className="md:w-[42%] border-b md:border-b-0 md:border-r bg-muted/20 flex flex-col items-center justify-center p-6 min-h-[220px]">
              {isImageFile(draft.file) ? (
                <img
                  src={draft.objectUrl}
                  alt={draft.file.name}
                  className="w-full max-h-[380px] object-contain rounded shadow-sm"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium break-all px-2">{draft.file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(draft.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(draft.objectUrl, "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Open PDF
                  </Button>
                </div>
              )}
            </div>

            {/* Right: Intake form */}
            <div className="md:w-[58%] p-6 space-y-4 overflow-y-auto max-h-[580px]">
              {/* Document Type */}
              <div className="space-y-1.5">
                <Label>Document Type</Label>
                <Select
                  value={draft.documentType}
                  onValueChange={(v) => updateDraft(currentIndex, { documentType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Provider */}
              <div className="space-y-1.5">
                <Label htmlFor={`vendor-${currentIndex}`}>
                  Provider / Vendor <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`vendor-${currentIndex}`}
                  placeholder="e.g. City Medical Center"
                  value={draft.vendor}
                  onChange={(e) => updateDraft(currentIndex, { vendor: e.target.value })}
                />
              </div>

              {/* Amount + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`amount-${currentIndex}`}>
                    Amount <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      id={`amount-${currentIndex}`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-7"
                      value={draft.amount}
                      onChange={(e) => updateDraft(currentIndex, { amount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`date-${currentIndex}`}>
                    Service Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`date-${currentIndex}`}
                    type="date"
                    value={draft.date}
                    onChange={(e) => updateDraft(currentIndex, { date: e.target.value })}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>
                    Category <span className="text-destructive">*</span>
                  </Label>
                  {HSA_ELIGIBLE_CATEGORIES.includes(draft.category) && (
                    <Badge className="text-xs bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-50">
                      HSA Eligible
                    </Badge>
                  )}
                </div>
                <Select
                  value={draft.category}
                  onValueChange={(v) => updateDraft(currentIndex, { category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice # */}
              <div className="space-y-1.5">
                <Label htmlFor={`invoiceNumber-${currentIndex}`}>
                  Bill / Invoice #{" "}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Input
                  id={`invoiceNumber-${currentIndex}`}
                  placeholder="e.g. INV-20240312"
                  value={draft.invoiceNumber}
                  onChange={(e) => updateDraft(currentIndex, { invoiceNumber: e.target.value })}
                />
              </div>

              {/* Collection picker */}
              <div className="space-y-2">
                {!showCollectionSection ? (
                  <button
                    type="button"
                    onClick={handleToggleCollectionSection}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add to a Collection
                    {collectionLabel && (
                      <span className="text-primary font-medium ml-0.5">· {collectionLabel}</span>
                    )}
                  </button>
                ) : (
                  <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <FolderHeart className="h-4 w-4 text-primary" />
                        Collection
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCollectionSection(false);
                          updateDraft(currentIndex, {
                            collectionId: null,
                            newCollectionTitle: "",
                            isCreatingNewCollection: false,
                          });
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Remove
                      </button>
                    </div>
                    <Select
                      value={
                        draft.collectionId ??
                        (draft.isCreatingNewCollection ? "__new__" : "")
                      }
                      onValueChange={(v) => {
                        if (v === "__new__") {
                          updateDraft(currentIndex, {
                            collectionId: null,
                            isCreatingNewCollection: true,
                          });
                        } else if (v === "") {
                          updateDraft(currentIndex, {
                            collectionId: null,
                            newCollectionTitle: "",
                            isCreatingNewCollection: false,
                          });
                        } else {
                          updateDraft(currentIndex, {
                            collectionId: v,
                            newCollectionTitle: "",
                            isCreatingNewCollection: false,
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select or create a collection…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {collections.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.title}
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__">＋ Create new collection…</SelectItem>
                      </SelectContent>
                    </Select>
                    {draft.isCreatingNewCollection && (
                      <Input
                        placeholder="Collection name (e.g. Knee Surgery 2026)"
                        value={draft.newCollectionTitle}
                        onChange={(e) =>
                          updateDraft(currentIndex, { newCollectionTitle: e.target.value })
                        }
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor={`notes-${currentIndex}`}>
                  Notes{" "}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Textarea
                  id={`notes-${currentIndex}`}
                  placeholder="Additional details…"
                  value={draft.notes}
                  onChange={(e) => updateDraft(currentIndex, { notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="border-t px-6 py-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button onClick={handleNext} disabled={!isDraftValid}>
              {isLastFile ? (
                <>
                  Review All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Next Bill
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // STEP: Review
  // ──────────────────────────────────────────────────────────────────────────────

  if (step === "review") {
    return (
      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-semibold">
              Review your {drafts.length} bill{drafts.length > 1 ? "s" : ""}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Confirm the details before saving.
            </p>
          </div>

          <div className="space-y-3">
            {drafts.map((d, i) => {
              const collName = d.collectionId
                ? collections.find((c) => c.id === d.collectionId)?.title
                : d.newCollectionTitle || null;

              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  {/* Thumbnail */}
                  <div className="h-12 w-12 rounded overflow-hidden border shrink-0 bg-muted flex items-center justify-center">
                    {isImageFile(d.file) ? (
                      <img src={d.objectUrl} alt="" className="h-12 w-12 object-cover" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{d.vendor}</p>
                        <p className="text-sm text-muted-foreground">
                          ${parseFloat(d.amount).toFixed(2)} ·{" "}
                          {new Date(d.date + "T00:00:00").toLocaleDateString()} · {d.category}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentIndex(i);
                          setStep("details");
                        }}
                        className="text-xs text-primary hover:underline shrink-0"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {collName && (
                        <div className="flex items-center gap-1">
                          <FolderHeart className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{collName}</span>
                        </div>
                      )}
                      {HSA_ELIGIBLE_CATEGORIES.includes(d.category) && (
                        <Badge className="text-xs bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-50">
                          HSA Eligible
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentIndex(drafts.length - 1);
                setStep("details");
              }}
              className="flex-1"
            >
              ← Back to Edit
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save {drafts.length} Bill{drafts.length > 1 ? "s" : ""}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // STEP: Saving
  // ──────────────────────────────────────────────────────────────────────────────

  if (step === "saving") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Saving your bills…</h3>
          <p className="text-sm text-muted-foreground">
            {savingIndex > 0 ? `Saving bill ${savingIndex} of ${drafts.length}…` : "Preparing…"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // STEP: Complete
  // ──────────────────────────────────────────────────────────────────────────────

  if (step === "complete") {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-6">
          <div>
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-1">
              {savedInvoices.length} bill{savedInvoices.length > 1 ? "s" : ""} saved!
            </h3>
            <p className="text-sm text-muted-foreground">
              Your bills are now being tracked in Wellth.
            </p>
          </div>

          {savedInvoices.length > 0 && (
            <div className="space-y-2 text-left">
              {savedInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div>
                    <p className="font-medium text-sm">{inv.vendor}</p>
                    <p className="text-xs text-muted-foreground">
                      ${parseFloat(inv.amount).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = `/bills/${inv.id}`)}
                  >
                    View →
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={handleReset} className="w-full">
            Upload More Bills
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // STEP: Error
  // ──────────────────────────────────────────────────────────────────────────────

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
