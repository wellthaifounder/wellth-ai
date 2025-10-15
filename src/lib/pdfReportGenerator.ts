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
  const annualSpending = data.monthlySpending * 12;
  
  // Helper function to add page header
  const addPageHeader = (pageNum: number) => {
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`HSA Maximizer Report | Page ${pageNum} of 15`, pageWidth / 2, 10, { align: "center" });
    pdf.setTextColor(0, 0, 0);
  };
  
  // Page 1: Cover
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 0, pageWidth, 80, "F");
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(32);
  pdf.setFont(undefined, "bold");
  pdf.text("HSA Maximizer Report", pageWidth / 2, 30, { align: "center" });
  
  pdf.setFontSize(18);
  pdf.setFont(undefined, "normal");
  pdf.text("Your Personalized Savings Blueprint", pageWidth / 2, 50, { align: "center" });
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(48);
  pdf.setFont(undefined, "bold");
  pdf.text(`$${savings.total.toLocaleString()}`, pageWidth / 2, 120, { align: "center" });
  
  pdf.setFontSize(16);
  pdf.setFont(undefined, "normal");
  pdf.text("Estimated Annual Savings", pageWidth / 2, 135, { align: "center" });
  
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  const householdText = data.householdSize === 1 ? "1 Person" : `${data.householdSize} People`;
  pdf.text(`${householdText} | $${annualSpending.toLocaleString()}/year Healthcare Spending`, pageWidth / 2, 150, { align: "center" });
  
  if (userEmail) {
    pdf.setFontSize(10);
    pdf.text(`Prepared for: ${userEmail}`, pageWidth / 2, pageHeight - 20, { align: "center" });
  }
  
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  
  // Page 2: Executive Summary
  pdf.addPage();
  addPageHeader(2);
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Executive Summary", 20, 30);
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  const householdLabel = data.householdSize === 1 ? "individual" : "family";
  const summaryText = `Based on your ${householdLabel} household's healthcare spending of $${annualSpending.toLocaleString()}/year, we've identified $${savings.total.toLocaleString()} in potential annual savings through three key strategies:`;
  pdf.text(summaryText, 20, 50, { maxWidth: pageWidth - 40 });
  
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
  
  yPos += 30;
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, 40, "F");
  yPos += 15;
  pdf.setFontSize(10);
  pdf.setFont(undefined, "bold");
  pdf.text("Quick Win:", 20, yPos);
  pdf.setFont(undefined, "normal");
  const quickWin = data.hasHSA === "no" 
    ? "Opening an HSA could save you $" + savings.taxSavings.toLocaleString() + " in taxes this year alone."
    : "Switching to the right rewards card could earn you $" + savings.rewardsSavings.toLocaleString() + " back annually.";
  pdf.text(quickWin, 20, yPos + 8, { maxWidth: pageWidth - 40 });
  
  // Page 3: Your Personal Savings Breakdown
  pdf.addPage();
  addPageHeader(3);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Your Personal Savings Breakdown", 20, 30);
  
  yPos = 50;
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  
  // Tax savings detail
  pdf.setFontSize(16);
  pdf.setFont(undefined, "bold");
  pdf.setTextColor(59, 130, 246);
  pdf.text(`Tax Savings: $${savings.taxSavings.toLocaleString()}/year`, 20, yPos);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(11);
  yPos += 10;
  
  const hsaMaxContribution = data.householdSize === 1 ? 4150 : 8300;
  const taxBracket = data.householdSize === 1 ? "22%" : "24%";
  pdf.text(`• Annual healthcare spending: $${annualSpending.toLocaleString()}`, 25, yPos);
  yPos += 8;
  pdf.text(`• Current HSA status: ${data.hasHSA === "yes" ? "Active" : data.hasHSA === "no" ? "Not enrolled" : "Uncertain"}`, 25, yPos);
  yPos += 8;
  pdf.text(`• Estimated tax bracket: ${taxBracket}`, 25, yPos);
  yPos += 8;
  pdf.text(`• 2024 HSA max contribution: $${hsaMaxContribution.toLocaleString()}`, 25, yPos);
  yPos += 8;
  pdf.text(`• Potential tax-free savings: $${Math.min(annualSpending, hsaMaxContribution).toLocaleString()}`, 25, yPos);
  
  yPos += 20;
  pdf.setFontSize(16);
  pdf.setFont(undefined, "bold");
  pdf.setTextColor(59, 130, 246);
  pdf.text(`Rewards Savings: $${savings.rewardsSavings.toLocaleString()}/year`, 20, yPos);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(11);
  yPos += 10;
  
  const currentMethod = data.paymentMethod === "credit-rewards" ? "Rewards credit card" : 
                        data.paymentMethod === "credit-no-rewards" ? "Credit card (no rewards)" :
                        data.paymentMethod === "debit" ? "Debit card" : "HSA card";
  const rewardsRate = data.paymentMethod === "credit-rewards" ? (data.hasRewards === "yes" ? "2-3%" : "0%") : "0%";
  
  pdf.text(`• Current payment method: ${currentMethod}`, 25, yPos);
  yPos += 8;
  pdf.text(`• Current rewards rate: ${rewardsRate}`, 25, yPos);
  yPos += 8;
  pdf.text(`• Optimized rewards potential: 3-5%`, 25, yPos);
  yPos += 8;
  pdf.text(`• Annual rewards on $${annualSpending.toLocaleString()}: $${savings.rewardsSavings.toLocaleString()}`, 25, yPos);
  
  yPos += 20;
  pdf.setFontSize(16);
  pdf.setFont(undefined, "bold");
  pdf.setTextColor(59, 130, 246);
  pdf.text(`Timing Savings: $${savings.timingSavings.toLocaleString()}/year`, 20, yPos);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(11);
  yPos += 10;
  
  const upcomingExpense = data.upcomingExpenses || "none";
  pdf.text(`• Upcoming major expenses: ${upcomingExpense}`, 25, yPos);
  yPos += 8;
  pdf.text(`• Timing optimization opportunity: $${savings.timingSavings.toLocaleString()}`, 25, yPos);
  yPos += 8;
  pdf.text(`• Strategy: Coordinate expenses with HSA contributions & FSA deadlines`, 25, yPos)
  
  // Page 4: Understanding Your Tax Savings
  pdf.addPage();
  addPageHeader(4);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Understanding Your Tax Savings", 20, 30);
  
  yPos = 50;
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  pdf.text("The Triple Tax Advantage of HSAs:", 20, yPos);
  yPos += 15;
  
  const taxAdvantages = [
    { num: "1", title: "Tax-Deductible Contributions", desc: "Every dollar you contribute reduces your taxable income" },
    { num: "2", title: "Tax-Free Growth", desc: "Investments grow without capital gains or dividend taxes" },
    { num: "3", title: "Tax-Free Withdrawals", desc: "No taxes when used for qualified medical expenses" }
  ];
  
  taxAdvantages.forEach(adv => {
    pdf.setFillColor(240, 240, 240);
    pdf.rect(15, yPos, pageWidth - 30, 25, "F");
    pdf.setFont(undefined, "bold");
    pdf.text(`${adv.num}. ${adv.title}`, 20, yPos + 8);
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(10);
    pdf.text(adv.desc, 25, yPos + 16);
    pdf.setFontSize(12);
    yPos += 30;
  });
  
  yPos += 10;
  pdf.setFont(undefined, "bold");
  pdf.text("Your Tax Savings Calculation:", 20, yPos);
  pdf.setFont(undefined, "normal");
  yPos += 12;
  
  const potentialContribution = Math.min(annualSpending, hsaMaxContribution);
  pdf.text(`Potential HSA contribution: $${potentialContribution.toLocaleString()}`, 25, yPos);
  yPos += 8;
  pdf.text(`Estimated tax savings (${taxBracket}): $${savings.taxSavings.toLocaleString()}`, 25, yPos);
  yPos += 8;
  pdf.text(`FICA tax savings (7.65%): $${Math.round(potentialContribution * 0.0765).toLocaleString()}`, 25, yPos);
  yPos += 15;
  pdf.setFont(undefined, "bold");
  pdf.text(`Total First-Year Tax Benefit: $${(savings.taxSavings + Math.round(potentialContribution * 0.0765)).toLocaleString()}`, 25, yPos);
  
  // Page 5: HSA Contribution Strategy
  pdf.addPage();
  addPageHeader(5);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("HSA Contribution Strategy", 20, 30);
  
  yPos = 50;
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  
  if (data.hasHSA === "no") {
    pdf.setFont(undefined, "bold");
    pdf.text("Step 1: Open Your HSA", 20, yPos);
    pdf.setFont(undefined, "normal");
    yPos += 10;
    pdf.text("You're not currently using an HSA. Here's how to get started:", 20, yPos, { maxWidth: pageWidth - 40 });
    yPos += 15;
    
    const hsaSteps = [
      "Verify you have a High Deductible Health Plan (HDHP)",
      "Choose an HSA provider (Fidelity, Lively, or HealthEquity recommended)",
      "Open your account online (takes 10-15 minutes)",
      "Link your bank account for contributions",
      "Set up automatic monthly contributions"
    ];
    
    hsaSteps.forEach((step, i) => {
      pdf.text(`${i + 1}. ${step}`, 25, yPos, { maxWidth: pageWidth - 50 });
      yPos += 12;
    });
  } else {
    pdf.setFont(undefined, "bold");
    pdf.text("Maximize Your Existing HSA", 20, yPos);
    pdf.setFont(undefined, "normal");
    yPos += 10;
    pdf.text("You have an HSA - here's how to optimize it:", 20, yPos, { maxWidth: pageWidth - 40 });
    yPos += 15;
  }
  
  yPos += 10;
  pdf.setFont(undefined, "bold");
  pdf.text("2024 Contribution Strategy:", 20, yPos);
  pdf.setFont(undefined, "normal");
  yPos += 12;
  
  const monthlyTarget = Math.round(hsaMaxContribution / 12);
  pdf.text(`Annual maximum: $${hsaMaxContribution.toLocaleString()}`, 25, yPos);
  yPos += 8;
  pdf.text(`Monthly contribution target: $${monthlyTarget.toLocaleString()}`, 25, yPos);
  yPos += 8;
  pdf.text(`Based on your spending: $${Math.min(data.monthlySpending, monthlyTarget).toLocaleString()}/month recommended`, 25, yPos);
  yPos += 15;
  
  pdf.setFillColor(255, 250, 230);
  pdf.rect(15, yPos, pageWidth - 30, 30, "F");
  yPos += 10;
  pdf.setFontSize(10);
  pdf.setFont(undefined, "bold");
  pdf.text("💡 Pro Tip:", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.text("Contribute throughout the year via payroll deductions to avoid FICA taxes.", 20, yPos + 8, { maxWidth: pageWidth - 40 });
  pdf.text("You can also make lump-sum contributions until tax filing deadline for the previous year.", 20, yPos + 16, { maxWidth: pageWidth - 40 });
  
  // Page 6: Payment Method Optimization
  pdf.addPage();
  addPageHeader(6);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Payment Method Optimization", 20, 30);
  
  yPos = 50;
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  pdf.text("The Smart Payment Strategy:", 20, yPos, { maxWidth: pageWidth - 40 });
  yPos += 15;
  
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, 35, "F");
  yPos += 10;
  pdf.setFont(undefined, "bold");
  pdf.text("Step 1: Pay with Rewards Credit Card", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(10);
  pdf.text("Use a high-rewards credit card for all medical expenses to earn 2-5% cash back.", 25, yPos + 8, { maxWidth: pageWidth - 50 });
  yPos += 35;
  
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, 35, "F");
  yPos += 10;
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(12);
  pdf.text("Step 2: Reimburse Yourself from HSA", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(10);
  pdf.text("Pay off the card immediately from your HSA. You keep the rewards AND the tax savings!", 25, yPos + 8, { maxWidth: pageWidth - 50 });
  yPos += 35;
  
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, 35, "F");
  yPos += 10;
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(12);
  pdf.text("Step 3: Save Receipts", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(10);
  pdf.text("Keep all receipts for tax purposes and future reimbursement flexibility.", 25, yPos + 8, { maxWidth: pageWidth - 50 });
  
  yPos += 45;
  pdf.setFontSize(12);
  pdf.setFont(undefined, "bold");
  pdf.text(`Your Annual Rewards Potential: $${savings.rewardsSavings.toLocaleString()}`, 20, yPos);
  pdf.setFont(undefined, "normal");
  yPos += 10;
  pdf.setFontSize(10);
  pdf.text(`On $${annualSpending.toLocaleString()} in healthcare spending at 3% rewards rate`, 20, yPos);
  
  // Page 7: Best Credit Cards for Healthcare
  pdf.addPage();
  addPageHeader(7);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Best Credit Cards for Healthcare", 20, 30);
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  yPos = 50;
  pdf.text("Top cards ranked by total value for healthcare spending:", 20, yPos);
  yPos += 20;
  
  const cards = [
    { 
      name: "Chase Sapphire Preferred", 
      rewards: "5% on all healthcare via Chase Travel portal",
      annual: "$95",
      bonus: "60,000 points ($750 value) after $4K spend",
      best: "Best for: Maximum rewards + travel benefits"
    },
    { 
      name: "American Express Blue Cash Preferred",
      rewards: "3% on transit/tolls, 6% on groceries (incl. pharmacy)",
      annual: "$95",
      bonus: "$350 statement credit after $3K spend",
      best: "Best for: Prescription drug purchases"
    },
    { 
      name: "Citi Double Cash",
      rewards: "2% on everything (1% purchase + 1% payment)",
      annual: "$0",
      bonus: "No sign-up bonus",
      best: "Best for: No-fee simplicity"
    },
    { 
      name: "Wells Fargo Active Cash",
      rewards: "2% on everything + cell phone protection",
      annual: "$0",
      bonus: "$200 cash after $500 spend",
      best: "Best for: Easy approval + benefits"
    }
  ];
  
  cards.forEach((card, index) => {
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      addPageHeader(7);
      yPos = 30;
    }
    
    pdf.setFillColor(index === 0 ? 230 : 245, index === 0 ? 245 : 245, 245);
    pdf.rect(15, yPos - 5, pageWidth - 30, 45, "F");
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(13);
    pdf.text(`${index + 1}. ${card.name}`, 20, yPos);
    
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(10);
    pdf.text(`Rewards: ${card.rewards}`, 25, yPos + 8);
    pdf.text(`Annual Fee: ${card.annual} | ${card.bonus}`, 25, yPos + 15);
    pdf.setFont(undefined, "italic");
    pdf.text(card.best, 25, yPos + 22);
    pdf.setFont(undefined, "normal");
    
    yPos += 52;
  });
  
  yPos += 5;
  pdf.setFillColor(255, 250, 230);
  pdf.rect(15, yPos, pageWidth - 30, 25, "F");
  yPos += 10;
  pdf.setFontSize(10);
  pdf.setFont(undefined, "bold");
  pdf.text("💳 Application Strategy:", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.text("Apply for one card now, wait 3 months before applying for another to protect your credit score.", 20, yPos + 8, { maxWidth: pageWidth - 40 });
  
  // Page 8: Strategic Timing Guide
  pdf.addPage();
  addPageHeader(8);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Strategic Timing Guide", 20, 30);
  
  yPos = 50;
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  pdf.text("Timing is everything. Here's when to schedule major expenses:", 20, yPos, { maxWidth: pageWidth - 40 });
  yPos += 20;
  
  const timingStrategies = [
    {
      title: "Q1 (January-March): Front-Load Deductibles",
      items: [
        "Schedule elective procedures early in the year",
        "Hit deductible early to maximize in-network benefits",
        "Stockpile FSA purchases before March 15 deadline"
      ]
    },
    {
      title: "Q2 (April-June): Mid-Year Check-In",
      items: [
        "Review HSA contribution pace (should be at 50%)",
        "Reassess medical spending vs. projections",
        "Apply for recommended rewards credit card"
      ]
    },
    {
      title: "Q3 (July-September): Strategic Planning",
      items: [
        "Schedule any remaining needed procedures",
        "Review open enrollment dates",
        "Plan for Q4 tax optimization"
      ]
    },
    {
      title: "Q4 (October-December): Year-End Moves",
      items: [
        "Max out HSA contributions by Dec 31",
        "Use FSA balance (or lose it!)",
        "Schedule January procedures now for early deductible hit"
      ]
    }
  ];
  
  timingStrategies.forEach(strategy => {
    if (yPos > pageHeight - 60) {
      pdf.addPage();
      addPageHeader(8);
      yPos = 30;
    }
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(12);
    pdf.text(strategy.title, 20, yPos);
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(10);
    yPos += 10;
    
    strategy.items.forEach(item => {
      pdf.text(`• ${item}`, 25, yPos, { maxWidth: pageWidth - 50 });
      yPos += 8;
    });
    
    yPos += 10;
  });
  
  // Page 9: 12-Month Action Plan
  pdf.addPage();
  addPageHeader(9);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Your 12-Month Action Plan", 20, 30);
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  yPos = 50;
  
  const actionPlan = [
    { month: "Month 1-2", action: "Foundation Setup", tasks: ["Open/optimize HSA account", "Set up automatic contributions", "Apply for recommended rewards credit card"] },
    { month: "Month 3", action: "System Implementation", tasks: ["Implement expense tracking (Wellth.ai)", "Link all payment methods", "Create receipt storage system"] },
    { month: "Month 4", action: "Q1 Review", tasks: ["Review savings vs. projections", "Adjust contribution amounts if needed", "Verify credit card rewards posting"] },
    { month: "Month 5-6", action: "Mid-Year Push", tasks: ["Maximize HSA contributions", "Schedule any pending procedures", "Review insurance for next year"] },
    { month: "Month 7", action: "Mid-Year Assessment", tasks: ["Calculate YTD savings", "Adjust strategy based on results", "Plan Q4 optimization moves"] },
    { month: "Month 8-9", action: "Preparation Phase", tasks: ["Research open enrollment options", "Calculate next year's HSA strategy", "Review FSA vs HSA decision"] },
    { month: "Month 10-11", action: "Open Enrollment", tasks: ["Select optimal health plan", "Adjust HSA contribution elections", "Plan January deductible strategy"] },
    { month: "Month 12", action: "Year-End Optimization", tasks: ["Max out HSA by Dec 31", "Use remaining FSA balance", "File pending reimbursements", "Schedule January procedures"] }
  ];
  
  actionPlan.forEach(item => {
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      addPageHeader(9);
      yPos = 30;
    }
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(12);
    pdf.text(item.month, 20, yPos);
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(59, 130, 246);
    pdf.text(item.action, 55, yPos);
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    yPos += 8;
    
    item.tasks.forEach(task => {
      pdf.text(`  • ${task}`, 25, yPos, { maxWidth: pageWidth - 50 });
      yPos += 7;
    });
    yPos += 8;
  });
  
  // Page 10: Tax Optimization Checklist
  pdf.addPage();
  addPageHeader(10);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Tax Optimization Checklist", 20, 30);
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  yPos = 50;
  
  const checklists = [
    {
      title: "Before Tax Season:",
      items: [
        "Maximize HSA contributions ($4,150 individual / $8,300 family for 2024)",
        "Keep detailed records of all medical expenses",
        "Save receipts for potential future reimbursements",
        "Track miles driven for medical appointments (67¢/mile deduction for 2024)"
      ]
    },
    {
      title: "During Tax Filing:",
      items: [
        "File Form 8889 with your tax return",
        "Report all HSA contributions (employer + personal)",
        "Document HSA distributions if any",
        "Claim medical expense deductions if over 7.5% AGI"
      ]
    },
    {
      title: "Year-Round Strategy:",
      items: [
        "Consider delaying HSA reimbursements for investment growth",
        "Use HSA for qualified medical expenses only",
        "Review employer HSA match opportunities",
        "Keep HSA funds invested for long-term growth"
      ]
    }
  ];
  
  checklists.forEach(section => {
    if (yPos > pageHeight - 60) {
      pdf.addPage();
      addPageHeader(10);
      yPos = 30;
    }
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(13);
    pdf.text(section.title, 20, yPos);
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(10);
    yPos += 12;
    
    section.items.forEach(item => {
      pdf.text(`☐ ${item}`, 25, yPos, { maxWidth: pageWidth - 50 });
      yPos += 10;
    });
    yPos += 10;
  });
  
  // Page 11: HSA Investment Strategy
  pdf.addPage();
  addPageHeader(11);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("HSA Investment Strategy", 20, 30);
  
  yPos = 50;
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  pdf.text("Your HSA isn't just a savings account - it's a powerful investment vehicle.", 20, yPos, { maxWidth: pageWidth - 40 });
  yPos += 20;
  
  pdf.setFont(undefined, "bold");
  pdf.text("The Long-Term Opportunity:", 20, yPos);
  pdf.setFont(undefined, "normal");
  yPos += 10;
  
  const investmentPoints = [
    "Unlike FSAs, HSA funds roll over year after year",
    "Investment gains grow tax-free forever",
    "After age 65, HSA becomes like a traditional IRA for non-medical expenses",
    "Medical expenses can be reimbursed decades later (keep receipts!)"
  ];
  
  investmentPoints.forEach(point => {
    pdf.text(`• ${point}`, 25, yPos, { maxWidth: pageWidth - 50 });
    yPos += 10;
  });
  
  yPos += 10;
  pdf.setFont(undefined, "bold");
  pdf.text("Recommended HSA Investment Providers:", 20, yPos);
  pdf.setFont(undefined, "normal");
  yPos += 12;
  
  const hsaProviders = [
    { name: "Fidelity", pros: "No fees, excellent fund selection, great platform", min: "$0" },
    { name: "Lively", pros: "Modern interface, low fees, good investment options", min: "$0" },
    { name: "HealthEquity", pros: "Most employer integrations, solid platform", min: "$0" }
  ];
  
  hsaProviders.forEach(provider => {
    pdf.setFont(undefined, "bold");
    pdf.text(`${provider.name}`, 25, yPos);
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(9);
    pdf.text(`  ${provider.pros} | Minimum: ${provider.min}`, 25, yPos + 6);
    pdf.setFontSize(10);
    yPos += 16;
  });
  
  yPos += 10;
  pdf.setFillColor(255, 250, 230);
  pdf.rect(15, yPos, pageWidth - 30, 35, "F");
  yPos += 10;
  pdf.setFontSize(10);
  pdf.setFont(undefined, "bold");
  pdf.text("💡 The \"Pay & Delay\" Strategy:", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.text("Pay medical expenses out-of-pocket with rewards card → Keep receipts → Let HSA", 20, yPos + 8, { maxWidth: pageWidth - 40 });
  pdf.text("investments grow tax-free → Reimburse yourself years later when you need the cash.", 20, yPos + 16, { maxWidth: pageWidth - 40 });
  
  yPos += 45;
  pdf.setFontSize(11);
  const projectedGrowth = Math.round(annualSpending * 0.07 * 10);
  pdf.text(`Example: If you invest $${annualSpending.toLocaleString()} at 7% annual return, in 10 years you'll have`, 20, yPos, { maxWidth: pageWidth - 40 });
  yPos += 8;
  pdf.setFont(undefined, "bold");
  pdf.text(`$${(annualSpending * 2).toLocaleString()} - all tax-free for medical expenses!`, 20, yPos);
  
  // Page 12: Common Mistakes to Avoid
  pdf.addPage();
  addPageHeader(12);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Common Mistakes to Avoid", 20, 30);
  
  yPos = 50;
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  
  const mistakes = [
    {
      mistake: "Not maximizing HSA contributions",
      fix: "Many people only contribute enough to cover current expenses. Max it out! The tax benefits are too good to pass up.",
      cost: `Potential lost savings: $${Math.round(savings.taxSavings * 0.5).toLocaleString()}/year`
    },
    {
      mistake: "Using HSA card for everything",
      fix: "Use rewards credit cards instead, then reimburse from HSA. You get rewards + tax benefits.",
      cost: `Lost rewards: $${savings.rewardsSavings.toLocaleString()}/year`
    },
    {
      mistake: "Not keeping receipts",
      fix: "Without receipts, you can't prove expenses were qualified. Keep digital copies in cloud storage.",
      cost: "Risk: IRS penalties + back taxes"
    },
    {
      mistake: "Confusing FSA and HSA",
      fix: "FSAs are \"use it or lose it.\" HSAs roll over forever. Know which you have!",
      cost: "Average FSA forfeiture: $500/year"
    },
    {
      mistake: "Paying annual fees for low rewards",
      fix: "If your card annual fee > your rewards earned, switch cards immediately.",
      cost: "Wasted fees: $95-$550/year"
    },
    {
      mistake: "Not reviewing insurance annually",
      fix: "Healthcare costs change. What was optimal last year might not be this year.",
      cost: `Potential overspend: $${Math.round(annualSpending * 0.15).toLocaleString()}/year`
    }
  ];
  
  mistakes.forEach((item, index) => {
    if (yPos > pageHeight - 55) {
      pdf.addPage();
      addPageHeader(12);
      yPos = 30;
    }
    
    pdf.setFillColor(index % 2 === 0 ? 250 : 245, 245, 245);
    pdf.rect(15, yPos - 3, pageWidth - 30, 42, "F");
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(220, 38, 38);
    pdf.text(`❌ ${item.mistake}`, 20, yPos);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(9);
    pdf.text(`✓ Fix: ${item.fix}`, 25, yPos + 8, { maxWidth: pageWidth - 50 });
    pdf.setFont(undefined, "italic");
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${item.cost}`, 25, yPos + 24);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, "normal");
    
    yPos += 47;
  });
  
  // Page 13: Qualified Medical Expenses Reference
  pdf.addPage();
  addPageHeader(13);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Qualified Medical Expenses", 20, 30);
  
  yPos = 45;
  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");
  pdf.text("What you CAN pay for with HSA funds (tax-free):", 20, yPos);
  yPos += 15;
  
  const qualifiedExpenses = {
    "Doctor Visits & Services": [
      "Primary care visits",
      "Specialist consultations",
      "Mental health therapy",
      "Chiropractic care"
    ],
    "Prescriptions & OTC": [
      "Prescription medications",
      "Over-the-counter meds (with Rx)",
      "Insulin (no Rx needed)",
      "Medical supplies"
    ],
    "Dental & Vision": [
      "Cleanings & exams",
      "Fillings & crowns",
      "Orthodontia (braces)",
      "Eye exams, glasses, contacts",
      "LASIK surgery"
    ],
    "Unexpected Eligible Items": [
      "Acupuncture",
      "Guide dogs",
      "Smoking cessation programs",
      "Weight loss programs (if prescribed)",
      "Sunscreen (SPF 15+)",
      "First aid kits"
    ]
  };
  
  Object.entries(qualifiedExpenses).forEach(([category, items]) => {
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      addPageHeader(13);
      yPos = 30;
    }
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(11);
    pdf.text(category, 20, yPos);
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(9);
    yPos += 8;
    
    items.forEach(item => {
      pdf.text(`• ${item}`, 25, yPos);
      yPos += 6;
    });
    yPos += 8;
  });
  
  yPos += 5;
  pdf.setFillColor(255, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, 30, "F");
  yPos += 10;
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(10);
  pdf.text("⚠️ NOT Qualified (Will Trigger Penalties):", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(9);
  yPos += 8;
  const notQualified = ["Gym memberships", "Vitamins (unless prescribed)", "Cosmetic procedures", "Most insurance premiums"];
  notQualified.forEach(item => {
    pdf.text(`• ${item}`, 25, yPos);
    yPos += 6;
  });
  
  // Page 14: Tools & Resources
  pdf.addPage();
  addPageHeader(14);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Tools & Resources", 20, 30);
  
  yPos = 50;
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  
  const resources = [
    {
      title: "Wellth.ai Platform (Your 14-Day Trial)",
      features: [
        "Automatic expense tracking & categorization",
        "Receipt OCR (snap photos, we extract data)",
        "Smart rewards optimization alerts",
        "One-click HSA reimbursement requests",
        "Advanced analytics & tax reports"
      ]
    },
    {
      title: "Recommended Apps & Tools",
      features: [
        "Mint or YNAB for budget tracking",
        "Keeper Tax for mileage tracking",
        "Google Drive or Dropbox for receipt storage",
        "IRS Publication 502 (qualified expenses list)"
      ]
    },
    {
      title: "Helpful Websites",
      features: [
        "IRS.gov/forms/form-8889 (HSA tax form)",
        "Healthcare.gov (plan comparisons)",
        "HSAStore.com (eligible products)",
        "Your HSA provider's online portal"
      ]
    }
  ];
  
  resources.forEach(section => {
    if (yPos > pageHeight - 60) {
      pdf.addPage();
      addPageHeader(14);
      yPos = 30;
    }
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(13);
    pdf.text(section.title, 20, yPos);
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(10);
    yPos += 10;
    
    section.features.forEach(feature => {
      pdf.text(`✓ ${feature}`, 25, yPos, { maxWidth: pageWidth - 50 });
      yPos += 8;
    });
    yPos += 12;
  });
  
  // Page 15: Next Steps & Activation
  pdf.addPage();
  addPageHeader(15);
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 0, pageWidth, 70, "F");
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.setFont(undefined, "bold");
  pdf.text("Ready to Start Saving?", pageWidth / 2, 35, { align: "center" });
  pdf.setFontSize(16);
  pdf.setFont(undefined, "normal");
  pdf.text(`Your $${savings.total.toLocaleString()}/year is waiting`, pageWidth / 2, 55, { align: "center" });
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(16);
  yPos = 90;
  pdf.setFont(undefined, "bold");
  pdf.text("Your 14-Day Wellth.ai Plus Trial is Active!", 20, yPos);
  
  pdf.setFontSize(11);
  pdf.setFont(undefined, "normal");
  yPos += 15;
  pdf.text("As a thank you for purchasing this report, you have immediate access to:", 20, yPos, { maxWidth: pageWidth - 40 });
  
  yPos += 15;
  const benefits = [
    "✓ Automatic expense tracking and categorization",
    "✓ Receipt OCR (snap photos, we extract the data)",
    "✓ Smart rewards optimization alerts",
    "✓ One-click HSA reimbursement requests",
    "✓ Advanced analytics and tax reports",
    "✓ Monthly savings progress dashboard"
  ];
  
  benefits.forEach(benefit => {
    pdf.setFontSize(11);
    pdf.text(benefit, 25, yPos);
    yPos += 9;
  });
  
  yPos += 15;
  pdf.setFillColor(59, 130, 246);
  pdf.rect(15, yPos, pageWidth - 30, 35, "F");
  yPos += 12;
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont(undefined, "bold");
  pdf.text("🚀 Activate Your Account Now", pageWidth / 2, yPos, { align: "center" });
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(12);
  pdf.text("Visit wellth.ai/activate to claim your trial", pageWidth / 2, yPos + 12, { align: "center" });
  
  pdf.setTextColor(0, 0, 0);
  yPos += 45;
  pdf.setFontSize(12);
  pdf.setFont(undefined, "bold");
  pdf.text("Your Next 3 Actions:", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(10);
  yPos += 12;
  
  const nextActions = data.hasHSA === "no" 
    ? [
        "1. Open your HSA account this week (see page 5 for providers)",
        "2. Apply for recommended rewards credit card (see page 7)",
        "3. Activate Wellth.ai trial at wellth.ai/activate"
      ]
    : [
        "1. Apply for recommended rewards credit card (see page 7)",
        "2. Set up automatic max HSA contributions (see page 5)",
        "3. Activate Wellth.ai trial at wellth.ai/activate"
      ];
  
  nextActions.forEach(action => {
    pdf.text(action, 25, yPos, { maxWidth: pageWidth - 50 });
    yPos += 10;
  });
  
  yPos += 15;
  pdf.setFillColor(240, 250, 240);
  pdf.rect(15, yPos, pageWidth - 30, 40, "F");
  yPos += 12;
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(11);
  pdf.text("📧 Questions or Need Help?", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(9);
  pdf.text("Email: support@wellth.ai", 20, yPos + 10);
  pdf.text("We typically respond within 2 hours during business hours.", 20, yPos + 18);
  
  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text("This report is for educational purposes. Consult a tax professional for personalized advice.", pageWidth / 2, pageHeight - 15, { align: "center" });
  pdf.text(`© ${new Date().getFullYear()} Wellth.ai | All rights reserved`, pageWidth / 2, pageHeight - 8, { align: "center" });
  
  return pdf.output("blob");
};
