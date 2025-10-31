# Wellth Pricing Tiers & Feature Gates

## Subscription Tiers

### Starter (Free)
- **Price:** Free forever
- **Features:**
  - Up to 50 expenses/month
  - Manual expense entry
  - Basic receipt storage
  - HSA eligibility checker
  - Simple reimbursement PDFs
  - Single payment method tracking
  - Basic expense categorization

### Plus ($19/month)
- **Price:** $19/month ($15/month annual)
- **Stripe Price ID:** `price_1SO9iP2Oq7FyVuCtXz38UjCM`
- **Stripe Product ID:** `prod_TKpNCQqHfKXoYn`
- **Features:**
  - All Starter features
  - Unlimited expenses
  - Receipt OCR automation
  - Smart categorization
  - Multiple payment method tracking
  - Rewards optimization alerts
  - **Advanced analytics & reports** (LOCKED)
  - **Benchmarking** (LOCKED)
  - Email support (24hr response)
  - Custom reimbursement templates
  - Bulk actions

### Premium ($49/month)
- **Price:** $49/month ($39/month annual)
- **Stripe Price ID:** `price_1SO9jA2Oq7FyVuCtc2WjHtZd`
- **Stripe Product ID:** `prod_TKpNCAxMltV8zl`
- **Features:**
  - All Plus features
  - **AI-Powered Insights** (LOCKED)
  - Auto-submit reimbursements
  - Bank/card integration (coming soon)
  - Tax optimization reports
  - Multi-year expense tracking
  - Export to tax software
  - Priority support (1hr response)
  - Custom HSA provider integrations
  - Expense forecasting & planning
  - API access

## Feature Gates Implementation

### Analytics Page

#### Advanced Analytics (Plus+)
**Location:** `/analytics` > Insights Tab
**Components Locked:**
- HSA Investment Tracker
- Reimbursement Timing Optimizer
- Rewards Optimization Dashboard
- Year-over-Year Comparison
- Payment Strategy Timeline

**Implementation:**
```tsx
<FeatureGate
  requiredTier="plus"
  feature="Advanced Analytics"
  description="Unlock detailed insights including HSA investment tracking, payment strategy timelines, and year-over-year comparisons"
>
  {/* Advanced analytics components */}
</FeatureGate>
```

#### Benchmarking (Plus+)
**Location:** `/analytics` > Benchmarks Tab
**Components Locked:**
- Industry benchmarking comparisons
- Performance metrics vs. averages

**Implementation:**
```tsx
<FeatureGate
  requiredTier="plus"
  feature="Benchmarking"
  description="Compare your performance against industry averages and top performers"
>
  <Benchmarking {...props} />
</FeatureGate>
```

#### AI-Powered Insights (Premium Only)
**Location:** `/analytics` > AI Analysis Tab
**Components Locked:**
- AI-generated personalized insights
- Actionable recommendations
- Predictive analytics

**Implementation:**
```tsx
<FeatureGate
  requiredTier="premium"
  feature="AI-Powered Insights"
  description="Get personalized recommendations and actionable insights powered by advanced AI analysis"
>
  <AIInsights {...props} />
</FeatureGate>
```

## Subscription Management

### Edge Functions

1. **check-subscription** - Checks user's current subscription status
   - Returns: `{ tier, subscribed, product_id, subscription_end }`
   - Automatically refreshes every 60 seconds
   - Called on auth state changes

2. **create-checkout** - Creates Stripe checkout session
   - Accepts: `{ tier: 'plus' | 'premium' }`
   - Returns: `{ url }` (opens in new tab)
   - Success URL: `/dashboard?subscription=success`
   - Cancel URL: `/settings?subscription=cancelled`

3. **customer-portal** - Opens Stripe customer portal
   - Returns: `{ url }` (opens in new tab)
   - Return URL: `/settings`

### React Context

**SubscriptionContext** provides:
- `tier: 'free' | 'plus' | 'premium'`
- `isSubscribed: boolean`
- `subscriptionEnd: string | null`
- `loading: boolean`
- `refreshSubscription: () => Promise<void>`
- `checkFeatureAccess: (requiredTier) => boolean`
- `createCheckoutSession: (tier) => Promise<void>`
- `openCustomerPortal: () => Promise<void>`

### UI Components

1. **FeatureGate** - Wraps premium features with upgrade prompt
2. **UpgradePrompt** - Displays upgrade card with tier info and CTA
3. **SubscriptionManagement** - Settings page subscription card

## Future Feature Gates (TODO)

### Receipt OCR (Plus+)
- Automatic data extraction from receipts
- Smart categorization suggestions

### Unlimited Expenses (Plus+)
- Remove 50 expense/month limit for free users
- Show warning at 40 expenses with upgrade prompt

### Auto-submit Reimbursements (Premium)
- Automatic HSA reimbursement submission
- Integration with HSA providers

### Tax Optimization Reports (Premium)
- Advanced tax strategy recommendations
- Multi-year tax planning

### API Access (Premium)
- REST API for programmatic access
- Webhook notifications

## Testing Subscription Flow

1. **Test Checkout:**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date and CVC

2. **Test Portal:**
   - Cancel subscription
   - Update payment method
   - View invoices

3. **Test Feature Access:**
   - Log in as free user → should see upgrade prompts
   - Upgrade to Plus → should unlock advanced analytics
   - Upgrade to Premium → should unlock AI insights
