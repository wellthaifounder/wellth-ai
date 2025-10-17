import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Receipt {
  id: string;
  file_path: string;
  file_type: string;
  document_type: string;
  description?: string;
  display_order: number;
  uploaded_at: string;
}

interface ReceiptGalleryProps {
  expenseId: string;
  receipts: Receipt[];
  onReceiptDeleted?: () => void;
}

const DOCUMENT_TYPE_LABELS = {
  invoice: "Invoice",
  payment_receipt: "Payment Receipt",
  eob: "EOB",
  prescription_label: "Prescription Label",
  receipt: "Receipt",
  other: "Other",
};

const DOCUMENT_TYPE_COLORS = {
  invoice: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  payment_receipt: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  eob: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  prescription_label: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  receipt: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  other: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export function ReceiptGallery({ expenseId, receipts, onReceiptDeleted }: ReceiptGalleryProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [viewUrl, setViewUrl] = useState<string>("");
  const { toast } = useToast();

  const handleView = async (receipt: Receipt) => {
    try {
      const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(receipt.file_path, 3600);

      if (error) throw error;

      setViewUrl(data.signedUrl);
      setSelectedReceipt(receipt);
    } catch (error) {
      console.error("Error viewing receipt:", error);
      toast({
        title: "Error",
        description: "Failed to load receipt for viewing",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (receipt: Receipt) => {
    try {
      const { data, error } = await supabase.storage
        .from("receipts")
        .download(receipt.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = receipt.file_path.split("/").pop() || "receipt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Receipt downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast({
        title: "Error",
        description: "Failed to download receipt",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (receiptId: string) => {
    try {
      const { error } = await supabase
        .from("receipts")
        .delete()
        .eq("id", receiptId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Receipt deleted successfully",
      });

      onReceiptDeleted?.();
    } catch (error) {
      console.error("Error deleting receipt:", error);
      toast({
        title: "Error",
        description: "Failed to delete receipt",
        variant: "destructive",
      });
    }
  };

  const sortedReceipts = [...receipts].sort((a, b) => a.display_order - b.display_order);

  if (receipts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
        <p>No receipts uploaded</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedReceipts.map((receipt) => (
          <div
            key={receipt.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {receipt.file_type.startsWith("image/") ? (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                )}
                <Badge className={DOCUMENT_TYPE_COLORS[receipt.document_type as keyof typeof DOCUMENT_TYPE_COLORS] || DOCUMENT_TYPE_COLORS.other}>
                  {DOCUMENT_TYPE_LABELS[receipt.document_type as keyof typeof DOCUMENT_TYPE_LABELS] || receipt.document_type}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(receipt.id)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {receipt.description && (
              <p className="text-sm text-muted-foreground mb-3">{receipt.description}</p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(receipt)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(receipt)}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Uploaded {new Date(receipt.uploaded_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReceipt && DOCUMENT_TYPE_LABELS[selectedReceipt.document_type as keyof typeof DOCUMENT_TYPE_LABELS]}
            </DialogTitle>
          </DialogHeader>
          {selectedReceipt && viewUrl && (
            <div className="mt-4">
              {selectedReceipt.file_type.startsWith("image/") ? (
                <img src={viewUrl} alt="Receipt" className="w-full rounded-lg" />
              ) : (
                <iframe
                  src={viewUrl}
                  className="w-full h-[70vh] rounded-lg"
                  title="Receipt viewer"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
