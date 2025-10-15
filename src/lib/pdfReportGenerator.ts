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
    pdf.text(`HSA Maximizer Blueprint | Page ${pageNum} of 10`, pageWidth / 2, 12, { align: "center" });
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
  
  // Page 5: Rewards Strategy That Actually Works
  pdf.addPage();
  addPageHeader(5);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(22);
  pdf.setFont(undefined, "bold");
  pdf.text("Let's Talk Credit Cards (The Fun Part!)", pageWidth / 2, 28, { align: "center" });
  
  yPos = 48;
  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");
  pdf.text("Look, most people are leaving free money on the table. Here's how to pick it up:", 20, yPos);
  yPos += 18;
  
  // Best Cards Section
  pdf.setFillColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.rect(20, yPos - 5, 3, 8, "F");
  pdf.setFontSize(14);
  pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.setFont(undefined, "bold");
  pdf.text("💳 Cards I Actually Recommend", 28, yPos);
  yPos += 14;
  
  const cards = [
    { 
      name: "Wells Fargo Active Cash", 
      rate: "2% on EVERYTHING",
      why: "No categories to track. Set it and forget it. Perfect for healthcare since you can't predict when you'll need care."
    },
    { 
      name: "Chase Freedom Unlimited", 
      rate: "1.5% base + bonus on pharmacy",
      why: "Pharmacy purchases often count as 'drugstore' category for 5%. Plus solid sign-up bonus."
    },
    { 
      name: "Citi Double Cash", 
      rate: "2% (1% when you buy, 1% when you pay)",
      why: "Simple and reliable. Great if you pay your card off monthly (which you should!)."
    }
  ];
  
  cards.forEach((card, index) => {
    pdf.setFillColor(brand.lightGray.r, brand.lightGray.g, brand.lightGray.b);
    pdf.roundedRect(15, yPos, pageWidth - 30, 34, 3, 3, "F");
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
    pdf.text(`${index + 1}. ${card.name}`, 20, yPos + 9);
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(brand.success.r, brand.success.g, brand.success.b);
    pdf.text(card.rate, 20, yPos + 17);
    
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
    const wrappedText = pdf.splitTextToSize(card.why, pageWidth - 42);
    pdf.text(wrappedText, 20, yPos + 24);
    
    yPos += 40;
  });
  
  yPos += 5;
  pdf.setFontSize(10);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFont(undefined, "bold");
  pdf.text("Pro Tip:", 20, yPos);
  pdf.setFont(undefined, "normal");
  pdf.text("Always pay the full balance monthly. Interest charges will wipe out any rewards!", 48, yPos);
  yPos += 10;
  
  pdf.setFontSize(11);
  pdf.setTextColor(brand.success.r, brand.success.g, brand.success.b);
  pdf.setFont(undefined, "bold");
  pdf.text(`With your $${annualSpending.toLocaleString()} in spending, that's $${savings.rewardsSavings.toLocaleString()} back in your pocket!`, 20, yPos);
  
  // Page 6: Timing Is Everything
  pdf.addPage();
  addPageHeader(6);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(22);
  pdf.setFont(undefined, "bold");
  pdf.text("The Calendar Hack Nobody Tells You", pageWidth / 2, 28, { align: "center" });
  
  yPos = 48;
  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");
  pdf.text("When you spend matters almost as much as how much you spend. Let me break it down:", 20, yPos);
  yPos += 18;
  
  const timingStrategies = [
    {
      icon: "🗓️",
      title: "Bundle Big Expenses Early",
      tip: "Got a surgery or major procedure? Do it in Q1. Once you hit your deductible, everything else is discounted.",
      savings: "Can save 20-40% on follow-up care"
    },
    {
      icon: "⏰",
      title: "December FSA Sweep",
      tip: "FSA money expires! Schedule dental cleanings, get new glasses, stock up on eligible items before year-end.",
      savings: "Don't lose your contributions"
    },
    {
      icon: "📅",
      title: "Space Out Regular Expenses",
      tip: "If you have ongoing prescriptions or therapy, align refills and appointments strategically throughout the year.",
      savings: "Maximize contribution efficiency"
    },
    {
      icon: "🎯",
      title: "Coordinate Billing Dates",
      tip: "Ask providers to delay billing until after Jan 1 if you've already maxed deductible—or vice versa!",
      savings: "Can shift thousands in savings"
    }
  ];
  
  timingStrategies.forEach(strategy => {
    pdf.setFillColor(brand.lightGray.r, brand.lightGray.g, brand.lightGray.b);
    pdf.roundedRect(15, yPos, pageWidth - 30, 32, 3, 3, "F");
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
    pdf.text(`${strategy.icon} ${strategy.title}`, 20, yPos + 9);
    
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
    const wrappedTip = pdf.splitTextToSize(strategy.tip, pageWidth - 42);
    pdf.text(wrappedTip, 20, yPos + 17);
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(brand.success.r, brand.success.g, brand.success.b);
    pdf.text(`💰 ${strategy.savings}`, 20, yPos + 28);
    
    yPos += 38;
  });
  
  yPos += 5;
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(11);
  pdf.setFont(undefined, "bold");
  pdf.text(`Your timing savings: $${savings.timingSavings.toLocaleString()}/year`, 20, yPos);
  
  // Page 7: Your Action Plan (Start Today!)
  pdf.addPage();
  addPageHeader(7);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(22);
  pdf.setFont(undefined, "bold");
  pdf.text("Your 30-Day Implementation Roadmap", pageWidth / 2, 28, { align: "center" });
  
  yPos = 46;
  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");
  pdf.text("Forget complicated 12-month plans. Here's what to do in the next 30 days to capture 80% of the value:", 20, yPos);
  yPos += 18;
  
  const weeklyActions = [
    {
      week: "Week 1: Foundation",
      actions: [
        "Open HSA if you don't have one (takes 15 min online)",
        "Apply for rewards credit card (10 min)",
        "Download HSA expense tracking app"
      ]
    },
    {
      week: "Week 2: Optimize",
      actions: [
        "Set up automatic HSA contributions from paycheck",
        "Update payment method to new rewards card",
        "Review current year's medical receipts for reimbursement"
      ]
    },
    {
      week: "Week 3: Strategize",
      actions: [
        "Schedule any planned procedures for optimal timing",
        "Call insurance to understand your deductible status",
        "Set calendar reminder for FSA deadline (if applicable)"
      ]
    },
    {
      week: "Week 4: Invest & Automate",
      actions: [
        "Move HSA funds to investment option (keep 3mo expenses liquid)",
        "Set quarterly review reminder",
        "Pat yourself on the back—you're now in the top 5% of savvy healthcare consumers!"
      ]
    }
  ];
  
  weeklyActions.forEach((week, weekIndex) => {
    pdf.setFillColor(brand.primary.r, brand.primary.g, brand.primary.b);
    pdf.rect(20, yPos - 5, 3, 6, "F");
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
    pdf.text(week.week, 28, yPos);
    yPos += 10;
    
    week.actions.forEach((action, actionIndex) => {
      pdf.setFont(undefined, "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
      pdf.text(`   ${actionIndex + 1}. ${action}`, 28, yPos);
      yPos += 7;
    });
    
    yPos += 8;
  });
  
  // Page 8: Common Mistakes (Don't Be That Person!)
  pdf.addPage();
  addPageHeader(8);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(22);
  pdf.setFont(undefined, "bold");
  pdf.text("Mistakes That Cost People Thousands", pageWidth / 2, 28, { align: "center" });
  
  yPos = 46;
  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");
  pdf.text("I've seen these mistakes cost people $5k-$15k per year. Don't let this be you:", 20, yPos);
  yPos += 18;
  
  const mistakes = [
    {
      icon: "❌",
      mistake: "Paying Healthcare Costs BEFORE Tax Benefits",
      cost: "$1,200-4,000/year",
      fix: "Always use HSA dollars for medical expenses. Pay yourself back later if needed."
    },
    {
      icon: "❌",
      mistake: "Letting HSA Money Sit in Cash",
      cost: "$800-2,000/year in lost growth",
      fix: "Once you hit $2-3k balance, invest the rest. It grows tax-free forever!"
    },
    {
      icon: "❌",
      mistake: "Using Debit Cards for Healthcare",
      cost: "$50-150/year in lost rewards",
      fix: "Route through rewards credit card, then reimburse yourself from HSA."
    },
    {
      icon: "❌",
      mistake: "Not Saving Receipts",
      cost: "Can't reimburse yourself years later",
      fix: "Take a photo and save digitally. You can reimburse anytime—even decades later!"
    },
    {
      icon: "❌",
      mistake: "Contributing Only What You Spend",
      cost: "Missing out on investment growth",
      fix: "Max it out if possible. It's a stealth retirement account with better tax benefits than a 401k!"
    }
  ];
  
  mistakes.forEach((item) => {
    pdf.setFillColor(254, 242, 242); // Light red background
    pdf.roundedRect(15, yPos, pageWidth - 30, 28, 3, 3, "F");
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(220, 38, 38); // Red text
    pdf.text(`${item.icon} ${item.mistake}`, 20, yPos + 8);
    
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(153, 27, 27); // Dark red
    pdf.text(`Cost: ${item.cost}`, 20, yPos + 15);
    
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(brand.success.r, brand.success.g, brand.success.b);
    pdf.text("✓ Fix:", 20, yPos + 21);
    pdf.setFont(undefined, "normal");
    const wrappedFix = pdf.splitTextToSize(item.fix, pageWidth - 50);
    pdf.text(wrappedFix, 36, yPos + 21);
    
    yPos += 34;
  });
  
  // Page 9: Quick Answers to Your Burning Questions
  pdf.addPage();
  addPageHeader(9);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(22);
  pdf.setFont(undefined, "bold");
  pdf.text("Questions Everyone Asks Me", pageWidth / 2, 28, { align: "center" });
  
  yPos = 46;
  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");
  
  const faqs = [
    { 
      q: "What if I need the money for non-medical stuff?", 
      a: "After 65, you can withdraw for anything penalty-free (just pay income tax). Before 65? 20% penalty + taxes. So keep it for healthcare or retirement!"
    },
    { 
      q: "Do my HSA funds expire like FSA?", 
      a: "Nope! They're yours forever. Roll over year after year. This is your secret healthcare retirement fund."
    },
    { 
      q: "Should I invest my HSA or keep it as cash?", 
      a: "Both! Keep $2-3k in cash for immediate expenses. Invest the rest. Historical returns: 7-10% annually, tax-free."
    },
    { 
      q: "Can I use HSA for my spouse/kids?", 
      a: "Absolutely! Any qualified dependent's medical expenses count, even if they're not on your health plan."
    },
    {
      q: "What's actually covered?",
      a: "Way more than you think! Doctor visits, prescriptions, dental, vision, therapy, even sunscreen and band-aids. Check IRS Pub 502."
    },
    {
      q: "Can I change my contribution mid-year?",
      a: "Yes! Adjust anytime through your employer. Just can't exceed annual max ($4,150 individual / $8,300 family for 2024)."
    }
  ];
  
  faqs.forEach(faq => {
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
    pdf.text(`Q: ${faq.q}`, 20, yPos);
    yPos += 7;
    
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
    const wrappedAnswer = pdf.splitTextToSize(`A: ${faq.a}`, pageWidth - 45);
    pdf.text(wrappedAnswer, 25, yPos);
    yPos += (wrappedAnswer.length * 5) + 8;
  });
  
  // Page 10: Your Next Steps (The Close)
  pdf.addPage();
  addPageHeader(10);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.setFontSize(22);
  pdf.setFont(undefined, "bold");
  pdf.text("What Happens Next?", pageWidth / 2, 28, { align: "center" });
  
  yPos = 50;
  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.text("Look, I've given you the blueprint. Here's the truth:", 20, yPos);
  yPos += 15;
  
  // The Reality Check
  pdf.setFillColor(brand.lightGray.r, brand.lightGray.g, brand.lightGray.b);
  pdf.roundedRect(15, yPos, pageWidth - 30, 55, 3, 3, "F");
  
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.text("Most people will do nothing with this report.", 20, yPos + 10);
  
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.text("They'll read it, think 'that's interesting,' and go back to overpaying for healthcare.", 20, yPos + 19);
  yPos += 26;
  
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.text("The top 5% will take action in the next 72 hours.", 20, yPos + 10);
  
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.text("Which group are you in?", 20, yPos + 19);
  
  yPos += 45;
  
  // The Offer
  pdf.setFontSize(12);
  pdf.setFont(undefined, "bold");
  pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.text("Here's How Wellbie Can Help:", 20, yPos);
  yPos += 15;
  
  const services = [
    "✓ HSA setup and optimization (we do the paperwork)",
    "✓ Automated expense tracking and reimbursement",
    "✓ Strategic timing alerts for your specific situation",
    "✓ Tax-optimized investment management for your HSA",
    "✓ Year-round support from real humans who get it"
  ];
  
  services.forEach(service => {
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
    pdf.text(service, 25, yPos);
    yPos += 9;
  });
  
  yPos += 12;
  
  // The Big Number Reminder
  pdf.setFillColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, "F");
  
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Remember:", pageWidth / 2, yPos + 12, { align: "center" });
  pdf.setFontSize(18);
  pdf.text(`You're leaving $${savings.total.toLocaleString()} on the table this year`, pageWidth / 2, yPos + 24, { align: "center" });
  
  yPos += 50;
  
  // Contact CTA
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.text("Ready to stop overpaying? Let's talk:", 20, yPos);
  yPos += 12;
  
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.text("📧 hello@wellbie.com", 20, yPos);
  yPos += 8;
  pdf.text("🌐 wellbie.com/get-started", 20, yPos);
  yPos += 8;
  pdf.text("📱 Text 'WELLBIE' to 555-HEALTH", 20, yPos);
  
  yPos += 20;
  
  // Final signature
  pdf.setFont(undefined, "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(brand.secondary.r, brand.secondary.g, brand.secondary.b);
  pdf.text("To your health (and wealth),", 20, yPos);
  yPos += 7;
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(brand.primary.r, brand.primary.g, brand.primary.b);
  pdf.text("Wellbie 🌱", 20, yPos);
  
  return pdf.output('blob');
};
