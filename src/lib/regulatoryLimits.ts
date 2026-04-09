/**
 * IRS Regulatory Limits — Single Source of Truth
 *
 * All HSA, FSA, and HDHP dollar limits must come from this file.
 * Do NOT hardcode IRS limit values elsewhere in the codebase.
 *
 * Update this file each January when the IRS publishes new limits.
 * Sources: IRS Publication 969, Revenue Procedure 2024-40.
 *
 * Last updated: 2026-04-08 (reflecting 2025 tax year limits)
 */

// ── HSA Contribution Limits ───────────────────────────────────────────────────
// Source: IRS Publication 969 (2025), Rev. Proc. 2024-25

export const HSA_LIMITS_2025 = {
  selfOnly: 4300,
  family: 8550,
  catchUp: 1000, // Additional contribution for age 55+ (unchanged from 2024)
} as const;

// ── HDHP Qualification Thresholds ────────────────────────────────────────────
// Source: IRS Publication 969 (2025)

export const HDHP_THRESHOLDS_2025 = {
  selfOnly: { minDeductible: 1650, maxOOP: 8300 },
  family: { minDeductible: 3300, maxOOP: 16600 },
} as const;

// ── FSA Limits ────────────────────────────────────────────────────────────────
// Source: Revenue Procedure 2024-40

export const FSA_LIMITS_2025 = {
  contribution: 3300, // Up from $3,050 in 2024
  carryover: 660,     // Up from $610 in 2024; only if plan allows carryover (not grace period)
} as const;

// ── 2026 Preview Limits ───────────────────────────────────────────────────────
// Source: IRS Publication 969 (2025), Tip boxes — informational only

export const HSA_LIMITS_2026 = {
  selfOnly: 4400,
  family: 8750,
  catchUp: 1000,
} as const;

export const HDHP_THRESHOLDS_2026 = {
  selfOnly: { minDeductible: 1700, maxOOP: 8500 },
  family: { minDeductible: 3400, maxOOP: 17000 },
} as const;

// ── Current Tax Year Alias ────────────────────────────────────────────────────
// Use these aliases when displaying the "current year" limits in UI.
// Update these aliases each January along with the raw limit objects above.

export const HSA_LIMITS_CURRENT = HSA_LIMITS_2025;
export const HDHP_THRESHOLDS_CURRENT = HDHP_THRESHOLDS_2025;
export const FSA_LIMITS_CURRENT = FSA_LIMITS_2025;
export const CURRENT_TAX_YEAR = 2025;
