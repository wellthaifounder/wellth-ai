import jsPDF from 'jspdf';

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
}

export const generateReimbursementPDF = async (data: ReimbursementPackage): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Cover Page
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('HSA Reimbursement Request', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Submitted: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
  
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
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Reimbursement Amount: $${data.totalAmount.toFixed(2)}`, 20, yPosition);

  if (data.notes) {
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Notes:', 20, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 40);
    doc.text(splitNotes, 20, yPosition);
    yPosition += (splitNotes.length * 5);
  }

  // Itemized List - New Page
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Itemized Expense List', 20, yPosition);
  
  yPosition += 15;
  doc.setFontSize(9);
  
  // Table headers
  doc.setFont('helvetica', 'bold');
  doc.text('Date', 20, yPosition);
  doc.text('Vendor', 50, yPosition);
  doc.text('Category', 100, yPosition);
  doc.text('Amount', 160, yPosition);
  
  yPosition += 7;
  doc.setFont('helvetica', 'normal');

  // Table rows
  data.expenses.forEach((expense) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
      // Repeat headers
      doc.setFont('helvetica', 'bold');
      doc.text('Date', 20, yPosition);
      doc.text('Vendor', 50, yPosition);
      doc.text('Category', 100, yPosition);
      doc.text('Amount', 160, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
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
  doc.setFont('helvetica', 'bold');
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 7;
  doc.setFontSize(11);
  doc.text(`Total: $${data.totalAmount.toFixed(2)}`, 160, yPosition);

  // Provider-specific instructions
  if (data.hsaProvider) {
    doc.addPage();
    yPosition = 20;
    doc.setFontSize(14);
    doc.text('Submission Instructions', 20, yPosition);
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const instructions = getProviderInstructions(data.hsaProvider);
    const splitInstructions = doc.splitTextToSize(instructions, pageWidth - 40);
    doc.text(splitInstructions, 20, yPosition);
  }

  return doc.output('blob');
};

const getProviderInstructions = (provider: string): string => {
  const instructions: Record<string, string> = {
    'HSA Bank': 'Submit this reimbursement package through your HSA Bank online portal at www.hsabank.com. Log in to your account, navigate to "Reimbursements" and upload this PDF along with any receipt images.',
    'HealthEquity': 'Log in to your HealthEquity account at www.healthequity.com. Click on "Reimburse Myself" and upload this PDF. Receipts may be required for verification.',
    'Fidelity HSA': 'Access your Fidelity HSA account at www.fidelity.com/hsa. Select "Reimbursements" and follow the prompts to submit this documentation.',
    'Optum Bank': 'Visit www.optumbank.com and log in to your account. Navigate to "Claims & Reimbursements" to submit this package.',
    'Lively': 'Log in at www.livelyme.com and select "Reimbursements" from your dashboard. Upload this PDF and any supporting receipts.',
    'Other': 'Please contact your HSA provider for specific submission instructions. This PDF contains all necessary documentation for your reimbursement request.',
  };

  return instructions[provider] || instructions['Other'];
};
