// Simple env-var-driven feature flags. Read at module load (Vite inlines
// import.meta.env values at build time, so changes require a redeploy).
// Set in Vercel env vars or a local .env. Treat any value other than "true"
// (case-insensitive) as off.

function flag(name: string): boolean {
  return (
    String(import.meta.env[name] ?? "")
      .trim()
      .toLowerCase() === "true"
  );
}

/**
 * Wave 3 (2026-05) experiment flags. Both default off until telemetry
 * supports the experiment. See docs/ux-review-2026-05.md §3 + §5 pre-mortem.
 */
export const FF = {
  /**
   * Auto-dismiss the OnboardingWizard carousel for users who picked
   * `userIntent === 'billing'`. The carousel still exists for HSA-intent
   * users who need the tax-advantage explanation.
   *
   * Set VITE_FF_AUTO_DISMISS_ONBOARDING_FOR_BILLING=true to enable.
   */
  AUTO_DISMISS_ONBOARDING_FOR_BILLING: flag(
    "VITE_FF_AUTO_DISMISS_ONBOARDING_FOR_BILLING",
  ),

  /**
   * Show the Get-Started progress ribbon only on /dashboard. Currently
   * persists on every authenticated page, becoming a "shame bar" reminder
   * of what the user hasn't done.
   *
   * Set VITE_FF_SCOPE_GET_STARTED_TO_DASHBOARD=true to enable.
   */
  SCOPE_GET_STARTED_TO_DASHBOARD: flag(
    "VITE_FF_SCOPE_GET_STARTED_TO_DASHBOARD",
  ),

  /**
   * Wave 4 (2026-05) — IA collapse experiment. When on:
   *   - /ledger redirects to /bills?view=ledger
   *   - Bills page reads ?view, renders Ledger view inline when view=ledger
   *   - Sidebar drops the standalone "Ledger" item; bottom-tab repoints
   *
   * Smallest reversible test of merging Bills + Ledger IA. Hold ≥7 days of
   * `bills_view_selected` telemetry before deciding to widen or revert.
   *
   * Set VITE_FF_BILLS_LEDGER_IA_COLLAPSE=true to enable.
   */
  BILLS_LEDGER_IA_COLLAPSE: flag("VITE_FF_BILLS_LEDGER_IA_COLLAPSE"),
} as const;
