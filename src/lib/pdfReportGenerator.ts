import jsPDF from "jspdf";
import { CalculatorData } from "@/pages/Calculator";
import { calculateSavings } from "./savingsCalculator";

export const generateHSAMaximizerReport = async (
  data: CalculatorData,
  userEmail?: string
): Promise<Blob> => {
  const pdf = new jsPDF();
  const savings = calculateSavings(data);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Page 1: Cover
  pdf.setFillColor(59, 130, 246); // Primary color
  pdf.rect(0, 0, pageWidth, 80, "F");
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(32);
  pdf.text("HSA Maximizer Report", pageWidth / 2, 30, { align: "center" });
  
  pdf.setFontSize(18);
  pdf.text("Your Personalized Savings Blueprint", pageWidth / 2, 50, { align: "center" });
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(48);
  pdf.setFont(undefined, "bold");
  pdf.text(`$${savings.total.toLocaleString()}`, pageWidth / 2, 120, { align: "center" });
  
  pdf.setFontSize(16);
  pdf.setFont(undefined, "normal");
  pdf.text("Estimated Annual Savings", pageWidth / 2, 135, { align: "center" });
  
  if (userEmail) {
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Prepared for: ${userEmail}`, pageWidth / 2, pageHeight - 20, { align: "center" });
  }
  
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  
  // Page 2: Executive Summary
  pdf.addPage();
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Executive Summary", 20, 30);
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  const summaryText = `Based on your household's healthcare spending of $${(data.monthlySpending * 12).toLocaleString()}/year, we've identified ${savings.total.toLocaleString()} in potential annual savings through three key strategies:`;
  pdf.text(summaryText, 20, 50, { maxWidth: pageWidth - 40 });
  
  // Savings breakdown
  let yPos = 75;
  pdf.setFontSize(14);
  pdf.setFont(undefined, "bold");
  pdf.text("1. Tax Optimization", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(12);
  pdf.text(`Save $${savings.taxSavings.toLocaleString()}/year through strategic HSA usage`, 25, yPos + 8);
  
  yPos += 25;
  pdf.setFontSize(14);
  pdf.setFont(undefined, "bold");
  pdf.text("2. Rewards Optimization", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(12);
  pdf.text(`Earn $${savings.rewardsSavings.toLocaleString()}/year with the right payment methods`, 25, yPos + 8);
  
  yPos += 25;
  pdf.setFontSize(14);
  pdf.setFont(undefined, "bold");
  pdf.text("3. Timing Strategy", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(12);
  pdf.text(`Save $${savings.timingSavings.toLocaleString()}/year through smart expense timing`, 25, yPos + 8);
  
  // Page 3: Best Credit Cards
  pdf.addPage();
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Best Credit Cards for Healthcare", 20, 30);
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  yPos = 50;
  
  const cards = [
    { name: "Chase Sapphire Preferred", rewards: "5% on all healthcare", annual: "$95" },
    { name: "American Express Blue Cash", rewards: "3% on prescriptions", annual: "$0" },
    { name: "Citi Double Cash", rewards: "2% on everything", annual: "$0" },
  ];
  
  cards.forEach((card, index) => {
    pdf.setFont(undefined, "bold");
    pdf.text(`${index + 1}. ${card.name}`, 20, yPos);
    pdf.setFont(undefined, "normal");
    pdf.text(`   Rewards: ${card.rewards}`, 25, yPos + 8);
    pdf.text(`   Annual Fee: ${card.annual}`, 25, yPos + 15);
    yPos += 30;
  });
  
  // Page 4: Month-by-Month Action Plan
  pdf.addPage();
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Your 12-Month Action Plan", 20, 30);
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  yPos = 50;
  
  const actionPlan = [
    { month: "Month 1", action: "Open/optimize HSA account, set up automatic contributions" },
    { month: "Month 2", action: "Apply for recommended rewards credit card" },
    { month: "Month 3", action: "Implement expense tracking system (Wellth.ai)" },
    { month: "Month 4", action: "Review Q1 savings, adjust strategy if needed" },
    { month: "Month 5-6", action: "Maximize mid-year HSA contributions" },
    { month: "Month 7", action: "Mid-year review and optimization" },
    { month: "Month 10", action: "Plan for open enrollment (if applicable)" },
    { month: "Month 12", action: "Year-end tax optimization, file reimbursements" },
  ];
  
  actionPlan.forEach(item => {
    if (yPos > pageHeight - 40) {
      pdf.addPage();
      yPos = 30;
    }
    pdf.setFont(undefined, "bold");
    pdf.text(item.month, 20, yPos);
    pdf.setFont(undefined, "normal");
    pdf.text(item.action, 50, yPos, { maxWidth: pageWidth - 70 });
    yPos += 15;
  });
  
  // Page 5: Tax Optimization Checklist
  pdf.addPage();
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Tax Optimization Checklist", 20, 30);
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  yPos = 50;
  
  const checklist = [
    "☐ Maximize HSA contributions ($4,150 individual / $8,300 family for 2024)",
    "☐ Keep detailed records of all medical expenses",
    "☐ Save receipts for potential future reimbursements",
    "☐ Consider delaying HSA reimbursements for investment growth",
    "☐ Use HSA for qualified medical expenses only",
    "☐ Track miles driven for medical appointments (65.5¢/mile deduction)",
    "☐ File Form 8889 with your tax return",
    "☐ Review employer HSA match opportunities",
  ];
  
  checklist.forEach(item => {
    pdf.text(item, 20, yPos, { maxWidth: pageWidth - 40 });
    yPos += 12;
  });
  
  // Final page: Next Steps
  pdf.addPage();
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 0, pageWidth, 60, "F");
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.text("Ready to Start Saving?", pageWidth / 2, 35, { align: "center" });
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  yPos = 80;
  pdf.text("Your 14-Day Plus Trial is Ready!", 20, yPos);
  
  pdf.setFontSize(12);
  yPos += 15;
  pdf.text("As a thank you for purchasing this report, you have access to:", 20, yPos, { maxWidth: pageWidth - 40 });
  
  yPos += 15;
  const benefits = [
    "✓ Automatic expense tracking and categorization",
    "✓ Receipt OCR (snap photos, we extract the data)",
    "✓ Smart rewards optimization alerts",
    "✓ One-click HSA reimbursement requests",
    "✓ Advanced analytics and tax reports",
  ];
  
  benefits.forEach(benefit => {
    pdf.text(benefit, 25, yPos);
    yPos += 10;
  });
  
  yPos += 15;
  pdf.setFontSize(14);
  pdf.setFont(undefined, "bold");
  pdf.text("Visit wellth.ai/activate to claim your trial", pageWidth / 2, yPos, { align: "center" });
  
  return pdf.output("blob");
};
