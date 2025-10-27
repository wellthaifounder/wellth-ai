// Payment Strategy Recommendation Engine
// Helps users make optimal payment decisions for HSA-eligible expenses

export interface PaymentRecommendation {
  method: "hsa" | "rewards-card" | "hsa-invest";
  title: string;
  description: string;
  savingsAmount: number;
  confidence: "high" | "medium" | "low";
  reasoning: string[];
  taxSavings?: number;
}

interface RecommendationInput {
  amount: number;
  category: string;
  isHsaEligible: boolean;
  hasHsaCard?: boolean;
  hasRewardsCard?: boolean;
  rewardsRate?: number; // e.g., 0.02 for 2%
  currentHsaBalance?: number;
  taxRate?: number; // e.g., 0.22 for 22%
  investmentReturnRate?: number; // e.g., 0.07 for 7%
  yearsUntilReimbursement?: number; // e.g., 5 years
  timingSavings?: number; // Optional user-defined timing benefit
}

export const getPaymentRecommendation = (input: RecommendationInput): PaymentRecommendation => {
  const {
    amount,
    isHsaEligible,
    hasRewardsCard = true,
    rewardsRate = 0.02, // Default 2%
    taxRate = 0.22, // Default 22% marginal tax rate
    investmentReturnRate = 0.07, // Default 7% annual return
    yearsUntilReimbursement = 5, // Default 5 years
    timingSavings = 0, // Optional user-defined timing benefit
  } = input;

  if (!isHsaEligible) {
    // Not HSA eligible - use rewards card
    const savingsAmount = amount * rewardsRate;
    return {
      method: "rewards-card",
      title: "Use Your Rewards Card",
      description: `This expense isn't HSA-eligible, so maximize your rewards instead.`,
      savingsAmount,
      confidence: "high",
      reasoning: [
        "Not eligible for HSA reimbursement",
        `Earn ${(rewardsRate * 100).toFixed(1)}% back in rewards`,
        `Estimated rewards: $${savingsAmount.toFixed(2)}`,
      ],
    };
  }

  // HSA-eligible expense - calculate the "invest and reimburse later" strategy
  const rewardsValue = amount * rewardsRate;
  const taxSavings = amount * taxRate;
  
  // The optimal strategy for HSA-eligible expenses:
  // 1. Pay with rewards card now (get rewards immediately, pay off card within billing cycle)
  // 2. Let HSA funds stay invested and grow
  // 3. Reimburse yourself later (e.g., in 5-10 years) when you need the cash
  
  // Investment growth on HSA funds that remain invested until reimbursement
  const investmentGrowth = amount * Math.pow(1 + investmentReturnRate, yearsUntilReimbursement) - amount;
  
  // Total benefit includes rewards, HSA tax savings, investment growth, and optional timing savings
  const totalBenefit = rewardsValue + taxSavings + investmentGrowth + timingSavings;

  const reasoning = [
    `Credit card rewards: +$${rewardsValue.toFixed(2)} (earned immediately)`,
    `HSA tax savings: +$${taxSavings.toFixed(2)} (included in total)`,
    `HSA investment growth: +$${investmentGrowth.toFixed(2)} (${yearsUntilReimbursement} years @ ${(investmentReturnRate * 100).toFixed(1)}% annual return)`,
  ];

  if (timingSavings > 0) {
    reasoning.push(`Timing benefits: +$${timingSavings.toFixed(2)}`);
  }

  reasoning.push(
    "💡 Pay off your credit card immediately to avoid interest charges",
    "Track this expense - you can reimburse yourself anytime!"
  );

  return {
    method: "hsa-invest",
    title: "Pay with Rewards Card + Save Receipt",
    description: `Keep your receipt and let HSA funds grow invested. Reimburse yourself in ${yearsUntilReimbursement} year${yearsUntilReimbursement !== 1 ? 's' : ''} for maximum benefit.`,
    savingsAmount: totalBenefit,
    taxSavings,
    confidence: "high",
    reasoning,
  };
};

// Quick tip generator for expense entry
export const getQuickTip = (isHsaEligible: boolean): string => {
  if (isHsaEligible) {
    return "💡 Pro Tip: Pay with a rewards card and save your receipt. Let your HSA funds grow invested, then reimburse yourself later for double benefits!";
  }
  return "💳 Use your best rewards card for this expense.";
};
