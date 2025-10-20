import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FolderHeart } from "lucide-react";

interface LinkToIncidentDialogProps {
  invoiceId: string;
  currentIncidentId?: string;
  onLinked?: () => void;
  trigger?: React.ReactNode;
}

export function LinkToIncidentDialog({ 
  invoiceId, 
  currentIncidentId,
  onLinked,
  trigger 
}: LinkToIncidentDialogProps) {
  const [open, setOpen] = useState(false);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<string>(currentIncidentId || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchIncidents();
    }
  }, [open]);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from("medical_incidents")
        .select("id, title, incident_date, incident_type")
        .order("incident_date", { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
      toast.error("Failed to load medical incidents");
    }
  };

  const handleLink = async () => {
    setLoading(true);
    try {
      const updateData = selectedIncident === "none" 
        ? { medical_incident_id: null, complexity_level: 'simple' }
        : { medical_incident_id: selectedIncident, complexity_level: 'complex' };

      const { error } = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", invoiceId);

      if (error) throw error;

      toast.success(
        selectedIncident === "none" 
          ? "Invoice unlinked from medical incident" 
          : "Invoice linked to medical incident"
      );
      setOpen(false);
      onLinked?.();
    } catch (error) {
      console.error("Failed to link invoice:", error);
      toast.error("Failed to link invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <FolderHeart className="h-4 w-4 mr-2" />
          {currentIncidentId ? "Change Incident" : "Link to Incident"}
        </Button>
      )}
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link to Medical Incident</DialogTitle>
          <DialogDescription>
            Group this invoice with a medical incident to track related costs together
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Select value={selectedIncident} onValueChange={setSelectedIncident}>
            <SelectTrigger>
              <SelectValue placeholder="Select a medical incident" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">Unlink (Simple Invoice)</span>
              </SelectItem>
              {incidents.map((incident) => (
                <SelectItem key={incident.id} value={incident.id}>
                  {incident.title} ({new Date(incident.incident_date).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {incidents.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No medical incidents found. Create one first to link invoices.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleLink} 
            disabled={loading || !selectedIncident}
          >
            {loading ? "Linking..." : "Link Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
