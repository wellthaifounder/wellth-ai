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
  
  // Brand colors from design system (HSL converted to RGB for jsPDF)
  const brand = {
    primary: { r: 0, g: 169, b: 169 }, // Teal - hsl(178 100% 33%)
    secondary: { r: 30, g: 44, b: 73 }, // Navy - hsl(228 36% 16%)
    accent: { r: 238, g: 194, b: 66 }, // Gold - hsl(43 88% 61%)
    success: { r: 76, g: 175, b: 80 }, // Green - hsl(122 39% 49%)
    lightGray: { r: 230, g: 235, b: 242 },
    white: { r: 255, g: 255, b: 255 },
  };
  
  // Helper function to add branded page header
  const addPageHeader = (pageNum: number) => {
    // Brand accent line at top
    pdf.setDrawColor(brand.primary.r, brand.primary.g, brand.primary.b);
    pdf.setLineWidth(1);
    pdf.line(10, 8, pageWidth - 10, 8);
    
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`HSA Maximizer Blueprint | Page ${pageNum} of 15`, pageWidth / 2, 12, { align: "center" });
    pdf.setTextColor(0, 0, 0);
  };
  
  // Calculate HSA investment growth projection (7% annual return over 10 years)
  const projectedContribution = Math.min(annualSpending, data.householdSize === 1 ? 4150 : 8300);
  const years = 10;
  const growthRate = 0.07;
  let futureValue = 0;
  for (let i = 0; i < years; i++) {
    futureValue = (futureValue + projectedContribution) * (1 + growthRate);
  }
  const investmentGrowth = Math.round(futureValue - (projectedContribution * years));
  
  // Page 1: Cover Page
  pdf.setFillColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.rect(0, 0, pageWidth, 80, "F");
  
  pdf.setTextColor(brand.white.r, brand.white.g, brand.white.b);
  pdf.setFontSize(26);
  pdf.setFont(undefined, "normal");
  pdf.text("Hey there! 👋", pageWidth / 2, 30, { align: "center" });
  pdf.setFontSize(16);
  pdf.text("I'm Wellbie, your personal HSA guide", pageWidth / 2, 42, { align: "center" });
  
  pdf.setFontSize(32);
  pdf.setFont(undefined, "bold");
  pdf.text("Your HSA Maximizer", pageWidth / 2, 60, { align: "center" });
  pdf.setFontSize(36);
  pdf.text("Blueprint", pageWidth / 2, 73, { align: "center" });
  
  // Savings highlight box with gold accent
  pdf.setFillColor(brand.white.r, brand.white.g, brand.white.b);
  pdf.roundedRect(35, 95, pageWidth - 70, 48, 5, 5, "F");
  
  // Gold accent bar
  pdf.setFillColor(brand.accent.r, brand.accent.g, brand.accent.b);
  pdf.rect(35, 95, pageWidth - 70, 8, "F");
  
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(12);
  pdf.text("Here's the exciting part:", pageWidth / 2, 113, { align: "center" });
  pdf.setFontSize(34);
  pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.text(`$${savings.total.toLocaleString()}`, pageWidth / 2, 128, { align: "center" });
  pdf.setFontSize(11);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.text("in potential annual savings!", pageWidth / 2, 137, { align: "center" });
  
  pdf.setTextColor(brand.white.r, brand.white.g, brand.white.b);
  pdf.setFillColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.rect(0, 155, pageWidth, 35, "F");
  pdf.setFontSize(11);
  pdf.text(`For ${data.householdSize > 1 ? 'your household of ' + data.householdSize : 'you'}`, pageWidth / 2, 167, { align: "center" });
  pdf.text(`Based on $${data.monthlySpending.toLocaleString()}/month healthcare spending`, pageWidth / 2, 177, { align: "center" });
  
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(9);
  pdf.text(`Created just for you on ${today}`, pageWidth / 2, pageHeight - 15, { align: "center" });
  if (userEmail) {
    pdf.text(userEmail, pageWidth / 2, pageHeight - 8, { align: "center" });
  }
  
  // Page 2: Executive Summary
  pdf.addPage();
  addPageHeader(2);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Let's Talk Numbers", pageWidth / 2, 30, { align: "center" });
  
  pdf.setFontSize(11);
  let yPos = 48;
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFont(undefined, "normal");
  pdf.text("After analyzing your healthcare spending, I found some really exciting opportunities", 20, yPos);
  yPos += 7;
  pdf.text("to put more money back in your pocket. Here's what caught my eye:", 20, yPos);
  
  yPos += 18;
  const boxWidth = pageWidth - 40;
  const boxHeight = 22;
  
  // Tax Savings with investment growth projection
  pdf.setFillColor(brand.lightGray.r, brand.lightGray.g, brand.lightGray.b);
  pdf.roundedRect(20, yPos, boxWidth, boxHeight + 10, 3, 3, "F");
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(12);
  pdf.setFont(undefined, "bold");
  pdf.text("💰 Tax Savings", 25, yPos + 8);
  pdf.setFontSize(14);
  pdf.setTextColor(brand.success.r, brand.success.g, brand.success.b);
  pdf.text(`$${savings.taxSavings.toLocaleString()}/year`, pageWidth - 25, yPos + 8, { align: "right" });
  pdf.setFontSize(8);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFont(undefined, "normal");
  pdf.text("HSA contributions = tax-free money!", 25, yPos + 16);
  pdf.setFontSize(7);
  pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.setFont(undefined, "bold");
  pdf.text(`💡 Invest this & it could grow to $${Math.round(futureValue).toLocaleString()} in ${years} years (+$${investmentGrowth.toLocaleString()} growth)!`, 25, yPos + 24);
  
  yPos += 38;
  
  // Rewards Savings
  pdf.setFillColor(brand.lightGray.r, brand.lightGray.g, brand.lightGray.b);
  pdf.roundedRect(20, yPos, boxWidth, boxHeight, 3, 3, "F");
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(12);
  pdf.setFont(undefined, "bold");
  pdf.text("💳 Smart Payment Strategy", 25, yPos + 8);
  pdf.setFontSize(14);
  pdf.setTextColor(brand.success.r, brand.success.g, brand.success.b);
  pdf.text(`$${savings.rewardsSavings.toLocaleString()}/year`, pageWidth - 25, yPos + 8, { align: "right" });
  pdf.setFontSize(8);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFont(undefined, "normal");
  pdf.text("Earn cash back on every healthcare dollar", 25, yPos + 16);
  
  yPos += 28;
  
  // Timing Savings
  pdf.setFillColor(brand.lightGray.r, brand.lightGray.g, brand.lightGray.b);
  pdf.roundedRect(20, yPos, boxWidth, boxHeight, 3, 3, "F");
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(12);
  pdf.setFont(undefined, "bold");
  pdf.text("⏰ Perfect Timing", 25, yPos + 8);
  pdf.setFontSize(14);
  pdf.setTextColor(brand.success.r, brand.success.g, brand.success.b);
  pdf.text(`$${savings.timingSavings.toLocaleString()}/year`, pageWidth - 25, yPos + 8, { align: "right" });
  pdf.setFontSize(8);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFont(undefined, "normal");
  pdf.text("Strategic scheduling of procedures", 25, yPos + 16);
  
  yPos += 28;
  
  // Total with brand accent
  pdf.setFillColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.roundedRect(20, yPos, boxWidth, boxHeight + 5, 3, 3, "F");
  pdf.setTextColor(brand.white.r, brand.white.g, brand.white.b);
  pdf.setFontSize(14);
  pdf.setFont(undefined, "bold");
  pdf.text("🎯 Your Total Annual Savings", 25, yPos + 10);
  pdf.setFontSize(20);
  pdf.text(`$${savings.total.toLocaleString()}`, pageWidth - 25, yPos + 10, { align: "right" });
  
  yPos += 38;
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(11);
  pdf.setFont(undefined, "normal");
  pdf.text("In this blueprint, I'll walk you through:", 20, yPos);
  pdf.setFontSize(10);
  yPos += 10;
  pdf.text("• The triple tax advantage of HSAs (it's like a financial superpower!)", 25, yPos);
  yPos += 7;
  pdf.text("• My favorite credit cards for healthcare rewards", 25, yPos);
  yPos += 7;
  pdf.text("• When to schedule that procedure for max savings", 25, yPos);
  yPos += 7;
  pdf.text("• Your personalized 12-month action plan", 25, yPos);
  
  // Page 3: Personal Savings Breakdown
  pdf.addPage();
  addPageHeader(3);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(22);
  pdf.setFont(undefined, "bold");
  pdf.text("How I Crunched Your Numbers", pageWidth / 2, 28, { align: "center" });
  
  pdf.setFontSize(10);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFont(undefined, "normal");
  pdf.text("Let me show you exactly where these savings come from. No magic, just smart strategy!", 20, 43);
  
  yPos = 56;
  
  // Tax Savings Detail
  pdf.setFillColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.rect(20, yPos - 5, 3, 8, "F");
  pdf.setFontSize(14);
  pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.setFont(undefined, "bold");
  pdf.text("💰 Tax Savings Magic", 28, yPos);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");
  yPos += 10;
  
  pdf.text(`You spend about $${annualSpending.toLocaleString()} on healthcare each year`, 25, yPos);
  yPos += 7;
  
  let taxRate = 0.22;
  if (data.hasHSA === "yes") {
    taxRate = 0.15;
    pdf.text("✓ You already have an HSA - smart move!", 25, yPos);
    yPos += 7;
    pdf.text(`You're likely saving around ${(taxRate * 100).toFixed(0)}% in taxes right now`, 25, yPos);
  } else if (data.hasHSA === "no") {
    taxRate = 0.22;
    pdf.text("You don't have an HSA yet - that's your biggest opportunity!", 25, yPos);
    yPos += 7;
    pdf.text(`Opening one could save you ${(taxRate * 100).toFixed(0)}% on every healthcare dollar`, 25, yPos);
  } else {
    taxRate = 0.18;
    pdf.text("Not sure about your HSA status? No worries!", 25, yPos);
    yPos += 7;
    pdf.text(`I used a conservative ${(taxRate * 100).toFixed(0)}% estimate for your potential savings`, 25, yPos);
  }
  yPos += 7;
  
  const householdMultiplier = 1 + (data.householdSize - 1) * 0.1;
  if (data.householdSize > 1) {
    pdf.text(`Plus, with ${data.householdSize} people in your household, that's ${householdMultiplier.toFixed(2)}x the opportunity`, 25, yPos);
    yPos += 7;
  }
  
  pdf.setFontSize(11);
  pdf.setTextColor(brand.success.r, brand.success.g, brand.success.b);
  pdf.setFont(undefined, "bold");
  pdf.text(`💚 Tax Savings: $${savings.taxSavings.toLocaleString()}/year`, 25, yPos);
  
  yPos += 15;
  
  // Rewards Savings Detail
  pdf.setFillColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.rect(20, yPos - 5, 3, 8, "F");
  pdf.setFontSize(14);
  pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.setFont(undefined, "bold");
  pdf.text("💳 Rewards Goldmine", 28, yPos);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");
  yPos += 10;
  
  const paymentMethodText = {
    "credit": data.hasRewards === "yes" ? "credit card with rewards" : "credit card (but no rewards yet)",
    "debit": "debit card (missing out on rewards!)",
    "cash": "cash (you're leaving money on the table!)",
    "hsa": "HSA card directly"
  }[data.paymentMethod] || "payment method";
  
  pdf.text(`Right now you're using a ${paymentMethodText}`, 25, yPos);
  yPos += 7;
  
  // Fixed calculation: Use actual percentage correctly
  let rewardsRate = 0;
  if (data.paymentMethod === "credit") {
    if (data.hasRewards === "yes") {
      rewardsRate = 0.02; // 2% current rewards
      pdf.text("You're earning about 2% back - nice!", 25, yPos);
      yPos += 7;
      pdf.text("But we can boost that to 3% or more with the right card", 25, yPos);
    } else {
      rewardsRate = 0.03; // 3% potential
      pdf.text("By switching to a rewards card, you could earn 3% back", 25, yPos);
    }
  } else {
    rewardsRate = 0.025; // 2.5% opportunity
    pdf.text("By using a rewards credit card, you could earn 2.5-3% back", 25, yPos);
  }
  yPos += 7;
  
  // Show the actual calculation
  const calculatedRewards = Math.round(annualSpending * rewardsRate);
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Math: $${annualSpending.toLocaleString()} × ${(rewardsRate * 100).toFixed(1)}% = $${calculatedRewards.toLocaleString()}`, 25, yPos);
  yPos += 7;
  
  pdf.setFontSize(11);
  pdf.setTextColor(brand.success.r, brand.success.g, brand.success.b);
  pdf.setFont(undefined, "bold");
  pdf.text(`💚 Rewards Potential: $${savings.rewardsSavings.toLocaleString()}/year`, 25, yPos);
  
  yPos += 15;
  
  // Timing Savings Detail
  pdf.setFillColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.rect(20, yPos - 5, 3, 8, "F");
  pdf.setFontSize(14);
  pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.setFont(undefined, "bold");
  pdf.text("⏰ Strategic Timing", 28, yPos);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");
  yPos += 10;
  
  const expenseType = {
    "major": "major procedure coming up - perfect timing to optimize!",
    "minor": "some minor expenses planned",
    "ongoing": "ongoing regular expenses",
    "regular": "regular healthcare needs",
    "none": "routine healthcare needs"
  }[data.upcomingExpenses || "none"] || "some healthcare expenses";
  
  pdf.text(`You mentioned ${expenseType}`, 25, yPos);
  yPos += 7;
  pdf.text("By timing these strategically, you can maximize deductible hits,", 25, yPos);
  yPos += 7;
  pdf.text("align with FSA deadlines, and optimize your annual contributions", 25, yPos);
  yPos += 7;
  
  pdf.setFontSize(11);
  pdf.setTextColor(brand.success.r, brand.success.g, brand.success.b);
  pdf.setFont(undefined, "bold");
  pdf.text(`💚 Timing Savings: $${savings.timingSavings.toLocaleString()}/year`, 25, yPos);
  
  // Page 4: Understanding Your Tax Savings
  pdf.addPage();
  addPageHeader(4);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("The HSA Triple Tax Advantage", pageWidth / 2, 28, { align: "center" });
  
  yPos = 48;
  pdf.setFontSize(11);
  pdf.setFont(undefined, "normal");
  pdf.text("Here's why HSAs are my favorite financial tool (and should be yours too!):", 20, yPos);
  yPos += 18;
  
  const taxAdvantages = [
    { emoji: "💵", title: "Tax-Deductible Contributions", desc: "Every dollar you put in reduces your taxable income. It's like getting a discount on your taxes!" },
    { emoji: "📈", title: "Tax-Free Growth", desc: "Invest your HSA funds and watch them grow without paying a penny in capital gains or dividend taxes" },
    { emoji: "🎁", title: "Tax-Free Withdrawals", desc: "Use the money for medical expenses and pay zero taxes. It's the only triple-tax-advantaged account!" }
  ];
  
  taxAdvantages.forEach((adv, index) => {
    pdf.setFillColor(brand.lightGray.r, brand.lightGray.g, brand.lightGray.b);
    pdf.roundedRect(15, yPos, pageWidth - 30, 32, 3, 3, "F");
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
    pdf.text(`${adv.emoji} ${index + 1}. ${adv.title}`, 20, yPos + 10);
    
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
    pdf.text(adv.desc, 20, yPos + 20, { maxWidth: pageWidth - 40 });
    
    yPos += 38;
  });
  
  yPos += 8;
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.text("Your Personalized Tax Savings:", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(10);
  yPos += 12;
  
  const hsaMaxContribution = data.householdSize === 1 ? 4150 : 8300;
  const taxBracket = data.householdSize === 1 ? "22%" : "24%";
  const potentialContribution = Math.min(annualSpending, hsaMaxContribution);
  
  pdf.text(`• Your healthcare spending: $${annualSpending.toLocaleString()}/year`, 25, yPos);
  yPos += 7;
  pdf.text(`• 2024 HSA max: $${hsaMaxContribution.toLocaleString()} (${data.householdSize === 1 ? "individual" : "family"})`, 25, yPos);
  yPos += 7;
  pdf.text(`• Recommended contribution: $${potentialContribution.toLocaleString()}`, 25, yPos);
  yPos += 7;
  pdf.text(`• Tax bracket estimate: ${taxBracket}`, 25, yPos);
  yPos += 7;
  pdf.text(`• FICA savings (7.65%): $${Math.round(potentialContribution * 0.0765).toLocaleString()}`, 25, yPos);
  yPos += 12;
  
  pdf.setFontSize(12);
  pdf.setTextColor(brand.success.r, brand.success.g, brand.success.b);
  pdf.setFont(undefined, "bold");
  pdf.text(`Total Tax Benefit: $${(savings.taxSavings + Math.round(potentialContribution * 0.0765)).toLocaleString()}/year`, 25, yPos);
  
  // Page 5: Favorite Credit Cards for Healthcare Rewards
  pdf.addPage();
  addPageHeader(5);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("My Favorite Credit Cards for Healthcare Rewards", pageWidth / 2, 28, { align: "center" });
  
  yPos = 48;
  pdf.setFontSize(11);
  pdf.setFont(undefined, "normal");
  pdf.text("Choosing the right credit card can boost your rewards and maximize your healthcare savings.", 20, yPos);
  yPos += 14;
  
  const cards = [
    { name: "Wellbie Health Rewards Card", rewards: "3% back on all healthcare expenses", notes: "Exclusive for Wellbie members" },
    { name: "CarePlus Platinum", rewards: "2.5% back on healthcare and pharmacy purchases", notes: "No annual fee" },
    { name: "HealthSaver Visa", rewards: "3% back on medical bills and prescriptions", notes: "Bonus points for wellness visits" }
  ];
  
  cards.forEach(card => {
    pdf.setFillColor(brand.lightGray.r, brand.lightGray.g, brand.lightGray.b);
    pdf.roundedRect(15, yPos, pageWidth - 30, 28, 3, 3, "F");
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
    pdf.text(card.name, 20, yPos + 10);
    
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
    pdf.text(card.rewards, 20, yPos + 18);
    pdf.setFontSize(8);
    pdf.text(card.notes, 20, yPos + 24);
    
    yPos += 36;
  });
  
  // Page 6: Timing Your Healthcare Expenses
  pdf.addPage();
  addPageHeader(6);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Timing Your Healthcare Expenses", pageWidth / 2, 28, { align: "center" });
  
  yPos = 48;
  pdf.setFontSize(11);
  pdf.setFont(undefined, "normal");
  pdf.text("When you schedule procedures and expenses can impact your savings. Here's how to optimize:", 20, yPos);
  yPos += 14;
  
  const timingTips = [
    "Schedule major procedures early in the year to maximize deductible use.",
    "Use FSA funds before they expire by planning minor expenses accordingly.",
    "Spread out ongoing expenses to avoid hitting contribution limits too soon.",
    "Coordinate with your healthcare provider to align billing dates with your plan year."
  ];
  
  timingTips.forEach(tip => {
    pdf.setFillColor(brand.lightGray.r, brand.lightGray.g, brand.lightGray.b);
    pdf.roundedRect(15, yPos, pageWidth - 30, 20, 3, 3, "F");
    
    pdf.setFontSize(10);
    pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
    pdf.text(`• ${tip}`, 20, yPos + 14);
    
    yPos += 28;
  });
  
  // Page 7: Your 12-Month Action Plan
  pdf.addPage();
  addPageHeader(7);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Your Personalized 12-Month Action Plan", pageWidth / 2, 28, { align: "center" });
  
  yPos = 48;
  pdf.setFontSize(11);
  pdf.setFont(undefined, "normal");
  pdf.text("Let's break down the steps to maximize your HSA benefits and savings over the next year:", 20, yPos);
  yPos += 14;
  
  const actionSteps = [
    "Open or fully fund your HSA account this month.",
    "Switch to a rewards credit card for healthcare spending.",
    "Schedule any major procedures in the first half of the year.",
    "Review your healthcare expenses quarterly to adjust contributions.",
    "Invest your HSA funds to grow your savings tax-free.",
    "Use your HSA for eligible expenses to avoid taxes.",
    "Plan minor expenses to use FSA funds before they expire.",
    "Reassess your strategy at year-end to maximize next year's benefits."
  ];
  
  actionSteps.forEach((step, index) => {
    pdf.setFontSize(10);
    pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
    pdf.text(`${index + 1}. ${step}`, 25, yPos);
    yPos += 10;
  });
  
  // Page 8: Additional Resources
  pdf.addPage();
  addPageHeader(8);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Additional Resources", pageWidth / 2, 28, { align: "center" });
  
  yPos = 48;
  pdf.setFontSize(11);
  pdf.setFont(undefined, "normal");
  pdf.text("Here are some helpful links and tools to keep you on track:", 20, yPos);
  yPos += 14;
  
  const resources = [
    { title: "IRS HSA Guidelines", url: "https://www.irs.gov/publications/p969" },
    { title: "Wellbie Blog: Maximizing Your HSA", url: "https://wellbie.com/blog/hsa-maximizer" },
    { title: "Healthcare Credit Card Reviews", url: "https://wellbie.com/credit-cards" },
    { title: "Investment Options for HSAs", url: "https://wellbie.com/hsa-investments" }
  ];
  
  resources.forEach(resource => {
    pdf.setFontSize(10);
    pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
    pdf.text(resource.title, 25, yPos);
    pdf.setTextColor(0, 0, 255);
    pdf.textWithLink(resource.url, 25, yPos + 6, { url: resource.url });
    yPos += 18;
  });
  
  // Page 9: FAQs
  pdf.addPage();
  addPageHeader(9);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Frequently Asked Questions", pageWidth / 2, 28, { align: "center" });
  
  yPos = 48;
  pdf.setFontSize(11);
  pdf.setFont(undefined, "normal");
  
  const faqs = [
    { q: "Can I use my HSA for non-medical expenses?", a: "Yes, but non-medical withdrawals before age 65 are subject to taxes and penalties." },
    { q: "What happens if I don't use all my HSA funds?", a: "Funds roll over year to year with no expiration." },
    { q: "Can I invest my HSA funds?", a: "Yes, many HSAs offer investment options similar to retirement accounts." },
    { q: "Are there limits to how much I can contribute?", a: "Yes, IRS sets annual contribution limits based on your coverage type." }
  ];
  
  faqs.forEach(faq => {
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
    pdf.text(`Q: ${faq.q}`, 20, yPos);
    yPos += 7;
    pdf.setFont(undefined, "normal");
    pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
    pdf.text(`A: ${faq.a}`, 25, yPos);
    yPos += 14;
  });
  
  // Page 10: Contact & Support
  pdf.addPage();
  addPageHeader(10);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(24);
  pdf.setFont(undefined, "bold");
  pdf.text("Contact & Support", pageWidth / 2, 28, { align: "center" });
  
  yPos = 48;
  pdf.setFontSize(11);
  pdf.setFont(undefined, "normal");
  pdf.text("Need help or have questions? Reach out anytime!", 20, yPos);
  yPos += 14;
  
  pdf.setFont(undefined, "bold");
  pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.text("Email:", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.text("support@wellbie.com", 60, yPos);
  yPos += 10;
  
  pdf.setFont(undefined, "bold");
  pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.text("Phone:", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.text("(555) 123-4567", 60, yPos);
  yPos += 10;
  
  pdf.setFont(undefined, "bold");
  pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.text("Website:", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.text("https://wellbie.com", 60, yPos);
  yPos += 10;
  
  // Page 11-15: Additional content placeholders (could be expanded as needed)
  for (let page = 11; page <= 15; page++) {
    pdf.addPage();
    addPageHeader(page);
    pdf.setFontSize(18);
    pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
    pdf.text(`More insights coming soon... (Page ${page})`, pageWidth / 2, pageHeight / 2, { align: "center" });
  }
  
  return pdf.output('blob');
};
