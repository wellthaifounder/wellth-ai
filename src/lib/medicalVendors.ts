// Known medical vendors and healthcare providers
export const KNOWN_MEDICAL_VENDORS = [
  // Pharmacies
  'CVS', 'WALGREENS', 'RITE AID', 'WALMART PHARMACY', 'KROGER PHARMACY',
  'COSTCO PHARMACY', 'TARGET PHARMACY', 'PUBLIX PHARMACY', 'SAFEWAY PHARMACY',
  
  // Healthcare providers
  'KAISER', 'SUTTER', 'DIGNITY HEALTH', 'ADVENTIST HEALTH', 'SCRIPPS',
  'SHARP', 'HOAG', 'CEDARS-SINAI', 'UCLA HEALTH', 'STANFORD HEALTH',
  
  // Labs
  'QUEST DIAGNOSTICS', 'LABCORP', 'BIOMAT', 'GRIFOLS',
  
  // Vision
  'VISIONWORKS', 'LENSCRAFTERS', 'PEARLE VISION', 'EYEGLASS WORLD',
  
  // Dental
  'ASPEN DENTAL', 'GENTLE DENTAL', 'BRIGHT NOW DENTAL',
  
  // Medical supplies
  'MEDLINE', 'FSA STORE', 'HSA STORE', 'DIRECT MEDICAL',
  
  // Telehealth
  'TELADOC', 'DOCTOR ON DEMAND', 'AMWELL', 'MDLive',
  
  // Mental health
  'TALKSPACE', 'BETTERHELP', 'CEREBRAL', 'HEADSPACE CARE',
  
  // Common patterns
  'DR ', 'DDS', 'DMD', 'MEDICAL', 'HEALTH', 'CLINIC', 'HOSPITAL',
  'URGENT CARE', 'FAMILY PRACTICE', 'PEDIATRICS', 'DERMATOLOGY',
  'ORTHOPEDIC', 'CARDIOLOGY', 'PHYSICAL THERAPY', 'CHIROPRACTIC'
];

// Medical categories from Plaid
export const MEDICAL_CATEGORIES = [
  'Healthcare',
  'Pharmacy',
  'Medical',
  'Dentist',
  'Optometrist',
  'Veterinary',
  'Healthcare Services',
  'Pharmacies',
  'Medical Services'
];

/**
 * Check if a vendor name likely represents a medical provider
 */
export function isMedicalVendor(vendorName: string): boolean {
  if (!vendorName) return false;
  
  const upperVendor = vendorName.toUpperCase();
  
  return KNOWN_MEDICAL_VENDORS.some(pattern => 
    upperVendor.includes(pattern)
  );
}

/**
 * Check if a category suggests medical expense
 */
export function isMedicalCategory(categories: string[]): boolean {
  if (!categories || categories.length === 0) return false;
  
  return categories.some(cat => 
    MEDICAL_CATEGORIES.some(medCat => 
      cat.toLowerCase().includes(medCat.toLowerCase())
    )
  );
}
