import { CalculatorData } from "@/pages/Calculator";

interface SavingsBreakdown {
  taxSavings: number;
  rewardsSavings: number;
  timingSavings: number;
  total: number;
}

export const calculateSavings = (data: CalculatorData): SavingsBreakdown => {
  const annualSpending = data.monthlySpending * 12;
  
  // Tax savings calculation
  // HSA contributions are pre-tax, typically saving 22-24% marginal tax rate
  let taxSavings = 0;
  if (data.hasHSA === "yes") {
    // Already has HSA, assume they're using it somewhat efficiently
    taxSavings = annualSpending * 0.15; // 15% tax savings
  } else if (data.hasHSA === "no") {
    // Could save by opening HSA
    taxSavings = annualSpending * 0.22; // 22% potential tax savings
  } else {
    // Not sure - conservative estimate
    taxSavings = annualSpending * 0.18;
  }

  // Household size multiplier (more people = more expenses = more savings potential)
  const householdMultiplier = 1 + (data.householdSize - 1) * 0.1;
  taxSavings *= householdMultiplier;

  // Rewards savings calculation
  let rewardsSavings = 0;
  if (data.paymentMethod === "credit") {
    if (data.hasRewards === "yes") {
      // Already earning some rewards, but could optimize
      rewardsSavings = annualSpending * 0.02; // 2% rewards
    } else {
      // Not earning rewards - huge opportunity
      rewardsSavings = annualSpending * 0.03; // 3% potential
    }
  } else if (data.paymentMethod === "debit" || data.paymentMethod === "cash") {
    // Missing out on all rewards
    rewardsSavings = annualSpending * 0.025; // 2.5% opportunity
  } else if (data.paymentMethod === "hsa") {
    // HSA card might have limited rewards
    rewardsSavings = annualSpending * 0.01; // 1% optimization
  }

  // Timing strategy savings
  // Big expenses benefit more from timing optimization
  let timingSavings = 0;
  if (data.upcomingExpenses === "major") {
    timingSavings = 500; // Significant timing benefits for major expenses
  } else if (data.upcomingExpenses === "minor") {
    timingSavings = 200;
  } else if (data.upcomingExpenses === "ongoing") {
    timingSavings = 300; // Recurring expenses benefit from strategic timing
  } else if (data.upcomingExpenses === "regular") {
    timingSavings = 150;
  } else {
    timingSavings = 100; // Base timing optimization
  }

  const total = Math.round(taxSavings + rewardsSavings + timingSavings);

  return {
    taxSavings: Math.round(taxSavings),
    rewardsSavings: Math.round(rewardsSavings),
    timingSavings: Math.round(timingSavings),
    total,
  };
};
