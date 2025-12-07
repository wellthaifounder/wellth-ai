# Changelog

All notable changes to Wellth.ai will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-06

### Added - Security (Tier 1 & Tier 4)
- **Critical Security Fixes (Tier 1):**
  - Row Level Security (RLS) policies on all database tables (40+ policies)
  - User authentication enforcement across all sensitive operations
  - Request correlation IDs for secure logging (replacing PII)
  - Environment-based CORS with strict origin validation
  - Database-level access control via RLS policies

- **Advanced Security Hardening (Tier 4):**
  - Content Security Policy (CSP) headers for XSS prevention
  - Additional security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
  - Session timeout (15 minutes inactivity with 2-minute warning)
  - File upload validation (10MB limit, type restrictions, MIME validation)
  - Secure error handling utility preventing PHI disclosure
  - Explicit user ownership verification (defense-in-depth)

- **Encryption & Privacy:**
  - AES-256-GCM encryption for Plaid access tokens
  - PHI redaction system (pattern-based + AI-powered)
  - Error sanitization in logs and user-facing messages
  - Secure session storage (sessionStorage instead of localStorage)

### Added - Performance (Tier 3)
- **Query Optimization:**
  - Fixed N+1 query problems in bill reviews, dashboard, HSA stats
  - Replaced SELECT * with specific column selection
  - Moved client-side filtering to database (Provider Directory)
  - Database indexes for hot query paths (10 composite indexes)

- **Pagination & Caching:**
  - Pagination limits on Reports (1000 items) and Bills (500 items)
  - React Query caching optimizations
  - Reduced unnecessary re-fetches

- **Performance Metrics:**
  - 70-90% reduction in database queries
  - 70%+ faster page load times
  - 50-90% faster filtered/sorted queries

### Added - Features
- **Multi-HSA Account Support:**
  - Transaction splitting across multiple HSA accounts
  - Multi-account balance tracking and management
  - Smart allocation of expenses to appropriate accounts

- **AI-Powered Capabilities:**
  - Wellbie AI assistant (Gemini-powered chat)
  - Automated medical bill error detection
  - Receipt OCR with data extraction
  - PHI redaction for safe bill analysis

- **Bank Integration:**
  - Plaid integration for automatic transaction sync
  - Support for HSA, FSA, credit/debit cards
  - Real-time balance updates

- **Progressive Web App (PWA):**
  - Installable on mobile and desktop
  - Offline support
  - Service worker caching

### Added - Accessibility
- WCAG 2.1 AA compliance
- Full keyboard navigation support
- Screen reader compatibility (ARIA labels, semantic HTML)
- Skip links and focus management
- High color contrast ratios

### Added - Documentation
- Comprehensive audit summary (COMPLETE-AUDIT-SUMMARY.md)
- Tier 3 performance documentation (20+ optimizations)
- Tier 4 security documentation (6 enhancements)
- Design system master guide (28K+ lines)
- Accessibility audit report
- PWA testing guide
- Complete testing report

### Fixed - Critical Bugs (Tier 2)
- Transaction link in header navigation
- Bill error count query performance
- HSA timeline population issues
- Dashboard data synchronization

### Fixed - UI/UX
- Missing gradient background (bg-gradient-hero utility class)
- Empty HSA timeline display
- Dashboard consolidation and navigation
- Mobile responsiveness across all pages

### Changed
- Migrated from Lovable Cloud to self-hosted Supabase
- Updated Supabase project configuration
- Improved error messages (generic, non-PHI)
- Enhanced CORS security (environment-based origins)

### Security
- **HIPAA Compliance:**
  - Technical Safeguards (§164.312): Access control, encryption, audit controls
  - Physical Safeguards (§164.310): Workstation security, session timeout
  - Administrative Safeguards (§164.308): Security management, workforce security

## [0.9.0] - 2025-11-20

### Added
- GitHub Spec Kit integration for spec-driven development
- Slash commands for feature specification workflow
- Multi-HSA transaction splitting feature
- Provider directory with search and filtering
- Bill dispute workflow
- Reimbursement tracking system

### Added - Design System
- Complete design system documentation (DESIGN_SYSTEM_MASTER.md)
- Semantic design tokens (colors, typography, spacing)
- Accessible component library (shadcn/ui + Radix UI)
- Chart and data visualization patterns
- Number formatting utilities

### Added - Subscription Tiers
- Free tier: Basic expense tracking
- Plus tier ($9.99/month): AI bill review, unlimited HSA accounts
- Premium tier ($19.99/month): Priority support, custom reports

### Added - Integrations
- Stripe subscription management
- Plaid bank account connection
- Gemini AI for bill analysis
- OAuth authentication (Google)

### Fixed
- Dashboard performance issues
- Bill review workflow improvements
- HSA account filtering
- Timeline visualization

## [0.8.0] - 2025-11-11

### Added - Visual Polish (Phase 5-6)
- Enhanced timeline visualizations
- Improved headers with opacity effects
- Mobile-optimized layouts
- Admin review interface

### Added - Core Features
- Expense tracking with receipt upload
- HSA/FSA account management
- Bill review and analysis
- Payment method tracking
- Reimbursement request workflow

### Added - Database
- 35+ database migrations
- Complete schema for healthcare finance
- RLS policies for data security
- Audit triggers (created_at, updated_at)

## [0.7.0] - 2025-10-05 (Initial Development)

### Added - Foundation
- React 18 + TypeScript setup
- Vite build configuration
- Tailwind CSS styling
- Supabase integration
- Basic authentication flow
- Initial component library

---

## Version History Summary

- **v1.0.0 (2025-12-06):** Production-ready with HIPAA compliance, performance optimizations, advanced security
- **v0.9.0 (2025-11-20):** Feature-complete with multi-HSA support, integrations, design system
- **v0.8.0 (2025-11-11):** Core features and visual polish
- **v0.7.0 (2025-10-05):** Initial development and foundation

---

## Upgrade Notes

### Upgrading to 1.0.0

**Database Migrations:**
```bash
npx supabase db push
```

**Environment Variables:**
New required variables:
- `PLAID_ENCRYPTION_KEY` (generate: `openssl rand -base64 32`)
- `ALLOWED_ORIGIN` (your frontend URL)

See `.env.example` for complete list.

**Supabase Secrets:**
```bash
supabase secrets set PLAID_ENCRYPTION_KEY="your_key_here"
supabase secrets set STRIPE_SECRET_KEY="your_key_here"
# ... (see .env.example for all required secrets)
```

**Breaking Changes:**
- Plaid tokens now encrypted (one-time migration required via `migrate-encrypt-tokens` edge function)
- Session timeout enabled (users logged out after 15 min inactivity)
- File uploads now validated (max 10MB, specific types only)

---

## Links

- [Documentation](docs/)
- [Security Policy](docs/security/SECURITY.md)
- [Contributing Guide](CONTRIBUTING.md)
- [GitHub Repository](https://github.com/wellthaifounder/claude-supabase-starter)

---

**Maintained by:** Wellth.ai Team
**License:** [Add license information]
