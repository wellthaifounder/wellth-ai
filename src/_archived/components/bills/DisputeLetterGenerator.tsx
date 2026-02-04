import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Download, FileText, Mail, Phone } from "lucide-react";
import { DISPUTE_TEMPLATES, fillTemplate, DisputeTemplate } from "@/lib/disputeTemplates";

interface DisputeLetterGeneratorProps {
  dispute: {
    provider_name: string;
    provider_contact_info: any;
    insurance_company?: string;
    claim_number?: string;
    original_amount: number;
    disputed_amount: number;
  };
  errors: Array<{
    error_type: string;
    description: string;
    potential_savings: number;
  }>;
}

export function DisputeLetterGenerator({ dispute, errors }: DisputeLetterGeneratorProps) {
  const [selectedErrorType, setSelectedErrorType] = useState(errors[0]?.error_type || '');
  const [customizations, setCustomizations] = useState<Record<string, string>>({});

  const generateReplacements = () => {
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return {
      '[YOUR NAME]': 'Your Full Name',
      '[YOUR ADDRESS]': 'Your Address',
      '[PROVIDER NAME]': dispute.provider_name,
      '[PROVIDER ADDRESS]': dispute.provider_contact_info?.address || '[Provider Address]',
      '[DATE]': today,
      '[CLAIM NUMBER]': dispute.claim_number || '[Claim Number]',
      '[SERVICE DATE]': '[Service Date]',
      '[CHARGE DESCRIPTION]': errors.find(e => e.error_type === selectedErrorType)?.description || '',
      '[CHARGED AMOUNT]': `$${dispute.original_amount.toFixed(2)}`,
      '[CORRECT AMOUNT]': `$${(dispute.original_amount - dispute.disputed_amount).toFixed(2)}`,
      '[INSURANCE COMPANY]': dispute.insurance_company || '[Insurance Company]',
      ...customizations
    };
  };

  const getTemplate = () => {
    const template = DISPUTE_TEMPLATES[selectedErrorType];
    if (!template) return null;
    
    const replacements = generateReplacements();
    return {
      subject: fillTemplate(template.subject, replacements),
      letter: fillTemplate(template.letterTemplate, replacements),
      email: fillTemplate(template.emailTemplate, replacements),
      phone: fillTemplate(template.phoneScript, replacements)
    };
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };

  const template = getTemplate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispute Letter Generator</CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate professional dispute letters, emails, and phone scripts
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Issue Type</label>
          <Select value={selectedErrorType} onValueChange={setSelectedErrorType}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an error type" />
            </SelectTrigger>
            <SelectContent>
              {errors.map((error) => (
                <SelectItem key={error.error_type} value={error.error_type}>
                  {error.error_type.replace(/_/g, ' ')} - ${error.potential_savings.toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {template && (
          <Tabs defaultValue="letter" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="letter" className="gap-2">
                <FileText className="h-4 w-4" />
                Letter
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-2">
                <Phone className="h-4 w-4" />
                Phone Script
              </TabsTrigger>
            </TabsList>

            <TabsContent value="letter" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Formal Letter Template</Badge>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleCopy(template.letter)}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    onClick={() => handleDownload(template.letter, 'dispute-letter.txt')}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <Textarea
                value={template.letter}
                readOnly
                rows={20}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Replace bracketed placeholders with your specific information before sending
              </p>
            </TabsContent>

            <TabsContent value="email" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Email Template</Badge>
                <Button 
                  onClick={() => handleCopy(`Subject: ${template.subject}\n\n${template.email}`)}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Subject Line</label>
                <div className="flex gap-2">
                  <Input value={template.subject} readOnly className="flex-1" />
                  <Button 
                    onClick={() => handleCopy(template.subject)}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email Body</label>
                <Textarea
                  value={template.email}
                  readOnly
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="phone" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Phone Script</Badge>
                <Button 
                  onClick={() => handleCopy(template.phone)}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Tips for Phone Calls:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Have your documents ready before calling</li>
                  <li>Take notes during the call</li>
                  <li>Get the name and ID of the person you speak with</li>
                  <li>Ask for a reference number for the dispute</li>
                  <li>Follow up with written documentation</li>
                </ul>
              </Card>
              <Textarea
                value={template.phone}
                readOnly
                rows={15}
                className="font-mono text-sm"
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
