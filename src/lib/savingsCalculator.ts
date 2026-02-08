import { CalculatorData } from "@/pages/Calculator";

export interface SavingsBreakdown {
  taxSavings: number;
  investmentGrowth: number;
  total: number;
  // For transparent display on results screen
  formulas: {
    taxLabel: string;
    taxExplanation: string;
    growthLabel: string;
    growthExplanation: string;
  };
}

const ASSUMED_RETURN_RATE = 0.07; // 7% average annual return
const ASSUMED_GROWTH_YEARS = 5; // 5-year projection

export const calculateSavings = (data: CalculatorData): SavingsBreakdown => {
  const { annualSpending, taxBracket, accountType, householdSize } = data;
  const taxRate = taxBracket / 100;

  // Tax savings: spending that flows through a tax-advantaged account saves at the marginal rate
  let taxSavings = 0;
  let taxLabel = "";
  let taxExplanation = "";

  if (accountType === "hsa") {
    taxSavings = annualSpending * taxRate;
    taxLabel = `$${annualSpending.toLocaleString()} x ${taxBracket}% tax rate`;
    taxExplanation = "HSA contributions are tax-deductible, and qualified withdrawals are tax-free.";
  } else if (accountType === "fsa") {
    taxSavings = annualSpending * taxRate;
    taxLabel = `$${annualSpending.toLocaleString()} x ${taxBracket}% tax rate`;
    taxExplanation = "FSA contributions are pre-tax, reducing your taxable income.";
  } else {
    // No account yet — show what they could save by opening one
    taxSavings = annualSpending * taxRate;
    taxLabel = `$${annualSpending.toLocaleString()} x ${taxBracket}% tax rate`;
    taxExplanation = "Opening an HSA or FSA could save you this amount in taxes each year.";
  }

  // Household multiplier: more people = more medical expenses eligible for tax savings
  if (householdSize > 1) {
    taxSavings *= (1 + (householdSize - 1) * 0.15);
  }
  taxSavings = Math.round(taxSavings);

  // Investment growth projection (HSA only — FSA funds don't invest long-term)
  let investmentGrowth = 0;
  let growthLabel = "";
  let growthExplanation = "";

  if (accountType === "hsa") {
    // Compound growth of tax savings kept invested in HSA
    const futureValue = taxSavings * Math.pow(1 + ASSUMED_RETURN_RATE, ASSUMED_GROWTH_YEARS);
    investmentGrowth = Math.round(futureValue - taxSavings);
    growthLabel = `$${taxSavings.toLocaleString()} x ${ASSUMED_RETURN_RATE * 100}% return x ${ASSUMED_GROWTH_YEARS} years`;
    growthExplanation = "HSA funds can be invested and grow tax-free. This projection assumes a 7% average annual return over 5 years.";
  } else if (accountType === "fsa") {
    growthLabel = "N/A for FSA";
    growthExplanation = "FSA funds must be used within the plan year (with possible grace period), so long-term investment growth doesn't apply.";
  } else {
    // Show what they'd gain with an HSA
    const futureValue = taxSavings * Math.pow(1 + ASSUMED_RETURN_RATE, ASSUMED_GROWTH_YEARS);
    investmentGrowth = Math.round(futureValue - taxSavings);
    growthLabel = `$${taxSavings.toLocaleString()} x ${ASSUMED_RETURN_RATE * 100}% return x ${ASSUMED_GROWTH_YEARS} years`;
    growthExplanation = "If you opened an HSA, your tax savings could be invested and grow tax-free at an estimated 7% annual return.";
  }

  const total = taxSavings + investmentGrowth;

  return {
    taxSavings,
    investmentGrowth,
    total,
    formulas: {
      taxLabel,
      taxExplanation,
      growthLabel,
      growthExplanation,
    },
  };
};
