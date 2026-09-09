-- A record you keep, and a claim you file.
--
-- IRS Notice 2004-50 Q&A-39 grants HSA holders an unlimited deferral -- "there
-- is no time limit on when the distribution must occur" -- on one condition:
-- the account beneficiary "must keep records sufficient to later show" that
-- each distribution paid a qualified medical expense, that it was not
-- reimbursed from another source, and that it was not taken as an itemized
-- deduction. Notice 2004-2 Q&A-29 confirms nobody else checks: HSA custodians
-- "are not required to determine whether HSA distributions are used for
-- qualified medical expenses."
--
-- So the document this product generates is not paperwork for a custodian. It
-- is evidence for an examiner who may not arrive for twenty years, and who will
-- be looking at the tax year of the DISTRIBUTION, not the year of the expense.
-- Its job is to be made early and kept long.
--
-- Until now it could only be made by claiming. Generating a record set every
-- included expense to claim_state='locked_in_request', and two separate
-- mechanisms then held it there:
--
--   1. idx_record_items_one_live_claim, a partial unique index allowing an
--      expense into at most one non-voided record; and
--   2. claimable_expenses(), which independently excludes any expense sitting
--      in a non-voided record.
--
-- Both are exactly right for a claim -- an expense claimed twice is the worst
-- failure this product can have -- and both are wrong for a record. Someone on
-- the shoebox strategy wants a fresh record every year over a pile of expenses
-- that must stay claimable indefinitely, which is precisely what those two
-- mechanisms exist to prevent. The only door to the document also did the one
-- thing they had decided not to do.
--
-- This migration gives a record a PURPOSE and narrows both locks to claims.
-- Nothing about the claim path changes: same index, same guards, same
-- exclusion. A record-purpose bundle simply does not participate in any of it.
--
-- Deliberately NOT changed here:
--   - void_substantiation_record() needs no change. It releases only invoices
--     sitting at claim_state='locked_in_request', which a record never sets,
--     so voiding a saved record marks it voided and touches nothing else.
--   - The set of expenses a record may contain is unchanged (eligible,
--     unclaimed, remaining > 0). Widening records to cover HSA-card spend and
--     already-reimbursed expenses -- both of which are distributions that need
--     substantiating just as much -- is real, and it is its own change.

-- ── 1. Purpose on the record ───────────────────────────────────────────────

ALTER TABLE public.substantiation_records
  ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'claim';

ALTER TABLE public.substantiation_records
  DROP CONSTRAINT IF EXISTS substantiation_records_purpose_check;
ALTER TABLE public.substantiation_records
  ADD CONSTRAINT substantiation_records_purpose_check
  CHECK (purpose IN ('record', 'claim'));

COMMENT ON COLUMN public.substantiation_records.purpose IS
  '"claim" -- filed with a custodian, so its expenses are locked against being
   claimed again. "record" -- kept as evidence, so its expenses stay claimable
   and may appear in any number of later records. Defaults to claim: every
   record generated before this column existed was one.';

-- ── 2. Mirrored onto the items ─────────────────────────────────────────────
-- Same reason record_status is mirrored: a partial unique index cannot
-- reference another table, and the index is the only thing that holds under
-- concurrency. Unlike record_status this never needs propagating, because a
-- record's purpose is fixed at creation (see 3).

ALTER TABLE public.substantiation_record_items
  ADD COLUMN IF NOT EXISTS record_purpose TEXT;

UPDATE public.substantiation_record_items sri
   SET record_purpose = sr.purpose
  FROM public.substantiation_records sr
 WHERE sr.id = sri.substantiation_record_id
   AND sri.record_purpose IS DISTINCT FROM sr.purpose;

ALTER TABLE public.substantiation_record_items
  ALTER COLUMN record_purpose SET DEFAULT 'claim';
ALTER TABLE public.substantiation_record_items
  ALTER COLUMN record_purpose SET NOT NULL;

ALTER TABLE public.substantiation_record_items
  DROP CONSTRAINT IF EXISTS substantiation_record_items_record_purpose_check;
ALTER TABLE public.substantiation_record_items
  ADD CONSTRAINT substantiation_record_items_record_purpose_check
  CHECK (record_purpose IN ('record', 'claim'));

COMMENT ON COLUMN public.substantiation_record_items.record_purpose IS
  'DERIVED mirror of substantiation_records.purpose, set by
   guard_record_item_insert from the parent. Exists solely so the claim lock
   can stay a partial unique index. Do not write it directly.';

-- ── 3. Purpose is fixed at creation ────────────────────────────────────────
-- Turning a saved record into a claim after the fact would leave its items
-- mirroring the old purpose, so the lock would not see them and no expense
-- would be moved to locked_in_request -- a claim outside the one mechanism
-- that stops double-claiming. Claiming expenses that sit in a saved record is
-- a NEW claim record over the same expenses, which this migration makes legal.

CREATE OR REPLACE FUNCTION public.freeze_record_purpose()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $fn$
BEGIN
  RAISE EXCEPTION
    'RECORD_PURPOSE_IMMUTABLE: % was created as a %, and that cannot change. '
    'To claim its expenses, generate a new claim over them.',
    OLD.record_number, OLD.purpose;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_records_freeze_purpose ON public.substantiation_records;
CREATE TRIGGER trg_records_freeze_purpose
  BEFORE UPDATE OF purpose ON public.substantiation_records
  FOR EACH ROW
  WHEN (OLD.purpose IS DISTINCT FROM NEW.purpose)
  EXECUTE FUNCTION public.freeze_record_purpose();

-- ── 4. The insert guard ────────────────────────────────────────────────────
-- Two changes. It now stamps record_purpose from the parent, for the same
-- reason it stamps record_status: taking it from the caller would let an
-- inserter opt out of the lock by declaring itself a record.
--
-- And the two money guards are narrowed to claims. Both describe money that
-- cannot be claimed AGAIN -- HSA-card spend, and an expense already reimbursed
-- in full. Neither is a reason to refuse to DOCUMENT an expense; both of those
-- are distributions, and a distribution is exactly the thing Pub 969 asks for
-- records of. Ownership is checked for both, because that is not about money.

CREATE OR REPLACE FUNCTION public.guard_record_item_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_rec       RECORD;
  v_inv       RECORD;
  v_remaining NUMERIC;
BEGIN
  SELECT sr.user_id, sr.status, sr.record_number, sr.purpose
    INTO v_rec
    FROM substantiation_records sr
   WHERE sr.id = NEW.substantiation_record_id;

  IF v_rec IS NULL THEN
    RAISE EXCEPTION 'CLAIM_NO_RECORD: that reimbursement record does not exist';
  END IF;

  SELECT i.user_id, i.claim_state, i.vendor
    INTO v_inv
    FROM invoices i
   WHERE i.id = NEW.invoice_id;

  IF v_inv IS NULL THEN
    RAISE EXCEPTION 'CLAIM_NO_EXPENSE: that expense does not exist';
  END IF;

  -- An expense and the record citing it must belong to the same person.
  -- Row-level security governs each table separately and would not, by itself,
  -- stop one user's expense being written into another user's record.
  IF v_inv.user_id <> v_rec.user_id THEN
    RAISE EXCEPTION 'CLAIM_WRONG_OWNER: that expense belongs to someone else';
  END IF;

  IF v_rec.purpose = 'claim' THEN
    -- The money already left the HSA when the card was swiped. Claiming it back
    -- would be taking the same money twice, and no later correction catches it.
    IF v_inv.claim_state = 'not_reimbursable' THEN
      RAISE EXCEPTION
        'CLAIM_HSA_CARD_PAID: % was paid with the HSA card, so it cannot be reimbursed again',
        v_inv.vendor;
    END IF;

    SELECT GREATEST(
             COALESCE(i.reimbursable_amount, i.amount_paid, i.amount)
             - COALESCE(i.reimbursed_amount, 0), 0)
      INTO v_remaining
      FROM invoices i WHERE i.id = NEW.invoice_id;

    IF v_remaining <= 0 THEN
      RAISE EXCEPTION
        'CLAIM_NOTHING_REMAINING: % has already been reimbursed in full',
        v_inv.vendor;
    END IF;
  END IF;

  -- Both derived. Taking them from the parent rather than from the caller
  -- means the lock cannot be sidestepped by an item that declares itself
  -- voided, or a record.
  NEW.record_status  := v_rec.status;
  NEW.record_purpose := v_rec.purpose;

  RETURN NEW;
END;
$fn$;

COMMENT ON FUNCTION public.guard_record_item_insert() IS
  'The single-row half of the double-claim guard -- ownership always, plus
   HSA-card spend and nothing-left-to-claim for claims only. The concurrent
   half is idx_record_items_one_live_claim.';

-- ── 5. The claim lock, narrowed to claims ──────────────────────────────────
-- An expense may still sit in at most one live CLAIM. It may now sit in any
-- number of records, which is the whole point: a shoebox holder saves one
-- every year over a pile that keeps growing.

DROP INDEX IF EXISTS public.idx_record_items_one_live_claim;
CREATE UNIQUE INDEX idx_record_items_one_live_claim
  ON public.substantiation_record_items (invoice_id)
  WHERE record_status <> 'voided' AND record_purpose = 'claim';

COMMENT ON INDEX public.idx_record_items_one_live_claim IS
  'The claim lock. An expense may sit in at most one non-voided CLAIM. Records
   are unlimited and unlocked -- documenting an expense is not spending it.
   Declarative because it has to survive concurrency: two tabs submitting at
   once is the exact case a counted check misses.';

-- ── 6. Claimable expenses ──────────────────────────────────────────────────
-- Verbatim from the deployed definition with one condition added, so the
-- picker and the lock still cannot drift apart.

CREATE OR REPLACE FUNCTION public.claimable_expenses()
 RETURNS TABLE(invoice_id uuid, vendor text, service_date date, tax_year integer, category text, patient_name text, remaining_amount numeric, confirmed_at timestamp with time zone, rule_id text, rule_name text, rule_section_ref text, documentation_state text, documents jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    i.id,
    i.vendor,
    i.effective_service_date,
    EXTRACT(YEAR FROM i.effective_service_date)::INT,
    i.category,
    i.patient_name,
    GREATEST(COALESCE(i.reimbursable_amount, i.amount_paid, i.amount)
             - COALESCE(i.reimbursed_amount, 0), 0),
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
    AND i.claim_state = 'unclaimed'
    AND GREATEST(COALESCE(i.reimbursable_amount, i.amount_paid, i.amount)
                 - COALESCE(i.reimbursed_amount, 0), 0) > 0
    AND NOT EXISTS (
      SELECT 1 FROM substantiation_record_items sri
       WHERE sri.invoice_id = i.id
         AND sri.record_status <> 'voided'
         AND sri.record_purpose = 'claim'
    )
  ORDER BY i.effective_service_date ASC, i.vendor ASC;
$function$;

COMMENT ON FUNCTION public.claimable_expenses() IS
  'The selectability rule in one place -- eligible, unclaimed, remaining > 0,
   and not already inside a live CLAIM. Sitting in a saved record does not
   make an expense unclaimable; that is the difference between evidence and
   a request for money.';

GRANT EXECUTE ON FUNCTION public.claimable_expenses() TO authenticated;

-- ── 7. Deposit matching ────────────────────────────────────────────────────
-- A saved record is not waiting for money, so it must not attract a deposit
-- prompt. Without this, saving a record and then happening to move a similar
-- sum would ask the user whether that deposit closed a claim they never made.

CREATE OR REPLACE FUNCTION public.match_reimbursement_deposits(p_user_id uuid DEFAULT NULL::uuid, p_lookback_days integer DEFAULT 120)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user      UUID := COALESCE(p_user_id, auth.uid());
  v_caller    UUID := auth.uid();
  v_custodian TEXT;
  v_token     TEXT;
  v_inserted  INTEGER := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'MATCH_NO_USER: no user to match deposits for';
  END IF;
  -- A NULL auth.uid() is the service role -- the Plaid sync and webhook, which
  -- legitimately run this on behalf of any user. Anyone else gets themselves.
  IF v_caller IS NOT NULL AND v_caller <> v_user THEN
    RAISE EXCEPTION 'MATCH_FORBIDDEN: cannot match deposits for another user'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- The custodian the user named on their last claim (E3). A deposit whose
  -- descriptor carries that name is the strongest cheap signal there is, and
  -- it is the reason E3 bothered to remember it.
  SELECT hsa_custodian INTO v_custodian FROM profiles WHERE id = v_user;

  -- First word only: descriptors say "OPTUM BANK HSA DIST", not "Optum Bank".
  -- Short tokens are dropped -- "HSA" from "HSA Bank" would match half of
  -- everything and corroborate nothing.
  v_token := NULLIF(SPLIT_PART(COALESCE(v_custodian, ''), ' ', 1), '');
  IF v_token IS NOT NULL AND LENGTH(v_token) < 5 THEN
    v_token := NULL;
  END IF;

  WITH RECURSIVE
  -- Money IN, on a posted transaction, that is not already spoken for.
  deposits AS MATERIALIZED (
    SELECT t.id,
           t.transaction_date,
           ABS(t.signed_amount) AS amount,
           t.transfer_kind,
           COALESCE(t.vendor, t.description) AS descriptor
      FROM transactions t
     WHERE t.user_id = v_user
       AND t.signed_amount < 0
       AND t.transaction_date >= CURRENT_DATE - p_lookback_days
       AND t.is_pending = FALSE
       -- Workstream C5 already knows what these are, and neither can be a
       -- reimbursement: a card payment settles a balance, a contribution goes
       -- the other way. 'internal' is deliberately NOT excluded -- an HSA the
       -- custodian exposes as a plain savings account pairs as internal, and
       -- that is the coverage gap the spec warns about.
       AND (t.transfer_kind IS NULL
            OR t.transfer_kind NOT IN ('card_payment', 'hsa_contribution'))
       AND NOT EXISTS (
             SELECT 1 FROM substantiation_records sr
              WHERE sr.reimbursed_transaction_id = t.id)
  ),
  open_records AS MATERIALIZED (
    SELECT sr.id, sr.record_number, sr.total_amount, sr.generated_at
      FROM substantiation_records sr
     WHERE sr.user_id = v_user
       AND sr.status = 'generated'
       AND sr.purpose = 'claim'
       AND sr.generated_at >= now() - (p_lookback_days || ' days')::INTERVAL
       AND sr.total_amount > 0
  ),

  -- ── one deposit, one record ──
  --
  -- The widest gap tolerated. Absolute floor of $2 covers rounding; the
  -- percentage term lets a large claim absorb a wire or check fee, capped at
  -- $25 so a big record cannot swallow an unrelated deposit. A $50 record
  -- tolerates $2, not $25.
  singles AS (
    SELECT d.id               AS txn_id,
           r.id               AS record_id,
           d.amount           AS deposit_amount,
           d.descriptor,
           d.transfer_kind,
           d.transaction_date,
           r.generated_at,
           r.total_amount,
           ABS(r.total_amount - d.amount) AS gap
      FROM deposits d
      JOIN open_records r
        -- A custodian cannot pay a claim that has not been made. Three days of
        -- grace for posting-date slop, not two months of it.
        ON d.transaction_date >= (r.generated_at::date - 3)
       AND ABS(r.total_amount - d.amount)
             <= GREATEST(2.00, LEAST(25.00, r.total_amount * 0.02))
  ),

  -- ── one deposit, several records ──
  --
  -- Custodians batch. Two claims filed a week apart come back as one transfer,
  -- and today that deposit matches nothing at all. Enumerated to size 3 and
  -- held to the tight $2 band: every extra term is another degree of freedom
  -- to fit a coincidence with, so the batch does not also get the fee band.
  batchable AS MATERIALIZED (
    SELECT id, record_number, total_amount, generated_at
      FROM open_records
     ORDER BY generated_at DESC
     LIMIT 30
  ),
  grow AS (
    -- Cast: total_amount is numeric(12,2) but the running sum below is plain
    -- numeric, and a recursive CTE requires both terms to agree exactly.
    SELECT ARRAY[b.id] AS ids, b.id AS max_id, b.total_amount::NUMERIC AS total,
           b.generated_at AS last_generated, 1 AS n
      FROM batchable b
    UNION ALL
    SELECT g.ids || b.id, b.id, g.total + b.total_amount,
           GREATEST(g.last_generated, b.generated_at), g.n + 1
      FROM grow g
      JOIN batchable b ON b.id > g.max_id
     WHERE g.n < 3
  ),
  batches AS MATERIALIZED (
    SELECT gen_random_uuid() AS group_id,
           d.id       AS txn_id,
           g.ids,
           g.n,
           d.amount   AS deposit_amount,
           d.descriptor,
           d.transfer_kind,
           d.transaction_date,
           g.last_generated AS generated_at,
           g.total    AS total_amount,
           ABS(g.total - d.amount) AS gap
      FROM deposits d
      JOIN grow g
        ON g.n >= 2
       AND d.transaction_date >= (g.last_generated::date - 3)
       AND ABS(g.total - d.amount) <= 2.00
     -- Only when the deposit explains no single record on its own. Offering
     -- both readings of the same money is how a user ends up confirming two.
     WHERE NOT EXISTS (SELECT 1 FROM singles s WHERE s.txn_id = d.id)
  ),

  -- ── one shape, scored the same way ──
  combined AS (
    SELECT s.txn_id, s.record_id, NULL::UUID AS group_id, 1 AS n,
           s.deposit_amount, s.descriptor,
           s.transfer_kind, s.transaction_date, s.generated_at,
           s.total_amount, s.gap,
           (CASE WHEN s.gap <= 0.01 THEN 'exact'
                 WHEN s.gap <= 2.00 THEN 'rounded'
                 ELSE 'fee' END)::TEXT AS tier,
           CASE WHEN s.gap <= 0.01 THEN 0.90
                WHEN s.gap <= 2.00 THEN 0.70
                -- Below the 0.50 surfacing floor on its own, deliberately: a
                -- gap this size only becomes a prompt with corroboration.
                ELSE 0.45 END AS base
      FROM singles s
    UNION ALL
    SELECT b.txn_id, rid, b.group_id, b.n,
           b.deposit_amount, b.descriptor,
           b.transfer_kind, b.transaction_date, b.generated_at,
           b.total_amount, b.gap,
           'batch'::TEXT AS tier,
           -- A pair stands alone; a triple needs a signal to reach the floor.
           CASE WHEN b.n = 2 THEN 0.55 ELSE 0.45 END AS base
      FROM batches b, UNNEST(b.ids) AS rid
  ),
  scored AS (
    SELECT c.*,
           (c.transfer_kind = 'hsa_distribution') AS sig_transfer,
           (v_token IS NOT NULL
            AND c.descriptor IS NOT NULL
            AND STRPOS(UPPER(c.descriptor), UPPER(v_token)) > 0) AS sig_custodian,
           (c.transaction_date <= (c.generated_at::date + 21)) AS sig_prompt
      FROM combined c
  ),
  -- The weights are set so that a WEAK signal can never carry a WEAK match
  -- over the 0.50 floor, only strengthen one that already stands. Timing alone
  -- (+0.03) leaves the fee band and the three-record batch below the floor;
  -- only knowing the money came out of the HSA, or seeing the custodian's name
  -- on the deposit, lifts them into view. An earlier draft gave timing +0.05,
  -- which quietly meant "$25 short, but it arrived promptly" was enough to
  -- prompt someone to mark $3,200 reimbursed.
  final AS (
    SELECT s.*,
           LEAST(1.00,
                 s.base
                 + CASE WHEN s.sig_transfer  THEN 0.15 ELSE 0 END
                 + CASE WHEN s.sig_custodian THEN 0.12 ELSE 0 END
                 + CASE WHEN s.sig_prompt    THEN 0.03 ELSE 0 END
           ) AS confidence,
           ARRAY_REMOVE(ARRAY[
             CASE WHEN s.sig_transfer  THEN 'hsa_transfer'   END,
             CASE WHEN s.sig_custodian THEN 'custodian_name' END,
             CASE WHEN s.sig_prompt    THEN 'prompt'         END
           ], NULL) AS signals
      FROM scored s
  )
  INSERT INTO reimbursement_match_candidates
    (user_id, transaction_id, substantiation_record_id, match_amount,
     match_confidence, match_reason, status, match_group_id, amount_gap,
     match_signals)
  SELECT v_user,
         f.txn_id,
         f.record_id,
         -- What THIS record claims of the deposit, not the whole deposit. On a
         -- batch the two are different numbers and conflating them would
         -- overstate every member.
         r.total_amount,
         f.confidence,
         CASE f.tier
           WHEN 'exact' THEN
             'Exact match: the deposit equals this record''s total to the cent.'
           WHEN 'rounded' THEN
             'Within $' || TO_CHAR(f.gap, 'FM999990.00')
             || ' of this record''s total — custodians often round.'
           WHEN 'fee' THEN
             '$' || TO_CHAR(f.gap, 'FM999990.00')
             || ' short of this record''s total, which is the size of a typical'
             || ' custodian transfer fee. Check the amount before confirming.'
           ELSE
             'One deposit of $' || TO_CHAR(f.deposit_amount, 'FM999999990.00')
             || ' looks like ' || f.n || ' records paid together.'
         END
         || CASE WHEN f.sig_transfer
                 THEN ' The money came out of your HSA.' ELSE '' END
         || CASE WHEN f.sig_custodian
                 THEN ' The deposit is from ' || v_custodian || '.' ELSE '' END,
         'pending',
         f.group_id,
         f.gap,
         f.signals
    FROM final f
    JOIN open_records r ON r.id = f.record_id
   WHERE f.confidence >= 0.50
  -- A resolved candidate is a decision the user made. Re-running the scan must
  -- never overwrite one, which is exactly what the previous upsert did.
  ON CONFLICT (transaction_id, substantiation_record_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.match_reimbursement_deposits(UUID, INTEGER)
  TO authenticated;
