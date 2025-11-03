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
  // With enhanced analytics and tracking, users optimize contributions better
  let taxSavings = 0;
  if (data.hasHSA === "yes") {
    // With Wellth's analytics, can optimize HSA usage much better
    taxSavings = annualSpending * 0.22; // 22% optimized tax savings
  } else if (data.hasHSA === "no") {
    // Could save significantly by opening HSA and using Wellth
    taxSavings = annualSpending * 0.24; // 24% potential tax savings
  } else {
    // Not sure - still good potential with proper guidance
    taxSavings = annualSpending * 0.20;
  }

  // Household size multiplier (more people = more expenses = more savings potential)
  const householdMultiplier = 1 + (data.householdSize - 1) * 0.1;
  taxSavings *= householdMultiplier;

  // Rewards savings calculation
  // With payment strategy optimizer and pre-purchase calculator, users maximize rewards
  let rewardsSavings = 0;
  if (data.paymentMethod === "credit") {
    if (data.hasRewards === "yes") {
      // With Wellth's optimization, can maximize rewards strategy
      rewardsSavings = annualSpending * 0.03; // 3% optimized rewards
    } else {
      // Not earning rewards - huge opportunity with guidance
      rewardsSavings = annualSpending * 0.035; // 3.5% potential
    }
  } else if (data.paymentMethod === "debit" || data.paymentMethod === "cash") {
    // Missing out on all rewards - major optimization opportunity
    rewardsSavings = annualSpending * 0.03; // 3% opportunity
  } else if (data.paymentMethod === "hsa") {
    // With payment strategy guidance, can layer rewards
    rewardsSavings = annualSpending * 0.025; // 2.5% optimization
  }

  // Timing strategy savings
  // With AI insights and payment strategy timeline, timing optimization is much more powerful
  // Plus HSA investment tracker helps compound growth
  let timingSavings = 0;
  if (data.upcomingExpenses === "major") {
    timingSavings = 800; // Significant timing benefits + investment growth for major expenses
  } else if (data.upcomingExpenses === "minor") {
    timingSavings = 350;
  } else if (data.upcomingExpenses === "ongoing") {
    timingSavings = 500; // Recurring expenses benefit greatly from strategic timing
  } else if (data.upcomingExpenses === "regular") {
    timingSavings = 300;
  } else {
    timingSavings = 200; // Base timing optimization with analytics
  }

  const total = Math.round(taxSavings + rewardsSavings + timingSavings);

  return {
    taxSavings: Math.round(taxSavings),
    rewardsSavings: Math.round(rewardsSavings),
    timingSavings: Math.round(timingSavings),
    total,
  };
};
