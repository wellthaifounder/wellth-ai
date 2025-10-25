import { isMedicalVendor } from './medicalVendors';

export interface Transaction {
  id: string;
  vendor: string | null;
  amount: number;
  transaction_date: string;
  description: string;
  is_medical?: boolean;
  reconciliation_status?: string;
  category?: string;
  is_hsa_eligible?: boolean;
  notes?: string | null;
  payment_method_id?: string | null;
  invoice_id?: string | null;
}

export interface Invoice {
  id: string;
  vendor: string;
  amount: number;
  date: string;
  invoice_date?: string;
}

export interface MatchSuggestion {
  type: 'link_to_invoice' | 'mark_medical' | 'not_medical' | 'skip';
  confidence: number;
  reason: string;
  invoice?: Invoice;
}

/**
 * Calculate similarity between two strings (0-1)
 */
function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Simple word matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const matches = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
  
  return matches.length / Math.max(words1.length, words2.length);
}

/**
 * Check if amounts are close enough to match
 */
function amountsMatch(amount1: number, amount2: number, tolerance = 0.02): boolean {
  const diff = Math.abs(amount1 - amount2);
  const avgAmount = (amount1 + amount2) / 2;
  return diff <= avgAmount * tolerance; // 2% tolerance
}

/**
 * Check if dates are within reasonable range
 */
function datesMatch(date1: string, date2: string, daysRange = 7): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffDays = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= daysRange;
}

/**
 * Find best matching invoice for a transaction
 */
export function findMatchingInvoice(
  transaction: Transaction,
  invoices: Invoice[]
): { invoice: Invoice; confidence: number } | null {
  if (!invoices || invoices.length === 0) return null;
  
  let bestMatch: { invoice: Invoice; confidence: number } | null = null;
  
  for (const invoice of invoices) {
    let confidence = 0;
    
    // Check vendor similarity
    const vendorSimilarity = stringSimilarity(
      transaction.vendor || transaction.description,
      invoice.vendor
    );
    confidence += vendorSimilarity * 0.4;
    
    // Check amount match
    if (amountsMatch(transaction.amount, invoice.amount)) {
      confidence += 0.4;
    }
    
    // Check date proximity
    const invoiceDate = invoice.invoice_date || invoice.date;
    if (datesMatch(transaction.transaction_date, invoiceDate, 7)) {
      confidence += 0.2;
    }
    
    // Update best match if this is better
    if (confidence > 0.5 && (!bestMatch || confidence > bestMatch.confidence)) {
      bestMatch = { invoice, confidence };
    }
  }
  
  return bestMatch;
}

/**
 * Generate smart suggestion for a transaction
 */
export function getSuggestion(
  transaction: Transaction,
  invoices: Invoice[],
  userPreferences: Array<{ vendor_pattern: string; is_medical: boolean }>
): MatchSuggestion {
  // Check user's learned preferences first
  const vendorText = (transaction.vendor || transaction.description).toUpperCase();
  const userPref = userPreferences.find(pref => 
    vendorText.includes(pref.vendor_pattern.toUpperCase())
  );
  
  if (userPref) {
    if (userPref.is_medical) {
      return {
        type: 'mark_medical',
        confidence: 0.95,
        reason: `You previously marked ${userPref.vendor_pattern} as medical`
      };
    } else {
      return {
        type: 'not_medical',
        confidence: 0.95,
        reason: `You previously marked ${userPref.vendor_pattern} as not medical`
      };
    }
  }
  
  // Try to find matching invoice
  const match = findMatchingInvoice(transaction, invoices);
  if (match && match.confidence > 0.6) {
    return {
      type: 'link_to_invoice',
      confidence: match.confidence,
      reason: `Matches invoice from ${match.invoice.vendor} for $${match.invoice.amount}`,
      invoice: match.invoice
    };
  }
  
  // Check if vendor is known medical provider
  if (isMedicalVendor(transaction.vendor || transaction.description)) {
    return {
      type: 'mark_medical',
      confidence: 0.8,
      reason: 'Vendor appears to be a healthcare provider'
    };
  }
  
  // Default: suggest skipping for manual review
  return {
    type: 'skip',
    confidence: 0,
    reason: 'Needs manual review'
  };
}
