-- Widen the picker: a record can cover a distribution that has already happened.
--
-- THE GAP. claimable_expenses() answers one question -- "what can I still ask
-- the custodian for?" -- and the record generator has been using it as though
-- it answered a different one: "what do I need to be able to prove?" Those sets
-- are not the same, and the difference is exactly the spend that an examiner is
-- most likely to ask about.
--
--   not_reimbursable   The HSA card paid the provider directly. The
--                      distribution ALREADY HAPPENED. Pub 969 requires records
--                      showing it was for qualified care, and Notice 2004-2
--                      Q&A-29/30 puts that burden on the account holder rather
--                      than the custodian -- yet this expense could never enter
--                      a Medical Expense Record, because it can never enter a
--                      claim.
--   reimbursed         The holder already took the money out. Same argument.
--                      The record is the evidence for a distribution that is
--                      now in the past, which is when it matters most.
--   locked_in_request  Sitting in a live claim. Belongs in the year's record;
--                      excluding it makes the annual file silently incomplete.
--
-- reimbursed_externally is deliberately NOT included. Someone else paid the
-- holder back, so no HSA distribution occurred and there is nothing about it to
-- substantiate to the IRS. It stays out of both sets.
--
-- WHAT THIS DOES NOT CHANGE. The database already permitted this: Phase 1
-- (20260906130000) gated guard_record_item_insert()'s CLAIM_HSA_CARD_PAID and
-- CLAIM_NOTHING_REMAINING checks on purpose = 'claim', and narrowed the
-- one-live-claim unique index to claims. So a record over an already-paid
-- expense already inserted cleanly. The only thing missing was a read that
-- offered it. Nothing here loosens a claim: `claimable` below is the same
-- predicate claimable_expenses() has always applied, moved rather than rewritten.
--
-- WHY claimable_expenses() SURVIVES. It is rewritten as a thin filter over the
-- new function so there is one definition of claimability, but it is NOT
-- dropped. Migrations are applied to production BEFORE the code that uses them
-- merges, so between those two moments the live frontend is still calling
-- claimable_expenses() by name. Dropping it here would take the Reimburse page
-- down for the length of that window.

-- ── The superset ──────────────────────────────────────────────────────────
-- Every expense the holder has confirmed eligible, whatever has since happened
-- to the money, with the facts a caller needs to narrow it back down.

CREATE OR REPLACE FUNCTION public.substantiatable_expenses()
RETURNS TABLE(
  invoice_id          UUID,
  vendor              TEXT,
  service_date        DATE,
  tax_year            INTEGER,
  category            TEXT,
  patient_name        TEXT,
  full_amount         NUMERIC,
  remaining_amount    NUMERIC,
  claim_state         TEXT,
  claimable           BOOLEAN,
  confirmed_at        TIMESTAMPTZ,
  rule_id             TEXT,
  rule_name           TEXT,
  rule_section_ref    TEXT,
  documentation_state TEXT,
  documents           JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
  SELECT
    i.id,
    i.vendor,
    i.effective_service_date,
    EXTRACT(YEAR FROM i.effective_service_date)::INT,
    i.category,
    i.patient_name,
    -- What the expense cost: what a RECORD documents. An expense reimbursed in
    -- full has a remaining amount of zero, and a record totalling $0.00 over
    -- real medical care would be worse than no record at all.
    COALESCE(i.reimbursable_amount, i.amount_paid, i.amount),
    -- What is still owed to the holder: what a CLAIM asks for.
    GREATEST(COALESCE(i.reimbursable_amount, i.amount_paid, i.amount)
             - COALESCE(i.reimbursed_amount, 0), 0),
    i.claim_state::TEXT,
    -- The claim predicate, unchanged from claimable_expenses(). It lives here
    -- so the screen, the guard and the unique index cannot drift: a caller asks
    -- whether an expense is claimable rather than reassembling the rule.
    (
      i.claim_state = 'unclaimed'
      AND GREATEST(COALESCE(i.reimbursable_amount, i.amount_paid, i.amount)
                   - COALESCE(i.reimbursed_amount, 0), 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM substantiation_record_items sri
         WHERE sri.invoice_id = i.id
           AND sri.record_status <> 'voided'
           AND sri.record_purpose = 'claim'
      )
    ),
    i.confirmed_at,
    i.eligibility_basis_rule_id,
    pr.name,
    pr.section_ref,
    i.documentation_state,
    -- The document set, not a count: the record's PDF embeds these images and
    -- the packet bundles the files themselves. A second round trip for them
    -- would let the picker and the packet disagree about what is attached.
    COALESCE(
      (SELECT JSONB_AGG(
                JSONB_BUILD_OBJECT(
                  'path', r.file_path,
                  'type', r.document_type,
                  'description', r.description)
                ORDER BY r.uploaded_at)
         FROM receipts r
         JOIN receipt_invoices ri ON ri.receipt_id = r.id
        WHERE ri.invoice_id = i.id),
      '[]'::JSONB
    )
  FROM invoices i
  LEFT JOIN pub_502_rules pr ON pr.id = i.eligibility_basis_rule_id
  WHERE i.user_id = auth.uid()
    AND i.eligibility_state = 'eligible'
    AND i.claim_state <> 'reimbursed_externally'
  ORDER BY i.effective_service_date ASC, i.vendor ASC;
$fn$;

COMMENT ON FUNCTION public.substantiatable_expenses() IS
  'Every expense confirmed eligible, whatever has happened to the money since -- the set a Medical Expense Record may cover. claimable = the narrower set a reimbursement claim may cover. Excludes reimbursed_externally: no HSA distribution occurred, so there is nothing to substantiate.';

GRANT EXECUTE ON FUNCTION public.substantiatable_expenses() TO authenticated;

-- ── The claim view over it ────────────────────────────────────────────────
-- Same signature and same rows as before; the predicate now has one home.
-- Kept rather than dropped so the deployed frontend keeps working in the
-- window between this migration being applied and the new code merging.

CREATE OR REPLACE FUNCTION public.claimable_expenses()
RETURNS TABLE(
  invoice_id          UUID,
  vendor              TEXT,
  service_date        DATE,
  tax_year            INTEGER,
  category            TEXT,
  patient_name        TEXT,
  remaining_amount    NUMERIC,
  confirmed_at        TIMESTAMPTZ,
  rule_id             TEXT,
  rule_name           TEXT,
  rule_section_ref    TEXT,
  documentation_state TEXT,
  documents           JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
  SELECT
    s.invoice_id, s.vendor, s.service_date, s.tax_year, s.category,
    s.patient_name, s.remaining_amount, s.confirmed_at, s.rule_id,
    s.rule_name, s.rule_section_ref, s.documentation_state, s.documents
  FROM public.substantiatable_expenses() s
  WHERE s.claimable
  -- Restated rather than inherited: ordering through a function scan is not
  -- guaranteed to survive, and the packet's "Expense 3 of 7" depends on it.
  ORDER BY s.service_date ASC, s.vendor ASC;
$fn$;

GRANT EXECUTE ON FUNCTION public.claimable_expenses() TO authenticated;
