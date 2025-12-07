# Wellth.ai

> AI-powered healthcare expense management with HIPAA-compliant HSA/FSA optimization

[![HIPAA Compliant](https://img.shields.io/badge/HIPAA-Compliant-green.svg)](docs/security/hipaa-compliance.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)

## Overview

Wellth.ai is a comprehensive healthcare expense management platform that helps users maximize their HSA and FSA benefits through intelligent automation, AI-powered bill analysis, and seamless bank integration. Built with HIPAA compliance at its core, Wellth.ai provides secure, efficient tools for managing healthcare finances.

## Key Features

### Financial Management
- **Multi-HSA/FSA Account Support** - Manage multiple accounts with real-time balance tracking
- **Automated Bank Integration** - Sync transactions automatically via Plaid
- **Smart Reimbursement Tracking** - Vault, immediate, or medium-term strategies
- **Payment Method Intelligence** - Track rewards, HSA eligibility, and optimize spending

### AI-Powered Analysis
- **Wellbie AI Assistant** - Natural language healthcare finance guidance
- **Medical Bill Review** - Automated error detection and overcharge identification
- **Receipt OCR** - Extract data from receipts and invoices automatically
- **PHI Redaction** - Pattern + AI-based protected health information removal

### Compliance & Security
- **HIPAA-Compliant Architecture** - Full technical, physical, and administrative safeguards
- **40+ Row Level Security Policies** - Database-level access control
- **AES-256-GCM Encryption** - Secure banking token storage
- **Session Management** - 15-minute timeout with user warnings
- **PHI Protection** - Automatic sanitization in logs and errors

### User Experience
- **Progressive Web App** - Install on mobile and desktop
- **WCAG 2.1 AA Accessible** - Full keyboard navigation and screen reader support
- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Real-time Updates** - WebSocket subscriptions for instant data

## Tech Stack

### Frontend
- **React 18.3** - Modern UI library with hooks
- **TypeScript 5.8** - Type-safe development
- **Vite 5.4** - Lightning-fast build tool
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui + Radix UI** - Accessible component library
- **React Query 5.83** - Powerful data synchronization
- **React Router 6.30** - Client-side routing

### Backend & Infrastructure
- **Supabase** - PostgreSQL database, authentication, storage, edge functions
- **PostgreSQL 15+** - Relational database with RLS
- **Deno Runtime** - Secure serverless functions (17 edge functions)
- **Supabase Auth** - JWT-based authentication with OAuth support

### External Services
- **Stripe** - Subscription management (Free, Plus, Premium tiers)
- **Plaid** - Bank account integration and transaction sync
- **Gemini AI** - Advanced medical bill analysis and chat

### Security & Compliance
- **Row Level Security** - 40+ policies enforcing user-level access
- **Content Security Policy** - XSS and injection prevention
- **AES-256-GCM** - Encryption for sensitive banking tokens
- **Session Timeout** - Automatic logout after 15 minutes inactivity

## Quick Start

### Prerequisites

- Node.js 18+ and npm ([install with nvm](https://github.com/nvm-sh/nvm))
- Supabase account ([sign up](https://supabase.com))
- Stripe account ([sign up](https://stripe.com))
- Plaid account ([sign up](https://plaid.com))
- Gemini AI API key ([get key](https://ai.google.dev))

### Installation

```bash
# Clone the repository
git clone https://github.com/wellthaifounder/claude-supabase-starter.git
cd wellth-ai

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials (see docs/getting-started/environment-variables.md)

# Run database migrations
npx supabase link --project-ref your-project-ref
npx supabase db push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Environment Setup

See [docs/getting-started/installation.md](docs/getting-started/installation.md) for detailed setup instructions.

## Documentation

### Getting Started
- [Installation Guide](docs/getting-started/installation.md) - Complete setup instructions
- [Environment Variables](docs/getting-started/environment-variables.md) - Configuration reference
- [Development Guide](docs/getting-started/development.md) - Local development workflow

### Architecture
- [System Overview](docs/architecture/README.md) - High-level architecture and design
- [Database Schema](docs/database/schema.md) - Complete database documentation
- [Security Architecture](docs/security/README.md) - Security design and implementation

### API Documentation
- [Edge Functions](docs/api/README.md) - All 17 Supabase edge functions documented
- [Authentication](docs/architecture/README.md#authentication) - Auth flow and session management

### Development
- [Coding Standards](docs/development/coding-standards.md) - TypeScript and React patterns
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to Wellth.ai
- [Testing Guide](docs/development/testing.md) - Testing strategy and examples

### Security & Compliance
- [Security Policy](docs/security/SECURITY.md) - Vulnerability reporting and security measures
- [HIPAA Compliance](docs/security/hipaa-compliance.md) - Compliance documentation
- [PHI Handling](docs/security/phi-handling.md) - Protected health information guidelines

## Project Structure

```
wellth-ai/
├── src/
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # Supabase client and integrations
│   ├── pages/               # Page components
│   ├── utils/               # Utility functions
│   └── main.tsx             # Application entry point
├── supabase/
│   ├── functions/           # Edge functions (17 serverless functions)
│   └── migrations/          # Database migrations (35+ files)
├── docs/                    # Comprehensive documentation
├── public/                  # Static assets
└── .env.example             # Environment template
```

## Security

Wellth.ai implements comprehensive security measures:

- **Authentication:** Supabase Auth with JWT tokens and OAuth (Google)
- **Authorization:** 40+ Row Level Security policies on all database tables
- **Encryption:** AES-256-GCM for Plaid banking tokens
- **PHI Protection:** Automatic redaction in logs and user-facing errors
- **Session Security:** 15-minute timeout with 2-minute warning
- **Headers:** Content Security Policy, X-Frame-Options, X-Content-Type-Options
- **File Uploads:** Type validation, 10MB limit, MIME type checking
- **CORS:** Strict origin validation for all edge functions

For vulnerability reporting, see [SECURITY.md](docs/security/SECURITY.md).

## HIPAA Compliance

Wellth.ai meets HIPAA Security Rule requirements:

- **Technical Safeguards (§164.312):** Access control, encryption, audit controls
- **Physical Safeguards (§164.310):** Workstation security with session timeout
- **Administrative Safeguards (§164.308):** Security management, workforce security

See [HIPAA Compliance Documentation](docs/security/hipaa-compliance.md) for details.

## Performance

Recent optimizations achieved significant improvements:

- **70-90% reduction** in database queries through query optimization
- **70%+ faster** page load times via pagination and caching
- **50-90% faster** filtered/sorted queries with database indexes
- **N+1 query elimination** across all major data fetching patterns

See [Performance Audit](docs/audits/tier-3-performance.md) for details.

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development workflow
- Coding standards
- Pull request process
- Testing requirements
- Security guidelines

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build for development
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Subscription Tiers

Wellth.ai offers three subscription tiers:

- **Free** - Basic expense tracking and receipt scanning
- **Plus ($9.99/month)** - AI bill review, unlimited HSA accounts, advanced analytics
- **Premium ($19.99/month)** - Priority support, custom reports, API access

See [Pricing Documentation](docs/design/pricing-tiers.md) for feature comparison.

## License

[Add license information here]

## Support

- **Documentation:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/wellthaifounder/claude-supabase-starter/issues)
- **Security:** security@wellth.ai
- **General:** support@wellth.ai

## Acknowledgments

Built with [Lovable](https://lovable.dev), [Supabase](https://supabase.com), and [shadcn/ui](https://ui.shadcn.com/).

---

**Version:** 1.0.0
**Last Updated:** December 6, 2025
**Status:** Production Ready
