# Wellth AI Constitution

## Core Principles

### I. Design System First (NON-NEGOTIABLE)
All UI development must adhere to the Design System Master Guide (`DESIGN_SYSTEM_MASTER.md`):
- **Semantic tokens only** - Never use direct colors (e.g., `text-white`, `bg-gray-500`)
- **HSL color format** - All colors defined in `src/index.css` with light/dark mode support
- **Component consistency** - Use shadcn-ui components with proper customization
- **Type-safe utilities** - Leverage TypeScript for formatting and validation
- Components must reference design system documentation before implementation

### II. Accessibility Is Mandatory (WCAG AA Minimum)
Accessibility is not optional and must be verified at every stage:
- **WCAG AA compliance** required for all features (reference `ACCESSIBILITY.md` and `ACCESSIBILITY_AUDIT.md`)
- **Keyboard navigation** fully supported for all interactive elements
- **Screen reader compatibility** with proper ARIA labels and semantic HTML
- **Color contrast ratios** verified using design system tokens
- **Focus management** implemented correctly in modals, dropdowns, and dynamic content
- Pre-launch accessibility audit required for all new features

### III. Component-First Architecture
Features are built using composable, reusable components:
- **Component library** - Use existing shadcn-ui components when available
- **Custom components** must be documented in the design system
- **Shared utilities** in `src/lib/` for common functionality
- **Type safety** - All components use TypeScript with proper prop types
- **Testing** - Components tested in isolation and integration scenarios

### IV. Mobile-First & Progressive Web App (PWA)
All features must work seamlessly across devices:
- **Mobile-first design** - Start with mobile, enhance for desktop
- **PWA capabilities** - Offline functionality where appropriate (reference `PWA_TESTING_GUIDE.md`)
- **Responsive layouts** using Tailwind breakpoints (sm, md, lg, xl, 2xl)
- **Touch-friendly** - Interactive elements properly sized (minimum 44x44px)
- **Performance** - Optimized for 3G networks and low-end devices

### V. Data Integrity & Security
Given financial nature of the application, security is paramount:
- **Supabase RLS policies** enforced for all data access
- **Authentication checks** on all protected routes
- **Sensitive data handling** - Never log PII or financial data
- **Stripe integration** follows best practices with proper error handling
- **Input validation** using Zod schemas on both client and server
- **Error boundaries** to gracefully handle failures without exposing internals

## Technology Stack & Standards

### Required Technologies
- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn-ui + Radix UI primitives
- **Styling**: Tailwind CSS with semantic tokens
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form + Zod validation
- **Backend**: Supabase (Auth, Database, Storage)
- **Payments**: Stripe with @stripe/stripe-js

### Code Quality Standards
- **TypeScript strict mode** enabled
- **ESLint** rules enforced (no warnings in production)
- **Consistent formatting** - Use project's ESLint configuration
- **No `any` types** unless absolutely justified in comments
- **Error handling** - Always handle promises and potential failures
- **Console logs** removed before committing (use proper logging if needed)

### File Organization
- **Components**: Organized by feature in logical directories
- **Hooks**: Custom hooks in dedicated files with `use` prefix
- **Utils**: Shared utilities in `src/lib/`
- **Types**: TypeScript types colocated with components or in `src/types/`
- **Assets**: Images and media in appropriate directories

## Development Workflow

### Feature Development Process
1. **Specify** - Create spec using `/speckit.specify` referencing design system
2. **Clarify** - Use `/speckit.clarify` to resolve ambiguities
3. **Plan** - Generate implementation plan with `/speckit.plan`
4. **Tasks** - Break into atomic tasks using `/speckit.tasks`
5. **Implement** - Build feature following constitution principles
6. **Test** - Verify functionality, accessibility, and responsiveness
7. **Document** - Update design system if new patterns introduced

### Code Review Requirements
- **Design system compliance** verified
- **Accessibility tested** (keyboard navigation, screen reader)
- **Responsive design** checked on mobile and desktop
- **TypeScript** compiles without errors
- **No console errors** in browser
- **Supabase policies** reviewed for security

### Testing Guidelines
- **Manual testing** on multiple viewports
- **Accessibility testing** using keyboard and screen reader
- **Cross-browser testing** (Chrome, Firefox, Safari minimum)
- **Error scenarios** tested (network failures, invalid inputs)
- Reference `TESTING_REPORT.md` for established patterns

## Governance

### Constitution Authority
This constitution supersedes all other development practices. When in doubt, refer to:
1. This constitution
2. Design System Master Guide (`DESIGN_SYSTEM_MASTER.md`)
3. Accessibility guidelines (`ACCESSIBILITY.md`)

### Amendments
Constitution changes require:
- Documentation of rationale
- Update of affected design system documentation
- Notification to all team members
- Migration plan for existing code if needed

### Compliance
- All feature specs must reference relevant constitution principles
- All code reviews verify constitutional compliance
- Design system deviations must be explicitly justified
- Accessibility violations are blocking issues

**Version**: 1.0.0 | **Ratified**: 2025-11-18 | **Last Amended**: 2025-11-18
