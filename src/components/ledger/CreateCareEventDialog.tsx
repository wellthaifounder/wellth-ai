import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { logError } from "@/utils/errorHandler";
import { Loader2, FolderHeart, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface SelectedEntry {
  invoice_id: string;
  vendor: string;
  category: string;
  service_date: string;
  billed_amount: number;
  care_event_title: string | null;
}

interface CreateCareEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: SelectedEntry[];
  /** Pre-filled title for cluster suggestions */
  suggestedTitle?: string;
  onSuccess: () => void;
}

export function CreateCareEventDialog({
  open,
  onOpenChange,
  entries,
  suggestedTitle,
  onSuccess,
}: CreateCareEventDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(suggestedTitle || "");
  const [description, setDescription] = useState("");

  // Auto-fill title when dialog opens with entries
  const autoTitle = (() => {
    if (suggestedTitle) return suggestedTitle;
    if (entries.length === 0) return "";
    const vendors = [...new Set(entries.map((e) => e.vendor))];
    const dates = entries.map((e) => new Date(e.service_date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    const dateRange =
      minDate.getMonth() === maxDate.getMonth()
        ? format(minDate, "MMM yyyy")
        : `${format(minDate, "MMM")}–${format(maxDate, "MMM yyyy")}`;
    return vendors.length === 1
      ? `${vendors[0]} — ${dateRange}`
      : `${vendors[0]} + ${vendors.length - 1} more — ${dateRange}`;
  })();

  // Use auto title if user hasn't typed anything
  const effectiveTitle = title || autoTitle;

  const totalAmount = entries.reduce((sum, e) => sum + e.billed_amount, 0);

  const alreadyAssigned = entries.filter((e) => e.care_event_title);

  const createMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create the collection
      const { data: collection, error: createError } = await supabase
        .from("collections")
        .insert({
          user_id: user.id,
          title: effectiveTitle,
          description: description || null,
        })
        .select("id")
        .single();

      if (createError) throw createError;

      // Batch-update invoices with the new collection_id
      const invoiceIds = entries.map((e) => e.invoice_id);
      const { error: updateError } = await supabase
        .from("invoices")
        .update({ collection_id: collection.id })
        .in("id", invoiceIds);

      if (updateError) throw updateError;

      return collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger-entries"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({
        queryKey: ["unorganized-invoices-count"],
      });
      queryClient.invalidateQueries({ queryKey: ["cluster-suggestions"] });
      toast.success(
        `Care event created with ${entries.length} bill${entries.length !== 1 ? "s" : ""}`,
      );
      setTitle("");
      setDescription("");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      logError("Failed to create care event", error);
      toast.error("Failed to create care event");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderHeart className="h-5 w-5" />
            Create Care Event
          </DialogTitle>
          <DialogDescription>
            Group {entries.length} selected bill
            {entries.length !== 1 ? "s" : ""} into a new care event for easier
            tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary of selected entries */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {entries.length} bill{entries.length !== 1 ? "s" : ""} selected
              </span>
              <span className="text-sm font-semibold">
                ${totalAmount.toFixed(2)} total
              </span>
            </div>
            <ScrollArea className="max-h-[150px]">
              <div className="space-y-1">
                {entries.map((entry) => (
                  <div
                    key={entry.invoice_id}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{entry.vendor}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(entry.service_date), "MMM d")}
                      </span>
                      {entry.care_event_title && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-orange-600"
                        >
                          Already in: {entry.care_event_title}
                        </Badge>
                      )}
                    </div>
                    <span className="flex items-center gap-0.5 text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      {entry.billed_amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {alreadyAssigned.length > 0 && (
            <p className="text-xs text-orange-600">
              {alreadyAssigned.length} bill
              {alreadyAssigned.length !== 1 ? "s are" : " is"} already in a care
              event and will be reassigned.
            </p>
          )}

          {/* Title input */}
          <div className="space-y-2">
            <Label htmlFor="care-event-title">Event Title</Label>
            <Input
              id="care-event-title"
              placeholder={autoTitle || "e.g., Knee Surgery — Jan 2026"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {!title && autoTitle && (
              <p className="text-xs text-muted-foreground">
                Auto-suggested: {autoTitle}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="care-event-description">
              Description (Optional)
            </Label>
            <Textarea
              id="care-event-description"
              placeholder="Add any notes about this care event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !effectiveTitle.trim()}
          >
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            <FolderHeart className="h-4 w-4 mr-2" />
            Create Care Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
