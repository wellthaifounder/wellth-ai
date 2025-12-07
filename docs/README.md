# Wellth.ai Documentation

Welcome to the Wellth.ai documentation! This comprehensive guide covers everything you need to know about developing, deploying, and maintaining the Wellth.ai healthcare expense management platform.

## Quick Navigation

### Getting Started
Start here if you're new to Wellth.ai development:

- **[Installation Guide](getting-started/installation.md)** - Set up your local development environment
- **[Environment Variables](getting-started/environment-variables.md)** - Configure your .env file
- **[Development Guide](getting-started/development.md)** - Local development workflow and best practices

**Time to first build:** <30 minutes
**Time to first contribution:** <2 hours

### Architecture & Design
Understand how Wellth.ai is built:

- **[System Overview](architecture/README.md)** - High-level architecture and design decisions
- **[Database Schema](database/schema.md)** - Complete database documentation (20+ tables)
- **[Security Architecture](security/README.md)** - HIPAA-compliant security design
- **[Frontend Architecture](architecture/frontend-architecture.md)** - React component structure and state management

### API Documentation
Reference for all edge functions:

- **[API Overview](api/README.md)** - All 17 Supabase edge functions
- **[Edge Functions](api/edge-functions/)** - Individual function documentation
- **[Authentication](architecture/README.md#authentication)** - Auth flow and session management

### Security & Compliance
Critical for healthcare applications:

- **[Security Policy](security/SECURITY.md)** - Vulnerability reporting and security measures
- **[HIPAA Compliance](security/hipaa-compliance.md)** - Compliance documentation and checklists
- **[PHI Handling](security/phi-handling.md)** - Protected health information guidelines
- **[RLS Policies](database/rls-policies.md)** - Row Level Security implementation

### Development
Guidelines for contributing:

- **[Coding Standards](development/coding-standards.md)** - TypeScript, React, and styling conventions
- **[Testing Guide](development/testing.md)** - Testing strategy and examples
- **[PWA Guide](development/pwa-guide.md)** - Progressive Web App implementation
- **[Contributing](../CONTRIBUTING.md)** - How to contribute to Wellth.ai

### Features
Feature-specific documentation:

- **[Expense Tracking](features/expense-tracking.md)** - Receipt upload and categorization
- **[HSA Accounts](features/hsa-accounts.md)** - Multi-account management
- **[Bill Review](features/bill-review.md)** - AI-powered medical bill analysis
- **[Reimbursements](features/reimbursements.md)** - Reimbursement request workflow
- **[See all features →](features/README.md)**

### Design System
UI/UX guidelines:

- **[Design System](design/design-system.md)** - Complete design system documentation
- **[Accessibility](design/accessibility.md)** - WCAG 2.1 AA compliance guide
- **[Pricing Tiers](design/pricing-tiers.md)** - Subscription feature gates

### Integrations
Third-party service integration:

- **[Stripe](integrations/stripe.md)** - Subscription and payment processing
- **[Plaid](integrations/plaid.md)** - Bank account connection and transaction sync
- **[Gemini AI](integrations/gemini-ai.md)** - AI-powered bill analysis and chat

### Deployment & Operations
Production deployment:

- **[Supabase Setup](deployment/supabase-setup.md)** - Project creation and configuration
- **[Environment Setup](deployment/environment-setup.md)** - Production vs development configuration
- **[Troubleshooting](deployment/troubleshooting.md)** - Common issues and solutions

### Audit Reports
Historical documentation:

- **[Complete Audit Summary](audits/complete-audit-summary.md)** - Comprehensive security and performance audit
- **[Tier 3 Performance](audits/tier-3-performance.md)** - 20+ performance optimizations
- **[Tier 4 Security](audits/tier-4-security.md)** - Advanced security enhancements
- **[Accessibility Audit](audits/accessibility-audit.md)** - WCAG 2.1 AA compliance testing

---

## Documentation Organization

```
docs/
├── README.md                          # This file
│
├── getting-started/                   # New developer onboarding
│   ├── installation.md
│   ├── environment-variables.md
│   └── development.md
│
├── architecture/                      # System design
│   ├── README.md                      # High-level overview
│   ├── database-schema.md
│   ├── security-architecture.md
│   └── frontend-architecture.md
│
├── api/                               # API documentation
│   ├── README.md
│   └── edge-functions/                # 17 individual function docs
│       ├── analyze-medical-bill.md
│       ├── check-subscription.md
│       └── ...
│
├── security/                          # Security & compliance
│   ├── README.md
│   ├── SECURITY.md                    # Security policy
│   ├── hipaa-compliance.md
│   ├── phi-handling.md
│   └── rls-policies.md
│
├── features/                          # Feature documentation
│   ├── README.md
│   ├── expense-tracking.md
│   ├── hsa-accounts.md
│   └── ...
│
├── development/                       # Developer guides
│   ├── README.md
│   ├── coding-standards.md
│   ├── testing.md
│   └── pwa-guide.md
│
├── design/                            # Design system
│   ├── README.md
│   ├── design-system.md
│   ├── accessibility.md
│   └── pricing-tiers.md
│
├── database/                          # Database documentation
│   ├── README.md
│   ├── schema.md
│   ├── rls-policies.md
│   └── migrations.md
│
├── deployment/                        # Operations
│   ├── README.md
│   ├── supabase-setup.md
│   └── environment-setup.md
│
├── integrations/                      # Third-party services
│   ├── README.md
│   ├── stripe.md
│   ├── plaid.md
│   └── gemini-ai.md
│
├── audits/                            # Historical audits
│   ├── README.md
│   ├── complete-audit-summary.md
│   └── ...
│
└── migration-history/                 # Archived migration docs
    ├── README.md
    └── ...
```

---

## Common Tasks

### I want to...

**...get started developing:**
1. Read [Installation Guide](getting-started/installation.md)
2. Set up [Environment Variables](getting-started/environment-variables.md)
3. Follow [Development Guide](getting-started/development.md)

**...understand the architecture:**
1. Start with [System Overview](architecture/README.md)
2. Review [Database Schema](database/schema.md)
3. Explore [API Documentation](api/README.md)

**...add a new feature:**
1. Review [Coding Standards](development/coding-standards.md)
2. Check [Contributing Guide](../CONTRIBUTING.md)
3. Reference existing [Feature Documentation](features/README.md)
4. Write tests following [Testing Guide](development/testing.md)

**...ensure HIPAA compliance:**
1. Read [HIPAA Compliance](security/hipaa-compliance.md)
2. Follow [PHI Handling](security/phi-handling.md) guidelines
3. Review [Security Architecture](security/README.md)
4. Check [RLS Policies](database/rls-policies.md)

**...deploy to production:**
1. Follow [Supabase Setup](deployment/supabase-setup.md)
2. Configure [Environment Setup](deployment/environment-setup.md)
3. Review [Security Checklist](security/SECURITY.md)

**...integrate a third-party service:**
1. Check [Integrations](integrations/README.md)
2. Follow service-specific guide ([Stripe](integrations/stripe.md), [Plaid](integrations/plaid.md), etc.)
3. Update environment variables
4. Test in sandbox/development mode

---

## Documentation Standards

When contributing to documentation:

1. **Use Markdown** - All docs in `.md` format
2. **Include Examples** - Code examples for technical content
3. **Link Related Docs** - Cross-reference related documentation
4. **Keep Current** - Update docs when code changes
5. **Clear Language** - Write for clarity, not cleverness
6. **Table of Contents** - Add ToC for docs >200 lines

---

## Key Metrics

### Security
- **40+ RLS policies** protecting all user data
- **AES-256-GCM encryption** for sensitive banking tokens
- **HIPAA-compliant** architecture (Technical, Physical, Administrative safeguards)
- **PHI redaction** in logs and errors

### Performance
- **70-90% reduction** in database queries
- **70%+ faster** page load times
- **50-90% faster** filtered queries

### Accessibility
- **WCAG 2.1 AA** compliance
- **Keyboard navigation** throughout app
- **Screen reader** support

### Coverage
- **17 edge functions** documented
- **20+ database tables** documented
- **35+ migrations** tracked
- **8 core features** documented

---

## Additional Resources

- **[Main README](../README.md)** - Project overview
- **[CHANGELOG](../CHANGELOG.md)** - Version history
- **[CONTRIBUTING](../CONTRIBUTING.md)** - Contribution guidelines
- **[GitHub Repository](https://github.com/wellthaifounder/claude-supabase-starter)** - Source code

---

## Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/wellthaifounder/claude-supabase-starter/discussions)
- **Bug?** File a [GitHub Issue](https://github.com/wellthaifounder/claude-supabase-starter/issues)
- **Security Issue?** Email security@wellth.ai
- **General Support?** Email support@wellth.ai

---

**Last Updated:** December 6, 2025
**Documentation Version:** 1.0.0
**Coverage:** 95% complete
