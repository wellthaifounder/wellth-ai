import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ChevronDown, 
  ChevronUp,
  DollarSign 
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BillError {
  id: string;
  error_type: string;
  error_category: string;
  description: string;
  line_item_reference?: string;
  potential_savings: number;
  evidence: any;
  status: string;
}

interface BillErrorCardProps {
  error: BillError;
}

const ERROR_TYPE_LABELS: Record<string, string> = {
  duplicate_charge: "Duplicate Charge",
  upcoding: "Upcoding",
  unbundling: "Unbundling",
  incorrect_quantity: "Incorrect Quantity",
  balance_billing: "Balance Billing",
  out_of_network_surprise: "Surprise Out-of-Network",
  wrong_insurance_info: "Insurance Info Error",
  coding_error: "Coding Error",
  uncovered_service: "Uncovered Service",
  pricing_transparency_violation: "Price Transparency Violation",
  excessive_markup: "Excessive Markup",
  facility_fees_questionable: "Questionable Facility Fees",
  timeline_inconsistency: "Timeline Inconsistency",
  inappropriate_for_diagnosis: "Inappropriate for Diagnosis",
  services_not_documented: "Services Not Documented",
  other: "Other Issue"
};

const CATEGORY_CONFIG = {
  high_priority: {
    icon: AlertTriangle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/20",
    badgeVariant: "destructive" as const,
    label: "High Priority"
  },
  medium_priority: {
    icon: AlertCircle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    badgeVariant: "default" as const,
    label: "Medium Priority"
  },
  low_priority: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    badgeVariant: "secondary" as const,
    label: "Low Priority"
  },
  informational: {
    icon: Info,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
    badgeVariant: "outline" as const,
    label: "Informational"
  }
};

export function BillErrorCard({ error }: BillErrorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const config = CATEGORY_CONFIG[error.error_category as keyof typeof CATEGORY_CONFIG];
  const Icon = config.icon;
  const errorLabel = ERROR_TYPE_LABELS[error.error_type] || "Billing Issue";

  return (
    <Card className={cn("overflow-hidden border-2", config.borderColor)}>
      <div className={cn("p-4", config.bgColor)}>
        <div className="flex items-start gap-4">
          <div className={cn("mt-1", config.color)}>
            <Icon className="h-6 w-6" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">{errorLabel}</h3>
                  <Badge variant={config.badgeVariant}>
                    {config.label}
                  </Badge>
                </div>
                {error.line_item_reference && (
                  <p className="text-sm text-muted-foreground">
                    {error.line_item_reference}
                  </p>
                )}
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600 font-semibold">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-lg">
                    {error.potential_savings.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Potential savings</p>
              </div>
            </div>

            <p className="text-sm">{error.description}</p>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-2 h-8 px-2 -ml-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show Details
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Why This Matters</h4>
            <p className="text-sm text-muted-foreground">
              {getWhyItMatters(error.error_type)}
            </p>
          </div>

          {error.evidence && Object.keys(error.evidence).length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Evidence</h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                {Object.entries(error.evidence).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="font-medium">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-2">Next Steps</h4>
            <p className="text-sm text-muted-foreground">
              {getNextSteps(error.error_type)}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function getWhyItMatters(errorType: string): string {
  const explanations: Record<string, string> = {
    duplicate_charge: "You're being charged multiple times for the same service. This is a clear billing error that should be corrected immediately.",
    upcoding: "You're being billed for a more complex or expensive service than what you actually received. This inflates your costs unfairly.",
    unbundling: "Services that should be billed together (at a lower bundled price) are being billed separately, resulting in overcharges.",
    incorrect_quantity: "The bill shows more units than you actually received or than would be medically necessary for your treatment.",
    balance_billing: "Under the No Surprises Act, you're protected from most surprise out-of-network bills. You should only pay in-network rates.",
    out_of_network_surprise: "You received care from an out-of-network provider without adequate notice, and federal law may protect you from the full cost.",
    wrong_insurance_info: "Incorrect insurance information can lead to denied claims and unexpected out-of-pocket costs.",
    coding_error: "The wrong medical code was used, which can result in incorrect charges or insurance denials.",
    uncovered_service: "This service may not be covered by your insurance, resulting in unexpected costs.",
    pricing_transparency_violation: "You were charged MORE than the hospital's own published rate. Under federal law (45 CFR § 180.50), hospitals must publish their standard charges and honor them. This is a violation of the Hospital Price Transparency Rule.",
    excessive_markup: "You're being charged far more than the Medicare allowable rate for common items or services. Markups of 200-300%+ above Medicare rates are excessive and indicate price gouging. These charges are highly negotiable.",
    facility_fees_questionable: "Facility fees are legitimate for hospital-based care, but charging facility fees for simple office visits or when services weren't performed in a facility setting is improper. This inflates costs unnecessarily.",
    timeline_inconsistency: "The billing timeline doesn't make medical sense - services may be listed in illogical order or on dates that don't align with typical care patterns. This could indicate data entry errors or fraudulent billing.",
    inappropriate_for_diagnosis: "You're being charged for services that don't match your diagnosis, demographics, or medical situation. This could be a coding error or indicate services you didn't actually receive.",
    services_not_documented: "You're being charged for services that don't appear in your medical record. If a service isn't documented, it may not have been provided. This is serious and could indicate fraudulent billing.",
    other: "This billing issue could result in unnecessary charges on your account."
  };

  return explanations[errorType] || "This billing issue should be reviewed to ensure you're not overpaying.";
}

function getNextSteps(errorType: string): string {
  const steps: Record<string, string> = {
    duplicate_charge: "Contact the billing department to have the duplicate charges removed. Keep your itemized bill as evidence.",
    upcoding: "Request a review of your medical records to verify the service level. Ask for the charges to be corrected to match the actual service.",
    unbundling: "Request that the services be rebilled using the correct bundled code per CPT guidelines.",
    incorrect_quantity: "Ask the provider to verify quantities against your medical record and adjust charges accordingly.",
    balance_billing: "Cite the No Surprises Act and request that charges be adjusted to in-network rates. File a complaint if necessary.",
    out_of_network_surprise: "Reference the No Surprises Act and request adjusted billing. You may need to file a formal dispute.",
    wrong_insurance_info: "Provide correct insurance information and request that the claim be resubmitted.",
    coding_error: "Request a review by a certified medical coder and correction of the billing code.",
    uncovered_service: "Request an explanation of why the service wasn't covered and explore appeal options with your insurance.",
    pricing_transparency_violation: "Cite the Hospital Price Transparency Rule (45 CFR § 180.50) and provide proof of the hospital's published rate. Request immediate adjustment to the published rate. If not resolved, file complaints with CMS and your state Attorney General.",
    excessive_markup: "Compare charges to Medicare allowable rates and typical commercial rates. Negotiate for a reduction citing excessive markup. Reference Medicare rates as fair market value. Demand adjustment to reasonable pricing (within 150-200% of Medicare).",
    facility_fees_questionable: "Request detailed explanation of why facility fees apply. If service was in an office setting, request removal of facility fee. Challenge fees that exceed the actual service charge. Ask for itemized breakdown showing how facility fee is justified.",
    timeline_inconsistency: "Request medical records to verify service dates and sequence. Compare bill to your appointment records. Ask billing department to explain the timeline discrepancy. May indicate data entry error requiring correction.",
    inappropriate_for_diagnosis: "Request medical records showing medical necessity for the service. Compare billed services to your diagnosis codes. Ask for clinical notes justifying why this service was appropriate for your condition. May require removal if service was unnecessary.",
    services_not_documented: "This is serious - request complete medical records immediately. Compare every billed service to documented services in your chart. Any service not documented should be removed. Consider filing a fraud complaint if multiple undocumented services appear.",
    other: "Contact the billing department to discuss this issue and request a review."
  };

  return steps[errorType] || "Contact the billing department to discuss this issue and request documentation.";
}
