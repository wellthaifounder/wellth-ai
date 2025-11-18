# Implementation Plan: Multi-HSA Account Management with Transaction Splitting

**Branch**: `feature/multi-hsa-transaction-splitting`  
**Date**: 2025-01-18  
**Links**: [Specification](./specification.md)

---

## Technical Context

**Language**: TypeScript, React  
**Framework**: Vite, React Router v6  
**Backend**: Lovable Cloud (Supabase)  
**Database**: PostgreSQL with RLS  
**UI Library**: shadcn/ui, Tailwind CSS  
**State Management**: React Context API, TanStack Query  
**Authentication**: Supabase Auth  

**Key Dependencies**:
- @supabase/supabase-js: Database operations
- @tanstack/react-query: Data fetching and caching
- react-hook-form + zod: Form validation
- date-fns: Date manipulation

**Testing Approach**: Manual testing + validation logic tests  
**Platform**: Web (responsive)  
**Performance Goals**: < 200ms for eligibility calculations, < 1s for transaction split operations  

**Constraints**:
- Must maintain backward compatibility with existing single HSA account data
- Cannot break existing reimbursement requests
- Must handle null/missing HSA account data gracefully

---

## Database Schema Changes

### New Tables

**1. hsa_accounts**
```sql
CREATE TABLE hsa_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  account_name TEXT NOT NULL,
  opened_date DATE NOT NULL,
  closed_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
ALTER TABLE hsa_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own HSA accounts"
  ON hsa_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own HSA accounts"
  ON hsa_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own HSA accounts"
  ON hsa_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own HSA accounts"
  ON hsa_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_hsa_accounts_user_id ON hsa_accounts(user_id);
CREATE INDEX idx_hsa_accounts_dates ON hsa_accounts(user_id, opened_date, closed_date);
```

**2. transaction_splits**
```sql
CREATE TABLE transaction_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  split_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  vendor TEXT,
  category TEXT,
  is_medical BOOLEAN DEFAULT false,
  is_hsa_eligible BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(parent_transaction_id, split_number)
);

-- RLS Policies
ALTER TABLE transaction_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view splits for their transactions"
  ON transaction_splits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM transactions
    WHERE transactions.id = transaction_splits.parent_transaction_id
    AND transactions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert splits for their transactions"
  ON transaction_splits FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM transactions
    WHERE transactions.id = transaction_splits.parent_transaction_id
    AND transactions.user_id = auth.uid()
  ));

CREATE POLICY "Users can update splits for their transactions"
  ON transaction_splits FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM transactions
    WHERE transactions.id = transaction_splits.parent_transaction_id
    AND transactions.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete splits for their transactions"
  ON transaction_splits FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM transactions
    WHERE transactions.id = transaction_splits.parent_transaction_id
    AND transactions.user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_transaction_splits_parent ON transaction_splits(parent_transaction_id);

-- Trigger for updated_at
CREATE TRIGGER update_transaction_splits_updated_at
  BEFORE UPDATE ON transaction_splits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Modified Tables

**1. transactions** - Add split tracking
```sql
ALTER TABLE transactions
ADD COLUMN is_split BOOLEAN DEFAULT false,
ADD COLUMN split_parent_id UUID REFERENCES transaction_splits(id) ON DELETE SET NULL;

CREATE INDEX idx_transactions_split ON transactions(is_split);
CREATE INDEX idx_transactions_split_parent ON transactions(split_parent_id);
```

**2. payment_transactions** - Add amount allocation
```sql
ALTER TABLE payment_transactions
ADD COLUMN transaction_amount_allocated NUMERIC CHECK (transaction_amount_allocated > 0);

-- Add validation: allocated amount cannot exceed transaction amount
-- This will be enforced in application logic due to cross-table validation complexity
```

**3. reimbursement_requests** - Add HSA account reference
```sql
ALTER TABLE reimbursement_requests
ADD COLUMN hsa_account_id UUID REFERENCES hsa_accounts(id) ON DELETE SET NULL;

CREATE INDEX idx_reimbursement_requests_hsa_account ON reimbursement_requests(hsa_account_id);
```

**4. profiles** - Keep existing hsa_opened_date for backward compatibility
```sql
-- No changes needed
-- hsa_opened_date remains for users with single HSA account
-- New users will use hsa_accounts table
```

---

## Data Migration Strategy

### Phase 1: Add New Schema
- Deploy new tables and columns
- All new columns are nullable or have defaults
- No impact on existing functionality

### Phase 2: Migrate Existing Data
- For users with hsa_opened_date in profiles:
  - Create a default HSA account: "Primary HSA"
  - Set opened_date from profiles.hsa_opened_date
  - Set is_active = true
  - Keep profiles.hsa_opened_date intact for rollback safety

### Phase 3: Update Application Logic
- Check for hsa_accounts first
- Fall back to profiles.hsa_opened_date if no accounts exist
- New UI allows creating multiple accounts

### Phase 4 (Future): Deprecate profiles.hsa_opened_date
- Once all users migrated and feature stable
- Remove profiles.hsa_opened_date column

---

## Application Architecture

### New Components

**1. `src/components/hsa/HSAAccountManager.tsx`**
- CRUD interface for HSA accounts
- List view with add/edit/delete actions
- Form validation (opened_date required, closed_date must be after opened_date)

**2. `src/components/hsa/HSAAccountSelector.tsx`**
- Dropdown for selecting active HSA account
- Used in reimbursement request flow
- Shows account name and date range

**3. `src/components/transactions/TransactionSplitDialog.tsx`**
- Modal dialog for splitting transactions
- Dynamic form for adding/removing splits
- Real-time validation that splits sum to parent amount
- Inherits parent transaction data for convenience

**4. `src/components/transactions/SplitTransactionCard.tsx`**
- Visual representation of split transaction
- Shows parent amount and child splits
- Expandable to view all splits

**5. `src/components/transactions/SplitIndicator.tsx`**
- Badge/icon showing transaction is split
- Used on transaction cards

**6. `src/components/bills/HSAEligibilityBadge.tsx`**
- Shows which HSA account(s) bill is eligible for
- Color-coded: green (eligible), red (ineligible), yellow (multiple accounts)

### Modified Components

**1. `src/pages/Transactions.tsx`**
- Add "Split Transaction" button/action
- Show split indicator on parent transactions
- Filter by HSA account eligibility

**2. `src/components/transactions/TransactionCard.tsx`**
- Add split indicator
- Show HSA eligibility badge
- Disable bill linking for parent split transactions

**3. `src/pages/Bills.tsx`**
- Display HSA account eligibility per bill
- Update payment breakdown chart to show HSA account source

**4. `src/components/bills/LinkTransactionDialog.tsx`**
- Add amount allocation field
- Validate allocation doesn't exceed transaction amount
- Show available amount if transaction already partially allocated

**5. `src/pages/HSAReimbursement.tsx`**
- Add HSA account selector
- Validate bill eligibility for selected account
- Show warnings for ineligible bills

**6. `src/pages/ReimbursementDetails.tsx`**
- Display which HSA account was used
- Show account date range

### New Hooks

**1. `src/hooks/useHSAAccounts.ts`**
```typescript
export function useHSAAccounts() {
  // Fetch user's HSA accounts
  // Return: accounts, isLoading, error, createAccount, updateAccount, deleteAccount
}
```

**2. `src/hooks/useTransactionSplits.ts`**
```typescript
export function useTransactionSplits(transactionId: string) {
  // Fetch splits for a transaction
  // Return: splits, isLoading, error, createSplits, updateSplit, deleteSplits
}
```

**3. `src/hooks/useHSAEligibility.ts`**
```typescript
export function useHSAEligibility(billDate: string | Date) {
  // Determine which HSA accounts cover the bill date
  // Return: eligibleAccounts, isEligible, isLoading
}
```

### New Utility Functions

**1. `src/lib/hsaAccountUtils.ts`**
```typescript
// Functions for HSA account operations
export function getActiveHSAAccount(accounts: HSAAccount[]): HSAAccount | null
export function getEligibleHSAAccounts(billDate: Date, accounts: HSAAccount[]): HSAAccount[]
export function isDateInHSAPeriod(date: Date, account: HSAAccount): boolean
```

**2. `src/lib/transactionSplitUtils.ts`**
```typescript
// Functions for transaction splitting
export function validateSplitAmounts(parent: Transaction, splits: TransactionSplit[]): boolean
export function calculateRemainingAmount(parent: Transaction, splits: TransactionSplit[]): number
export function canTransactionBeSplit(transaction: Transaction): boolean
```

**3. `src/lib/paymentAllocationUtils.ts`**
```typescript
// Functions for payment allocation
export function calculateAvailableAmount(transaction: Transaction, existingAllocations: PaymentTransaction[]): number
export function validateAllocation(transaction: Transaction, newAllocation: number, existingAllocations: PaymentTransaction[]): boolean
```

### Updated Utility Functions

**1. `src/lib/hsaCalculations.ts`**
- Modify eligibility logic to check hsa_accounts table
- Fall back to profiles.hsa_opened_date if no accounts
- Update function signatures to accept HSA account parameter

---

## Implementation Phases

### Phase 1: HSA Account Management (2-3 days)
1. Database migration: Create hsa_accounts table
2. Migrate existing hsa_opened_date data
3. Build HSAAccountManager component
4. Build HSAAccountSelector component
5. Add HSA accounts page/section in Settings
6. Update hsaCalculations.ts to use new table

### Phase 2: Transaction Splitting (3-4 days)
1. Database migration: Create transaction_splits table, modify transactions
2. Build TransactionSplitDialog component
3. Build SplitTransactionCard component
4. Build SplitIndicator component
5. Update TransactionCard with split action
6. Update Transactions page with split filtering
7. Implement split validation logic

### Phase 3: Payment Allocation (2-3 days)
1. Database migration: Modify payment_transactions table
2. Update LinkTransactionDialog with allocation field
3. Implement allocation validation logic
4. Update Bills page payment breakdown
5. Handle multiple transactions per bill UI

### Phase 4: Reimbursement Flow Updates (2 days)
1. Database migration: Add hsa_account_id to reimbursement_requests
2. Add HSA account selector to reimbursement flow
3. Implement eligibility validation
4. Update ReimbursementDetails to show account used
5. Add eligibility warnings/errors in UI

### Phase 5: UI Enhancements & Polish (2 days)
1. Add HSAEligibilityBadge to bills
2. Update Bills page with account eligibility display
3. Add HSA account filter to Transactions page
4. Improve visual indicators and user guidance
5. Add tooltips and help text

### Phase 6: Testing & Bug Fixes (2 days)
1. End-to-end testing of all user scenarios
2. Edge case testing (gaps, overlaps, null accounts)
3. Validation testing (split sums, allocation limits)
4. UI/UX refinement based on testing
5. Performance testing

---

## Rollback Strategy

1. **Phase 1-2 Rollback**: Remove new tables, keep profiles.hsa_opened_date
2. **Phase 3-4 Rollback**: New columns are nullable, can be ignored
3. **Phase 5-6 Rollback**: UI changes can be reverted without data loss

**Data Safety**:
- Keep profiles.hsa_opened_date until Phase 4 complete
- All new columns nullable or have defaults
- RLS policies prevent unauthorized access
- Transactions marked as split can still function as regular transactions if needed

---

## Risk Assessment

**High Risk**:
- Data migration from single to multiple HSA accounts - Mitigation: Keep dual-write period, extensive testing
- Complex validation logic for splits and allocations - Mitigation: Unit tests, clear error messages

**Medium Risk**:
- User confusion with multiple HSA accounts - Mitigation: Clear UI, tooltips, default to most recent account
- Performance with large transaction counts - Mitigation: Indexed queries, pagination

**Low Risk**:
- Breaking existing reimbursement requests - Mitigation: hsa_account_id is nullable, backward compatible
