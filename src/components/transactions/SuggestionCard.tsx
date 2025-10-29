import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, Clock, Lightbulb, Brain } from "lucide-react";
import { format } from "date-fns";

interface SuggestionCardProps {
  transaction: {
    id: string;
    vendor: string | null;
    description: string;
    amount: number;
    transaction_date: string;
  };
  suggestion: {
    type: 'link_to_invoice' | 'mark_medical' | 'not_medical' | 'skip';
    confidence: number;
    reason: string;
    invoice?: {
      id: string;
      vendor: string;
      amount: number;
    };
  };
  onConfirmMedical: () => void;
  onNotMedical: () => void;
  onSkip: () => void;
  onViewDetails: () => void;
  showRememberOption?: boolean;
  onRememberChoice?: (remember: boolean) => void;
}

export function SuggestionCard({
  transaction,
  suggestion,
  onConfirmMedical,
  onNotMedical,
  onSkip,
  onViewDetails,
  showRememberOption = true,
  onRememberChoice,
}: SuggestionCardProps) {
  const [rememberChoice, setRememberChoice] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handleConfirmMedical = () => {
    if (onRememberChoice && rememberChoice) {
      onRememberChoice(true);
    }
    onConfirmMedical();
  };

  const handleNotMedical = () => {
    if (onRememberChoice && rememberChoice) {
      onRememberChoice(false);
    }
    onNotMedical();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'm' || key === 'n' || key === 's') {
        setActiveKey(key);
      }
    };

    const handleKeyUp = () => {
      setActiveKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getSuggestionIcon = () => {
    switch (suggestion.type) {
      case 'link_to_invoice':
      case 'mark_medical':
        return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case 'not_medical':
        return <XCircle className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSuggestionColor = () => {
    if (suggestion.confidence > 0.8) return "default";
    if (suggestion.confidence > 0.5) return "secondary";
    return "outline";
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Transaction Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {transaction.vendor || transaction.description}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(transaction.transaction_date), "MMM d, yyyy")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${Math.abs(transaction.amount).toFixed(2)}</p>
          </div>
        </div>

        {/* Suggestion */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Suggestion</span>
            <Badge variant={getSuggestionColor()}>
              {Math.round(suggestion.confidence * 100)}% confidence
            </Badge>
          </div>
          
          <div className="flex items-start gap-3">
            {getSuggestionIcon()}
            <div className="flex-1">
              <p className="text-sm">{suggestion.reason}</p>
              {suggestion.invoice && (
                <p className="text-xs text-muted-foreground mt-1">
                  Invoice: {suggestion.invoice.vendor} • ${suggestion.invoice.amount}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {showRememberOption && transaction.vendor && (
          <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Checkbox 
              id="remember" 
              checked={rememberChoice}
              onCheckedChange={(checked) => setRememberChoice(checked as boolean)}
            />
            <label 
              htmlFor="remember" 
              className="text-sm cursor-pointer flex-1 flex items-start gap-2"
            >
              <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>
                Remember this choice for <span className="font-medium">{transaction.vendor}</span>
                <span className="text-muted-foreground block text-xs mt-0.5">
                  I'll automatically categorize similar transactions in the future
                </span>
              </span>
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {suggestion.type === 'link_to_invoice' || suggestion.type === 'mark_medical' ? (
            <>
              <Button
                onClick={handleConfirmMedical}
                className={`w-full transition-all ${activeKey === 'm' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                size="lg"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Medical
              </Button>
              <Button
                onClick={handleNotMedical}
                variant="outline"
                className={`w-full transition-all ${activeKey === 'n' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                size="lg"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Not Medical
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleConfirmMedical}
                variant="outline"
                className={`w-full transition-all ${activeKey === 'm' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                size="lg"
              >
                Mark Medical
              </Button>
              <Button
                onClick={handleNotMedical}
                className={`w-full transition-all ${activeKey === 'n' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                size="lg"
              >
                Not Medical
              </Button>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onSkip}
            variant="ghost"
            className={`w-full transition-all ${activeKey === 's' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
          >
            <Clock className="h-4 w-4 mr-2" />
            Skip for Now
          </Button>
          <Button
            onClick={onViewDetails}
            variant="ghost"
            className="w-full"
          >
            View Details
          </Button>
        </div>

        {/* Keyboard Hints */}
        <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">M</kbd> Medical</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">N</kbd> Not Medical</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">S</kbd> Skip</span>
        </div>
      </div>
    </Card>
  );
}
