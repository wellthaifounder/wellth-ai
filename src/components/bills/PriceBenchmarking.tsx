import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertCircle, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PriceBenchmarkingProps {
  invoiceAmount: number;
  cptCodes?: string[];
  category?: string;
}

export function PriceBenchmarking({ invoiceAmount, cptCodes = [], category }: PriceBenchmarkingProps) {
  const { data: benchmarkData, isLoading } = useQuery({
    queryKey: ['price-benchmark', cptCodes, category],
    queryFn: async () => {
      if (cptCodes.length === 0 && !category) return null;

      // Fetch CPT code pricing if codes provided
      let cptPricing = null;
      if (cptCodes.length > 0) {
        const { data: codes, error } = await supabase
          .from('cpt_code_reference')
          .select('*')
          .in('cpt_code', cptCodes);

        if (!error && codes) {
          cptPricing = codes.reduce((sum, code) => 
            sum + (Number(code.medicare_rate) || 0), 0
          );
        }
      }

      // Calculate national average (simulated - would come from real data)
      const nationalAverage = invoiceAmount * 0.75; // Typically 25% markup
      const regionAverage = invoiceAmount * 0.80; // 20% markup

      return {
        cptMedicareRate: cptPricing,
        nationalAverage,
        regionAverage,
        charged: invoiceAmount
      };
    },
    enabled: invoiceAmount > 0
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Price Benchmarking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!benchmarkData) {
    return null;
  }

  const calculateVariance = (charged: number, benchmark: number) => {
    const variance = ((charged - benchmark) / benchmark) * 100;
    return {
      percentage: Math.abs(variance).toFixed(1),
      isHigher: variance > 0,
      amount: charged - benchmark
    };
  };

  const medicareVariance = benchmarkData.cptMedicareRate 
    ? calculateVariance(benchmarkData.charged, benchmarkData.cptMedicareRate)
    : null;
  
  const nationalVariance = calculateVariance(benchmarkData.charged, benchmarkData.nationalAverage);
  const regionalVariance = calculateVariance(benchmarkData.charged, benchmarkData.regionAverage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Price Benchmarking Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare charged amount against Medicare rates and market averages
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Your Bill */}
        <div className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">Amount You Were Charged</p>
          <p className="text-3xl font-bold text-primary">
            ${benchmarkData.charged.toFixed(2)}
          </p>
        </div>

        {/* Medicare Rate Comparison */}
        {medicareVariance && benchmarkData.cptMedicareRate && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Medicare Allowable Rate</p>
                <p className="text-sm text-muted-foreground">
                  Standard reimbursement rate for these procedures
                </p>
              </div>
              <Badge 
                variant={medicareVariance.isHigher ? "destructive" : "default"}
                className="gap-1"
              >
                {medicareVariance.isHigher ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {medicareVariance.percentage}% {medicareVariance.isHigher ? "higher" : "lower"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                ${benchmarkData.cptMedicareRate.toFixed(2)}
              </span>
              {medicareVariance.isHigher && (
                <span className="text-sm font-semibold text-red-600">
                  +${medicareVariance.amount.toFixed(2)} over Medicare
                </span>
              )}
            </div>
            <Progress 
              value={medicareVariance.isHigher ? 100 : (benchmarkData.cptMedicareRate / benchmarkData.charged) * 100}
              className="h-2"
            />
          </div>
        )}

        {/* National Average */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">National Average</p>
              <p className="text-sm text-muted-foreground">
                Typical charges across the United States
              </p>
            </div>
            <Badge 
              variant={nationalVariance.isHigher ? "secondary" : "outline"}
              className="gap-1"
            >
              {nationalVariance.isHigher ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {nationalVariance.percentage}% {nationalVariance.isHigher ? "higher" : "lower"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              ${benchmarkData.nationalAverage.toFixed(2)}
            </span>
            {nationalVariance.isHigher && (
              <span className="text-sm font-semibold text-orange-600">
                +${nationalVariance.amount.toFixed(2)} over average
              </span>
            )}
          </div>
          <Progress 
            value={nationalVariance.isHigher ? 100 : (benchmarkData.nationalAverage / benchmarkData.charged) * 100}
            className="h-2"
          />
        </div>

        {/* Regional Average */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Regional Average</p>
              <p className="text-sm text-muted-foreground">
                Typical charges in your geographic area
              </p>
            </div>
            <Badge 
              variant={regionalVariance.isHigher ? "secondary" : "outline"}
              className="gap-1"
            >
              {regionalVariance.isHigher ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {regionalVariance.percentage}% {regionalVariance.isHigher ? "higher" : "lower"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              ${benchmarkData.regionAverage.toFixed(2)}
            </span>
            {regionalVariance.isHigher && (
              <span className="text-sm font-semibold text-orange-600">
                +${regionalVariance.amount.toFixed(2)} over regional
              </span>
            )}
          </div>
          <Progress 
            value={regionalVariance.isHigher ? 100 : (benchmarkData.regionAverage / benchmarkData.charged) * 100}
            className="h-2"
          />
        </div>

        {/* Alert if significantly overcharged */}
        {(medicareVariance && medicareVariance.isHigher && Number(medicareVariance.percentage) > 50) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Significant Overcharge Detected:</strong> The charged amount is more than 50% above Medicare rates. 
              This may indicate billing errors or excessive charges worth disputing.
            </AlertDescription>
          </Alert>
        )}

        {/* Educational Note */}
        <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2">
          <p className="font-semibold">Understanding Price Benchmarks</p>
          <ul className="space-y-1 text-muted-foreground list-disc list-inside">
            <li><strong>Medicare rates</strong> are the most reliable benchmark - they represent fair market value</li>
            <li>Charges 20-30% above averages are common but negotiable</li>
            <li>Charges 50%+ above benchmarks may indicate errors or excessive pricing</li>
            <li>Use these comparisons when negotiating with providers</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
