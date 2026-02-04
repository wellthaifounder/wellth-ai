import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Phone, Mail, FileText, Building2, ArrowRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface Communication {
  id: string;
  communication_type: string;
  direction: string;
  contact_person: string;
  summary: string;
  outcome: string;
  follow_up_required: boolean;
  follow_up_date: string | null;
  created_at: string;
}

interface DisputeCommunicationLogProps {
  disputeId: string;
  communications: Communication[];
  onRefresh: () => void;
}

const communicationIcons = {
  phone: Phone,
  email: Mail,
  letter: FileText,
  portal: Building2
};

export function DisputeCommunicationLog({ disputeId, communications, onRefresh }: DisputeCommunicationLogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    communication_type: 'phone',
    direction: 'outbound',
    contact_person: '',
    summary: '',
    outcome: '',
    follow_up_required: false,
    follow_up_date: ''
  });

  const handleSubmit = async () => {
    if (!formData.summary) {
      toast.error("Please provide a summary");
      return;
    }

    try {
      const { error } = await supabase
        .from('dispute_communications')
        .insert({
          dispute_id: disputeId,
          communication_type: formData.communication_type as any,
          direction: formData.direction as any,
          contact_person: formData.contact_person || null,
          summary: formData.summary,
          outcome: formData.outcome || null,
          follow_up_required: formData.follow_up_required,
          follow_up_date: formData.follow_up_date || null
        });

      if (error) throw error;

      toast.success("Communication logged");
      setIsAdding(false);
      setFormData({
        communication_type: 'phone',
        direction: 'outbound',
        contact_person: '',
        summary: '',
        outcome: '',
        follow_up_required: false,
        follow_up_date: ''
      });
      onRefresh();
    } catch (error) {
      console.error('Error logging communication:', error);
      toast.error("Failed to log communication");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Communication Log</CardTitle>
          <Button 
            onClick={() => setIsAdding(!isAdding)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Communication
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <Card className="p-4 bg-muted/50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select 
                  value={formData.communication_type}
                  onValueChange={(value) => setFormData({ ...formData, communication_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="portal">Online Portal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Direction</Label>
                <Select 
                  value={formData.direction}
                  onValueChange={(value) => setFormData({ ...formData, direction: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Contact Person (Optional)</Label>
              <Input
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="e.g., Jane Smith - Billing Department"
              />
            </div>

            <div>
              <Label>Summary *</Label>
              <Textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Describe what was discussed..."
                rows={3}
              />
            </div>

            <div>
              <Label>Outcome</Label>
              <Input
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                placeholder="e.g., Agreed to review within 5 business days"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.follow_up_required}
                  onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm">Follow-up required</span>
              </label>

              {formData.follow_up_required && (
                <div className="flex-1">
                  <Input
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex-1">
                Save Communication
              </Button>
              <Button 
                onClick={() => setIsAdding(false)} 
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {communications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No communications logged yet
          </div>
        ) : (
          <div className="space-y-3">
            {communications.map((comm) => {
              const Icon = communicationIcons[comm.communication_type as keyof typeof communicationIcons];
              const DirectionIcon = comm.direction === 'outbound' ? ArrowRight : ArrowLeft;
              
              return (
                <Card key={comm.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="gap-1">
                          <DirectionIcon className="h-3 w-3" />
                          {comm.direction}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comm.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      {comm.contact_person && (
                        <p className="text-sm font-medium mb-1">{comm.contact_person}</p>
                      )}
                      <p className="text-sm text-muted-foreground mb-2">{comm.summary}</p>
                      {comm.outcome && (
                        <p className="text-sm">
                          <span className="font-medium">Outcome:</span> {comm.outcome}
                        </p>
                      )}
                      {comm.follow_up_required && comm.follow_up_date && (
                        <Badge variant="secondary" className="mt-2">
                          Follow-up: {format(new Date(comm.follow_up_date), 'MMM d, yyyy')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
