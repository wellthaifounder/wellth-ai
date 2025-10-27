export interface UserProgress {
  hasConnectedBank: boolean;
  hasAddedFirstExpense: boolean;
  hasReviewedTransactions: boolean;
  hasCreatedReimbursement: boolean;
  completionPercentage: number;
}

export function calculateProgress(
  hasConnectedBank: boolean,
  expenseCount: number,
  unreviewedTransactions: number,
  reimbursementCount: number
): UserProgress {
  const steps = [
    hasConnectedBank,
    expenseCount > 0,
    unreviewedTransactions === 0 && expenseCount > 0,
    reimbursementCount > 0
  ];

  const completedSteps = steps.filter(Boolean).length;
  const completionPercentage = (completedSteps / steps.length) * 100;

  return {
    hasConnectedBank,
    hasAddedFirstExpense: expenseCount > 0,
    hasReviewedTransactions: unreviewedTransactions === 0 && expenseCount > 0,
    hasCreatedReimbursement: reimbursementCount > 0,
    completionPercentage
  };
}

export interface ProgressStep {
  id: number;
  title: string;
  status: 'completed' | 'active' | 'upcoming';
}

export function getProgressSteps(progress: UserProgress): ProgressStep[] {
  return [
    {
      id: 1,
      title: "Connect Bank",
      status: progress.hasConnectedBank ? 'completed' : 'active'
    },
    {
      id: 2,
      title: "Add Expenses",
      status: progress.hasAddedFirstExpense ? 'completed' : 
              progress.hasConnectedBank ? 'active' : 'upcoming'
    },
    {
      id: 3,
      title: "Review Transactions",
      status: progress.hasReviewedTransactions ? 'completed' :
              progress.hasAddedFirstExpense ? 'active' : 'upcoming'
    },
    {
      id: 4,
      title: "Track Your Wins",
      status: progress.hasCreatedReimbursement ? 'completed' :
              progress.hasReviewedTransactions ? 'active' : 'upcoming'
    }
  ];
}
