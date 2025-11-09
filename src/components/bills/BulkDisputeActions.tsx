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
      let updateData: any = {};
      let notificationType: string | null = null;
      
      switch (bulkAction) {
        case 'submit':
          updateData = { 
            dispute_status: 'submitted', 
            submitted_date: new Date().toISOString().split('T')[0]
          };
          notificationType = 'submitted';
          break;
        case 'withdraw':
          updateData = { 
            dispute_status: 'withdrawn',
            resolution_date: new Date().toISOString().split('T')[0]
          };
          break;
        case 'archive':
          updateData = { dispute_status: 'withdrawn' };
          break;
      }

      // Update all selected disputes
      const { error } = await supabase
        .from('bill_disputes')
        .update(updateData)
        .in('id', selectedIds);

      if (error) throw error;

      // Send notifications for submitted disputes
      if (notificationType === 'submitted') {
        for (const disputeId of selectedIds) {
          try {
            await supabase.functions.invoke('send-dispute-notification', {
              body: { disputeId, notificationType }
            });
          } catch (notifError) {
            console.error('Notification error for dispute:', disputeId, notifError);
          }
        }
      }

      toast({
        title: "Success",
        description: `${selectedIds.length} dispute(s) ${bulkAction === 'submit' ? 'submitted' : bulkAction === 'withdraw' ? 'withdrawn' : 'archived'} successfully.`,
      });

      onActionComplete();
      onSelectionChange([]);
      setBulkAction('');
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Bulk action error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete bulk action. Please try again.",
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
