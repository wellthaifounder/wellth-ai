// Payment Strategy Recommendation Engine
// Helps users make optimal payment decisions for HSA-eligible expenses

export interface PaymentRecommendation {
  method: "hsa" | "rewards-card" | "hsa-invest";
  title: string;
  description: string;
  savingsAmount: number;
  confidence: "high" | "medium" | "low";
  reasoning: string[];
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
}

export const getPaymentRecommendation = (input: RecommendationInput): PaymentRecommendation => {
  const {
    amount,
    isHsaEligible,
    hasRewardsCard = true,
    rewardsRate = 0.02, // Default 2%
    taxRate = 0.22, // Default 22% marginal tax rate
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
  // 1. Pay with rewards card now (get rewards immediately)
  // 2. Let HSA funds stay invested and grow
  // 3. Reimburse yourself years later when you need the cash
  
  // Conservative estimate: 7% annual growth over 10 years
  const investmentGrowth = amount * Math.pow(1.07, 10) - amount;
  const totalBenefit = rewardsValue + investmentGrowth;

  return {
    method: "hsa-invest",
    title: "Pay with Rewards Card + Save Receipt",
    description: `Keep your receipt and let HSA funds grow. Reimburse yourself later for maximum benefit.`,
    savingsAmount: totalBenefit,
    confidence: "high",
    reasoning: [
      `Pay with rewards card: +$${rewardsValue.toFixed(2)} rewards now`,
      `HSA tax savings: $${taxSavings.toFixed(2)} (when you contribute)`,
      `Investment growth potential: ~$${investmentGrowth.toFixed(2)} over 10 years`,
      `Total estimated benefit: $${totalBenefit.toFixed(2)}`,
      "Track this expense - you can reimburse yourself anytime!",
    ],
  };
};

// Quick tip generator for expense entry
export const getQuickTip = (isHsaEligible: boolean): string => {
  if (isHsaEligible) {
    return "💡 Pro Tip: Pay with a rewards card and save your receipt. Let your HSA funds grow invested, then reimburse yourself later for double benefits!";
  }
  return "💳 Use your best rewards card for this expense.";
};
