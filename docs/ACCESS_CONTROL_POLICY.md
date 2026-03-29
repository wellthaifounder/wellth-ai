# Access Control Policy

**Organization:** Wellth.ai
**Effective Date:** 2026-03-24
**Review Cycle:** Annually, or upon significant infrastructure change
**Owner:** Wellth.ai Founder (wellth.ai.founder@gmail.com)

---

## 1. Purpose

This policy defines the access controls Wellth.ai has in place to protect production assets (virtual infrastructure, APIs, databases) and sensitive data, including Protected Health Information (PHI), Protected Financial Information (PFI), and Personally Identifiable Information (PII).

---

## 2. Scope

This policy applies to all production systems, APIs, cloud infrastructure, and third-party integrations used to deliver the Wellth.ai platform, including:

- Supabase (database, authentication, edge functions)
- Vercel (frontend hosting)
- Plaid (bank account data)
- Stripe (payment processing)

---

## 3. Documented Policy

Access control requirements are codified in the project's security policy document (`CLAUDE.md`), which is version-controlled in the source repository. All contributors — human and AI-assisted — are required to comply with these controls before committing code.

---

## 4. Identity & Access Management

- **Centralized authentication:** All user authentication is managed through Supabase Auth, which provides a single, centralized identity layer for both end users and API consumers.
- **JWT-based API access:** Every API endpoint (Supabase Edge Function) requires a valid JWT bearer token. Requests without a valid token are rejected with HTTP 401 before any data is accessed.
- **OAuth for third-party integrations:** OAuth 2.0 tokens are used for all Plaid bank account connections. All external API communication uses TLS.

---

## 5. Role-Based Access Control (RBAC)

- **User-level data isolation:** Supabase Row Level Security (RLS) is enabled on every database table. All queries are automatically scoped to the authenticated user's ID (`auth.uid()`), preventing cross-user data access.
- **Subscription-based feature access:** Application features are gated by subscription tier (Free, Plus, Premium), enforced via the `useSubscription()` context.
- **Least-privilege API keys:** Edge functions use the `SUPABASE_ANON_KEY` by default. The `SUPABASE_SERVICE_ROLE_KEY` (full admin access) is only used in edge functions that explicitly require privileged database operations, and is never exposed to the frontend.

---

## 6. Secrets & Credential Management

- All sensitive credentials (Plaid API keys, Stripe secret key, encryption keys) are stored in Supabase Edge Function Secrets — never in frontend code, client-side environment variables, or version control.
- Secret keys are rotated on a **90-day schedule**, and immediately upon suspected compromise.
- Plaid access tokens are encrypted at rest using **AES-256-GCM** before storage. Plaintext tokens are never stored or logged.

---

## 7. Network & API Access Controls

- **CORS allowlist:** API endpoints enforce an explicit origin allowlist (`https://wellth-ai.app`, `https://www.wellth-ai.app`). Wildcard origins (`*`) are prohibited.
- **Input validation:** All API input is validated against strict schemas (Zod) before use.
- **URL allowlisting:** Edge functions that fetch external URLs validate the scheme (`https:` only) and domain against an explicit allowlist to prevent SSRF.

---

## 8. PHI & Sensitive Data Controls

- PHI is never logged or returned verbatim to the client.
- Frontend logging uses a `safeLog()` utility that strips sensitive data in non-development environments.
- PHI is redacted before being sent to any third-party AI service.

---

## 9. Access Reviews

- API key and credential rotation is performed on a 90-day cycle.
- Infrastructure access (Supabase dashboard, Vercel dashboard) is limited to authorized team members and protected by strong passwords and MFA where supported.
- Access rights are reviewed when team membership changes.

---

## 10. Incident Response

In the event of a suspected unauthorized access or credential compromise:

1. **Identify** — determine what data class was exposed (PHI/PFI/PII), to whom, and for how long.
2. **Contain** — revoke and rotate all affected credentials immediately.
3. **Assess** — if PHI was involved, evaluate HIPAA breach notification obligations (45 CFR §164.400).
4. **Document** — record the timeline, actions taken, and resolution.
5. **Contact** — notify wellth.ai.founder@gmail.com.

---

*This policy is reviewed annually and updated to reflect changes in infrastructure, team composition, or regulatory requirements.*
