import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AnalyticsAssumptions {
  investmentReturnRate: number;
  currentTaxBracket: number;
  projectedTaxBracket: number;
  defaultRewardsRate: number;
}

interface AnalyticsSettingsProps {
  assumptions: AnalyticsAssumptions;
  onUpdate: (assumptions: AnalyticsAssumptions) => void;
}

export const AnalyticsSettings = ({ assumptions, onUpdate }: AnalyticsSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [localAssumptions, setLocalAssumptions] = useState(assumptions);

  const handleSave = () => {
    onUpdate(localAssumptions);
    setOpen(false);
  };

  const handleReset = () => {
    const defaults: AnalyticsAssumptions = {
      investmentReturnRate: 7,
      currentTaxBracket: 22,
      projectedTaxBracket: 24,
      defaultRewardsRate: 2,
    };
    setLocalAssumptions(defaults);
    onUpdate(defaults);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Customize Assumptions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Analytics Assumptions</DialogTitle>
          <DialogDescription>
            Adjust these values to personalize your analytics and projections
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="investment-return">
              Expected Annual Investment Return
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                id="investment-return"
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={localAssumptions.investmentReturnRate}
                onChange={(e) =>
                  setLocalAssumptions({
                    ...localAssumptions,
                    investmentReturnRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="flex-1"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Typical range: 5-10% for diversified portfolios
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current-tax">Current Tax Bracket</Label>
            <Select
              value={localAssumptions.currentTaxBracket.toString()}
              onValueChange={(value) =>
                setLocalAssumptions({
                  ...localAssumptions,
                  currentTaxBracket: parseInt(value),
                })
              }
            >
              <SelectTrigger id="current-tax">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10% ($0 - $11,600)</SelectItem>
                <SelectItem value="12">12% ($11,600 - $47,150)</SelectItem>
                <SelectItem value="22">22% ($47,150 - $100,525)</SelectItem>
                <SelectItem value="24">24% ($100,525 - $191,950)</SelectItem>
                <SelectItem value="32">32% ($191,950 - $243,725)</SelectItem>
                <SelectItem value="35">35% ($243,725 - $609,350)</SelectItem>
                <SelectItem value="37">37% ($609,350+)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projected-tax">Projected Future Tax Bracket</Label>
            <Select
              value={localAssumptions.projectedTaxBracket.toString()}
              onValueChange={(value) =>
                setLocalAssumptions({
                  ...localAssumptions,
                  projectedTaxBracket: parseInt(value),
                })
              }
            >
              <SelectTrigger id="projected-tax">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10% ($0 - $11,600)</SelectItem>
                <SelectItem value="12">12% ($11,600 - $47,150)</SelectItem>
                <SelectItem value="22">22% ($47,150 - $100,525)</SelectItem>
                <SelectItem value="24">24% ($100,525 - $191,950)</SelectItem>
                <SelectItem value="32">32% ($191,950 - $243,725)</SelectItem>
                <SelectItem value="35">35% ($243,725 - $609,350)</SelectItem>
                <SelectItem value="37">37% ($609,350+)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Estimate your tax bracket during retirement or future career changes
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rewards-rate">
              Default Credit Card Rewards Rate
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                id="rewards-rate"
                type="number"
                min="0"
                max="10"
                step="0.25"
                value={localAssumptions.defaultRewardsRate}
                onChange={(e) =>
                  setLocalAssumptions({
                    ...localAssumptions,
                    defaultRewardsRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="flex-1"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Used for calculations when specific card rate isn't set
            </p>
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
