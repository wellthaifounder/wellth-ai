# Tasks: Multi-HSA Account Management with Transaction Splitting

**Branch**: `feature/multi-hsa-transaction-splitting`  
**Date**: 2025-01-18  
**Links**: [Specification](./specification.md) | [Plan](./plan.md)

---

## Phase 1: HSA Account Management ⏳

### Task 1.1: Database Schema - HSA Accounts Table
**Status**: 🔴 Not Started  
**Estimated**: 30 min  
**Dependencies**: None

- [ ] Create `hsa_accounts` table with all columns
- [ ] Add RLS policies for user access control
- [ ] Create indexes for performance
- [ ] Add trigger for updated_at timestamp

### Task 1.2: Data Migration - Existing HSA Dates
**Status**: 🔴 Not Started  
**Estimated**: 30 min  
**Dependencies**: Task 1.1

- [ ] Create migration script to populate hsa_accounts from profiles.hsa_opened_date
- [ ] Set default account name as "Primary HSA"
- [ ] Verify all users with hsa_opened_date get an account
- [ ] Test migration on sample data

### Task 1.3: Component - HSAAccountManager
**Status**: 🔴 Not Started  
**Estimated**: 2 hours  
**Dependencies**: Task 1.1

- [ ] Create HSAAccountManager.tsx component
- [ ] Build account list view with add/edit/delete actions
- [ ] Implement form validation (dates, required fields)
- [ ] Add confirmation dialog for delete
- [ ] Handle active/inactive status toggle

### Task 1.4: Component - HSAAccountSelector
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 1.1

- [ ] Create HSAAccountSelector.tsx dropdown component
- [ ] Display account name and date range
- [ ] Filter to show only active accounts
- [ ] Handle empty state (no accounts)

### Task 1.5: Hook - useHSAAccounts
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 1.1

- [ ] Create useHSAAccounts.ts hook
- [ ] Implement fetchAccounts with TanStack Query
- [ ] Add CRUD operations (create, update, delete)
- [ ] Handle loading and error states
- [ ] Add optimistic updates

### Task 1.6: Utility - hsaAccountUtils
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 1.1

- [ ] Create hsaAccountUtils.ts
- [ ] Implement getActiveHSAAccount function
- [ ] Implement getEligibleHSAAccounts function
- [ ] Implement isDateInHSAPeriod function
- [ ] Add unit tests

### Task 1.7: Update - hsaCalculations.ts
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 1.1, Task 1.6

- [ ] Update eligibility logic to check hsa_accounts table
- [ ] Add fallback to profiles.hsa_opened_date
- [ ] Update function signatures to accept HSA account parameter
- [ ] Ensure backward compatibility
- [ ] Test with both old and new data

### Task 1.8: UI - Settings HSA Accounts Page
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 1.3, Task 1.4

- [ ] Add HSA Accounts section to Settings page
- [ ] Integrate HSAAccountManager component
- [ ] Add explanatory text and tooltips
- [ ] Test responsive design

---

## Phase 2: Transaction Splitting ⏳

### Task 2.1: Database Schema - Transaction Splits
**Status**: 🔴 Not Started  
**Estimated**: 30 min  
**Dependencies**: Phase 1 Complete

- [ ] Create `transaction_splits` table
- [ ] Add RLS policies
- [ ] Create indexes
- [ ] Add updated_at trigger

### Task 2.2: Database Schema - Modify Transactions Table
**Status**: 🔴 Not Started  
**Estimated**: 15 min  
**Dependencies**: Task 2.1

- [ ] Add is_split column to transactions
- [ ] Add split_parent_id column to transactions
- [ ] Create indexes for split tracking
- [ ] Test backward compatibility

### Task 2.3: Component - TransactionSplitDialog
**Status**: 🔴 Not Started  
**Estimated**: 3 hours  
**Dependencies**: Task 2.1

- [ ] Create TransactionSplitDialog.tsx modal
- [ ] Build dynamic form for adding/removing splits
- [ ] Implement real-time sum validation
- [ ] Pre-populate with parent transaction data
- [ ] Add save/cancel actions
- [ ] Handle validation errors

### Task 2.4: Component - SplitTransactionCard
**Status**: 🔴 Not Started  
**Estimated**: 1.5 hours  
**Dependencies**: Task 2.1

- [ ] Create SplitTransactionCard.tsx
- [ ] Display parent amount and child splits
- [ ] Make expandable/collapsible
- [ ] Show HSA eligibility per split
- [ ] Add edit splits action

### Task 2.5: Component - SplitIndicator
**Status**: 🔴 Not Started  
**Estimated**: 30 min  
**Dependencies**: Task 2.1

- [ ] Create SplitIndicator.tsx badge/icon
- [ ] Design visual indicator for split transactions
- [ ] Add tooltip explaining split status

### Task 2.6: Hook - useTransactionSplits
**Status**: 🔴 Not Started  
**Estimated**: 1.5 hours  
**Dependencies**: Task 2.1

- [ ] Create useTransactionSplits.ts hook
- [ ] Implement fetchSplits with TanStack Query
- [ ] Add createSplits batch operation
- [ ] Add updateSplit and deleteSplits
- [ ] Handle validation and error states

### Task 2.7: Utility - transactionSplitUtils
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 2.1

- [ ] Create transactionSplitUtils.ts
- [ ] Implement validateSplitAmounts
- [ ] Implement calculateRemainingAmount
- [ ] Implement canTransactionBeSplit
- [ ] Add unit tests

### Task 2.8: Update - TransactionCard Component
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 2.3, Task 2.5

- [ ] Add split indicator to TransactionCard
- [ ] Add "Split Transaction" action button
- [ ] Disable bill linking for parent split transactions
- [ ] Update visual design

### Task 2.9: Update - Transactions Page
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 2.4, Task 2.8

- [ ] Integrate TransactionSplitDialog
- [ ] Show split transactions with SplitTransactionCard
- [ ] Add filter for split vs. non-split
- [ ] Update empty states

---

## Phase 3: Payment Allocation ⏳

### Task 3.1: Database Schema - Payment Transactions
**Status**: 🔴 Not Started  
**Estimated**: 15 min  
**Dependencies**: Phase 2 Complete

- [ ] Add transaction_amount_allocated column
- [ ] Add CHECK constraint for positive amounts
- [ ] Update indexes if needed

### Task 3.2: Utility - paymentAllocationUtils
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 3.1

- [ ] Create paymentAllocationUtils.ts
- [ ] Implement calculateAvailableAmount
- [ ] Implement validateAllocation
- [ ] Add unit tests for over-allocation prevention

### Task 3.3: Update - LinkTransactionDialog
**Status**: 🔴 Not Started  
**Estimated**: 2 hours  
**Dependencies**: Task 3.1, Task 3.2

- [ ] Add amount allocation input field
- [ ] Show available amount for transaction
- [ ] Implement allocation validation
- [ ] Display error messages for over-allocation
- [ ] Default to full transaction amount

### Task 3.4: Update - Bills Page Payment Breakdown
**Status**: 🔴 Not Started  
**Estimated**: 1.5 hours  
**Dependencies**: Task 3.1

- [ ] Update payment breakdown chart logic
- [ ] Show multiple payment sources
- [ ] Display partial payment amounts
- [ ] Update HSA vs. personal card breakdown
- [ ] Handle multiple transactions per bill

### Task 3.5: Component - PaymentAllocationList
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 3.1

- [ ] Create component to show all payment allocations for a bill
- [ ] Display transaction details with allocated amounts
- [ ] Add edit/remove allocation actions
- [ ] Show total paid and remaining

---

## Phase 4: Reimbursement Flow Updates ⏳

### Task 4.1: Database Schema - Reimbursement Requests
**Status**: 🔴 Not Started  
**Estimated**: 15 min  
**Dependencies**: Phase 1 Complete

- [ ] Add hsa_account_id column to reimbursement_requests
- [ ] Create index on hsa_account_id
- [ ] Test nullable constraint

### Task 4.2: Hook - useHSAEligibility
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 1.6, Task 4.1

- [ ] Create useHSAEligibility.ts hook
- [ ] Implement eligibility check for bill date
- [ ] Return list of eligible HSA accounts
- [ ] Handle no eligible accounts case

### Task 4.3: Update - HSAReimbursement Page
**Status**: 🔴 Not Started  
**Estimated**: 2 hours  
**Dependencies**: Task 1.4, Task 4.2

- [ ] Add HSAAccountSelector to reimbursement flow
- [ ] Implement eligibility validation on bill selection
- [ ] Show warnings for ineligible bills
- [ ] Allow user to remove ineligible bills
- [ ] Prevent submission with ineligible bills

### Task 4.4: Update - ReimbursementDetails Page
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 4.1

- [ ] Display which HSA account was used
- [ ] Show account date range
- [ ] Handle null hsa_account_id (legacy requests)

### Task 4.5: Validation - Eligibility Logic
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 4.2

- [ ] Add server-side validation for eligibility
- [ ] Create edge function or database function
- [ ] Return clear error messages
- [ ] Test with various date scenarios

---

## Phase 5: UI Enhancements & Polish ⏳

### Task 5.1: Component - HSAEligibilityBadge
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 4.2

- [ ] Create HSAEligibilityBadge.tsx
- [ ] Design color-coded badges (green/red/yellow)
- [ ] Show account name(s) in tooltip
- [ ] Handle multiple eligible accounts

### Task 5.2: Update - Bills Page Eligibility Display
**Status**: 🔴 Not Started  
**Estimated**: 1.5 hours  
**Dependencies**: Task 5.1

- [ ] Add HSAEligibilityBadge to bill cards
- [ ] Update bill detail view with eligibility info
- [ ] Add filter by HSA account eligibility
- [ ] Show account-specific eligibility in lists

### Task 5.3: Update - Transactions Page Filters
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Task 5.1

- [ ] Add HSA account filter to AdvancedFilters
- [ ] Filter transactions by eligibility
- [ ] Show eligibility badges on transaction cards
- [ ] Update empty states with filter context

### Task 5.4: UI Polish - Tooltips and Help Text
**Status**: 🔴 Not Started  
**Estimated**: 1.5 hours  
**Dependencies**: All previous tasks

- [ ] Add tooltips explaining HSA eligibility
- [ ] Add help text for transaction splitting
- [ ] Add guidance for payment allocation
- [ ] Create onboarding tooltips for new features
- [ ] Add contextual help icons

### Task 5.5: UI Polish - Visual Indicators
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: All previous tasks

- [ ] Improve split transaction visual design
- [ ] Enhance HSA account selector design
- [ ] Add loading states for all async operations
- [ ] Improve error message design
- [ ] Ensure consistent design system usage

---

## Phase 6: Testing & Bug Fixes ⏳

### Task 6.1: End-to-End Testing
**Status**: 🔴 Not Started  
**Estimated**: 2 hours  
**Dependencies**: Phase 5 Complete

- [ ] Test complete flow: Create HSA account → Split transaction → Link to bill → Create reimbursement
- [ ] Test with multiple HSA accounts
- [ ] Test with no HSA accounts
- [ ] Test backward compatibility with old data
- [ ] Test on mobile and desktop

### Task 6.2: Edge Case Testing
**Status**: 🔴 Not Started  
**Estimated**: 1.5 hours  
**Dependencies**: Phase 5 Complete

- [ ] Test HSA date gaps (bill between closed and new HSA)
- [ ] Test HSA date overlaps (bill eligible for multiple accounts)
- [ ] Test null/missing HSA account scenarios
- [ ] Test deleted HSA account with existing reimbursements
- [ ] Test boundary dates (same as opened/closed dates)

### Task 6.3: Validation Testing
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Phase 5 Complete

- [ ] Test split sum validation (must equal parent)
- [ ] Test allocation validation (cannot exceed transaction)
- [ ] Test HSA eligibility validation in reimbursement flow
- [ ] Test form validation on all inputs
- [ ] Test error message clarity

### Task 6.4: Performance Testing
**Status**: 🔴 Not Started  
**Estimated**: 1 hour  
**Dependencies**: Phase 5 Complete

- [ ] Test eligibility calculations with large datasets
- [ ] Test transaction split operations performance
- [ ] Test page load times with many splits/accounts
- [ ] Optimize queries if needed
- [ ] Add pagination if needed

### Task 6.5: Bug Fixes and Refinement
**Status**: 🔴 Not Started  
**Estimated**: 2 hours  
**Dependencies**: Tasks 6.1-6.4

- [ ] Fix any bugs found during testing
- [ ] Refine UI/UX based on testing feedback
- [ ] Update documentation
- [ ] Verify all success criteria met
- [ ] Final code review

---

## Progress Summary

**Total Tasks**: 41  
**Completed**: 0  
**In Progress**: 0  
**Not Started**: 41

**Phase Status**:
- Phase 1: 🔴 Not Started (8 tasks)
- Phase 2: 🔴 Not Started (9 tasks)
- Phase 3: 🔴 Not Started (5 tasks)
- Phase 4: 🔴 Not Started (5 tasks)
- Phase 5: 🔴 Not Started (5 tasks)
- Phase 6: 🔴 Not Started (5 tasks + ongoing)

---

## Notes

- Each task should be completed in order within its phase
- Some tasks can be parallelized if they don't have dependencies
- Testing should happen continuously, not just in Phase 6
- Update task status as work progresses
- Add new tasks if requirements change
