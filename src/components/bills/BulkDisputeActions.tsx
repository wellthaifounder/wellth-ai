import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface BulkDisputeActionsProps {
  disputes: any[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onActionComplete: () => void;
}

export const BulkDisputeActions = ({
  disputes,
  selectedIds,
  onSelectionChange,
  onActionComplete,
}: BulkDisputeActionsProps) => {
  const [bulkAction, setBulkAction] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(disputes.map(d => d.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;

    setIsLoading(true);
    try {
      const updates: any = {};
      
      switch (bulkAction) {
        case "submit":
          updates.dispute_status = "submitted";
          updates.submitted_date = new Date().toISOString().split('T')[0];
          break;
        case "withdraw":
          updates.dispute_status = "withdrawn";
          break;
        case "archive":
          updates.dispute_status = "resolved";
          updates.resolution_date = new Date().toISOString().split('T')[0];
          break;
        default:
          break;
      }

      const { error } = await supabase
        .from("bill_disputes")
        .update(updates)
        .in("id", selectedIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedIds.length} dispute(s) updated successfully.`,
      });

      onSelectionChange([]);
      setBulkAction("");
      setShowConfirmDialog(false);
      onActionComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          checked={selectedIds.length === disputes.length && disputes.length > 0}
          onCheckedChange={handleSelectAll}
        />
        <span className="text-sm font-medium">
          {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all"}
        </span>

        {selectedIds.length > 0 && (
          <>
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Bulk action..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submit">Submit Selected</SelectItem>
                <SelectItem value="withdraw">Withdraw Selected</SelectItem>
                <SelectItem value="archive">Archive Selected</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!bulkAction || isLoading}
              size="sm"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
            >
              Clear Selection
            </Button>
          </>
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {bulkAction} {selectedIds.length} dispute(s)?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
