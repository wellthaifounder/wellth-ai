# Design System Phase 6: Charts & Tables Enhancement

## Overview
Phase 6 focused on refining data visualization and table presentation with Stripe-style aesthetics, standardized number formatting, and comprehensive accessibility.

## 1. Number Formatting Utilities

Created standardized formatting functions in `src/lib/utils.ts`:

### Functions Added:
- **`formatCurrency(amount, currency, options)`** - Formats numbers as currency with proper localization
- **`formatNumber(num, decimals)`** - Formats numbers with thousand separators
- **`formatPercent(num, decimals)`** - Formats numbers as percentages
- **`formatCompactNumber(num)`** - Compacts large numbers (1K, 1M notation)

### Usage Example:
```typescript
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

formatCurrency(1234.56)        // "$1,234.56"
formatNumber(1234567, 2)       // "1,234,567.00"
formatPercent(45.678, 1)       // "45.7%"
formatCompactNumber(1500000)   // "1.5M"
```

## 2. Stripe-Style Tables

Enhanced `src/components/ui/table.tsx` with professional styling:

### Table Component Updates:
- **TableRow**: Subtle hover states with smooth transitions
  - `hover:bg-accent/5` for gentle highlighting
  - `hover:border-border/60` for refined borders
  - Transition duration: 200ms

- **TableHead**: Modern header styling
  - Small caps with tracking (`text-xs font-semibold uppercase tracking-wider`)
  - Subtle background: `bg-muted/30`
  - Reduced height: `h-11` (from h-12)

- **TableCell**: Optimized padding and typography
  - Reduced padding: `px-4 py-3` (from p-4)
  - Consistent font size: `text-sm`

### Design Tokens Used:
- `border-border/40` and `border-border/60` for border states
- `bg-accent/5` and `bg-accent/10` for hover/selected states
- `bg-muted/30` for header backgrounds
- `text-muted-foreground/90` for header text

## 3. Recharts Theme Refinement

Updated all chart components to use semantic design tokens:

### Chart Components Updated:
- `src/components/analytics/YearOverYearComparison.tsx`
- `src/components/analytics/HSAInvestmentTracker.tsx`
- `src/components/analytics/RewardsOptimizationDashboard.tsx`
- `src/pages/Reports.tsx`

### Theme Improvements:

#### Colors:
- Primary line: `stroke="hsl(var(--primary))"`
- Secondary lines: `stroke="hsl(var(--chart-2))"`, `stroke="hsl(var(--chart-3))"`
- Grid lines: `stroke="hsl(var(--border))" opacity={0.3}`
- Axes: `stroke="hsl(var(--muted-foreground))"`

#### Tooltips:
```typescript
contentStyle={{
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow-lg)',
}}
```

#### Interactive Elements:
- Active dots: `activeDot={{ r: 6 }}`
- Regular dots: `dot={{ fill: 'hsl(var(--primary))', r: 4 }}`
- Legend padding: `wrapperStyle={{ paddingTop: '20px' }}`
- Rounded bars: `radius={[8, 8, 0, 0]}`

## 4. Chart Accessibility

Added comprehensive ARIA labels to all charts:

### Chart Container Labels:
```jsx
<div 
  role="img" 
  aria-label="Line chart comparing year-over-year savings trends. Shows total savings, tax savings, and rewards earned across multiple years to track financial progress over time."
>
```

### Axis Labels:
```jsx
<XAxis 
  aria-label="Year"
  stroke="hsl(var(--muted-foreground))"
/>
<YAxis 
  aria-label="Amount in dollars"
  stroke="hsl(var(--muted-foreground))"
/>
```

### Screen Reader Support:
- All charts wrapped with `role="img"`
- Descriptive `aria-label` explaining chart purpose and data
- Axis labels identifying what each axis represents
- Clear legend text for data series

## 5. Dark Mode Support

All enhancements include dark mode considerations:

### Table Styling:
- Dynamic borders that adapt to theme
- Subtle hover states that work in both modes
- Header backgrounds with proper contrast

### Chart Styling:
- Uses semantic tokens that automatically adapt
- Tooltip backgrounds follow theme
- Grid opacity adjusted for visibility in both modes

## Visual Improvements

### Before:
- Basic table styling with standard padding
- Charts using hardcoded colors
- Inconsistent number formatting across the app
- Limited accessibility labels

### After:
- Professional Stripe-style tables with refined spacing
- Charts using semantic color tokens from design system
- Standardized number formatting with utilities
- Comprehensive accessibility with ARIA labels
- Smooth hover transitions and interactions
- Enhanced dark mode support

## Benefits

1. **Consistency**: All numbers formatted uniformly across the application
2. **Accessibility**: Screen readers can properly announce chart content
3. **Professional Polish**: Tables have refined, Stripe-inspired aesthetics
4. **Theme Adherence**: Charts use semantic tokens, not hardcoded colors
5. **Maintainability**: Centralized utilities make future updates easier
6. **Performance**: Optimized rendering with proper transitions

## Testing Checklist

- [x] Number formatting utilities work correctly
- [x] Tables render properly in light and dark modes
- [x] Chart colors use semantic tokens
- [x] Hover states work smoothly on tables
- [x] ARIA labels are descriptive and accurate
- [x] Screen readers can announce chart content
- [x] Tooltips display with proper styling
- [x] Charts are responsive on all screen sizes

## Next Steps

Consider these enhancements for future phases:
- Add data export functionality to tables
- Implement chart download/save as image
- Add more chart types (area charts, scatter plots)
- Create reusable chart wrapper components
- Add chart animation options
- Implement table sorting and filtering UI
