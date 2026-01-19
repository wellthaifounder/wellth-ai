import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { ArrowLeft, Loader2, Calendar, Building2, FileText } from "lucide-react";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";

const EVENT_TYPES = [
  { value: "surgery", label: "Surgery", description: "Surgical procedures and related follow-ups" },
  { value: "office_visit", label: "Office Visit", description: "Regular doctor appointments" },
  { value: "emergency", label: "Emergency", description: "ER visits and urgent care" },
  { value: "ongoing_treatment", label: "Ongoing Treatment", description: "Long-term care like physical therapy" },
  { value: "lab_test", label: "Lab Test", description: "Blood work, biopsies, etc." },
  { value: "imaging", label: "Imaging", description: "X-rays, MRIs, CT scans" },
  { value: "physical_therapy", label: "Physical Therapy", description: "PT sessions and rehabilitation" },
  { value: "dental", label: "Dental", description: "Dental procedures and checkups" },
  { value: "vision", label: "Vision", description: "Eye exams, glasses, contacts" },
  { value: "prescription", label: "Prescription", description: "Medication costs" },
  { value: "other", label: "Other", description: "Any other medical expense" },
];

export default function NewMedicalEvent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    event_type: "other",
    event_date: "",
    primary_provider: "",
    description: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("medical_events")
        .insert({
          user_id: user.id,
          title: formData.title,
          event_type: formData.event_type,
          event_date: formData.event_date || null,
          primary_provider: formData.primary_provider || null,
          description: formData.description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Medical event created!");
      navigate(`/medical-events/${data.id}`);
    },
    onError: (error) => {
      toast.error("Failed to create event");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }
    createMutation.mutate();
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/medical-events")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              New Medical Event
            </CardTitle>
            <CardDescription>
              Create an event to group related bills, documents, and payments together.
              Examples: "Shoulder Surgery - Jan 2026", "Physical Therapy Q1 2026"
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Event Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Shoulder Surgery - Jan 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Give your event a descriptive name you'll recognize later
                </p>
              </div>

              {/* Event Type */}
              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <span className="font-medium">{type.label}</span>
                          <span className="text-muted-foreground ml-2 text-xs">
                            {type.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Event Date & Provider */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_date">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Event Date
                  </Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Primary date of service
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary_provider">
                    <Building2 className="h-3 w-3 inline mr-1" />
                    Primary Provider
                  </Label>
                  <Input
                    id="primary_provider"
                    placeholder="e.g., City Hospital"
                    value={formData.primary_provider}
                    onChange={(e) => setFormData({ ...formData, primary_provider: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Main healthcare provider
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  <FileText className="h-3 w-3 inline mr-1" />
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add any notes about this medical event..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/medical-events")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Event
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
