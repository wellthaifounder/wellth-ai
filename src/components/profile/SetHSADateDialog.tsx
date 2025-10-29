import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SetHSADateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SetHSADateDialog({ open, onOpenChange, onSuccess }: SetHSADateDialogProps) {
  const [date, setDate] = useState<Date>();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const hsaDateString = format(date, "yyyy-MM-dd");

      // Update profile with HSA opened date
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ hsa_opened_date: hsaDateString })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Retroactively update existing invoices based on HSA opened date
      // 1) Invoices using `date`
      const { error: updateDateError } = await supabase
        .from("invoices")
        .update({ is_hsa_eligible: false })
        .eq("user_id", user.id)
        .lt("date", hsaDateString)
        .eq("is_hsa_eligible", true);
      if (updateDateError) throw updateDateError;

      // 2) Invoices using `invoice_date`
      const { error: updateInvoiceDateError } = await supabase
        .from("invoices")
        .update({ is_hsa_eligible: false })
        .eq("user_id", user.id)
        .lt("invoice_date", hsaDateString)
        .eq("is_hsa_eligible", true);
      if (updateInvoiceDateError) throw updateInvoiceDateError;

      toast.success("HSA opened date saved! We've updated your expense eligibility.");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving HSA date:", error);
      toast.error("Failed to save HSA date");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>When did you open your HSA?</DialogTitle>
          <DialogDescription>
            We'll use this to determine which expenses you can reimburse. You can only claim expenses that occurred after your HSA was opened.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="pointer-events-auto"
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!date || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
