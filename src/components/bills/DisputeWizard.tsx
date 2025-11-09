import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  Circle, 
  FileText,
  Building2,
  Mail,
  Phone
} from "lucide-react";

interface DisputeWizardProps {
  invoice: any;
  errors: any[];
  billReviewId?: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

export function DisputeWizard({ invoice, errors, billReviewId }: DisputeWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
  const [providerInfo, setProviderInfo] = useState({
    providerName: invoice.vendor || '',
    providerPhone: '',
    providerEmail: '',
    providerAddress: ''
  });
  const [insuranceInfo, setInsuranceInfo] = useState({
    insuranceCompany: '',
    insurancePhone: '',
    claimNumber: ''
  });
  const [disputeReason, setDisputeReason] = useState('');
  const [submissionMethod, setSubmissionMethod] = useState<'mail' | 'phone' | 'email' | 'portal'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { number: 1, title: "Select Issues", icon: CheckCircle2 },
    { number: 2, title: "Provider Info", icon: Building2 },
    { number: 3, title: "Insurance Info", icon: FileText },
    { number: 4, title: "Build Case", icon: Mail },
    { number: 5, title: "Submit", icon: Phone }
  ];

  const currentProgress = (currentStep / steps.length) * 100;

  const handleErrorToggle = (errorId: string) => {
    setSelectedErrors(prev =>
      prev.includes(errorId)
        ? prev.filter(id => id !== errorId)
        : [...prev, errorId]
    );
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (selectedErrors.length === 0) {
      toast.error("Please select at least one issue to dispute");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const disputedAmount = selectedErrors.reduce((total, errorId) => {
        const error = errors.find(e => e.id === errorId);
        return total + (error?.potential_savings || 0);
      }, 0);

      // Create dispute
      const { data: dispute, error: disputeError } = await supabase
        .from('bill_disputes')
        .insert({
          user_id: user.id,
          bill_review_id: billReviewId || null,
          invoice_id: invoice.id,
          dispute_status: 'draft',
          provider_name: providerInfo.providerName,
          provider_contact_info: {
            phone: providerInfo.providerPhone,
            email: providerInfo.providerEmail,
            address: providerInfo.providerAddress
          },
          insurance_company: insuranceInfo.insuranceCompany,
          insurance_contact_info: {
            phone: insuranceInfo.insurancePhone
          },
          claim_number: insuranceInfo.claimNumber,
          original_amount: invoice.amount,
          disputed_amount: disputedAmount,
          dispute_reason: disputeReason,
          timeline: [{
            date: new Date().toISOString(),
            status: 'draft',
            note: 'Dispute created'
          }]
        })
        .select()
        .single();

      if (disputeError) throw disputeError;

      // Update selected errors to 'disputed' status
      const { error: updateError } = await supabase
        .from('bill_errors')
        .update({ status: 'disputed' })
        .in('id', selectedErrors);

      if (updateError) throw updateError;

      toast.success("Dispute created successfully!");
      navigate(`/disputes/${dispute.id}`);
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error("Failed to create dispute");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepComplete = (step: number): boolean => {
    if (step === 1) return selectedErrors.length > 0;
    if (step === 2) return providerInfo.providerName.length > 0;
    if (step === 3) return true; // Insurance info is optional
    if (step === 4) return disputeReason.length > 20;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isComplete = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : isComplete
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="h-[2px] w-12 mx-2 bg-border" />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={currentProgress} className="h-2" />
        </div>
      </Card>

      {/* Step Content */}
      <Card className="p-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Select Issues to Dispute</h2>
              <p className="text-muted-foreground">
                Choose which billing errors you want to challenge
              </p>
            </div>

            {errors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No issues identified. You can still create a manual dispute.
              </div>
            ) : (
              <div className="space-y-3">
                {errors.map((error) => (
                  <div
                    key={error.id}
                    className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleErrorToggle(error.id)}
                  >
                    <Checkbox
                      checked={selectedErrors.includes(error.id)}
                      onCheckedChange={() => handleErrorToggle(error.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{error.error_type.replace(/_/g, ' ')}</h4>
                        <Badge variant="outline">
                          ${error.potential_savings.toFixed(2)} savings
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {error.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Provider Information</h2>
              <p className="text-muted-foreground">
                Enter contact details for the billing provider
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="providerName">Provider Name *</Label>
                <Input
                  id="providerName"
                  value={providerInfo.providerName}
                  onChange={(e) => setProviderInfo({ ...providerInfo, providerName: e.target.value })}
                  placeholder="e.g., Memorial Hospital"
                />
              </div>

              <div>
                <Label htmlFor="providerPhone">Phone Number</Label>
                <Input
                  id="providerPhone"
                  type="tel"
                  value={providerInfo.providerPhone}
                  onChange={(e) => setProviderInfo({ ...providerInfo, providerPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="providerEmail">Email</Label>
                <Input
                  id="providerEmail"
                  type="email"
                  value={providerInfo.providerEmail}
                  onChange={(e) => setProviderInfo({ ...providerInfo, providerEmail: e.target.value })}
                  placeholder="billing@provider.com"
                />
              </div>

              <div>
                <Label htmlFor="providerAddress">Billing Address</Label>
                <Textarea
                  id="providerAddress"
                  value={providerInfo.providerAddress}
                  onChange={(e) => setProviderInfo({ ...providerInfo, providerAddress: e.target.value })}
                  placeholder="123 Medical Drive, Suite 100..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Insurance Information</h2>
              <p className="text-muted-foreground">
                Optional: This helps if your insurance needs to be involved
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="insuranceCompany">Insurance Company</Label>
                <Input
                  id="insuranceCompany"
                  value={insuranceInfo.insuranceCompany}
                  onChange={(e) => setInsuranceInfo({ ...insuranceInfo, insuranceCompany: e.target.value })}
                  placeholder="e.g., Blue Cross Blue Shield"
                />
              </div>

              <div>
                <Label htmlFor="insurancePhone">Insurance Phone</Label>
                <Input
                  id="insurancePhone"
                  type="tel"
                  value={insuranceInfo.insurancePhone}
                  onChange={(e) => setInsuranceInfo({ ...insuranceInfo, insurancePhone: e.target.value })}
                  placeholder="(555) 987-6543"
                />
              </div>

              <div>
                <Label htmlFor="claimNumber">Claim Number</Label>
                <Input
                  id="claimNumber"
                  value={insuranceInfo.claimNumber}
                  onChange={(e) => setInsuranceInfo({ ...insuranceInfo, claimNumber: e.target.value })}
                  placeholder="CLM-12345678"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Build Your Case</h2>
              <p className="text-muted-foreground">
                Explain why you're disputing these charges
              </p>
            </div>

            <div>
              <Label htmlFor="disputeReason">Dispute Reason *</Label>
              <Textarea
                id="disputeReason"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain in your own words why these charges should be corrected..."
                rows={6}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {disputeReason.length} characters (minimum 20)
              </p>
            </div>

            <Card className="p-4 bg-muted/50">
              <h4 className="font-semibold mb-2">Selected Issues:</h4>
              <ul className="space-y-1 text-sm">
                {selectedErrors.map((errorId) => {
                  const error = errors.find(e => e.id === errorId);
                  return error ? (
                    <li key={errorId} className="flex justify-between">
                      <span>{error.error_type.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-green-600">
                        ${error.potential_savings.toFixed(2)}
                      </span>
                    </li>
                  ) : null;
                })}
              </ul>
            </Card>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Review & Submit</h2>
              <p className="text-muted-foreground">
                Your dispute will be saved as a draft for you to submit when ready
              </p>
            </div>

            <Card className="p-4 space-y-3">
              <div>
                <h4 className="font-semibold mb-1">Provider:</h4>
                <p className="text-sm">{providerInfo.providerName}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Issues Disputed:</h4>
                <p className="text-sm">{selectedErrors.length} billing errors</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Total Disputed Amount:</h4>
                <p className="text-lg font-bold text-green-600">
                  ${selectedErrors.reduce((total, errorId) => {
                    const error = errors.find(e => e.id === errorId);
                    return total + (error?.potential_savings || 0);
                  }, 0).toFixed(2)}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Back
          </Button>

          {currentStep < 5 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepComplete(currentStep)}
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isStepComplete(4)}
            >
              {isSubmitting ? 'Creating...' : 'Create Dispute'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
