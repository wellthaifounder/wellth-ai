# Wellth.ai Design System Master Guide

**Version 1.0** | Complete Implementation Reference

## Table of Contents
1. [Overview](#overview)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Shadows & Elevation](#shadows--elevation)
6. [Border Radius](#border-radius)
7. [Gradients](#gradients)
8. [Animation System](#animation-system)
9. [Component Patterns](#component-patterns)
10. [Charts & Data Visualization](#charts--data-visualization)
11. [Tables](#tables)
12. [Number Formatting](#number-formatting)
13. [Accessibility Guidelines](#accessibility-guidelines)
14. [Best Practices](#best-practices)
15. [Quick Reference](#quick-reference)

---

## Overview

The Wellth.ai design system is built on semantic tokens using HSL color values, ensuring consistency across light and dark modes. All design tokens are defined in `src/index.css` and exposed through `tailwind.config.ts`.

### Core Principles
- **Semantic Tokens Only**: Never use direct colors like `text-white` or `bg-gray-500`
- **HSL Color Format**: All colors use HSL for better theme manipulation
- **Mobile-First**: All components are responsive by default
- **Accessibility**: WCAG AA compliant with proper contrast ratios
- **Type Safety**: TypeScript utilities for formatting and validation

---

## Color System

### Semantic Color Tokens

All colors are defined in `src/index.css` and automatically adapt to light/dark mode.

#### Primary Colors
```css
/* Use these for main brand elements */
--primary: 178 85% 36%           /* Main teal brand color */
--primary-foreground: 0 0% 100%  /* Text on primary */
```

**Usage:**
```jsx
<Button className="bg-primary text-primary-foreground">
  Primary Action
</Button>
```

#### Background & Foreground
```css
--background: 0 0% 100%          /* Main background */
--foreground: 222.2 84% 4.9%     /* Main text color */
```

**Usage:**
```jsx
<div className="bg-background text-foreground">
  Main content area
</div>
```

#### Secondary Colors
```css
--secondary: 210 40% 96.1%       /* Secondary UI elements */
--secondary-foreground: 222.2 47.4% 11.2%
```

**Usage:**
```jsx
<Button variant="secondary">
  Secondary Action
</Button>
```

#### Accent Colors
```css
--accent: 210 40% 96.1%          /* Accent highlights */
--accent-foreground: 222.2 47.4% 11.2%
```

**Usage:**
```jsx
<div className="bg-accent text-accent-foreground">
  Highlighted section
</div>
```

#### Muted Colors
```css
--muted: 210 40% 96.1%           /* Subdued backgrounds */
--muted-foreground: 215.4 16.3% 46.9%  /* Subdued text */
```

**Usage:**
```jsx
<p className="text-muted-foreground">
  Secondary information
</p>
```

#### Semantic States
```css
--success: 142 71% 45%           /* Success states */
--success-foreground: 0 0% 100%
--destructive: 0 84.2% 60.2%     /* Error/danger states */
--destructive-foreground: 0 0% 100%
```

**Usage:**
```jsx
<Alert className="bg-success text-success-foreground">
  Success message
</Alert>
```

#### UI Elements
```css
--border: 214.3 31.8% 91.4%      /* Border color */
--input: 214.3 31.8% 91.4%       /* Input borders */
--ring: 222.2 84% 4.9%           /* Focus ring */
```

**Usage:**
```jsx
<Input className="border-border focus:ring-ring" />
```

#### Chart Colors
```css
/* Used for data visualization */
--chart-1: 178 85% 36%   /* Primary teal */
--chart-2: 228 36% 50%   /* Navy blue */
--chart-3: 43 75% 58%    /* Gold accent */
--chart-4: 122 39% 49%   /* Success green */
--chart-5: 357 79% 59%   /* Alert red */
```

**Usage:**
```jsx
<Line stroke="hsl(var(--chart-1))" />
```

### Tailwind Color Classes

All semantic tokens are exposed as Tailwind utilities:

```jsx
// Backgrounds
className="bg-primary"
className="bg-secondary"
className="bg-accent"
className="bg-muted"
className="bg-card"

// Text colors
className="text-foreground"
className="text-primary"
className="text-muted-foreground"
className="text-success"

// Borders
className="border-border"
className="border-input"

// Charts
className="bg-chart-1"
className="text-chart-2"
```

---

## Typography

### Font Families

```typescript
fontFamily: {
  sans: ["Inter", "system-ui", "sans-serif"],
  heading: ["Manrope", "Inter", "system-ui", "sans-serif"],
}
```

**Usage:**
```jsx
<h1 className="font-heading">Main Heading</h1>
<p className="font-sans">Body text</p>
```

### Font Sizes

All font sizes use CSS variables with paired line heights:

```typescript
fontSize: {
  xs: ['var(--text-xs)', { lineHeight: 'var(--leading-tight)' }],      // 0.75rem
  sm: ['var(--text-sm)', { lineHeight: 'var(--leading-normal)' }],     // 0.875rem
  base: ['var(--text-base)', { lineHeight: 'var(--leading-relaxed)' }], // 1rem
  lg: ['var(--text-lg)', { lineHeight: 'var(--leading-relaxed)' }],     // 1.125rem
  xl: ['var(--text-xl)', { lineHeight: 'var(--leading-snug)' }],        // 1.25rem
  '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-snug)' }],   // 1.5rem
  '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],  // 1.875rem
  '4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-tight)' }],  // 2.25rem
  '5xl': ['var(--text-5xl)', { lineHeight: 'var(--leading-tight)' }],  // 3rem
}
```

**Usage:**
```jsx
<h1 className="text-4xl font-heading">Page Title</h1>
<h2 className="text-2xl font-heading">Section Title</h2>
<p className="text-base">Body content</p>
<span className="text-sm text-muted-foreground">Helper text</span>
```

### Line Heights

```typescript
lineHeight: {
  none: 'var(--leading-none)',       // 1
  tight: 'var(--leading-tight)',     // 1.25
  snug: 'var(--leading-snug)',       // 1.375
  normal: 'var(--leading-normal)',   // 1.5
  relaxed: 'var(--leading-relaxed)', // 1.625
  loose: 'var(--leading-loose)',     // 2
}
```

### Typography Scale Best Practices

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Page Title | `text-4xl` or `text-5xl` | `font-bold` | Main page heading |
| Section Title | `text-2xl` or `text-3xl` | `font-semibold` | Section headings |
| Card Title | `text-lg` or `text-xl` | `font-semibold` | Card headings |
| Body Text | `text-base` | `font-normal` | Paragraphs, content |
| Helper Text | `text-sm` | `font-normal` | Descriptions, hints |
| Labels | `text-sm` | `font-medium` | Form labels |
| Micro Copy | `text-xs` | `font-medium` | Badges, tags |

---

## Spacing & Layout

### Spacing Scale

Based on an 8px grid system:

```typescript
spacing: {
  '0': 'var(--space-0)',   // 0
  '1': 'var(--space-1)',   // 0.25rem (4px)
  '2': 'var(--space-2)',   // 0.5rem (8px)
  '3': 'var(--space-3)',   // 0.75rem (12px)
  '4': 'var(--space-4)',   // 1rem (16px)
  '5': 'var(--space-5)',   // 1.5rem (24px)
  '6': 'var(--space-6)',   // 2rem (32px)
  '8': 'var(--space-8)',   // 3rem (48px)
  '10': 'var(--space-10)', // 4rem (64px)
}
```

### Layout Patterns

#### Card Spacing
```jsx
<Card className="p-6 space-y-4">
  {/* 24px padding, 16px vertical spacing */}
</Card>
```

#### Dashboard Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Responsive grid with 24px gaps */}
</div>
```

#### Form Layout
```jsx
<form className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Responsive form with 16px gaps */}
  </div>
</form>
```

#### Section Spacing
```jsx
<section className="py-10 px-4">
  {/* 64px vertical padding, 16px horizontal */}
</section>
```

### Responsive Breakpoints

```typescript
screens: {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1400px' // Extra large
}
```

---

## Shadows & Elevation

### Shadow Scale

```typescript
boxShadow: {
  xs: 'var(--shadow-xs)',   // 0 1px 2px rgba(0,0,0,0.05)
  sm: 'var(--shadow-sm)',   // 0 1px 3px rgba(0,0,0,0.1)
  DEFAULT: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',   // 0 4px 6px rgba(0,0,0,0.1)
  lg: 'var(--shadow-lg)',   // 0 10px 15px rgba(0,0,0,0.1)
  xl: 'var(--shadow-xl)',   // 0 20px 25px rgba(0,0,0,0.1)
}
```

### Elevation Guidelines

| Level | Shadow | Use Case |
|-------|--------|----------|
| 0 | `shadow-none` | Flat elements, inline content |
| 1 | `shadow-xs` | Subtle borders, minimal lift |
| 2 | `shadow-sm` | Cards, inputs (default) |
| 3 | `shadow-md` | Raised cards, hover states |
| 4 | `shadow-lg` | Modals, dropdowns, popovers |
| 5 | `shadow-xl` | High-priority modals, notifications |

**Usage:**
```jsx
<Card className="shadow-sm hover:shadow-md transition-shadow">
  Hover to elevate
</Card>
```

---

## Border Radius

### Radius Scale

```typescript
borderRadius: {
  xs: "var(--radius-xs)",   // 0.125rem (2px)
  sm: "var(--radius-sm)",   // 0.25rem (4px)
  DEFAULT: "var(--radius-md)",
  md: "var(--radius-md)",   // 0.5rem (8px)
  lg: "var(--radius-lg)",   // 0.75rem (12px)
  xl: "var(--radius-xl)",   // 1rem (16px)
  full: "var(--radius-full)", // 9999px (circle)
}
```

### Usage Guidelines

| Element | Radius | Example |
|---------|--------|---------|
| Buttons | `rounded-md` | Primary actions |
| Cards | `rounded-lg` | Content containers |
| Inputs | `rounded-md` | Form fields |
| Badges | `rounded-full` | Status indicators |
| Modals | `rounded-xl` | Dialogs, overlays |
| Avatars | `rounded-full` | Profile images |

**Usage:**
```jsx
<Button className="rounded-md">Default Button</Button>
<Card className="rounded-lg">Content Card</Card>
<Badge className="rounded-full">Status</Badge>
```

---

## Gradients

### Gradient Tokens

Defined in CSS and exposed as Tailwind utilities:

```css
/* Light Mode */
--gradient-hero: linear-gradient(135deg, 
  hsl(var(--primary)) 0%, 
  hsl(var(--primary) / 0.8) 100%);

--gradient-card: linear-gradient(135deg, 
  hsl(var(--card)) 0%, 
  hsl(var(--muted)) 100%);

--gradient-accent: linear-gradient(135deg, 
  hsl(var(--accent)) 0%, 
  hsl(var(--primary) / 0.1) 100%);
```

### Usage

```jsx
// Hero sections
<div className="bg-gradient-hero">
  <h1>Welcome to Wellth</h1>
</div>

// Card backgrounds
<Card className="bg-gradient-card">
  Gradient card content
</Card>

// Accent elements
<div className="bg-gradient-accent p-6">
  Highlighted section
</div>
```

### Custom Gradients

For one-off gradients, use inline styles with semantic tokens:

```jsx
<div style={{
  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--chart-1)))'
}}>
  Custom gradient
</div>
```

---

## Animation System

### Transition Utilities

```typescript
// Default transitions
className="transition-colors"      // Color changes
className="transition-transform"   // Scale, rotate
className="transition-shadow"      // Shadow changes
className="transition-all"         // All properties

// Duration modifiers
className="duration-150"  // Fast (150ms)
className="duration-200"  // Default (200ms)
className="duration-300"  // Smooth (300ms)
```

### Hover States

```jsx
// Button hover
<Button className="hover:bg-primary/90 transition-colors">
  Hover Effect
</Button>

// Card elevation
<Card className="hover:shadow-md transition-shadow">
  Hover to elevate
</Card>

// Scale interaction
<div className="hover:scale-105 transition-transform">
  Grows on hover
</div>
```

### Active States

```jsx
<Button className="active:scale-95 transition-transform">
  Press Effect
</Button>
```

### Focus States

```jsx
<Input className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" />
```

### Loading States

Use the skeleton component for loading states:

```jsx
import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="h-20 w-full" />
```

### Confetti Celebrations

Use for significant achievements:

```typescript
import { triggerConfetti } from "@/lib/confettiUtils";

// On success
triggerConfetti();
```

---

## Component Patterns

### Button Variants

The button component supports multiple variants:

```jsx
import { Button } from "@/components/ui/button";

<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Danger</Button>
```

### Button Sizes

```jsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <IconComponent />
</Button>
```

### Card Patterns

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card className="shadow-sm hover:shadow-md transition-shadow">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Supporting text</CardDescription>
  </CardHeader>
  <CardContent>
    Main content area
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Form Patterns

```jsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

<Form {...form}>
  <form className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="fieldName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field Label</FormLabel>
            <FormControl>
              <Input placeholder="Enter value" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </form>
</Form>
```

### Modal Patterns

```jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="rounded-xl">
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Supporting description text
      </DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

### Toast Notifications

```jsx
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

toast({
  title: "Success",
  description: "Your changes have been saved.",
  variant: "default", // or "destructive"
});
```

---

## Charts & Data Visualization

### Recharts Theme

All charts should use semantic color tokens:

```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

<div 
  role="img" 
  aria-label="Descriptive chart label explaining what the chart shows"
>
  <LineChart data={data}>
    <CartesianGrid 
      strokeDasharray="3 3" 
      stroke="hsl(var(--border))" 
      opacity={0.3} 
    />
    <XAxis 
      dataKey="name" 
      stroke="hsl(var(--muted-foreground))"
      aria-label="X axis label"
    />
    <YAxis 
      stroke="hsl(var(--muted-foreground))"
      aria-label="Y axis label"
    />
    <Tooltip
      contentStyle={{
        backgroundColor: 'hsl(var(--popover))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-lg)',
      }}
      labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
    />
    <Legend 
      wrapperStyle={{ paddingTop: '20px' }}
    />
    <Line 
      type="monotone" 
      dataKey="value" 
      stroke="hsl(var(--chart-1))" 
      strokeWidth={2}
      dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
      activeDot={{ r: 6 }}
    />
  </LineChart>
</div>
```

### Chart Color Usage

Use chart tokens in order for consistency:

| Data Series | Token | Color |
|-------------|-------|-------|
| Primary data | `--chart-1` | Teal |
| Secondary data | `--chart-2` | Navy |
| Tertiary data | `--chart-3` | Gold |
| Success metrics | `--chart-4` | Green |
| Alert metrics | `--chart-5` | Red |

### Bar Charts

```jsx
<Bar 
  dataKey="value" 
  fill="hsl(var(--chart-1))" 
  radius={[8, 8, 0, 0]}
/>
```

### Pie Charts

```jsx
<Pie
  data={data}
  fill="hsl(var(--chart-1))"
  dataKey="value"
>
  {data.map((entry, index) => (
    <Cell 
      key={`cell-${index}`} 
      fill={`hsl(var(--chart-${(index % 5) + 1}))`} 
    />
  ))}
</Pie>
```

### Chart Accessibility

Every chart must include:
1. **Container ARIA label**: Describes the chart's purpose
2. **Axis labels**: Identifies what each axis represents
3. **Legend**: Clear labels for all data series
4. **Color contrast**: Ensure chart colors meet WCAG AA

---

## Tables

### Stripe-Style Tables

Tables use refined styling inspired by Stripe:

```jsx
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data 1</TableCell>
      <TableCell>Data 2</TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(1234.56)}
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Table Features

- **Hover states**: Subtle `hover:bg-accent/5` with smooth transitions
- **Borders**: `border-border/40` for rows, `border-border/60` on hover
- **Header styling**: Small caps with `text-xs font-semibold uppercase tracking-wider`
- **Compact spacing**: `px-4 py-3` for cells (optimized for data density)
- **Background**: Headers use `bg-muted/30` for subtle differentiation

### Table Best Practices

1. Right-align numeric columns
2. Use `font-medium` for important values
3. Format all numbers with utilities
4. Keep headers concise and descriptive
5. Use `TableCaption` for screen readers

---

## Number Formatting

### Formatting Utilities

Located in `src/lib/utils.ts`:

#### Currency Formatting

```typescript
import { formatCurrency } from "@/lib/utils";

formatCurrency(1234.56)  // "$1,234.56"
formatCurrency(1234.56, 'EUR')  // "€1,234.56"
formatCurrency(1234.567, 'USD', { maximumFractionDigits: 3 })  // "$1,234.567"
```

**Function signature:**
```typescript
formatCurrency(
  amount: number, 
  currency: string = 'USD',
  options?: Intl.NumberFormatOptions
): string
```

#### Number Formatting

```typescript
import { formatNumber } from "@/lib/utils";

formatNumber(1234567)      // "1,234,567"
formatNumber(1234.5, 2)    // "1,234.50"
formatNumber(1234.567, 1)  // "1,234.6"
```

**Function signature:**
```typescript
formatNumber(num: number, decimals: number = 0): string
```

#### Percentage Formatting

```typescript
import { formatPercent } from "@/lib/utils";

formatPercent(45.678)       // "46%"
formatPercent(45.678, 1)    // "45.7%"
formatPercent(0.4567, 2)    // "0.46%"
```

**Function signature:**
```typescript
formatPercent(num: number, decimals: number = 0): string
```

#### Compact Numbers

```typescript
import { formatCompactNumber } from "@/lib/utils";

formatCompactNumber(1500)      // "1.5K"
formatCompactNumber(1500000)   // "1.5M"
formatCompactNumber(1500000000) // "1.5B"
```

**Function signature:**
```typescript
formatCompactNumber(num: number): string
```

### Formatting Best Practices

1. **Always format user-facing numbers**: Never display raw numbers
2. **Be consistent**: Use the same format for similar data types
3. **Consider locale**: The utilities use the user's locale by default
4. **Right-align in tables**: Numbers should align to the right
5. **Use compact format for large numbers**: Improves readability in dashboards

---

## Accessibility Guidelines

### Color Contrast

All color combinations meet WCAG AA standards:
- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text**: 3:1 minimum contrast ratio
- **UI components**: 3:1 minimum contrast ratio

### Keyboard Navigation

All interactive elements must be keyboard accessible:

```jsx
// Good: Proper focus indicators
<Button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
  Accessible Button
</Button>

// Good: Keyboard-accessible card
<Card 
  tabIndex={0}
  className="focus-visible:ring-2 focus-visible:ring-ring"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Interactive Card
</Card>
```

### ARIA Labels

#### Charts
```jsx
<div 
  role="img" 
  aria-label="Line chart showing monthly expense trends from January to December, with values ranging from $500 to $2000"
>
  <LineChart>
    <XAxis aria-label="Month" />
    <YAxis aria-label="Amount in dollars" />
  </LineChart>
</div>
```

#### Forms
```jsx
<FormField
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel htmlFor="email">Email Address</FormLabel>
      <FormControl>
        <Input 
          id="email"
          type="email"
          aria-required="true"
          aria-describedby="email-error"
          {...field} 
        />
      </FormControl>
      <FormMessage id="email-error" />
    </FormItem>
  )}
/>
```

#### Buttons
```jsx
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>
```

### Screen Reader Support

1. **Skip links**: Provide skip navigation for keyboard users
2. **Live regions**: Use `aria-live` for dynamic content updates
3. **Role attributes**: Use semantic HTML or ARIA roles
4. **Alt text**: All images must have descriptive alt attributes
5. **Focus management**: Trap focus in modals, return focus on close

### Accessibility Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and meet contrast requirements
- [ ] All images have alt text
- [ ] Forms have proper labels and error messages
- [ ] Color is not the only means of conveying information
- [ ] Charts have descriptive ARIA labels
- [ ] Tables have proper headers and scope
- [ ] Modals trap focus and can be dismissed with Escape
- [ ] Loading states have appropriate ARIA attributes
- [ ] All content is screen reader friendly

---

## Best Practices

### DO ✅

1. **Use Semantic Tokens**
   ```jsx
   // ✅ Good
   <div className="bg-primary text-primary-foreground">
   
   // ❌ Bad
   <div className="bg-teal-600 text-white">
   ```

2. **Use Design System Utilities**
   ```jsx
   // ✅ Good
   <div className="p-6 space-y-4 rounded-lg shadow-sm">
   
   // ❌ Bad
   <div className="p-[24px] space-y-[16px] rounded-[12px]" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
   ```

3. **Format Numbers Consistently**
   ```jsx
   // ✅ Good
   {formatCurrency(amount)}
   
   // ❌ Bad
   ${amount.toFixed(2)}
   ```

4. **Create Component Variants**
   ```jsx
   // ✅ Good
   <Button variant="premium">Upgrade</Button>
   
   // ❌ Bad
   <Button className="bg-gradient-to-r from-primary to-primary-glow text-white shadow-lg">
   ```

5. **Use Responsive Patterns**
   ```jsx
   // ✅ Good
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
   
   // ❌ Bad
   <div className="grid grid-cols-3 gap-6">
   ```

### DON'T ❌

1. **Don't Use Direct Colors**
   ```jsx
   // ❌ Never
   className="text-white bg-black"
   className="text-gray-500"
   className="bg-teal-600"
   ```

2. **Don't Use Arbitrary Values**
   ```jsx
   // ❌ Avoid
   className="p-[23px] text-[17px] rounded-[13px]"
   
   // ✅ Use design system values
   className="p-6 text-lg rounded-lg"
   ```

3. **Don't Inline Complex Styles**
   ```jsx
   // ❌ Bad
   <div style={{
     background: 'linear-gradient(135deg, #00b894, #0984e3)',
     padding: '24px',
     borderRadius: '12px'
   }}>
   
   // ✅ Good
   <div className="bg-gradient-hero p-6 rounded-lg">
   ```

4. **Don't Skip Accessibility**
   ```jsx
   // ❌ Bad
   <div onClick={handleClick}>Click me</div>
   
   // ✅ Good
   <Button onClick={handleClick}>Click me</Button>
   ```

5. **Don't Create Monolithic Components**
   ```jsx
   // ❌ Bad: 500-line component
   
   // ✅ Good: Break into smaller, focused components
   <Dashboard>
     <DashboardHeader />
     <DashboardStats />
     <DashboardCharts />
   </Dashboard>
   ```

### Component Organization

```
src/components/
├── ui/                    # Base UI components (Button, Card, etc.)
├── dashboard/             # Dashboard-specific components
├── analytics/             # Analytics-specific components
├── forms/                 # Form-specific components
└── [feature]/             # Feature-specific components
```

### File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `DashboardHeader.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatCurrency.ts`)
- Constants: `UPPER_SNAKE_CASE.ts` (e.g., `API_ENDPOINTS.ts`)
- Hooks: `use*.ts` (e.g., `useToast.ts`)

---

## Quick Reference

### Color Tokens Quick List

```typescript
// Backgrounds
bg-background, bg-card, bg-muted, bg-accent, bg-primary, bg-secondary

// Text
text-foreground, text-muted-foreground, text-primary, text-secondary

// Borders
border-border, border-input

// States
bg-success, bg-destructive, text-success-foreground, text-destructive-foreground

// Charts
bg-chart-1, bg-chart-2, bg-chart-3, bg-chart-4, bg-chart-5
```

### Spacing Quick List

```typescript
// Padding/Margin
p-0, p-1, p-2, p-3, p-4, p-5, p-6, p-8, p-10
m-0, m-1, m-2, m-3, m-4, m-5, m-6, m-8, m-10

// Gap
gap-2 (8px), gap-4 (16px), gap-6 (24px)

// Space-y (vertical)
space-y-2, space-y-4, space-y-6
```

### Typography Quick List

```typescript
// Sizes
text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl, text-4xl, text-5xl

// Weights
font-normal, font-medium, font-semibold, font-bold

// Families
font-sans, font-heading
```

### Common Patterns

```jsx
// Card
<Card className="p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow rounded-lg">

// Button
<Button className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-md">

// Input
<Input className="border-input focus-visible:ring-2 focus-visible:ring-ring rounded-md">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Flex
<div className="flex items-center justify-between gap-4">
```

### Utilities Quick Reference

```typescript
// Number formatting
import { formatCurrency, formatNumber, formatPercent, formatCompactNumber } from "@/lib/utils";

// Usage
formatCurrency(1234.56)     // "$1,234.56"
formatNumber(1234567, 2)    // "1,234,567.00"
formatPercent(45.5, 1)      // "45.5%"
formatCompactNumber(1500000) // "1.5M"
```

---

## Version History

### Version 1.0 (Current)
- Complete 6-phase implementation
- Gap fixes for chart colors and gradients
- Comprehensive accessibility audit
- Stripe-style tables
- Number formatting utilities
- Full dark mode support

### Implementation Status

✅ **Completed:**
- Phase 1: Foundation & Colors
- Phase 2: Typography & Spacing  
- Phase 3: Components & Interactions
- Phase 4: Animation & Delight
- Phase 5: Accessibility & Polish
- Phase 6: Data Visualization
- Gap Fixes: Chart tokens & Gradients

### Maintenance

This design system is maintained as part of the Wellth.ai codebase. For updates:
1. Update tokens in `src/index.css`
2. Expose in `tailwind.config.ts`
3. Document changes in this file
4. Test in both light and dark modes
5. Verify accessibility compliance

---

## Support & Resources

- **Design Tokens**: `src/index.css`
- **Tailwind Config**: `tailwind.config.ts`
- **Utilities**: `src/lib/utils.ts`
- **Components**: `src/components/ui/`
- **Phase Documentation**: See individual `DESIGN_SYSTEM_PHASE*.md` files

For questions or contributions, refer to the individual phase documentation for detailed implementation notes.
