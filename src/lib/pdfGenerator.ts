import jsPDF from "jspdf";

interface Expense {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  notes: string | null;
}

interface ReimbursementPackage {
  expenses: Expense[];
  totalAmount: number;
  notes?: string;
  hsaProvider?: string;
  userName: string;
  userEmail: string;
  hsaAccounts?: { id: string; account_name: string }[];
}

export const generateReimbursementPDF = async (
  data: ReimbursementPackage,
): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Cover Page
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("HSA Reimbursement Request", pageWidth / 2, yPosition, {
    align: "center",
  });

  yPosition += 20;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Submitted: ${new Date().toLocaleDateString()}`,
    pageWidth / 2,
    yPosition,
    { align: "center" },
  );

  yPosition += 15;
  doc.setFontSize(10);
  doc.text(`Submitted by: ${data.userName}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Email: ${data.userEmail}`, 20, yPosition);

  if (data.hsaProvider) {
    yPosition += 7;
    doc.text(`HSA Provider: ${data.hsaProvider}`, 20, yPosition);
  }

  yPosition += 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total Reimbursement Amount: $${data.totalAmount.toFixed(2)}`,
    20,
    yPosition,
  );

  if (data.notes) {
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Additional Notes:", 20, yPosition);
    yPosition += 7;
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 40);
    doc.text(splitNotes, 20, yPosition);
    yPosition += splitNotes.length * 5;
  }

  // Itemized List - New Page
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Itemized Expense List", 20, yPosition);

  yPosition += 15;
  doc.setFontSize(9);

  // Table headers
  doc.setFont("helvetica", "bold");
  doc.text("Date", 20, yPosition);
  doc.text("Vendor", 50, yPosition);
  doc.text("Category", 100, yPosition);
  doc.text("Amount", 160, yPosition);

  yPosition += 7;
  doc.setFont("helvetica", "normal");

  // Table rows
  data.expenses.forEach((expense) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
      // Repeat headers
      doc.setFont("helvetica", "bold");
      doc.text("Date", 20, yPosition);
      doc.text("Vendor", 50, yPosition);
      doc.text("Category", 100, yPosition);
      doc.text("Amount", 160, yPosition);
      yPosition += 7;
      doc.setFont("helvetica", "normal");
    }

    doc.text(new Date(expense.date).toLocaleDateString(), 20, yPosition);
    doc.text(expense.vendor.substring(0, 25), 50, yPosition);
    doc.text(expense.category.substring(0, 20), 100, yPosition);
    doc.text(`$${Number(expense.amount).toFixed(2)}`, 160, yPosition);

    if (expense.notes) {
      yPosition += 5;
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Note: ${expense.notes.substring(0, 60)}`, 50, yPosition);
      doc.setFontSize(9);
      doc.setTextColor(0);
    }

    yPosition += 7;
  });

  // Total
  yPosition += 5;
  doc.setFont("helvetica", "bold");
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 7;
  doc.setFontSize(11);
  doc.text(`Total: $${data.totalAmount.toFixed(2)}`, 160, yPosition);

  // Provider-specific instructions
  if (data.hsaProvider) {
    doc.addPage();
    yPosition = 20;
    doc.setFontSize(14);
    doc.text("Submission Instructions", 20, yPosition);
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const instructions = getProviderInstructions(data.hsaProvider);
    const splitInstructions = doc.splitTextToSize(instructions, pageWidth - 40);
    doc.text(splitInstructions, 20, yPosition);
  }

  return doc.output("blob");
};

interface AnalyticsReport {
  dateRange: string;
  stats: {
    totalExpenses: number;
    hsaEligible: number;
    projectedSavings: number;
    actualSavings: number;
    avgMonthly: number;
    unreimbursedHsaTotal: number;
  };
  monthlyData: { month: string; total: number }[];
  categoryData: { category: string; total: number }[];
  paymentMethodsRewards: {
    name: string;
    rewardsEarned: number;
    rewardsRate: number;
    totalSpent: number;
  }[];
  yearlyData: {
    year: number;
    totalExpenses: number;
    taxSavings: number;
    rewardsEarned: number;
    hsaEligible: number;
  }[];
}

export const generateAnalyticsReportPDF = (data: AnalyticsReport): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  const addRow = (label: string, value: string, indent = 20) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text(label, indent, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 130, y);
    y += 7;
  };

  const addSectionHeader = (title: string) => {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }
    y += 5;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(title, 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
  };

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Analytics Report", pageWidth / 2, y, { align: "center" });
  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${data.dateRange}`, pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, {
    align: "center",
  });
  y += 15;

  // Summary
  addSectionHeader("Summary Statistics");
  addRow("Total Expenses", `$${data.stats.totalExpenses.toFixed(2)}`);
  addRow("HSA Eligible", `$${data.stats.hsaEligible.toFixed(2)}`);
  addRow("Projected Tax Savings", `$${data.stats.projectedSavings.toFixed(2)}`);
  addRow("Actual Tax Savings", `$${data.stats.actualSavings.toFixed(2)}`);
  addRow("Average Monthly", `$${data.stats.avgMonthly.toFixed(2)}`);
  addRow(
    "Unreimbursed HSA Total",
    `$${data.stats.unreimbursedHsaTotal.toFixed(2)}`,
  );

  // Monthly trends
  if (data.monthlyData.length > 0) {
    addSectionHeader("Monthly Trends");
    data.monthlyData.forEach((m) =>
      addRow(m.month, `$${Number(m.total).toFixed(2)}`),
    );
  }

  // Category breakdown
  if (data.categoryData.length > 0) {
    addSectionHeader("Category Breakdown");
    data.categoryData.forEach((c) =>
      addRow(c.category, `$${Number(c.total).toFixed(2)}`),
    );
  }

  // Rewards
  if (data.paymentMethodsRewards.length > 0) {
    addSectionHeader("Rewards by Payment Method");
    data.paymentMethodsRewards.forEach((pm) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(pm.name, 20, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.text(
        `Rewards earned: $${Number(pm.rewardsEarned).toFixed(2)} | Rate: ${pm.rewardsRate}% | Spent: $${Number(pm.totalSpent).toFixed(2)}`,
        25,
        y,
      );
      y += 7;
    });
  }

  // Year-over-year
  if (data.yearlyData.length > 0) {
    addSectionHeader("Year-over-Year Comparison");
    data.yearlyData.forEach((yr) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(String(yr.year), 20, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.text(
        `Expenses: $${yr.totalExpenses.toFixed(2)} | Tax Savings: $${yr.taxSavings.toFixed(2)} | Rewards: $${yr.rewardsEarned.toFixed(2)} | HSA Eligible: $${yr.hsaEligible.toFixed(2)}`,
        25,
        y,
      );
      y += 7;
    });
  }

  doc.save(`analytics-report-${new Date().toISOString().split("T")[0]}.pdf`);
};

const getProviderInstructions = (provider: string): string => {
  const instructions: Record<string, string> = {
    "HSA Bank":
      'Submit this reimbursement package through your HSA Bank online portal at www.hsabank.com. Log in to your account, navigate to "Reimbursements" and upload this PDF along with any receipt images.',
    HealthEquity:
      'Log in to your HealthEquity account at www.healthequity.com. Click on "Reimburse Myself" and upload this PDF. Receipts may be required for verification.',
    "Fidelity HSA":
      'Access your Fidelity HSA account at www.fidelity.com/hsa. Select "Reimbursements" and follow the prompts to submit this documentation.',
    "Optum Bank":
      'Visit www.optumbank.com and log in to your account. Navigate to "Claims & Reimbursements" to submit this package.',
    Lively:
      'Log in at www.livelyme.com and select "Reimbursements" from your dashboard. Upload this PDF and any supporting receipts.',
    Other:
      "Please contact your HSA provider for specific submission instructions. This PDF contains all necessary documentation for your reimbursement request.",
  };

  return instructions[provider] || instructions["Other"];
};
