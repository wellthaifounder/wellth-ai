# Complex Sample Medical Bill for Testing

**Based on real-world billing error patterns from Marshall Allen's "Never Pay the First Bill"**

---

## Hospital Information
**Memorial Regional Medical Center**
123 Healthcare Boulevard
Springfield, State 12345
Tax ID: 12-3456789
Phone: (555) 123-4567

## Patient Information
John Doe
DOB: 01/15/1980
Account #: MR-2024-12345
Service Date: December 15, 2024

## Visit Summary
Emergency Department Visit - Chest Pain Evaluation

---

## ITEMIZED CHARGES

### Emergency Department Services
| Line | Date | CPT Code | Description | Qty | Unit Price | Total |
|------|------|----------|-------------|-----|------------|-------|
| 1 | 12/15/24 | 99285 | Emergency Dept Visit - Level 5 | 1 | $1,250.00 | $1,250.00 |
| 2 | 12/15/24 | 99285 | Emergency Dept Visit - Level 5 | 1 | $1,250.00 | $1,250.00 |
| 3 | 12/15/24 | G0380 | Emergency Room Facility Fee | 1 | $3,500.00 | $3,500.00 |

### Cardiac Testing
| Line | Date | CPT Code | Description | Qty | Unit Price | Total |
|------|------|----------|-------------|-----|------------|-------|
| 4 | 12/15/24 | 93000 | Electrocardiogram (EKG) complete | 1 | $450.00 | $450.00 |
| 5 | 12/15/24 | 93005 | EKG tracing only | 1 | $125.00 | $125.00 |
| 6 | 12/15/24 | 93010 | EKG interpretation & report | 1 | $125.00 | $125.00 |

### Laboratory Tests
| Line | Date | CPT Code | Description | Qty | Unit Price | Total |
|------|------|----------|-------------|-----|------------|-------|
| 7 | 12/15/24 | 80053 | Comprehensive Metabolic Panel | 1 | $285.00 | $285.00 |
| 8 | 12/15/24 | 85025 | Complete Blood Count (CBC) | 1 | $165.00 | $165.00 |
| 9 | 12/15/24 | 82947 | Troponin (Cardiac Enzyme) | 1 | $320.00 | $320.00 |
| 10 | 12/15/24 | 82947 | Troponin (Cardiac Enzyme) | 1 | $320.00 | $320.00 |
| 11 | 12/15/24 | 82947 | Troponin (Cardiac Enzyme) | 1 | $320.00 | $320.00 |

### Imaging Studies
| Line | Date | CPT Code | Description | Qty | Unit Price | Total |
|------|------|----------|-------------|-----|------------|-------|
| 12 | 12/15/24 | 71046 | Chest X-ray, 2 views | 1 | $850.00 | $850.00 |
| 13 | 12/15/24 | G0380 | Radiology Facility Fee | 1 | $1,200.00 | $1,200.00 |

### Medical Supplies
| Line | Date | CPT Code | Description | Qty | Unit Price | Total |
|------|------|----------|-------------|-----|------------|-------|
| 14 | 12/15/24 | A4648 | IV Start Kit | 1 | $145.00 | $145.00 |
| 15 | 12/15/24 | J7060 | Normal Saline 1000mL IV | 1 | $485.00 | $485.00 |
| 16 | 12/15/24 | 51701 | Aspirin 81mg | 1 | $18.50 | $18.50 |
| 17 | 12/15/24 | - | Bandage, adhesive 2x3 | 15 | $8.75 | $131.25 |
| 18 | 12/15/24 | - | Gauze pads sterile | 10 | $12.00 | $120.00 |

### Medications
| Line | Date | CPT Code | Description | Qty | Unit Price | Total |
|------|------|----------|-------------|-----|------------|-------|
| 19 | 12/15/24 | J1644 | Nitroglycerin 0.4mg tablet | 1 | $28.00 | $28.00 |
| 20 | 12/15/24 | 99070 | Prescription Supplies/Materials | 1 | $75.00 | $75.00 |

### Consultation Services
| Line | Date | CPT Code | Description | Qty | Unit Price | Total |
|------|------|----------|-------------|-----|------------|-------|
| 21 | 12/16/24 | 99254 | Cardiology Consult - Level 4 | 1 | $850.00 | $850.00 |
| 22 | 12/14/24 | 99213 | Follow-up Office Visit | 1 | $285.00 | $285.00 |

---

## BILLING SUMMARY

**Total Charges:** $13,297.75

**Insurance:** Blue Cross Blue Shield PPO
**Insurance Responsibility:** Processing
**Patient Responsibility:** $13,297.75 (until insurance processes)

---

## KNOWN BILLING ERRORS IN THIS SAMPLE:

### 1. **DUPLICATE CHARGE** (Lines 1-2)
- Emergency visit (CPT 99285) charged twice on same date
- Error: $1,250.00

### 2. **UNBUNDLING** (Lines 4-6)
- EKG broken into 3 separate codes when CPT 93000 includes all components
- Should be single charge of $450.00, not $700.00 total
- Error: $250.00

### 3. **DUPLICATE CHARGE** (Lines 9-11)
- Troponin test charged 3 times - typically only 1-2 draws for chest pain
- Third charge likely duplicate
- Error: $320.00

### 4. **FACILITY FEE QUESTIONABLE** (Line 13)
- Separate radiology facility fee when already charged ER facility fee (Line 3)
- Facility overhead should be included in ER facility fee
- Error: $1,200.00

### 5. **EXCESSIVE MARKUP** (Lines 15-18)
- Normal Saline bag: Charged $485 (Medicare rate: ~$5) = 9,700% markup
- Aspirin tablet: Charged $18.50 (Medicare rate: ~$0.10) = 18,400% markup
- Adhesive bandages: $8.75 each (typical: $0.25) = 3,400% markup
- Gauze pads: $12.00 each (typical: $0.50) = 2,300% markup
- Total excessive markup: ~$600

### 6. **TIMELINE INCONSISTENCY** (Line 22)
- Follow-up visit dated 12/14/24 - BEFORE initial ER visit on 12/15/24
- Impossible timeline
- Error: $285.00

### 7. **INAPPROPRIATE FOR DIAGNOSIS** (Line 21)
- Cardiology consult dated 12/16/24 but patient was discharged same day (12/15/24)
- No mention of admission or overnight stay
- Error: $850.00

### 8. **UPCODING** (Line 1)
- Level 5 ER visit (99285) is highest complexity, typically for life-threatening emergencies
- Chest pain evaluation with negative findings rarely justifies Level 5
- Should be Level 3 or 4 (99283-99284, ~$600-900)
- Error: ~$350-650

---

## MEDICARE ALLOWABLE RATES FOR COMPARISON:

- 99285 (ER Level 5): ~$350
- 93000 (EKG complete): ~$15
- 71046 (Chest X-ray): ~$35
- 82947 (Troponin): ~$12
- 80053 (Metabolic Panel): ~$12
- J7060 (Saline IV): ~$5
- Aspirin: ~$0.10
- Bandages: ~$0.25 each

**Total Medicare Allowable (approximate):** ~$500-700
**Charged Amount:** $13,297.75
**Markup over Medicare:** ~1,900-2,600%

---

## POTENTIAL TOTAL SAVINGS:
Duplicate charges: $1,570.00
Unbundling: $250.00
Questionable facility fee: $1,200.00
Timeline/inappropriate charges: $1,135.00
Excessive supply markups: $600.00
Upcoding adjustment: $500.00

**TOTAL POTENTIAL SAVINGS: $5,255.00**
**Adjusted Fair Price: ~$8,042.75**

**Note:** Even the "adjusted" price is still significantly above Medicare rates. A fair negotiated price would likely be 150-250% of Medicare (~$750-1,750 for this visit).
