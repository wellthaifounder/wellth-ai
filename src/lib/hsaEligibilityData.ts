// HSA Eligibility Reference Data - Based on IRS Publication 502

export type EligibilityStatus = 'eligible' | 'not-eligible' | 'conditional';

export interface HSAEligibilityItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  status: EligibilityStatus;
  description: string;
  conditions?: string;
  irsReference: string;
  requiresLMN?: boolean; // Letter of Medical Necessity
  commonQuestions?: string[];
  relatedItems?: string[];
  keywords?: string[];
}

export const CATEGORIES = {
  MEDICAL_SERVICES: 'Medical Services',
  PRESCRIPTION_DRUGS: 'Prescription Drugs & Medicine',
  DENTAL_CARE: 'Dental Care',
  VISION_CARE: 'Vision Care',
  MEDICAL_EQUIPMENT: 'Medical Equipment & Supplies',
  MENTAL_HEALTH: 'Mental Health Services',
  ALTERNATIVE_MEDICINE: 'Alternative Medicine',
  INSURANCE: 'Insurance Premiums',
  SPECIAL_ITEMS: 'Special Items & Equipment',
  PREVENTIVE_CARE: 'Preventive Care',
  NOT_ELIGIBLE: 'Generally Not Eligible',
};

export const hsaEligibilityItems: HSAEligibilityItem[] = [
  // Medical Services
  {
    id: 'doctor-visits',
    name: 'Doctor Visits',
    category: CATEGORIES.MEDICAL_SERVICES,
    status: 'eligible',
    description: 'Office visits to primary care physicians, specialists, and medical consultations.',
    irsReference: 'Pub 502 - Medical Care',
    keywords: ['physician', 'doctor', 'office visit', 'consultation'],
  },
  {
    id: 'surgery',
    name: 'Surgery',
    category: CATEGORIES.MEDICAL_SERVICES,
    status: 'eligible',
    description: 'Surgical procedures performed by licensed medical professionals for medical necessity.',
    irsReference: 'Pub 502 - Surgery',
    keywords: ['operation', 'surgical procedure'],
  },
  {
    id: 'hospital-care',
    name: 'Hospital Care',
    category: CATEGORIES.MEDICAL_SERVICES,
    status: 'eligible',
    description: 'Inpatient and outpatient hospital services, emergency room visits.',
    irsReference: 'Pub 502 - Hospital Services',
    keywords: ['emergency room', 'ER', 'hospitalization', 'inpatient'],
  },
  {
    id: 'lab-tests',
    name: 'Laboratory Tests',
    category: CATEGORIES.MEDICAL_SERVICES,
    status: 'eligible',
    description: 'Diagnostic lab work ordered by a healthcare provider.',
    irsReference: 'Pub 502 - Laboratory Fees',
    keywords: ['blood work', 'diagnostic testing', 'lab work'],
  },
  {
    id: 'x-rays',
    name: 'X-rays and Imaging',
    category: CATEGORIES.MEDICAL_SERVICES,
    status: 'eligible',
    description: 'X-rays, MRIs, CT scans, ultrasounds, and other diagnostic imaging.',
    irsReference: 'Pub 502 - X-ray',
    keywords: ['MRI', 'CT scan', 'ultrasound', 'imaging', 'radiology'],
  },
  {
    id: 'physical-therapy',
    name: 'Physical Therapy',
    category: CATEGORIES.MEDICAL_SERVICES,
    status: 'eligible',
    description: 'Physical therapy prescribed by a physician for medical treatment.',
    irsReference: 'Pub 502 - Medical Services',
    keywords: ['PT', 'rehabilitation', 'rehab'],
  },
  {
    id: 'occupational-therapy',
    name: 'Occupational Therapy',
    category: CATEGORIES.MEDICAL_SERVICES,
    status: 'eligible',
    description: 'Occupational therapy prescribed for medical treatment or rehabilitation.',
    irsReference: 'Pub 502 - Medical Services',
    keywords: ['OT', 'rehabilitation'],
  },
  {
    id: 'cosmetic-surgery',
    name: 'Cosmetic Surgery',
    category: CATEGORIES.NOT_ELIGIBLE,
    status: 'conditional',
    description: 'Generally not eligible unless medically necessary (e.g., reconstructive surgery after accident or disease).',
    conditions: 'Only eligible if medically necessary to correct deformity from congenital abnormality, accident, or disease.',
    irsReference: 'Pub 502 - Cosmetic Surgery',
    keywords: ['plastic surgery', 'elective surgery', 'aesthetic'],
  },

  // Prescription Drugs & Medicine
  {
    id: 'prescription-drugs',
    name: 'Prescription Medications',
    category: CATEGORIES.PRESCRIPTION_DRUGS,
    status: 'eligible',
    description: 'Medications prescribed by a licensed healthcare provider.',
    irsReference: 'Pub 502 - Medicines',
    keywords: ['prescriptions', 'medications', 'pharmacy', 'drugs'],
  },
  {
    id: 'insulin',
    name: 'Insulin',
    category: CATEGORIES.PRESCRIPTION_DRUGS,
    status: 'eligible',
    description: 'Insulin and diabetic supplies, even without a prescription.',
    irsReference: 'Pub 502 - Insulin',
    keywords: ['diabetes', 'diabetic'],
  },
  {
    id: 'otc-medications',
    name: 'Over-the-Counter Medications',
    category: CATEGORIES.PRESCRIPTION_DRUGS,
    status: 'conditional',
    description: 'OTC medications are eligible only with a prescription from your doctor.',
    conditions: 'Requires a prescription from a licensed healthcare provider.',
    irsReference: 'Pub 502 - Medicines',
    requiresLMN: true,
    keywords: ['OTC', 'non-prescription', 'pain reliever', 'allergy medicine'],
  },
  {
    id: 'vitamins',
    name: 'Vitamins and Supplements',
    category: CATEGORIES.PRESCRIPTION_DRUGS,
    status: 'conditional',
    description: 'Generally not eligible unless prescribed by a doctor for a specific medical condition.',
    conditions: 'Eligible only with prescription for treating a diagnosed medical condition.',
    irsReference: 'Pub 502 - Medicines',
    requiresLMN: true,
    keywords: ['multivitamin', 'supplements', 'vitamin D', 'probiotics'],
  },

  // Dental Care
  {
    id: 'dental-checkups',
    name: 'Dental Checkups and Cleanings',
    category: CATEGORIES.DENTAL_CARE,
    status: 'eligible',
    description: 'Routine dental examinations and cleanings.',
    irsReference: 'Pub 502 - Dental Treatment',
    keywords: ['dentist', 'teeth cleaning', 'dental exam'],
  },
  {
    id: 'dental-fillings',
    name: 'Fillings and Restorations',
    category: CATEGORIES.DENTAL_CARE,
    status: 'eligible',
    description: 'Dental fillings, crowns, bridges, and other restorative work.',
    irsReference: 'Pub 502 - Dental Treatment',
    keywords: ['cavity', 'crown', 'bridge', 'root canal'],
  },
  {
    id: 'orthodontia',
    name: 'Orthodontia (Braces)',
    category: CATEGORIES.DENTAL_CARE,
    status: 'eligible',
    description: 'Orthodontic treatment including braces and retainers.',
    irsReference: 'Pub 502 - Dental Treatment',
    keywords: ['braces', 'retainer', 'orthodontist', 'invisalign'],
  },
  {
    id: 'teeth-whitening',
    name: 'Teeth Whitening',
    category: CATEGORIES.NOT_ELIGIBLE,
    status: 'not-eligible',
    description: 'Cosmetic teeth whitening is not eligible.',
    irsReference: 'Pub 502 - Cosmetic',
    keywords: ['whitening', 'bleaching'],
  },

  // Vision Care
  {
    id: 'eye-exams',
    name: 'Eye Examinations',
    category: CATEGORIES.VISION_CARE,
    status: 'eligible',
    description: 'Routine eye exams by optometrists or ophthalmologists.',
    irsReference: 'Pub 502 - Eye Examination',
    keywords: ['vision test', 'optometrist', 'ophthalmologist'],
  },
  {
    id: 'prescription-glasses',
    name: 'Prescription Eyeglasses',
    category: CATEGORIES.VISION_CARE,
    status: 'eligible',
    description: 'Prescription glasses and frames.',
    irsReference: 'Pub 502 - Eyeglasses',
    keywords: ['glasses', 'spectacles', 'frames', 'lenses'],
  },
  {
    id: 'contact-lenses',
    name: 'Contact Lenses',
    category: CATEGORIES.VISION_CARE,
    status: 'eligible',
    description: 'Prescription contact lenses and solutions.',
    irsReference: 'Pub 502 - Contact Lenses',
    keywords: ['contacts', 'lens solution'],
  },
  {
    id: 'lasik-surgery',
    name: 'LASIK Eye Surgery',
    category: CATEGORIES.VISION_CARE,
    status: 'eligible',
    description: 'Laser eye surgery to correct vision.',
    irsReference: 'Pub 502 - Surgery',
    keywords: ['laser eye surgery', 'vision correction'],
  },
  {
    id: 'sunglasses',
    name: 'Sunglasses',
    category: CATEGORIES.NOT_ELIGIBLE,
    status: 'conditional',
    description: 'Generally not eligible unless prescribed for a medical condition.',
    conditions: 'Eligible only if prescribed by a doctor for a specific medical condition.',
    irsReference: 'Pub 502 - Eyeglasses',
    requiresLMN: true,
    keywords: ['sun glasses', 'UV protection'],
  },

  // Medical Equipment & Supplies
  {
    id: 'crutches',
    name: 'Crutches and Walkers',
    category: CATEGORIES.MEDICAL_EQUIPMENT,
    status: 'eligible',
    description: 'Crutches, walkers, canes, and other mobility aids.',
    irsReference: 'Pub 502 - Crutches',
    keywords: ['walker', 'cane', 'mobility aid'],
  },
  {
    id: 'wheelchair',
    name: 'Wheelchairs',
    category: CATEGORIES.MEDICAL_EQUIPMENT,
    status: 'eligible',
    description: 'Manual and electric wheelchairs for medical necessity.',
    irsReference: 'Pub 502 - Wheelchair',
    keywords: ['mobility', 'electric wheelchair'],
  },
  {
    id: 'blood-pressure-monitor',
    name: 'Blood Pressure Monitor',
    category: CATEGORIES.MEDICAL_EQUIPMENT,
    status: 'eligible',
    description: 'Home blood pressure monitoring devices.',
    irsReference: 'Pub 502 - Medical Equipment',
    keywords: ['BP monitor', 'blood pressure cuff'],
  },
  {
    id: 'diabetic-supplies',
    name: 'Diabetic Testing Supplies',
    category: CATEGORIES.MEDICAL_EQUIPMENT,
    status: 'eligible',
    description: 'Blood glucose monitors, test strips, lancets, and diabetic supplies.',
    irsReference: 'Pub 502 - Medical Supplies',
    keywords: ['glucose monitor', 'test strips', 'diabetes supplies'],
  },
  {
    id: 'compression-stockings',
    name: 'Compression Stockings',
    category: CATEGORIES.MEDICAL_EQUIPMENT,
    status: 'conditional',
    description: 'Eligible when medically necessary and prescribed by a doctor.',
    conditions: 'Requires prescription for medical condition (e.g., varicose veins, lymphedema).',
    irsReference: 'Pub 502 - Medical Equipment',
    requiresLMN: true,
    keywords: ['compression socks', 'support stockings'],
  },
  {
    id: 'first-aid-kit',
    name: 'First Aid Kit',
    category: CATEGORIES.MEDICAL_EQUIPMENT,
    status: 'eligible',
    description: 'Basic first aid supplies including bandages, antiseptics, and medical tape.',
    irsReference: 'Pub 502 - Medical Supplies',
    keywords: ['bandages', 'band-aids', 'gauze', 'first aid'],
  },
  {
    id: 'thermometer',
    name: 'Thermometer',
    category: CATEGORIES.MEDICAL_EQUIPMENT,
    status: 'eligible',
    description: 'Digital and infrared thermometers for medical use.',
    irsReference: 'Pub 502 - Medical Equipment',
    keywords: ['temperature', 'fever'],
  },

  // Mental Health Services
  {
    id: 'therapy-counseling',
    name: 'Therapy and Counseling',
    category: CATEGORIES.MENTAL_HEALTH,
    status: 'eligible',
    description: 'Mental health counseling and therapy sessions with licensed professionals.',
    irsReference: 'Pub 502 - Psychotherapy',
    keywords: ['psychotherapy', 'counseling', 'therapist', 'psychologist'],
  },
  {
    id: 'psychiatric-care',
    name: 'Psychiatric Care',
    category: CATEGORIES.MENTAL_HEALTH,
    status: 'eligible',
    description: 'Psychiatric evaluations and treatment.',
    irsReference: 'Pub 502 - Psychiatrist',
    keywords: ['psychiatrist', 'mental health'],
  },
  {
    id: 'substance-abuse-treatment',
    name: 'Substance Abuse Treatment',
    category: CATEGORIES.MENTAL_HEALTH,
    status: 'eligible',
    description: 'Inpatient and outpatient treatment for drug or alcohol addiction.',
    irsReference: 'Pub 502 - Drug Addiction',
    keywords: ['addiction treatment', 'rehab', 'recovery'],
  },

  // Alternative Medicine
  {
    id: 'acupuncture',
    name: 'Acupuncture',
    category: CATEGORIES.ALTERNATIVE_MEDICINE,
    status: 'eligible',
    description: 'Acupuncture treatments by licensed practitioners.',
    irsReference: 'Pub 502 - Acupuncture',
    keywords: ['alternative medicine', 'acupuncturist'],
  },
  {
    id: 'chiropractic',
    name: 'Chiropractic Care',
    category: CATEGORIES.ALTERNATIVE_MEDICINE,
    status: 'eligible',
    description: 'Chiropractic treatments for medical purposes.',
    irsReference: 'Pub 502 - Chiropractor',
    keywords: ['chiropractor', 'spinal adjustment'],
  },
  {
    id: 'massage-therapy',
    name: 'Massage Therapy',
    category: CATEGORIES.ALTERNATIVE_MEDICINE,
    status: 'conditional',
    description: 'Therapeutic massage is eligible when prescribed by a doctor for a specific medical condition.',
    conditions: 'Requires prescription from a licensed healthcare provider for medical treatment.',
    irsReference: 'Pub 502 - Medical Services',
    requiresLMN: true,
    keywords: ['therapeutic massage', 'medical massage'],
  },

  // Special Items & Equipment
  {
    id: 'hearing-aids',
    name: 'Hearing Aids',
    category: CATEGORIES.SPECIAL_ITEMS,
    status: 'eligible',
    description: 'Hearing aids and batteries.',
    irsReference: 'Pub 502 - Hearing Aids',
    keywords: ['hearing device', 'hearing aid batteries'],
  },
  {
    id: 'service-animal',
    name: 'Service Animals',
    category: CATEGORIES.SPECIAL_ITEMS,
    status: 'eligible',
    description: 'Cost of buying, training, and maintaining a service animal for medical purposes.',
    irsReference: 'Pub 502 - Guide Dog',
    keywords: ['guide dog', 'service dog', 'assistance animal'],
  },
  {
    id: 'home-modifications',
    name: 'Home Modifications',
    category: CATEGORIES.SPECIAL_ITEMS,
    status: 'conditional',
    description: 'Home improvements for medical care (e.g., wheelchair ramps, widening doorways).',
    conditions: 'Only the amount that exceeds the increase in home value is eligible.',
    irsReference: 'Pub 502 - Capital Expenses',
    keywords: ['wheelchair ramp', 'accessibility', 'handicap'],
  },

  // Insurance Premiums
  {
    id: 'health-insurance',
    name: 'Health Insurance Premiums',
    category: CATEGORIES.INSURANCE,
    status: 'conditional',
    description: 'Generally not eligible with HSA funds, except in specific circumstances.',
    conditions: 'Eligible only for COBRA, unemployment, Medicare, or long-term care insurance.',
    irsReference: 'Pub 502 - Insurance Premiums',
    keywords: ['premiums', 'COBRA', 'Medicare'],
  },
  {
    id: 'long-term-care-insurance',
    name: 'Long-Term Care Insurance',
    category: CATEGORIES.INSURANCE,
    status: 'eligible',
    description: 'Qualified long-term care insurance premiums up to age-based limits.',
    irsReference: 'Pub 502 - Long-Term Care',
    keywords: ['LTC insurance', 'nursing home insurance'],
  },

  // Preventive Care
  {
    id: 'annual-physical',
    name: 'Annual Physical Exam',
    category: CATEGORIES.PREVENTIVE_CARE,
    status: 'eligible',
    description: 'Annual wellness checkups and preventive care.',
    irsReference: 'Pub 502 - Physical Examination',
    keywords: ['wellness exam', 'checkup', 'preventive'],
  },
  {
    id: 'immunizations',
    name: 'Vaccinations and Immunizations',
    category: CATEGORIES.PREVENTIVE_CARE,
    status: 'eligible',
    description: 'Vaccines and immunizations recommended by healthcare providers.',
    irsReference: 'Pub 502 - Medical Care',
    keywords: ['vaccines', 'shots', 'flu shot'],
  },
  {
    id: 'mammogram',
    name: 'Mammograms and Cancer Screenings',
    category: CATEGORIES.PREVENTIVE_CARE,
    status: 'eligible',
    description: 'Preventive cancer screenings including mammograms, colonoscopies, and other tests.',
    irsReference: 'Pub 502 - Medical Care',
    keywords: ['cancer screening', 'colonoscopy', 'preventive screening'],
  },

  // Common Ineligible Items
  {
    id: 'gym-membership',
    name: 'Gym Membership',
    category: CATEGORIES.NOT_ELIGIBLE,
    status: 'conditional',
    description: 'Generally not eligible unless prescribed by a doctor for a specific medical condition.',
    conditions: 'Eligible only with prescription for treating a diagnosed disease (e.g., obesity, heart disease).',
    irsReference: 'Pub 502 - General Health',
    requiresLMN: true,
    keywords: ['fitness', 'health club', 'exercise'],
  },
  {
    id: 'weight-loss-program',
    name: 'Weight Loss Programs',
    category: CATEGORIES.NOT_ELIGIBLE,
    status: 'conditional',
    description: 'Weight loss programs are eligible only if prescribed by a doctor for a specific disease.',
    conditions: 'Eligible when prescribed for treatment of obesity or other specific disease.',
    irsReference: 'Pub 502 - Weight-Loss Program',
    requiresLMN: true,
    keywords: ['diet program', 'weight watchers', 'obesity treatment'],
  },
  {
    id: 'nutritionist',
    name: 'Nutritionist/Dietitian',
    category: CATEGORIES.MEDICAL_SERVICES,
    status: 'conditional',
    description: 'Eligible when prescribed for treatment of a specific disease.',
    conditions: 'Requires prescription for treating diagnosed medical condition (e.g., diabetes, heart disease).',
    irsReference: 'Pub 502 - Medical Services',
    requiresLMN: true,
    keywords: ['dietitian', 'nutrition counseling'],
  },
  {
    id: 'maternity-clothes',
    name: 'Maternity Clothes',
    category: CATEGORIES.NOT_ELIGIBLE,
    status: 'not-eligible',
    description: 'Maternity clothing is not eligible.',
    irsReference: 'Pub 502',
    keywords: ['pregnancy clothes'],
  },
  {
    id: 'prenatal-vitamins',
    name: 'Prenatal Vitamins',
    category: CATEGORIES.PRESCRIPTION_DRUGS,
    status: 'conditional',
    description: 'Eligible with a prescription from your doctor.',
    conditions: 'Requires prescription.',
    irsReference: 'Pub 502 - Medicines',
    requiresLMN: true,
    keywords: ['pregnancy vitamins', 'folic acid'],
  },
  {
    id: 'fertility-treatment',
    name: 'Fertility Treatments',
    category: CATEGORIES.MEDICAL_SERVICES,
    status: 'eligible',
    description: 'In vitro fertilization (IVF) and other fertility treatments.',
    irsReference: 'Pub 502 - Medical Care',
    keywords: ['IVF', 'infertility', 'reproductive'],
  },
  {
    id: 'birth-control',
    name: 'Birth Control',
    category: CATEGORIES.PRESCRIPTION_DRUGS,
    status: 'eligible',
    description: 'Prescription birth control pills, patches, IUDs, and other contraceptives.',
    irsReference: 'Pub 502 - Birth Control Pills',
    keywords: ['contraceptives', 'IUD', 'birth control pills'],
  },
  {
    id: 'smoking-cessation',
    name: 'Smoking Cessation Programs',
    category: CATEGORIES.MEDICAL_SERVICES,
    status: 'eligible',
    description: 'Programs and medications to help quit smoking.',
    irsReference: 'Pub 502 - Stop-Smoking Programs',
    keywords: ['quit smoking', 'nicotine patches', 'tobacco cessation'],
  },
  {
    id: 'medical-marijuana',
    name: 'Medical Marijuana',
    category: CATEGORIES.NOT_ELIGIBLE,
    status: 'not-eligible',
    description: 'Not eligible because marijuana is a controlled substance under federal law.',
    irsReference: 'Pub 502',
    keywords: ['cannabis', 'CBD', 'THC'],
  },
  {
    id: 'cbd-products',
    name: 'CBD Products',
    category: CATEGORIES.NOT_ELIGIBLE,
    status: 'not-eligible',
    description: 'CBD and hemp products are generally not eligible.',
    irsReference: 'Pub 502',
    keywords: ['cannabidiol', 'hemp oil'],
  },
];

/**
 * Search eligibility items by keyword, name, or category
 */
export function searchEligibilityItems(query: string): HSAEligibilityItem[] {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) {
    return hsaEligibilityItems;
  }
  
  return hsaEligibilityItems.filter(item => {
    const matchesName = item.name.toLowerCase().includes(searchTerm);
    const matchesCategory = item.category.toLowerCase().includes(searchTerm);
    const matchesDescription = item.description.toLowerCase().includes(searchTerm);
    const matchesKeywords = item.keywords?.some(keyword => 
      keyword.toLowerCase().includes(searchTerm)
    );
    
    return matchesName || matchesCategory || matchesDescription || matchesKeywords;
  });
}

/**
 * Filter items by category
 */
export function filterByCategory(category: string): HSAEligibilityItem[] {
  return hsaEligibilityItems.filter(item => item.category === category);
}

/**
 * Filter items by eligibility status
 */
export function filterByStatus(status: EligibilityStatus): HSAEligibilityItem[] {
  return hsaEligibilityItems.filter(item => item.status === status);
}

/**
 * Get item by ID
 */
export function getItemById(id: string): HSAEligibilityItem | undefined {
  return hsaEligibilityItems.find(item => item.id === id);
}

/**
 * Get category counts
 */
export function getCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  
  hsaEligibilityItems.forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });
  
  return counts;
}
