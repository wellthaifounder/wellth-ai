# Data Retention and Deletion Policy

**Organization:** Wellth.ai
**Effective Date:** 2026-04-24
**Review Cycle:** Annually, or upon material change in applicable law or product scope
**Owner:** Wellth.ai Founder (wellth.ai.founder@gmail.com)

---

## 1. Purpose

This policy defines how Wellth.ai retains, reviews, and deletes personal data, Protected Health Information (PHI), and Protected Financial Information (PFI) collected through its platform. It is designed to comply with applicable U.S. data privacy laws including HIPAA, state-level privacy laws (e.g., CCPA/CPRA), and relevant financial record-keeping regulations.

---

## 2. Scope

This policy applies to all data collected, processed, or stored by Wellth.ai in connection with its web and mobile applications, including data obtained through third-party integrations (Plaid, Stripe, Supabase).

---

## 3. Data Classes and Retention Periods

| Data Class                 | Examples                                                    | Retention Period                                                                                                                                                        | Basis                                                  |
| -------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Account & Profile**      | Email, name, user ID, authentication records                | Active account + 30 days after account deletion                                                                                                                         | User relationship                                      |
| **PHI**                    | Receipts, medical bills, diagnoses, provider names          | Active account + up to 7 years after account deletion for records where retention is required by HIPAA or tax law; otherwise deleted within 30 days of account deletion | HIPAA (45 CFR §164.530(j)), IRS recordkeeping          |
| **PFI – Plaid data**       | Encrypted access tokens, transaction data, account metadata | Active account; access tokens revoked and purged within 30 days of account deletion or connection disconnection                                                         | Plaid Developer Policy; principle of data minimization |
| **PFI – Stripe data**      | Customer ID, subscription status                            | Active account + 7 years after account deletion (tax/audit requirements)                                                                                                | IRS recordkeeping (26 U.S.C. §6001)                    |
| **Session / Auth logs**    | IP addresses, session tokens, login timestamps              | 90 days                                                                                                                                                                 | Security monitoring                                    |
| **Application logs**       | Error logs (PHI-redacted), performance telemetry            | 30 days                                                                                                                                                                 | Operational need                                       |
| **Database backups**       | Automated Supabase backups                                  | 7 days rolling                                                                                                                                                          | Supabase platform default                              |
| **Consent records**        | Timestamp and version of Privacy Policy acceptance          | Active account + 7 years after account deletion                                                                                                                         | Audit / compliance                                     |
| **Support correspondence** | Emails to founder address                                   | 3 years                                                                                                                                                                 | Operational need                                       |

---

## 4. User-Initiated Deletion

Users may delete their account at any time using the "Delete Account" control in the application's Settings page, or by emailing the Privacy contact below.

Upon account deletion:

1. **Immediate actions (within seconds):**
   - The user's `auth.users` record is deleted, cascading to all user-owned rows (profiles, transactions, collections, receipts, payment methods, bank connections).
   - All active sessions are invalidated.
   - Plaid access tokens are revoked via Plaid's `/item/remove` API before being purged.

2. **Within 30 days:**
   - Removal from automated backups as the 7-day backup window rolls off.
   - Removal from any caches or read replicas.

3. **Data retained beyond deletion:**
   - Records subject to legal or regulatory hold (tax records, HIPAA-protected records where required) are retained in the minimum form necessary, for the minimum duration required.
   - Consent acceptance records are retained for audit purposes.

Users will receive email confirmation when deletion is complete.

---

## 5. Automated Deletion

- **Abandoned unverified accounts:** Accounts that have not completed email verification within 30 days of creation are automatically deleted.
- **Expired Plaid items:** Plaid items that have been unused or in an error state for more than 180 days are automatically disconnected and their tokens purged.
- **Log rotation:** Application logs older than the defined retention period are purged on a rolling basis by Supabase's log retention controls.

---

## 6. Legal & Regulatory Holds

If Wellth.ai receives a valid legal preservation order, subpoena, or is otherwise required by law to preserve specific data, the affected records will be excluded from routine deletion for the duration of the hold. Users will be notified where legally permitted.

---

## 7. Third-Party Retention

- **Plaid:** Data shared with Plaid is retained by Plaid per its own privacy policy and data retention practices.
- **Stripe:** Payment data retained by Stripe per its privacy policy and applicable financial regulations.
- **Supabase:** Underlying storage provider; retains data only as directed by Wellth.ai via this policy.
- **AI processing (Gemini via Lovable Gateway):** Receipt images sent for OCR are processed ephemerally. PHI is redacted before submission; no persistent storage of submitted content is performed by Wellth.ai on AI provider systems beyond what is necessary for the single inference request.

---

## 8. Policy Review

- This policy is reviewed at least **annually** by the policy owner.
- The policy is also reviewed whenever:
  - A new data class is introduced into the system.
  - An applicable law or regulation materially changes.
  - A new subprocessor or integration is added.
- Review outcomes are recorded with the document version history below.

---

## 9. Exercising Your Rights

To request data deletion, data access, or information about retention of your specific data, contact:

**wellth.ai.founder@gmail.com**

Requests will be acknowledged within 5 business days and fulfilled within 30 days, subject to verification of the requester's identity.

---

## 10. Version History

| Version | Date       | Summary         |
| ------- | ---------- | --------------- |
| 1.0     | 2026-04-24 | Initial policy. |

---

_This policy is a companion to the Wellth.ai Access Control Policy and Privacy Policy._
