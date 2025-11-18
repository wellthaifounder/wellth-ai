# Multi-HSA Account Management with Transaction Splitting

**Branch**: `feature/multi-hsa-transaction-splitting`  
**Date**: 2025-01-18  
**Status**: Draft

---

## Overview

Enable users to manage multiple HSA accounts across different time periods, split transactions into HSA-eligible and non-eligible portions, and accurately track reimbursement eligibility based on bill dates rather than payment dates. This addresses real-world scenarios where users change jobs, open new HSA accounts, and need to track which expenses are eligible for reimbursement from which HSA account.

---

## User Scenarios & Testing

### P1: User manages multiple HSA accounts with different date ranges
**Priority**: P1 (Critical Path)  
**Why P1**: Core functionality - users with job changes or multiple HSA accounts cannot accurately track eligibility without this.  
**Independently Testable**: Yes - can be tested by creating multiple HSA accounts with different date ranges and verifying eligibility calculations.

**Acceptance Scenarios**:
```gherkin
Given a user has two HSA accounts (HSA-A opened 2024-01-01, HSA-B opened 2024-08-01)
When they view a bill dated 2024-06-15
Then the bill should show as eligible for reimbursement from HSA-A only
And the bill should show as NOT eligible for reimbursement from HSA-B

Given a user has two HSA accounts with overlapping date ranges
When they create a reimbursement request
Then they must select which HSA account to use for the request
And the system validates all included bills are eligible for the selected account
```

### P1: User splits transaction with mixed HSA-eligible items
**Priority**: P1 (Critical Path)  
**Why P1**: Essential for accurate HSA tracking - many real transactions contain both eligible and non-eligible items.  
**Independently Testable**: Yes - can be tested by splitting a transaction and verifying each split has correct amounts and categories.

**Acceptance Scenarios**:
```gherkin
Given a user has a $150 Walmart transaction
When they split it into $100 groceries (non-eligible) and $50 OTC drugs (eligible)
Then the system creates two child transactions
And the original transaction is marked as "split"
And only the $50 OTC drugs split shows as HSA-eligible
And the splits sum to the original transaction amount

Given a user attempts to create splits that don't sum to the original amount
When they try to save the splits
Then the system shows an error
And prevents saving until amounts match
```

### P1: User pays one bill with multiple transactions
**Priority**: P1 (Critical Path)  
**Why P1**: Common scenario for payment plans - users need to track partial payments accurately.  
**Independently Testable**: Yes - can be tested by linking multiple transactions to one bill and verifying payment tracking.

**Acceptance Scenarios**:
```gherkin
Given a user has a $5000 medical bill with a payment plan
When they make 3 payments of $1000, $2000, and $2000
Then all three transactions can be linked to the same bill
And the bill shows $3000 paid with personal card and $2000 remaining unpaid
And each payment_transaction records the correct amount allocated

Given a user tries to allocate more than the transaction amount
When they attempt to save the payment link
Then the system shows an error
And prevents over-allocation
```

### P2: User pays multiple bills with one transaction
**Priority**: P2 (Important)  
**Why P2**: Less common but still occurs - users may bundle payments or have consolidated medical billing.  
**Independently Testable**: Yes - can be tested by linking one transaction to multiple bills.

**Acceptance Scenarios**:
```gherkin
Given a user has a $500 transaction
When they allocate $300 to Bill A and $200 to Bill B
Then both bills show the correct allocated amounts
And the transaction shows as linked to both bills
And the sum of allocations equals the transaction amount
```

### P2: User reviews HSA eligibility on transactions page
**Priority**: P2 (Important)  
**Why P2**: Improves user workflow but not critical for basic functionality.  
**Independently Testable**: Yes - can be tested by viewing transactions with different HSA accounts active.

**Acceptance Scenarios**:
```gherkin
Given a user has HSA-A (closed 2024-07-31) and HSA-B (opened 2024-08-01)
When they view the transactions page
Then transactions show which HSA account(s) they're eligible for
And transactions can be filtered by HSA account eligibility
```

---

## Edge Cases

1. **Transaction split validation**: Splits must sum exactly to parent transaction amount
2. **Payment allocation validation**: Total allocated amount cannot exceed transaction amount
3. **HSA account date gaps**: Bills incurred during periods without an active HSA account should show as ineligible
4. **HSA account date overlaps**: Bills eligible for multiple accounts require user to select which account to use for reimbursement
5. **Split transaction linking**: Child transactions (splits) can be linked to bills, not parent transactions
6. **Deleted HSA accounts**: Historical reimbursement requests should still show which account was used, even if account is later removed
7. **Null HSA account**: Users without any HSA accounts should still be able to track medical expenses and bills

---

## Requirements

### Functional Requirements

**FR1**: System shall support multiple HSA accounts per user, each with:
- Unique name/identifier
- Opened date (required)
- Closed date (optional)
- Active/inactive status

**FR2**: HSA eligibility determination shall be based on bill date, not payment date:
- If bill has invoice_date, use that
- Otherwise, use the expense date field
- Transaction payment date is NOT considered for eligibility

**FR3**: Transaction splitting shall allow:
- Creating multiple child transactions from a parent transaction
- Each split has: amount, description, vendor, category, is_medical, is_hsa_eligible
- Splits must sum exactly to parent transaction amount
- Parent transaction marked as "split" and cannot be directly linked to bills
- Child transactions can be linked to bills via payment_transactions

**FR4**: Payment allocation shall support:
- One transaction linked to multiple bills (split allocation)
- Multiple transactions linked to one bill (partial payments/payment plans)
- Amount allocated tracked in payment_transactions.transaction_amount_allocated
- Validation prevents over-allocation

**FR5**: Reimbursement request flow shall:
- Require user to select which HSA account to use
- Validate all included bills are eligible for selected HSA account
- Show clear error if ineligible bills are included
- Allow user to remove ineligible bills or select different account

**FR6**: Bills page shall display:
- Payment breakdown by source (HSA, personal, unpaid)
- Which HSA account(s) bill is eligible for
- Clear visual indication of eligibility status

**FR7**: Transactions page shall provide:
- Split transaction UI (button/action on transaction card)
- Visual indication of split vs. non-split transactions
- HSA account eligibility indicators
- Filter by HSA account eligibility

### Key Entities

**hsa_accounts**
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- account_name (text, e.g., "Fidelity HSA 2024")
- opened_date (date, required)
- closed_date (date, nullable)
- is_active (boolean, default true)
- created_at, updated_at

**transaction_splits**
- id (uuid, PK)
- parent_transaction_id (uuid, FK to transactions)
- split_number (integer, e.g., 1, 2, 3)
- amount (numeric, required)
- description (text)
- vendor (text)
- category (text)
- is_medical (boolean)
- is_hsa_eligible (boolean)
- notes (text, nullable)
- created_at, updated_at

**payment_transactions** (modified)
- Add: transaction_amount_allocated (numeric, nullable)
  - Null means entire transaction amount is allocated
  - If set, specifies partial amount used from transaction

**transactions** (modified)
- Add: is_split (boolean, default false)
- Add: split_parent_id (uuid, FK to transaction_splits, nullable)
  - Links child transactions created from splits back to the split

**invoices** (no changes to schema, but eligibility logic changes)
- HSA eligibility now considers: bill date, user's HSA accounts, and date ranges

---

## Success Criteria

### SC1: Multiple HSA Account Management
**Measurement**: User can successfully create, edit, and manage multiple HSA accounts with different date ranges.  
**Target**: 100% of users can add and manage at least 2 HSA accounts.  
**Verification**: Manual testing and user feedback.

### SC2: Accurate Eligibility Calculation
**Measurement**: Bills are correctly marked as eligible/ineligible based on bill date and HSA account date ranges.  
**Target**: 100% accuracy in eligibility determination.  
**Verification**: Automated tests with various date scenarios.

### SC3: Transaction Splitting Workflow
**Measurement**: Users can split transactions and correctly allocate HSA-eligible vs. non-eligible amounts.  
**Target**: Users can split a transaction in < 30 seconds with clear UI guidance.  
**Verification**: User testing and time-to-completion metrics.

### SC4: Payment Allocation Accuracy
**Measurement**: System correctly tracks partial payments and multiple payment sources per bill.  
**Target**: 100% accuracy in payment amount tracking, no over-allocation errors.  
**Verification**: Automated validation tests.

### SC5: Reimbursement Request Validation
**Measurement**: Users cannot submit reimbursement requests with ineligible bills.  
**Target**: 0% of submitted requests contain ineligible bills.  
**Verification**: Validation logic tests and error message verification.

### SC6: User Comprehension
**Measurement**: Users understand which bills are eligible for which HSA accounts.  
**Target**: > 90% of users correctly identify eligible bills in user testing.  
**Verification**: User testing with think-aloud protocol.
