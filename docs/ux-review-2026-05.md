# Wellth.ai UX Review — 2026-05

**Reviewer:** Claude Opus 4.7 (Claude Code)
**Date:** 2026-05-03
**Scope:** Time-to-value, workflow coherence, UI simplification, plus added dimensions
**Method:** Hands-on Playwright walkthrough against `npm run dev` on Windows-ARM, with stubbed Supabase auth (real backend was blocked by migration bugs — see Finding #2). Screenshots and observations in [tests/ux-review/\_artifacts/](../tests/ux-review/_artifacts/).
**Personas:** Maya (anxious first-timer, primary lens), Derek (HSA optimizer, adversarial), Priya (chronic-care caregiver, adversarial).

---

## Executive summary

Wellth.ai's product surface is in a _coherent middle_: the marketing→signup→empty-state path is clearly designed, the Bill Upload Wizard is genuinely good, and Reports has the best empty-state pattern in the app. But the authenticated experience suffers from **layering** — three onboarding surfaces, four "expense" surfaces, and a Get-Started progress ribbon that turns every screen into a reminder of what Maya hasn't done. None of these are individually wrong; together they create choice overload before Maya has a single bill in the system.

The most leverage available right now (in priority order):

1. **Make Maya's first 90 seconds about _seeing_, not _doing_.** Currently she lands on a dashboard of skeleton loaders + a 0% progress ribbon + an empty-state card + (potentially) a 3-screen modal carousel. The first thing she should see is her own calculator projection (already wired up) front and center, and one CTA. Defer the carousel and the progress ribbon until _after_ her first upload. Steel-man and counter-arguments below.
2. **Fix the dashboard's skeleton-forever bug.** With a slow or failing backend, [Dashboard.tsx:254–259](../src/pages/Dashboard.tsx#L254) shows `DashboardSkeleton` indefinitely. There is no timeout, no error path, no fallback. Maya on a flaky 4G connection sees a blank dashboard and closes the tab. Reports has a working pattern; Dashboard, Bills, Ledger, and Collections do not.
3. **Mobile: the bottom tab nav overlaps the Bill Upload Wizard's Cancel/Continue buttons.** This is visible in [041-mobile-upload-wizard.png](../tests/ux-review/_artifacts/screenshots/038-41-mobile-upload-wizard.png). For Maya signing up on her phone at 11pm, this is a hard blocker on the primary activation action. One-line fix in the wizard's container padding.
4. **Collapse the four-surface "expense" IA.** Bills, Ledger, Collections, and Documents are all top-level routes that operate on overlapping data. The vocabulary leaks (`/collections` URL, "Care Events" label, "Organize by Collection" landing card). Pick a primary mental model and demote the rest to filters/views.
5. **Decide what `/bill-reviews`, `/disputes`, `/medical-events`, `/invoices` should do.** Today they silently redirect to `/bills` with no breadcrumb that the feature was retired or the route was renamed. Either delete the routes (let `*` 404 handle) or render an interstitial that explains what happened.

I find one thing genuinely working very well — see Yellow Hat in §4 — and one thing I think the current design got _right_ that simplification might be tempted to break: the persistent calculator → projected-savings handoff (a quiet, measurable, persona-specific value cue). Don't lose that.

---

## How this review was conducted

This was meant to be a fully hands-on Playwright run against a live local Supabase. That fell over for two reasons worth capturing:

- **Local Supabase fails on fresh start.** `npx supabase start` runs migrations in date order. [`20241209000000_add_analytics_and_insurance.sql`](../supabase/migrations/20241209000000_add_analytics_and_insurance.sql) `ALTER`s `public.profiles`, but `profiles` is created by [`20251005153724_*.sql`](../supabase/migrations/20251005153724_74c19063-ad0e-4068-a15b-bbab43420959.sql) (almost a year later in the timeline). After moving that migration aside, the next failure is [`20251110220722`](../supabase/migrations/20251110220722_99e2f0fc-03da-455c-8cad-e38c19794c2c.sql) referencing a function `public.can_view_provider_review` that doesn't exist (the bill-review feature was archived in [`20260125_archive_bill_review_feature.sql`](../supabase/migrations/20260125_archive_bill_review_feature.sql) and the function was dropped, but earlier policies still reference it).
- **Practical impact:** any new contractor, any CI pipeline, any disaster-recovery exercise will hit these on day one. Production doesn't reveal them because production has the schema from before migrations were tracked. This is a real Finding (§4 → "Onboarding for Devs"), not just an inconvenience for me.

I pivoted to running the dev server with the placeholder Supabase env, and stubbed an auth session via `localStorage` injection in Playwright ([helpers.ts](../tests/ux-review/helpers.ts)). Backend reads return errors, which surfaced behavior I would not otherwise have seen — see Finding #1 (skeletons-forever).

The walkthrough produced 39 full-page screenshots and ~240 lines of structured observations in [observations.md](../tests/ux-review/_artifacts/observations.md). Anywhere this report quotes a metric ("1484ms to dashboard render"), the observations file has the raw data.

**What I could test live:** landing, auth pages, dashboard empty state, upload wizard UI, navigation IA, all reachable routes, retired-route redirect behavior, mobile layout at 390px, console-error inventory.

**What I code-traced (clearly marked below):** the actual signup → intent-dialog → dashboard state machine; OCR results; Plaid Link sandbox; reimbursement PDF generation; the Stripe upgrade flow. These need a live backend to verify and are flagged ⚠️ Code-traced where they appear.

---

## Personas

- **Maya — anxious first-timer.** $4,200 ER bill, never used an HSA tool, on her phone at 11pm. Time-to-value bar: 3 minutes from arriving on the landing page.
- **Derek — HSA optimizer (adversarial).** Maxes his HSA, three years of receipts, wants speed and accuracy. Will resent anything that hand-holds.
- **Priya — chronic-care caregiver (adversarial).** Bills for self + parent. Needs bulk and family/grouping primitives.

---

## Area 1 — Time-to-value

### Stopwatch run

| Step      | Surface                                                                       | Decisions / fields          | Time (live, dev)                                                |
| --------- | ----------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------- |
| 1         | Landing page (`/`)                                                            | 0                           | 4977ms to networkidle                                           |
| 2         | Click "Start Free" (or "Get Started Free" mid-page) → `/auth`                 | 1                           | ~50ms (client-side route)                                       |
| 3         | `/auth` → choose Sign Up tab                                                  | 1                           | instant                                                         |
| 4         | Sign-up form: full name, email, password (≥8), terms checkbox, Create Account | 5                           | depends on Maya's typing                                        |
| 5         | ⚠️ Code-traced — `supabase.auth.signUp` round-trip                            | 0                           | typically 600–1200ms                                            |
| 6         | `UserIntentDialog` modal (intent: billing/HSA/both)                           | 1                           | instant render                                                  |
| 7         | If HSA selected: HSA opened-date prompt                                       | 1–2                         | (or "Skip for now")                                             |
| 8         | Redirect to `/dashboard`                                                      | 0                           | 1484ms to networkidle (with stubbed auth)                       |
| **TOTAL** |                                                                               | **8–10 discrete decisions** | **~5–8s** of perceived "system time" plus Maya's reading/typing |

Maya's clock runs out on **decisions and reads, not network**. The form itself is tight — 5 fields plus a privacy checkbox. The post-signup machinery is the friction.

### Key findings (Area 1)

#### **A1.1 — Three onboarding surfaces compete for the same moment**

Maya's first authenticated minute touches three independently-designed surfaces:

- [UserIntentDialog](../src/components/onboarding/UserIntentDialog.tsx) — modal, gates access to dashboard, asks intent + optional HSA date
- [OnboardingWizard](../src/components/onboarding/OnboardingWizard.tsx) — modal carousel, 3 screens about HSA tax advantage + workflow + "claim when ready"; auto-shows after 1s if `hasCompletedOnboarding=false` and Maya has 0–3 bills
- [EmptyStateOnboarding](../src/components/dashboard/EmptyStateOnboarding.tsx) — full-card on the dashboard with a 3-step "Upload → Organize → Setup" diagram, plus the calculator-projection hero
- Plus the persistent "Get Started 0/3 complete 0%" ribbon at the top of every authenticated page (visible in every screenshot — e.g. [001](../tests/ux-review/_artifacts/screenshots/006-10-maya-dashboard.png))

Each tells Maya something useful, but together they say: _welcome / what brings you here / let me explain the HSA / here's the 3 steps / and here's the 3 steps again / and here's a progress bar of those 3 steps_. Black hat: she dismisses the wizard reflexively (it looks like a paywall), reads the empty-state card, and then doesn't notice that the same actions exist as the ribbon at top.

**Steel-man (best case for keeping the current design):** each surface was probably added in response to a separate piece of user feedback ("users don't understand HSA mechanics" → carousel; "users don't know what to do next" → empty state; "users abandon midway" → progress ribbon). Removing any one _will_ hurt the cohort whose feedback drove it.

**Who could change hurt:** users who actually need education on HSA mechanics — Maya, especially, since her mental model is probably "this is a bill I owe," not "this is an HSA optimization opportunity."

**Where the complexity goes:** if you collapse to one surface, that one surface has to do double duty. A persona-aware dashboard (different layout if `userIntent === 'hsa'` vs `'billing'`) is the natural place for the complexity to live — but it adds branching to a page that already has six widgets.

**Smallest reversible test:** A/B the OnboardingWizard carousel against simply auto-dismissing it. Measure week-1 retention. The carousel is the most easily removed of the three; if removing it doesn't hurt retention, it earns its absence.

#### **A1.2 — "Start Saving on Healthcare Today" is a verb the wrong way around**

The dashboard zero-state H1 is "Start Saving on Healthcare Today" (or, with a calculator projection: "Let's Start Tracking"). For Maya, who arrived because she received a $4,200 bill, *saving* is the wrong word. She wants relief from a specific bill, not a savings program. Red hat: "saving on healthcare" is what a 401k brochure says. Yellow hat: when projected-savings is shown ("$X/year your personalized projection"), it's much stronger — concrete and personal.

**Recommendation:** If the calculator pre-signup hand-off is empty, lead with "Track your $4,200 ER bill" as the placeholder if Maya gave any signal about an active bill (she may not have — but consider an optional "Why are you here?" follow-up after intent). Steel-man: founder may not want to ask too many questions before showing dashboard. Smallest test: rotate three H1 variants ("Start Saving…" / "Get organized…" / "Track your first bill in 30 seconds…") and measure click-through to upload.

#### **A1.3 — The Calculator → Dashboard hand-off is the best part of onboarding and is at risk**

[Dashboard.tsx:92–129](../src/pages/Dashboard.tsx#L92) reads `sessionStorage.getItem("calculatorData")` and threads `projectedSavings` into [EmptyStateOnboarding](../src/components/dashboard/EmptyStateOnboarding.tsx). If Maya used the public calculator before signing up, her dashboard greets her with "$X/year — Your Personalized Savings Projection" instead of generic copy. **This is the one moment in onboarding where the app is concrete and personalized.** Yellow hat. Don't break it. Project memory: when you simplify onboarding, _do not_ lose the calculator hand-off.

The risk: the value lives in `sessionStorage`, which dies on tab close. If Maya signs up, gets distracted, comes back tomorrow, the projection is gone. Recommendation: persist `calculator_data` to the user's profile on signup so it survives. Smallest test: mirror to profile and re-read on dashboard mount.

#### **A1.4 — The Get-Started 0/3 ribbon is a shame bar**

The ribbon at the top of every authenticated page reads "Get Started — Upload Bill · See Value · Connect Accounts · 0/3 complete 0%." Visible in every authenticated screenshot. For Maya it's a useful nudge for her first session. By session two, when she's uploaded one bill, it still says 1/3. By month three, when Derek is using the app daily, it's still there saying 1/3 because he never connected a bank.

**Steel-man:** progress bars increase activation. Linear's onboarding ribbon is iconic. Removing it would lose a measurable activation lift.

**Where complexity goes:** it has to know when to disappear. Per-user dismiss state, plus a "graduate" trigger (e.g. >5 bills or any reimbursement). That's three new state fields.

**Smallest test:** auto-dismiss after the user has uploaded ≥3 bills _and_ has been a user for ≥7 days. Measure whether retention drops vs. control where the ribbon stays. If it doesn't, ship the dismiss.

---

## Area 2 — Workflow coherence

### Workflow 1 — Add HSA account

**Intended path:** Settings → HSA Accounts section → "Add" dialog → fill name, opened_date, optional eligibility/QLE fields → save.

**Entry points found:**

- [Settings.tsx](../src/pages/Settings.tsx) — primary surface, via [HSAAccountManager](../src/components/hsa/HSAAccountManager.tsx) modal
- HSA opened-date is _also_ asked in [UserIntentDialog](../src/components/onboarding/UserIntentDialog.tsx) (without creating an HSA account record — only writes `profiles.hsa_opened_date`)
- HSA opened-date is _also_ asked in [EmptyStateOnboarding](../src/components/dashboard/EmptyStateOnboarding.tsx) banner if missing
- [MissingHSADateBanner](../src/components/dashboard/MissingHSADateBanner.tsx) appears on Dashboard if there are bills but no HSA date

**Coherence problem:** "HSA opened date" (a `profiles` column) and "HSA account" (an `hsa_accounts` row) are separately modeled and separately collected. Maya enters her HSA opened date in the intent dialog and reasonably believes she has "set up her HSA." She has not — she still needs to add an `hsa_accounts` row in Settings to enable claim generation. This is a workflow rupture.

**Recommendation:** Drop `profiles.hsa_opened_date` and _only_ maintain HSA accounts. The intent dialog should say "We'll set up your HSA next" rather than asking for a date that lives in the wrong place. Or: when the user enters an opened date in onboarding, automatically create an `hsa_accounts` row from it (`account_name = "My HSA"`). Counter-argument: this conflates user intent (probably has an HSA somewhere) with confirmed account data; some users won't yet know their provider name and you'd be creating ghost rows. Smallest test: when opened-date is provided in onboarding, create a row named "My HSA — please update" and surface it in Settings.

### Workflow 2 — Upload a receipt

The wizard at [BillUploadWizard.tsx](../src/components/bills/BillUploadWizard.tsx) is the strongest single piece of UX in the app. Yellow hat. Specifically:

- All metadata fields are optional ([line 372–373](../src/components/bills/BillUploadWizard.tsx#L372)) — Maya can save a bill with just a file
- OCR fires automatically on image upload and pre-fills vendor / amount / date / category, with a "✨ AI" badge per filled field ([line 271–330](../src/components/bills/BillUploadWizard.tsx#L271))
- Coach marks for first-upload only, dismissible ([line 186–192](../src/components/bills/BillUploadWizard.tsx#L186))
- Side-by-side document preview + intake form ([line 700–760](../src/components/bills/BillUploadWizard.tsx#L700))
- Duplicate detection: vendor + amount + date warning, but saves anyway ([line 432–462](../src/components/bills/BillUploadWizard.tsx#L432))
- Inline care-event creation without leaving the form

**Entry points:**

- `/bills/new` (sidebar Bills → "+ Upload")
- `/bills/upload` (duplicate route — both render `<NewBillUpload>`, [App.tsx:138–147](../src/App.tsx#L138))
- Dashboard QuickActionBar / EmptyStateOnboarding "Upload Your First Bill"
- Top-nav "Upload Bill" button (yellow, persistent)
- Get-Started ribbon "Upload Bill"

That's **5 entry points**, all leading to the same wizard. Three are durable and well-placed; the dual `/bills/new` and `/bills/upload` route is dead duplication. Black hat: the duplicate routes silently exist forever, taking up TypeScript surface area and confusing future contributors. Cut `/bills/upload` and 301 anyone hitting it.

**Mobile bug — see Top-5.** The bottom tab nav overlaps the wizard's Cancel/Continue buttons at 390px. [041-mobile-upload-wizard.png](../tests/ux-review/_artifacts/screenshots/038-41-mobile-upload-wizard.png) shows it cleanly. Fix: `pb-24` on the wizard's outer container on mobile, or render the wizard in a layout that suppresses the bottom nav.

**"Drag & drop or click to browse"** is desktop language ([BillUploadWizard.tsx:591](../src/components/bills/BillUploadWizard.tsx#L591)). On mobile, the dropzone correctly invokes the file picker, but the _copy_ still says "drag & drop." Switch to "Take a photo or choose a file" on `useIsMobile()`. Smallest test: a one-line copy swap.

### Workflow 3 — Link Plaid bank

⚠️ Code-traced (PLAID_CLIENT_ID etc. not in placeholder env). Entry points:

- Settings → "Bank Accounts" section
- Standalone `/bank-accounts` page
- Dashboard QuickActionBar (one of the contextual CTAs)
- Get-Started ribbon "Connect Accounts"

The flow uses [PlaidLink.tsx](../src/components/PlaidLink.tsx) and an edge function `plaid-create-link-token`. **Edge case observation from code-trace:** [BankAccounts.tsx](../src/pages/BankAccounts.tsx) has a 3-retry mechanism for the manual sync. The auto-sync (background) is invisible to the user — there's no "last synced" timestamp on the bank-accounts list. Black hat: a user who linked a bank on Monday and uploaded a $200 bill on Tuesday will not know whether the auto-sync has matched it to a real bank transaction or whether they need to manually trigger.

**Recommendation:** "Last synced X minutes ago / Sync now" on each bank connection card. Smallest test: add timestamp + button, no algorithm change.

### Workflow 4 — Submit reimbursement

⚠️ Code-traced. [HSAReimbursement.tsx](../src/pages/HSAReimbursement.tsx) lets the user filter HSA-eligible unreimbursed expenses by HSA opened date, select multiple, choose an HSA provider (9 named + Other), then download a PDF or "submit." **The "submit" path is unclear** — there's no edge function I can find that emails or transmits the request. The user downloads a PDF and is presumably expected to manually file with their HSA provider.

The empty state is good (see [reimbursement-requests screenshot](../tests/ux-review/_artifacts/screenshots/016-route-reimbursement-requests.png)) — "No reimbursement requests yet" + "Create First Request" — but a `Failed to load reimbursement requests` toast also fires from a separate fetch. The empty state and the error coexist, which is noisy.

**Coherence problem:** there are _two_ reimbursement surfaces — `/reimbursement-requests` (list page with empty state) and `/hsa-reimbursement` (the filtered selector + PDF generator). They are conceptually different but the URL structure suggests they should be one resource. Pick one canonical "claim" workflow, route everything through it.

### Workflow 5 — Track a bill

This is where the IA gets cluttered. **Four top-level surfaces** operate on overlapping data:

- `/bills` — list of invoices, filters
- `/ledger` — "unified view, Phase 2 — parallel to Bills" (per [App.tsx comment](../src/App.tsx#L441))
- `/collections` — bills grouped into Care Events
- `/documents` — receipts/files

A user who uploaded a receipt does not know which of these to look at to find it later. Code-trace suggests `/ledger` is intended to eventually replace `/bills` ("Phase 2 parallel"), but the parallel state is the bug. Yellow hat: progressive migration is sometimes the right call. Black hat: it's been "Phase 2 parallel" for at least two months (per `20260413_create_ledger_view.sql`) — long enough for users to be confused.

See Area 3 for simplification proposal.

---

## Area 3 — UI simplification candidates

### **A3.1 — Collapse Bills / Ledger / Collections / Documents to one surface with views**

**Current state:** four routes, four sidebar items (Bills, Ledger, Care Events, Documents).

**Proposal:** one surface — call it "Bills" or "Expenses" — with a tab/view switcher: List · Care Events · Documents. The Ledger view is the "List + payment history" composite, which can be a third tab or the default for Plus users.

**Steel-man:** each surface has a distinct mental model. Ledger is for "money in/out tracking," Collections for "episode-of-care narrative," Documents for "search receipts as a file system." Merging them flattens those models.

**Who it hurts:** Derek, who likes that Ledger gives him a tabular dump with payment statuses. If the merged surface defaults to a card-based Care Events view, Derek loses his preferred data density.

**Where complexity goes:** into the view-switcher UX. Tabs are cheap; preserving deep links into a specific view (`/expenses?view=ledger`) means routing rules.

**Smallest reversible test:** before merging, make `/ledger` redirect to `/bills?view=ledger` for a week. Watch retention and time-on-page. If users in the ledger cohort don't complain, merge.

### **A3.2 — Settings: 10-section scroll → tabbed**

[Settings.tsx](../src/pages/Settings.tsx) hosts 10 sections in a single scroll: Subscription, App Preferences, PWA install, Profile + HSA date, HSA Accounts, Security, Payment Methods, Bank Accounts, Notifications (placeholder), Delete Account. Live measurement was blocked by the auth bounce (live test landed in the intent dialog), so this is code-traced.

**Proposal:** tabs / sections — Account · Subscription · HSA · Bank & Cards · Notifications · Security & Data. Five tabs, each a focused page.

**Steel-man:** linear scroll is faster for power users who use Cmd-F. Tabs add a click. The current page is the simpler architecture.

**Who it hurts:** Derek, who can scroll-and-scan once. Maya, who has to know which tab her HSA date lives in.

**Where complexity goes:** into deep-linking. `/settings#bank` solves desktop scrolling; `/settings/bank` solves the IA but breaks any existing bookmarks.

**Smallest test:** add anchor-jump links at the top of the current page ("Account · HSA · Banking · Subscription"). Measure scroll-depth via analytics. If users routinely scroll past 60%, the page is too long; tabs help. If they don't, the page is fine.

### **A3.3 — Dashboard widget stack**

The dashboard renders, in order: MissingHSADateBanner, AttentionBanner, EmptyStateOnboarding (zero-state) OR (TotalValueCard + QuickActionBar + HSAHealthCheck + Recent Bills + WellbieTip). Plus the OnboardingWizard modal possibly auto-opening.

For Maya the empty-state is fine. For Derek (lots of data), the dashboard becomes a wall of cards. **Recommendation:** persona-aware default order — for `userIntent === 'hsa'`, lead with HSAHealthCheck and HSA-claimable amount; for `'billing'`, lead with attention-list (unmatched payments, OCR failures, etc.). Steel-man: a single dashboard is simpler to maintain. Smallest test: persona-default _order_ (not different widgets), preserve dismissibility per widget.

### **A3.4 — Wizards vs modals vs pages: pick a pattern**

- BillUploadWizard: page (`/bills/new`)
- OrganizeWizard: modal
- OnboardingWizard: modal carousel
- UserIntentDialog: modal (gates the app)
- TransactionSplitDialog: modal
- HSAAccountManager: modal

The choice between page and modal looks accidental. Heuristic: anything that should preserve URL state on refresh, or might be linked-to, is a page. Anything that's truly transient (split a transaction) is a modal. By that rule, OnboardingWizard probably should be a page (`/welcome`) so abandoning mid-flow doesn't lose state on refresh. Smallest test: convert OnboardingWizard to a page, see if completion rate changes. Steel-man for status quo: the carousel is intentionally lightweight; making it a page raises its perceived weight.

### **A3.5 — Top nav has redundant entries**

The top `AuthenticatedNav` shows Home · Bills 0 · Care Events · Reports plus Wellbie and an Upload Bill button. The sidebar repeats Home · Bills · Ledger · Care Events · Reports · Documents · HSA Guide · etc. **Redundancy ratio:** at least 4 items appear in both. Steel-man: redundancy aids learnability. Counter: it also doubles the visual budget for navigation. Recommendation: the top bar should hold _only_ the persistent action (Upload Bill), the brand, and Wellbie; sidebar holds navigation. Smallest test: hide top-nav route links on `lg+`, keep on mobile. Watch click-distribution.

---

## Area 4 — Dimensions the brief didn't name

### **A4.1 — Skeleton-forever / failed-fetch fallback (severity: critical)**

Already in the Top-5. Concretely: [Dashboard.tsx:254–259](../src/pages/Dashboard.tsx#L254) gates render on `loading`, which only flips to `false` _after_ `supabase.auth.getSession()` resolves. The fetch functions (`fetchStats`, `fetchTransactionStats`, `checkBankConnection`) catch their own errors silently via `logError`, but if the session resolves with no data and no error, the dashboard still renders skeleton placeholders for the remaining queries that haven't returned. Bills, Ledger, Collections show the same pattern (a centered spinner — see [014-route-collections.png](../tests/ux-review/_artifacts/screenshots/014-route-collections.png)).

Reports gets it right: the empty state renders, _and_ a toast surfaces "Failed to load analytics" ([reports screenshot](../tests/ux-review/_artifacts/screenshots/034-22-derek-reports.png)). That pattern should be the model for every fetch-driven page. Recommendation: add a global React Query default of `staleTime`/`retry`/`onError` that flips the page to a degraded view rather than spinner-eternity. Smallest test: pick Bills, add a 5s timeout that flips to "We're having trouble loading your bills — try again" with a Retry button. Measure refresh-loop rate.

### **A4.2 — Trust signals**

Landing page trust badges read "Bank-Level Security · HIPAA Compliant · 256-bit Encryption" ([001-landing.png](../tests/ux-review/_artifacts/screenshots/001-01-landing.png)). Good. **But:** inside the app, there is no in-product reinforcement of these signals. When Maya is asked to enter her HSA opened date, there's no "🔒 stored encrypted, never shared" inline. When she scans a receipt, there's no "image processed, not retained for AI training." For a HIPAA-relevant app, trust cues should be in-product, not just on the marketing site. Recommendation: a single repeating microcopy convention (e.g. small lock icon + "Encrypted at rest" tooltip) on every PHI-collecting field. Steel-man: too many trust signals is itself a signal of nervousness. Smallest test: add to one field group (HSA section in Settings), measure dwell time.

### **A4.3 — Vocabulary alignment**

Three terms collide:

- URL: `/collections`
- UI label: "Care Events" ([AppSidebar.tsx:65–69](../src/components/AppSidebar.tsx#L65))
- Landing page card: "Organize by Collection" ([Index.tsx](../src/pages/Index.tsx))
- Database table: `collections`

Maya is told three different things. Pick "Care Events" (consumer-friendly, healthcare-native) and propagate. The URL is a 60-line sed; the database can stay `collections` internally. Steel-man: "collection" is the engineering term and changing the URL is irreversible. Counter: 301 redirects are a one-line route. Smallest test: change the landing page card today, change the URL after the next deploy. Both reversible.

Other vocabulary asks: **"Ledger"** is unfamiliar to Maya (consumer-language: "Activity" or "Transactions"). **"Reimbursement Requests"** is correct but cold; for Maya, "Get money back from your HSA" might convert better as a button label.

### **A4.4 — Activation moment**

What is the single event that, once it happens, materially raises retention? My read: the **first reimbursement PDF generated**. Until then, Wellth.ai is "another receipt-tracking app." After the first PDF, the user has experienced the unique value-prop (HSA paper trail → real money back). Wellth.ai today has [celebrateFirstReimbursement](../src/lib/confettiUtils.ts) — confetti on first claim. Good. But **the journey to that confetti requires:** account, HSA opened date, ≥1 HSA-eligible bill, picking a provider, generating a PDF. That's five steps, none of which are explicit on the dashboard.

**Recommendation:** explicit "Steps to your first reimbursement" gauge — replaces or augments the Get-Started ribbon. Each step strikes through as completed. Steel-man: this presupposes HSA users; for billing-only users, the activation moment is different (maybe "first bill organized into a Care Event"?). Persona-branch the activation gauge. Smallest test: define `is_activated` for HSA users as `had_first_reimbursement`, instrument it, see what % of week-1 users hit it today.

### **A4.5 — Retention loops**

**There are no automated re-engagement loops.** No weekly digest email, no "you have 3 unmatched transactions to review" push, no "your tax-savings estimate this year so far" email. Code-trace confirms Resend is wired up but I can find no scheduled job that uses it for re-engagement (only transactional). For Maya — who uploaded one bill, panicked, went to bed — what brings her back in week 2 is _nothing_. Build a weekly digest. Steel-man: most apps abuse email. Counter: a healthcare-finance app _under-emails_ relative to user need. Smallest test: a manual-trigger weekly digest for the first cohort of beta users, measure week-2 return.

### **A4.6 — Subscription gating placement**

Free Plan / Plus ($9.99) / Premium ($19.99) per CLAUDE.md. In the live walkthrough I did **not** see any feature blocked by tier — every page rendered (under stubbed auth). The sidebar footer "Free Plan · Upgrade" is a quiet, persistent reminder ([AppSidebar.tsx:257–267](../src/components/AppSidebar.tsx#L257)). Code-trace shows [FeatureGate](../src/components/subscription/FeatureGate.tsx) wraps Plus features but I didn't trip a gate during the walkthrough. **Hypothesis:** subscription gating is currently aspirational. If so, that's fine for a beta but worth clarifying — gates that don't fire don't drive conversion. Smallest test: pick _one_ feature to actually gate (e.g. "AI bill review" reincarnated, or batch upload >3 files) and measure conversion.

### **A4.7 — Mobile vs desktop parity**

Mobile gets a different IA (bottom-tab variant by HSA presence) and a different CTA hierarchy. The most visible defect: bottom nav clipping the upload wizard at 390px. Beyond that, mobile is a respectable port. Empty-state cards stack cleanly. The Wellbie tab is its own bottom-nav slot — discoverable. The desktop sidebar is correctly hidden via `lg:hidden`.

**One real divergence I'd flag:** on desktop the `Wellbie` link top-right is a small icon-style button; on mobile it's a full bottom-tab. That mismatches Wellbie's discoverability across devices. Pick one — either make Wellbie a persistent floating action button on desktop, or remove the bottom-nav slot and rely on a discoverable header on mobile. Smallest test: instrument open-rate by device; the device with lower open-rate gets a more prominent treatment.

### **A4.8 — Cognitive load budget**

Decisions to reach "first useful screen" (live count): **8–10**, including the privacy checkbox, intent radio, optional HSA date, dismissing the carousel. That's high-but-survivable. Each is a single click except for the password (8+ char rule) and the HSA date (date picker requires recall). Code-trace adds the back-pressure: the OnboardingWizard's three carousel screens each require a `Next` click. So the real number is closer to **11–13** if Maya doesn't skip.

**Reduction levers, ranked:**

1. Auto-dismiss the OnboardingWizard for `userIntent === 'billing'` (saves 3 clicks for a cohort that doesn't need HSA explanation).
2. Combine intent + HSA date into one screen with progressive disclosure (saves 1 screen).
3. Change HSA date input to a "year I opened my HSA" coarse selector (skip-friendly).
   Smallest test: lever 1 only. Measure week-1 retention vs control.

### **A4.9 — Discoverability of secondary features**

- **Wellbie chat:** discoverable (top nav + sidebar + bottom-tab).
- **Reports:** sidebar + dashboard "View Reports" button + top nav. Discoverable.
- **HSA Calculator:** sidebar (HSA group) + landing page link. **Hidden in the sidebar's HSA section, which is collapsible.** If Maya has `userIntent: 'billing'` (no HSA features) the Calculator never appears. That's fine, but: a billing-only user who later wants to compute HSA savings has no path. Recommendation: keep the calculator always-accessible, even for billing-intent users.
- **HSA Guide:** sidebar (Insights group). Solid placement.
- **Pre-purchase Decision** at `/savings-calculator` is the same page as the public calculator, served behind auth. Functional but the URL is ambiguous (it's both pre-purchase and savings calculator).

### **A4.10 — Accessibility (live observations)**

Quick scan, not exhaustive:

- Landing page H1 wraps onto two lines, semantically a single H1. Good.
- Auth form fields have proper `<Label htmlFor>` pairings ([Auth.tsx](../src/pages/Auth.tsx)). Good.
- Several pages return "(no heading found)" in the live walkthrough — `/bills`, `/ledger`, `/collections`, `/documents` — meaning their first heading is rendered after a network call, _and_ there's no semantic landmark before that. Screen reader users hit those pages and get nothing announced. Recommendation: add an `<h1>` skeleton above the main content area that is visible immediately.
- The DashboardSkeleton uses `<Loader2>` icons but no `aria-live="polite"` on the loading region. Screen reader users wait silently.
- 40 React-ref warnings on the Dashboard (function components passed refs through `Slot.SlotClone` in NavLink). Not a user-facing a11y issue but pollutes the console and risks future regressions.

Smallest test: add an `<h1>` skeleton + visually-hidden "Loading dashboard data" `aria-live` region. Single PR.

### **A4.11 — Performance perception**

Dev-mode landing page took 4977ms to networkidle (fonts + analytics). Dashboard render in 1484ms after auth. These are dev numbers; production with PWA + service worker should be faster. The PWA's `runtimeCaching` rule for Supabase calls uses NetworkFirst with a 10s timeout — meaning a slow Supabase response stalls the page for up to 10s. For Maya on flaky 4G, this _is_ the skeleton-forever path. Recommendation: drop NetworkFirst timeout to 3s for read-only Supabase queries, with stale-while-revalidate fallback. Steel-man: stale data is wrong for HSA accounting. Counter: stale data + a "last synced 12 minutes ago" pill is acceptable for a _display_ page.

### **A4.12 — Copy quality**

Worth quoting:

- ✅ "Your HSA Could Be Saving You Thousands More" (landing) — concrete, aspirational
- ✅ "There's no time limit on reimbursements. Pay out-of-pocket today, let your HSA grow, and reimburse yourself years later" — clearest copy in the app, in the OnboardingWizard
- ❌ "Wellth.ai builds your paper trail" (OnboardingWizard screen 2) — "paper trail" sounds like work; persona-mismatched for Maya
- ❌ "All Requests · Showing 0 of 0 request(s)" (HSAReimbursement) — boilerplate-y
- ❌ "Start Saving on Healthcare Today" (dashboard) — wrong verb for Maya's frame
- ❓ "Optimize My HSA/FSA · investment tracking" (intent dialog) — promises feature ("investment tracking") that isn't really in the app yet

### **A4.13 — Telemetry gap**

[analytics.ts](../src/lib/analytics.ts) writes to `analytics_events` (per the migration that broke local). No funnel definition, no activation-event consensus, no dashboard for retention. **Without telemetry, the smallest tests in this report are unmeasurable.** Highest-leverage non-UI work: define `signup`, `intent_selected`, `first_bill_uploaded`, `first_reimbursement_pdf` as named events; build a 5-row weekly funnel report. Smallest test: PostHog or Plausible plug-in (1 day) for events. Defer dashboards.

### **A4.14 — Onboarding for devs**

Local Supabase is broken (see "How this review was conducted"). For a solo founder this is fine; the moment you bring on contractor #1 they're blocked. Recommendation: add a `make dev` (or `npm run dev:fresh`) that runs `supabase start` and bails with a clear error if migrations don't apply, plus fix the two known migration ordering bugs. Steel-man: any contractor will navigate it. Counter: every minute of day-1 friction signals "this codebase doesn't expect new contributors," which is its own retention issue at the team level.

---

## Area 5 — Synthesis

### Top 5 with full steel-man

#### **#1 — Skeleton-forever on Dashboard / Bills / Ledger / Collections**

- **Finding:** if a Supabase fetch stalls, the page renders skeleton placeholders indefinitely. No timeout, no error path, no fallback. Reports has the right pattern; others don't.
- **Steel-man:** indefinite skeletons are honest — they reflect actual loading state. Adding artificial timeouts can flash error-state for users on a 5s connection that would have completed at 6s.
- **Who it hurts to fix:** users on truly slow connections who would prefer to wait 10s rather than see a "we're having trouble" message at 5s.
- **Where complexity goes:** retry/timeout state on every list page. Best lived in a shared React Query default + an `<EmptyOrErrorBoundary>` wrapper.
- **Smallest reversible test:** add a 5s timeout to the Bills page query only, with a "Try again" empty state. Measure refresh-rate and bounces.

#### **#2 — Mobile bottom nav clips upload wizard CTAs**

- **Finding:** at 390px, the wizard's Cancel / Continue buttons are partially hidden behind the bottom tab nav. Visible in [041-mobile-upload-wizard.png](../tests/ux-review/_artifacts/screenshots/038-41-mobile-upload-wizard.png).
- **Steel-man:** none — this is an unambiguous bug. The only argument for keeping it: it's invisible to anyone reviewing on desktop, so it never gets reported.
- **Who it hurts:** every mobile user attempting their first bill. The activation action.
- **Where complexity goes:** trivial — `pb-24` on the wizard container or render the wizard in a layout that suppresses the bottom nav.
- **Smallest test:** ship the fix. This is not an experiment.

#### **#3 — Three competing onboarding surfaces**

- **Finding:** UserIntentDialog modal, OnboardingWizard carousel, EmptyStateOnboarding card, plus the Get-Started 0/3 ribbon — all firing within Maya's first minute.
- **Steel-man:** each was added to address a specific gap. The carousel teaches HSA mechanics that Maya may genuinely need. Removing it punishes the cohort that doesn't already understand the value-prop.
- **Who it hurts to consolidate:** the intent dialog is load-bearing (drives feature gating). Removing the carousel hurts users who would have benefited from the HSA explanation.
- **Where complexity goes:** persona-aware onboarding (`userIntent === 'billing'` skips the carousel). Smarter conditional than today's "show if `expenseCount <= 3`" heuristic.
- **Smallest reversible test:** auto-dismiss the OnboardingWizard for billing-intent users. Measure week-1 retention vs control.

#### **#4 — Bills/Ledger/Collections/Documents IA collapse**

- **Finding:** four top-level surfaces operating on the same underlying data. Vocabulary leaks ("Care Events" vs "collections"). Maya doesn't know where to look for the bill she just uploaded.
- **Steel-man:** Ledger is for accounting-minded users; Collections is for narrative-minded (episodes of care); Bills is the default; Documents is for file-search. These mental models are real and serving different needs is correct.
- **Who it hurts to merge:** Derek's preferred dense ledger view, if it becomes a tab buried under a card-based default.
- **Where complexity goes:** a view-switcher UI plus deep-link preservation. Tabs are cheap; the work is migrating users without breaking bookmarks.
- **Smallest reversible test:** redirect `/ledger` to `/bills?view=ledger` for one week. If no support tickets and no time-on-page collapse, merge.

#### **#5 — Migration ordering blocks local dev**

- **Finding:** fresh `npx supabase start` fails on `20241209000000` and `20251110220722`. New contractors / CI / disaster recovery are blocked.
- **Steel-man:** production runs fine, the cost-of-fix exceeds the cost-of-leaving for a solo founder.
- **Who it hurts to fix:** no one — repointing the bad migrations to land after their dependencies is reversible.
- **Where complexity goes:** rename / merge the broken migrations so they apply in correct dependency order. Or wrap them in `IF EXISTS` / `DO $$` guards.
- **Smallest reversible test:** the fix _is_ the test — `npx supabase start` should succeed on a fresh checkout. Add a CI job that verifies it.

### Top 3 "draft" recommendations (suspected, not fully justified)

- **D1 — The Auth tab should default to Sign Up when arriving from landing page CTAs.** Currently defaults to Sign In. I haven't measured the split between organic returning vs new-from-landing, so I'm not certain. Read landing page CTA URLs and tag them.
- **D2 — The Wellbie chat may be dispensable for billing-intent users.** It's three entry points worth of UI real estate; I have no telemetry on how often Maya-class users open it. Could test by hiding the bottom-tab and top-nav for `userIntent === 'billing'` users.
- **D3 — The OnboardingWizard's "paper trail" framing might be hurting more than helping.** I read it as anxiety-inducing for Maya, but I have no copy-test data. Try "Wellth keeps your records so you can claim later."

### The single change for Maya, and what Derek pays

**The change:** auto-dismiss the OnboardingWizard carousel for `userIntent !== 'hsa'` users, _and_ drop the Get-Started ribbon's visibility on every page in favor of showing it only on `/dashboard`.

**Why this:** it removes the most aggressive layering without losing capability. The carousel still exists for HSA-intent users who need the education. The ribbon still exists for users who land back on `/dashboard`. Maya gets a calm dashboard instead of a hectoring one.

**Derek's price:** he doesn't actually pay anything in this version — he probably never sees the carousel anyway (already activated) and the ribbon would only re-appear when he visits `/dashboard`. **A version of this change that _would_ hurt Derek:** if you simultaneously remove the dashboard's six-widget stack in favor of a "just the action items" minimal view, Derek loses his daily check-in surface. Don't do both at once.

### Pre-mortem

It's six months from now. The single-change shipped — carousel auto-dismisses, ribbon scoped to dashboard. The autopsy says:

> Week-1 retention dropped 6%. The OnboardingWizard carousel was carrying more weight than we thought — it was _not_ educational for users who didn't read it, but the act of clicking "Next" three times was a behavioral commitment. Removing that commitment moment removed the trip-wire that prevented half-engaged users from churning. We confused "users skip this" with "users get nothing from this."
>
> Separately, scoping the Get-Started ribbon to only `/dashboard` had the side effect of users who were on `/bills` not seeing the "Connect Accounts" prompt and never linking a bank, hurting the conversion to the moment that drove paid upgrade.

That autopsy is plausible enough that the smallest-test discipline matters: ship the carousel change and the ribbon change _separately_, with telemetry on the activation events, and revert either independently if the funnel cracks.

---

## Appendix

### Critical files referenced

- Onboarding: [UserIntentDialog](../src/components/onboarding/UserIntentDialog.tsx), [OnboardingWizard](../src/components/onboarding/OnboardingWizard.tsx), [EmptyStateOnboarding](../src/components/dashboard/EmptyStateOnboarding.tsx), [Auth](../src/pages/Auth.tsx)
- Dashboard: [Dashboard](../src/pages/Dashboard.tsx), [DashboardSkeleton](../src/components/skeletons/DashboardSkeleton.tsx)
- Workflows: [BillUploadWizard](../src/components/bills/BillUploadWizard.tsx), [PlaidLink](../src/components/PlaidLink.tsx), [HSAReimbursement](../src/pages/HSAReimbursement.tsx), [HSAAccountManager](../src/components/hsa/HSAAccountManager.tsx)
- IA: [App](../src/App.tsx), [AppSidebar](../src/components/AppSidebar.tsx), [BottomTabNavigation](../src/components/BottomTabNavigation.tsx), [AuthenticatedLayout](../src/components/AuthenticatedLayout.tsx), [Settings](../src/pages/Settings.tsx)
- Migrations (broken): [`20241209000000_*`](../supabase/migrations/20241209000000_add_analytics_and_insurance.sql), [`20251110220722_*`](../supabase/migrations/20251110220722_99e2f0fc-03da-455c-8cad-e38c19794c2c.sql)

### Artifacts

- Walkthrough scripts: [tests/ux-review/](../tests/ux-review/)
- Raw observations: [tests/ux-review/\_artifacts/observations.md](../tests/ux-review/_artifacts/observations.md)
- Screenshots (39 PNGs, ~5 MB): [tests/ux-review/\_artifacts/screenshots/](../tests/ux-review/_artifacts/screenshots/)
- Re-run: `npm run dev` in one terminal, then `npx playwright test --config=tests/ux-review/playwright.config.ts --project=desktop`

### What I could not verify live

- Real `supabase.auth.signUp` round-trip latency
- OCR result quality and edge cases (real Gemini call gated by edge function secrets)
- Plaid Link sandbox flow (PLAID_CLIENT_ID required)
- Reimbursement PDF generation end-to-end
- Stripe upgrade flow (publishable key required)
- Email delivery via Resend (server-only)

For each of the above, my code-trace conclusions are tagged ⚠️ Code-traced inline. They should be re-verified once a working local Supabase or sandbox setup exists.
