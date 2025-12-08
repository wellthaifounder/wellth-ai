# PHI Handling Guide

This guide explains how to properly handle Protected Health Information (PHI) in Wellth.ai code to maintain HIPAA compliance.

## Table of Contents

- [What is PHI?](#what-is-phi)
- [PHI in Wellth.ai](#phi-in-wellthai)
- [Golden Rules](#golden-rules)
- [PHI Redaction System](#phi-redaction-system)
- [Logging Guidelines](#logging-guidelines)
- [Error Handling](#error-handling)
- [Database Operations](#database-operations)
- [API Responses](#api-responses)
- [Code Examples](#code-examples)

---

## What is PHI?

**Protected Health Information (PHI)** is any information about health status, provision of healthcare, or payment for healthcare that can be linked to an individual.

### 18 HIPAA Identifiers

1. **Names** - Patient, family, employer names
2. **Geographic subdivisions** - Smaller than state (addresses, ZIP codes)
3. **Dates** - Birth, admission, discharge, death (except year)
4. **Phone numbers**
5. **Fax numbers**
6. **Email addresses**
7. **Social Security Numbers**
8. **Medical Record Numbers (MRN)**
9. **Health plan beneficiary numbers**
10. **Account numbers**
11. **Certificate/license numbers**
12. **Vehicle identifiers** - License plates, VINs
13. **Device identifiers** - Serial numbers
14. **URLs**
15. **IP addresses**
16. **Biometric identifiers** - Fingerprints, voiceprints
17. **Photos** - Full face or comparable images
18. **Other unique identifying numbers**

---

## PHI in Wellth.ai

### Data We Handle

**Definitely PHI:**
- Medical bill content (diagnoses, procedures, provider names)
- Insurance information (plan numbers, member IDs)
- Provider names and addresses
- Medical Record Numbers
- Social Security Numbers (on bills)
- Patient names (on bills)

**Potentially PHI:**
- Expense amounts (linked to medical services)
- Receipt images (if contain provider info)
- Transaction descriptions (if mention medical services)

**Not PHI:**
- User IDs (UUIDs - not linked to identity outside system)
- Aggregate statistics
- De-identified data

---

## Golden Rules

### 1. Never Log PHI

```typescript
// ❌ BAD - Logs PHI
console.log('Processing bill for patient:', patientName);
console.error('Failed to save SSN:', ssn);
console.log('User email:', user.email);

// ✅ GOOD - Logs non-PHI identifiers
console.log('Processing bill for user ID:', userId);
console.error('Failed to save encrypted token for user:', userId);
logError('User operation failed', error, { userId: user.id });
```

### 2. Use Error Sanitization

```typescript
import { handleError, logError } from '@/utils/errorHandler';

// ❌ BAD - Exposes error details (might contain PHI)
try {
  await processData(userEmail, ssn);
} catch (error) {
  toast.error(error.message); // Might leak PHI
}

// ✅ GOOD - Generic message, safe logging
try {
  await processData(userEmail, ssn);
} catch (error) {
  logError('Data processing failed', error, { userId });
  handleError(error, 'process-data', toast, 'Operation failed');
}
```

### 3. Redact PHI in User-Facing Content

```typescript
// ❌ BAD - Shows full SSN to user
<div>SSN: {bill.ssn}</div>

// ✅ GOOD - Masked display
<div>SSN: ***-**-{bill.ssn.slice(-4)}</div>

// ✅ BETTER - Redacted at source
const redactedBillText = await redactPHI(bill.content);
```

### 4. Encrypt Sensitive Data at Rest

```typescript
// ✅ GOOD - Encrypt before storing
import { encryptPlaidToken } from '../_shared/encryption';

const encryptedToken = await encryptPlaidToken(accessToken);
await supabase.from('plaid_connections').insert({
  encrypted_access_token: encryptedToken,
  user_id: userId
});
```

### 5. Use Request Correlation IDs, Not PHI

```typescript
// ❌ BAD - Use PHI for tracking
logger.info(`Processing request for ${userEmail}`);

// ✅ GOOD - Use correlation ID
const correlationId = crypto.randomUUID().substring(0, 8);
logger.info(`[${correlationId}] Processing request for user ${userId}`);
```

---

## PHI Redaction System

Wellth.ai uses a two-layer PHI redaction system.

### Layer 1: Pattern-Based Redaction

**Automatically detects and redacts:**
- Social Security Numbers: `XXX-XX-XXXX`
- Phone numbers: `(XXX) XXX-XXXX`
- Email addresses: `user@domain.com`
- Medical Record Numbers: `MRN: XXXXXXX`
- Dates of birth: `MM/DD/YYYY`
- Street addresses
- ZIP codes

```typescript
// Pattern-based redaction
function redactPHIPatterns(text: string): string {
  // SSN
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN-REDACTED]');

  // Phone
  text = text.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE-REDACTED]');

  // Email
  text = text.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL-REDACTED]');

  // MRN
  text = text.replace(/\b(?:MRN|Medical Record Number):?\s*\w+/gi, '[MRN-REDACTED]');

  return text;
}
```

### Layer 2: AI-Based Redaction

**Contextually identifies:**
- Patient names
- Provider names (when context suggests PHI)
- Partial addresses
- Insurance IDs
- Other contextual PHI

```typescript
// AI-based redaction using Gemini
import { GoogleGenerativeAI } from '@google/generative-ai';

async function redactPHIWithAI(text: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `
Identify and redact all Protected Health Information (PHI) in the following text.
Replace PHI with [TYPE-REDACTED]. Types: NAME, ADDRESS, PHONE, EMAIL, SSN, MRN, DOB.

Text: ${text}
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

### Using the Redaction System

```typescript
// Redact medical bill before AI analysis
import { redactPHI } from '@/utils/redactPHI';

const billContent = await fetchBillContent(billId);
const redactedContent = await redactPHI(billContent);

// Safe to send to AI for analysis
const analysis = await analyzeBill(redactedContent);
```

**Edge Function:** `supabase/functions/redact-phi/`

---

## Logging Guidelines

### Development vs Production

```typescript
import { logError } from '@/utils/errorHandler';

// Development only - detailed logs
if (import.meta.env.DEV) {
  console.log('Full data:', data); // OK in development
}

// Production - no PHI, use error utility
logError('Operation failed', error, {
  userId: user.id,  // ✅ OK - not PHI
  action: 'create-expense'  // ✅ OK - action type
  // ❌ NOT OK: email, name, SSN, etc.
});
```

### What to Log

**✅ Safe to Log:**
- User IDs (UUIDs)
- Request correlation IDs
- Action types ('create-expense', 'update-bill')
- Error types ('ValidationError', 'NetworkError')
- Timestamps
- Status codes
- Generic error messages

**❌ Never Log:**
- Names (patient, provider, user)
- Email addresses
- Phone numbers
- SSNs
- Medical Record Numbers
- Addresses
- Full error messages (might contain PHI)
- Database query results (might contain PHI)

### Example: Safe Logging

```typescript
// ✅ GOOD
logError('Bill analysis failed', error, {
  userId: user.id,
  billId: bill.id,
  errorType: error.constructor.name,
  timestamp: new Date().toISOString()
});

// ❌ BAD
console.error('Bill analysis failed', {
  userName: user.name,  // PHI
  userEmail: user.email,  // PHI
  billContent: bill.content,  // PHI
  error: error.message  // Might contain PHI
});
```

---

## Error Handling

### Use Error Sanitization Utility

```typescript
import { handleError } from '@/utils/errorHandler';

try {
  const result = await processUserData(userData);
} catch (error) {
  // Automatically sanitizes error message
  handleError(error, 'process-user-data', toast, 'Failed to process data');
  // User sees: "Failed to process data. Error ID: abc12345"
  // Logs (dev only): Full error with context
}
```

### Custom Error Messages

```typescript
// ✅ GOOD - Generic, no PHI
throw new Error('Invalid input format');
throw new Error('Database operation failed');
throw new Error('External service unavailable');

// ❌ BAD - Contains or might contain PHI
throw new Error(`Failed for user ${userEmail}`);
throw new Error(`Invalid SSN: ${ssn}`);
throw new Error(`Bill content: ${bill.content}`);
```

---

## Database Operations

### Querying Data

```typescript
// ✅ GOOD - RLS enforces user isolation
const { data, error } = await supabase
  .from('expenses')
  .select('*')
  .eq('user_id', user.id); // Explicit user check (defense-in-depth)

// Log on error (no PHI in query)
if (error) {
  logError('Failed to fetch expenses', error, { userId: user.id });
}
```

### Inserting Data

```typescript
// Validate and sanitize before insert
const expenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().max(50),
  date: z.string().datetime()
});

const validated = expenseSchema.parse(userInput);

const { error } = await supabase
  .from('expenses')
  .insert({
    ...validated,
    user_id: user.id
  });

if (error) {
  // Generic error (no PHI from validated input)
  handleError(error, 'create-expense', toast);
}
```

---

## API Responses

### Edge Function Responses

```typescript
// ✅ GOOD - Generic error response
if (!user) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: corsHeaders }
  );
}

// ❌ BAD - Leaks PHI
return new Response(
  JSON.stringify({
    error: 'User not found',
    details: `No user with email ${email}`  // PHI!
  }),
  { status: 404, headers: corsHeaders }
);
```

### Success Responses

```typescript
// ✅ GOOD - Returns data (protected by auth)
return new Response(
  JSON.stringify({
    success: true,
    data: billAnalysis // OK - user is authenticated
  }),
  { status: 200, headers: corsHeaders }
);

// ✅ ALSO GOOD - Redacted content
return new Response(
  JSON.stringify({
    success: true,
    data: {
      ...billAnalysis,
      content: await redactPHI(billAnalysis.content) // Extra safe
    }
  }),
  { status: 200, headers: corsHeaders }
);
```

---

## Code Examples

### Example 1: Processing Medical Bill

```typescript
// GOOD: Redact PHI before AI analysis
export async function analyzeMedicalBill(billId: string, userId: string) {
  try {
    // 1. Fetch bill (RLS ensures user owns it)
    const { data: bill, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', billId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Redact PHI from bill content
    const redactedContent = await redactPHI(bill.content);

    // 3. Send to AI (safe - no PHI)
    const analysis = await gemini.generateContent(
      `Analyze this medical bill for errors: ${redactedContent}`
    );

    // 4. Store results (no raw PHI)
    const { error: insertError } = await supabase
      .from('bill_reviews')
      .insert({
        bill_id: billId,
        user_id: userId,
        analysis: analysis.text(),
        identified_errors: parseErrors(analysis)
      });

    if (insertError) throw insertError;

    return { success: true };

  } catch (error) {
    // 5. Log safely (no PHI)
    logError('Bill analysis failed', error, {
      billId,
      userId
    });

    // 6. Generic error to user
    throw new Error('Failed to analyze bill');
  }
}
```

### Example 2: Displaying User Data

```tsx
// GOOD: Display PHI only to authorized user
export function BillDetail({ billId }: Props) {
  const { data: { user } } = useAuth();

  const { data: bill, isLoading } = useQuery({
    queryKey: ['bill', billId],
    queryFn: async () => {
      // RLS ensures user can only fetch their own bill
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', billId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <Skeleton />;
  if (!bill) return <NotFound />;

  return (
    <div>
      {/* OK to display - user is authenticated and owns bill */}
      <h1>{bill.provider_name}</h1>
      <p>Amount: {formatCurrency(bill.amount)}</p>
      <p>Date: {formatDate(bill.date)}</p>

      {/* Mask sensitive identifiers */}
      {bill.member_id && (
        <p>Member ID: ***-{bill.member_id.slice(-4)}</p>
      )}
    </div>
  );
}
```

### Example 3: Search Functionality

```typescript
// GOOD: Search without exposing PHI
export async function searchBills(userId: string, query: string) {
  // Don't log search query (might contain PHI)
  logError('Bill search initiated', null, { userId });

  const { data, error } = await supabase
    .from('invoices')
    .select('id, date, amount, provider_name')  // Don't include content
    .eq('user_id', userId)
    .ilike('provider_name', `%${query}%`);

  if (error) {
    logError('Bill search failed', error, { userId });
    return [];
  }

  return data;
}
```

---

## Testing with PHI

### Use Fake Data in Tests

```typescript
// ✅ GOOD - Fake PHI for testing
const testBill = {
  patient_name: 'Test Patient',
  ssn: '123-45-6789',
  mrn: 'MRN123456',
  content: 'Medical services for Test Patient...'
};

// ❌ BAD - Real PHI in tests
const testBill = {
  patient_name: 'John Smith',  // Real name
  ssn: '555-12-3456',  // Real-looking SSN
  // ...
};
```

### Test Data Generators

```typescript
// Utility for generating test PHI
function generateTestPHI() {
  return {
    name: faker.name.fullName(),
    ssn: '000-00-0000',  // Obviously fake
    mrn: `TEST-${faker.random.alphaNumeric(6)}`,
    email: 'test@example.com'
  };
}
```

---

## Checklist for Developers

Before committing code that touches PHI:

- [ ] No PHI in console.log statements
- [ ] Error messages sanitized (use handleError utility)
- [ ] Logging uses non-PHI identifiers (userIds, not emails)
- [ ] PHI redacted before sending to external services
- [ ] Database queries include explicit user_id checks
- [ ] API responses don't leak PHI in errors
- [ ] Test data uses fake PHI, not real data
- [ ] Comments don't include example PHI
- [ ] Documentation examples use obviously fake PHI

---

## Common Mistakes

### Mistake 1: Logging Full Objects

```typescript
// ❌ BAD
console.log('User data:', user);  // user contains email, name

// ✅ GOOD
console.log('User ID:', user.id);  // Only non-PHI identifier
```

### Mistake 2: Error Messages with Context

```typescript
// ❌ BAD
throw new Error(`Invalid email: ${email}`);

// ✅ GOOD
throw new Error('Invalid email format');
```

### Mistake 3: Debugging with PHI

```typescript
// ❌ BAD
console.log('Bill content:', bill.content);  // PHI!

// ✅ GOOD
console.log('Bill ID:', bill.id, 'length:', bill.content.length);
```

---

## Related Documentation

- [HIPAA Compliance Guide](hipaa-compliance.md) - Full compliance documentation
- [Security Policy](SECURITY.md) - Security measures and policies
- [Coding Standards](../development/coding-standards.md) - General coding guidelines
- [Error Handler Utility](../../src/utils/errorHandler.ts) - Error sanitization code

---

## Resources

- [HHS PHI Guidance](https://www.hhs.gov/hipaa/for-professionals/privacy/special-topics/de-identification/index.html)
- [HIPAA Privacy Rule](https://www.hhs.gov/hipaa/for-professionals/privacy/index.html)
- [De-identification Methods](https://www.hhs.gov/hipaa/for-professionals/privacy/special-topics/de-identification/index.html)

---

**Last Updated:** December 6, 2025
**Version:** 1.0.0
**Mandatory Training:** All developers must read before contributing
