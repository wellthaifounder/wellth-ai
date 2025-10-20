import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { WellthLogo } from "@/components/WellthLogo";

const incidentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  incidentDate: z.string().min(1, "Incident date is required"),
  incidentType: z.string().min(1, "Incident type is required"),
  description: z.string().max(500).optional(),
});

const INCIDENT_TYPES = [
  { value: "surgery", label: "Surgery/Procedure" },
  { value: "chronic_care", label: "Chronic Care Treatment" },
  { value: "emergency", label: "Emergency Room Visit" },
  { value: "routine", label: "Routine Care" },
  { value: "other", label: "Other" },
];

const MedicalIncidentEntry = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    incidentDate: new Date().toISOString().split('T')[0],
    incidentType: "",
    description: "",
    isHsaEligible: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = incidentSchema.parse(formData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const dateObj = new Date(validatedData.incidentDate + 'T00:00:00');
      const formattedDate = dateObj.toISOString().split('T')[0];

      const { data: incident, error: incidentError } = await supabase
        .from("medical_incidents")
        .insert({
          user_id: user.id,
          title: validatedData.title,
          incident_date: formattedDate,
          incident_type: validatedData.incidentType,
          description: validatedData.description || null,
          is_hsa_eligible: formData.isHsaEligible,
        })
        .select()
        .single();

      if (incidentError) throw incidentError;

      toast.success("Medical incident created successfully!");
      navigate(`/incident/${incident.id}?addFirst=true`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to create medical incident");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <button 
              onClick={() => navigate("/dashboard")}
              className="hover:opacity-80 transition-opacity"
            >
              <WellthLogo size="sm" showTagline />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/expenses/new")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Selection
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create Medical Incident</CardTitle>
            <CardDescription>
              Group related medical expenses together for better tracking and optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">What medical event is this?</Label>
                <Input
                  id="title"
                  placeholder="e.g., Knee Replacement Surgery, Annual Physical, ER Visit"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Give it a descriptive name to easily identify it later
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="incidentDate">Date of Incident</Label>
                  <Input
                    id="incidentDate"
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incidentType">Incident Type</Label>
                  <Select
                    value={formData.incidentType}
                    onValueChange={(value) => setFormData({ ...formData, incidentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any additional details about this medical incident..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                <Checkbox 
                  id="isHsaEligible"
                  checked={formData.isHsaEligible}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isHsaEligible: checked as boolean })
                  }
                />
                <Label 
                  htmlFor="isHsaEligible" 
                  className="text-sm cursor-pointer"
                >
                  This is HSA-eligible (tax-advantaged)
                </Label>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm font-medium text-primary mb-2">📋 Next Steps</p>
                <p className="text-sm text-muted-foreground">
                  After creating this incident, you'll be able to add invoices and track payments 
                  associated with this medical event.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Medical Incident & Add First Invoice"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MedicalIncidentEntry;