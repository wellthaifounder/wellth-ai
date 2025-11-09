export interface DisputeTemplate {
  errorType: string;
  subject: string;
  letterTemplate: string;
  emailTemplate: string;
  phoneScript: string;
}

export const DISPUTE_TEMPLATES: Record<string, DisputeTemplate> = {
  duplicate_charge: {
    errorType: 'duplicate_charge',
    subject: 'Billing Error: Duplicate Charges on Account',
    letterTemplate: `[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Provider Name]
[Provider Address]
[City, State ZIP]

Re: Account Number: [ACCOUNT_NUMBER]
    Patient: [PATIENT_NAME]
    Service Date: [SERVICE_DATE]

Dear Billing Department,

I am writing to dispute duplicate charges on my recent medical bill dated [BILL_DATE].

Upon careful review of my itemized statement, I have identified the following duplicate charges:

[DUPLICATE_DETAILS]

These charges appear to be billing errors, as the same service was billed multiple times on the same date. I am requesting an immediate adjustment to remove the duplicate charges totaling $[DISPUTED_AMOUNT].

Please provide:
1. A corrected itemized statement
2. Written confirmation of the adjustment
3. A refund check for $[DISPUTED_AMOUNT] if already paid

I request a response within 30 days. If this matter is not resolved, I will file a complaint with my insurance company and the state insurance commissioner.

Thank you for your prompt attention to this matter.

Sincerely,
[Your Signature]
[Your Printed Name]
[Phone Number]
[Email Address]`,
    emailTemplate: `Subject: Billing Error - Duplicate Charges on Account [ACCOUNT_NUMBER]

Dear Billing Department,

I am contacting you regarding duplicate charges on my recent medical bill (Account: [ACCOUNT_NUMBER], Service Date: [SERVICE_DATE]).

I have identified the following duplicate charges on my itemized statement:

[DUPLICATE_DETAILS]

I am requesting an adjustment to remove these duplicate charges totaling $[DISPUTED_AMOUNT]. Please send me a corrected statement and confirmation of this adjustment.

Please respond within 30 days. I can be reached at [PHONE] or [EMAIL].

Thank you,
[Your Name]`,
    phoneScript: `Hi, my name is [Your Name] and I'm calling about a billing error on my account.

Account Number: [ACCOUNT_NUMBER]
Service Date: [SERVICE_DATE]

I've noticed duplicate charges on my bill. Specifically, [DESCRIBE DUPLICATE].

Can you help me remove these duplicate charges and send me a corrected statement?

[Take notes on who you spoke with, what they said, and next steps]

Follow-up: Ask for a reference number and timeframe for resolution.`
  },

  upcoding: {
    errorType: 'upcoding',
    subject: 'Billing Dispute: Incorrect Service Level Code',
    letterTemplate: `[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Provider Name]
[Provider Address]
[City, State ZIP]

Re: Account Number: [ACCOUNT_NUMBER]
    Patient: [PATIENT_NAME]
    Service Date: [SERVICE_DATE]

Dear Billing Department,

I am disputing charges on my medical bill that appear to reflect an incorrect service level (upcoding).

Issue: The bill includes CPT code [CPT_CODE] for [SERVICE_DESCRIPTION], however the actual service I received was [ACTUAL_SERVICE]. The code used represents a higher level of service than what was provided.

The appropriate code should be [CORRECT_CODE], which has a lower associated charge. The difference is approximately $[DISPUTED_AMOUNT].

I request:
1. Review of the medical record to verify the actual service provided
2. Correction of the billing code to accurately reflect services rendered
3. Adjustment of charges accordingly
4. Written confirmation of the correction

Please respond within 30 days. I am prepared to file a complaint with my insurance company and state medical board if this is not resolved.

Sincerely,
[Your Signature]
[Your Printed Name]
[Phone Number]
[Email Address]`,
    emailTemplate: `Subject: Billing Dispute - Incorrect Service Level Code

Dear Billing Department,

I am disputing an incorrect service level code on my bill (Account: [ACCOUNT_NUMBER], Date: [SERVICE_DATE]).

The bill shows CPT code [CPT_CODE], but the service I received was [ACTUAL_SERVICE], which should be coded as [CORRECT_CODE]. This appears to be upcoding, resulting in an overcharge of approximately $[DISPUTED_AMOUNT].

Please review my medical record, correct the billing code, and adjust my charges. I request written confirmation of this correction within 30 days.

Thank you,
[Your Name]
[PHONE] | [EMAIL]`,
    phoneScript: `Hi, I'm calling about an incorrect billing code on my account.

Account: [ACCOUNT_NUMBER]
Date: [SERVICE_DATE]

My bill shows code [CPT_CODE] for [SERVICE_DESCRIPTION], but I only received [ACTUAL_SERVICE]. This appears to be coded at a higher level than what I received.

Can you review my medical record and correct this? The correct code should be [CORRECT_CODE].

[Take notes and get a reference number]`
  },

  unbundling: {
    errorType: 'unbundling',
    subject: 'Billing Error: Unbundled Services',
    letterTemplate: `[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Provider Name]
[Provider Address]
[City, State ZIP]

Re: Account Number: [ACCOUNT_NUMBER]
    Patient: [PATIENT_NAME]
    Service Date: [SERVICE_DATE]

Dear Billing Department,

I am disputing charges that appear to be improperly unbundled on my medical bill.

According to Current Procedural Terminology (CPT) guidelines, the following services should be billed together as a package, not separately:

[UNBUNDLED_SERVICES_DETAILS]

These services were billed individually, resulting in an overcharge of approximately $[DISPUTED_AMOUNT]. The correct bundled code should be [CORRECT_BUNDLE_CODE].

I request:
1. Correction to use the appropriate bundled billing code
2. Adjustment of charges to reflect bundled pricing
3. Refund of overpayment if already paid
4. Written confirmation of correction

This type of unbundling violates CMS National Correct Coding Initiative (NCCI) edits. Please respond within 30 days.

Sincerely,
[Your Signature]
[Your Printed Name]
[Phone Number]
[Email Address]`,
    emailTemplate: `Subject: Billing Error - Unbundled Services

Dear Billing Department,

I am disputing unbundled charges on my bill (Account: [ACCOUNT_NUMBER], Date: [SERVICE_DATE]).

The following services were billed separately but should be bundled: [UNBUNDLED_SERVICES]. According to CPT guidelines, these should be billed as [CORRECT_BUNDLE_CODE].

This unbundling resulted in an overcharge of $[DISPUTED_AMOUNT]. Please rebill using the correct bundled code and adjust my charges accordingly.

I request written confirmation within 30 days.

Thank you,
[Your Name]
[PHONE] | [EMAIL]`,
    phoneScript: `Hi, I'm calling about unbundled services on my bill.

Account: [ACCOUNT_NUMBER]
Date: [SERVICE_DATE]

I was charged separately for [LIST SERVICES], but these should be billed together as one bundled service under code [CORRECT_BUNDLE_CODE].

Can you correct this and adjust my bill?

[Document the conversation]`
  },

  balance_billing: {
    errorType: 'balance_billing',
    subject: 'Dispute: Balance Billing / No Surprises Act Violation',
    letterTemplate: `[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Provider Name]
[Provider Address]
[City, State ZIP]

Re: Account Number: [ACCOUNT_NUMBER]
    Patient: [PATIENT_NAME]
    Service Date: [SERVICE_DATE]

Dear Billing Department,

I am disputing balance billing charges that violate the No Surprises Act.

Background: On [SERVICE_DATE], I received emergency services / services at an in-network facility. I have now been billed $[DISPUTED_AMOUNT] by an out-of-network provider who I did not choose and was not informed would be treating me.

Under the No Surprises Act (effective January 1, 2022), I am protected from surprise medical bills for:
- Emergency services
- Non-emergency services from out-of-network providers at in-network facilities (when I didn't consent to out-of-network care)

I did not:
- Receive notice that you were out-of-network
- Consent to receive out-of-network services
- Have the ability to choose an in-network provider

Therefore, I am only responsible for my in-network cost-sharing amount. Please:
1. Immediately cease collection activities
2. Bill my insurance at the in-network rate
3. Adjust my balance to reflect in-network cost-sharing only
4. Provide written confirmation within 30 days

If this is not resolved, I will file complaints with:
- Centers for Medicare & Medicaid Services (CMS)
- State Attorney General
- State Insurance Commissioner
- Consumer Financial Protection Bureau (if sent to collections)

Sincerely,
[Your Signature]
[Your Printed Name]
[Phone Number]
[Email Address]`,
    emailTemplate: `Subject: URGENT - Balance Billing Dispute / No Surprises Act

Dear Billing Department,

I am disputing balance billing charges on my account (Account: [ACCOUNT_NUMBER], Date: [SERVICE_DATE]).

I received [emergency services / services at an in-network facility] and was treated by an out-of-network provider without my knowledge or consent. Under the No Surprises Act, I am protected from surprise bills and should only pay my in-network cost-sharing.

Balance billed amount: $[DISPUTED_AMOUNT]

Please immediately:
1. Stop collection activities
2. Bill insurance at in-network rate
3. Adjust my balance accordingly
4. Confirm in writing within 30 days

Failure to comply will result in complaints to CMS, state regulators, and consumer protection agencies.

[Your Name]
[PHONE] | [EMAIL]`,
    phoneScript: `Hi, I'm calling to dispute balance billing charges under the No Surprises Act.

Account: [ACCOUNT_NUMBER]
Date: [SERVICE_DATE]

I received [emergency care / services at an in-network facility] and was unexpectedly treated by an out-of-network provider. Under federal law, I'm protected from surprise bills and should only pay my in-network cost-sharing amount.

I need you to:
1. Stop any collection activities immediately
2. Bill my insurance at the in-network rate
3. Adjust my balance

This is a violation of the No Surprises Act. Who can help me resolve this today?

[Get supervisor if needed; document everything]`
  },

  incorrect_quantity: {
    errorType: 'incorrect_quantity',
    subject: 'Billing Error: Incorrect Quantity Charged',
    letterTemplate: `[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Provider Name]
[Provider Address]
[City, State ZIP]

Re: Account Number: [ACCOUNT_NUMBER]
    Patient: [PATIENT_NAME]
    Service Date: [SERVICE_DATE]

Dear Billing Department,

I am disputing incorrect quantities charged on my medical bill.

Issue: My bill shows charges for [QUANTITY] units of [ITEM/SERVICE], however I only received [ACTUAL_QUANTITY] units. This results in an overcharge of $[DISPUTED_AMOUNT].

Specifically:
[QUANTITY_DETAILS]

I request:
1. Review of the medical record to verify quantities used
2. Correction of quantities to reflect actual services/supplies provided
3. Adjustment of charges
4. Written confirmation of correction

Medical records should clearly document quantities used. Please provide supporting documentation with your response within 30 days.

Sincerely,
[Your Signature]
[Your Printed Name]
[Phone Number]
[Email Address]`,
    emailTemplate: `Subject: Billing Error - Incorrect Quantity

Dear Billing Department,

I am disputing incorrect quantities on my bill (Account: [ACCOUNT_NUMBER], Date: [SERVICE_DATE]).

My bill shows [QUANTITY] units of [ITEM], but I only received [ACTUAL_QUANTITY]. This is an overcharge of $[DISPUTED_AMOUNT].

Please review my medical record, correct the quantities, and adjust my charges. I request written confirmation within 30 days.

Thank you,
[Your Name]
[PHONE] | [EMAIL]`,
    phoneScript: `Hi, I'm calling about incorrect quantities on my bill.

Account: [ACCOUNT_NUMBER]
Date: [SERVICE_DATE]

My bill shows [QUANTITY] of [ITEM], but I only received [ACTUAL_QUANTITY].

Can you review my medical record and correct this?

[Take notes]`
  },

  coding_error: {
    errorType: 'coding_error',
    subject: 'Billing Error: Incorrect Medical Code',
    letterTemplate: `[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Provider Name]
[Provider Address]
[City, State ZIP]

Re: Account Number: [ACCOUNT_NUMBER]
    Patient: [PATIENT_NAME]
    Service Date: [SERVICE_DATE]

Dear Billing Department,

I am disputing an incorrect medical billing code on my statement.

Issue: The bill includes code [INCORRECT_CODE] for [SERVICE], however this code is [invalid / does not match the service provided / incompatible with the diagnosis code].

[CODING_ERROR_DETAILS]

The correct code should be [CORRECT_CODE], which results in a charge adjustment of $[DISPUTED_AMOUNT].

I request:
1. Review by a certified medical coder
2. Correction to the appropriate code
3. Adjustment of charges
4. Written confirmation with updated explanation of benefits

Please respond within 30 days.

Sincerely,
[Your Signature]
[Your Printed Name]
[Phone Number]
[Email Address]`,
    emailTemplate: `Subject: Billing Error - Incorrect Medical Code

Dear Billing Department,

I am disputing an incorrect billing code (Account: [ACCOUNT_NUMBER], Date: [SERVICE_DATE]).

The bill shows code [INCORRECT_CODE], but this is [describe issue]. The correct code should be [CORRECT_CODE].

Please have a certified medical coder review this and correct my bill. I request written confirmation within 30 days.

Thank you,
[Your Name]
[PHONE] | [EMAIL]`,
    phoneScript: `Hi, I'm calling about an incorrect medical code on my bill.

Account: [ACCOUNT_NUMBER]
Date: [SERVICE_DATE]

The bill shows code [INCORRECT_CODE], but [explain issue]. Can you have this reviewed by a medical coder?

[Document conversation]`
  }
};

export function getDisputeTemplate(errorType: string): DisputeTemplate | null {
  return DISPUTE_TEMPLATES[errorType] || null;
}

export function fillTemplate(
  template: string,
  replacements: Record<string, string>
): string {
  let filled = template;
  
  Object.entries(replacements).forEach(([key, value]) => {
    const placeholder = `[${key}]`;
    filled = filled.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });
  
  return filled;
}

export const EDUCATION_CONTENT = {
  glossary: {
    cpt_code: "Current Procedural Terminology codes are numeric codes used to describe medical, surgical, and diagnostic services",
    eob: "Explanation of Benefits - a statement from your insurance showing what they paid and what you owe",
    deductible: "The amount you pay before your insurance starts covering costs",
    coinsurance: "Your share of costs after meeting your deductible (e.g., you pay 20%, insurance pays 80%)",
    copay: "A fixed amount you pay for a service (e.g., $30 for a doctor visit)",
    balance_billing: "When an out-of-network provider bills you for the difference between their charge and what insurance paid",
    upcoding: "Billing for a more expensive service than what was actually provided",
    unbundling: "Billing separately for services that should be billed together at a lower bundled price"
  },
  
  patientRights: {
    right_to_itemized_bill: "You have the right to request an itemized bill showing all charges in detail",
    right_to_dispute: "You can dispute any charges you believe are incorrect",
    right_to_appeal: "If your dispute is denied, you can appeal the decision",
    protection_from_surprise_bills: "The No Surprises Act protects you from most surprise medical bills",
    right_to_financial_assistance: "Many hospitals offer financial assistance programs for patients who qualify",
    right_to_payment_plan: "You can usually negotiate a payment plan for large bills"
  },
  
  resources: [
    {
      name: "Centers for Medicare & Medicaid Services",
      url: "https://www.cms.gov",
      description: "Federal agency overseeing Medicare, Medicaid, and health insurance marketplace"
    },
    {
      name: "No Surprises Act Help",
      url: "https://www.cms.gov/nosurprises",
      description: "Information about protections from surprise medical bills"
    },
    {
      name: "State Insurance Department",
      description: "Your state insurance department can help with billing disputes"
    }
  ]
};
