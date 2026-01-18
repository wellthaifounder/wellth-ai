// Secure error handling utility
// Tier 4 Security Enhancement - Prevents information disclosure

/**
 * Handles errors securely by:
 * 1. Logging detailed errors only in development
 * 2. Showing generic messages to users
 * 3. Preventing PHI exposure in logs
 * 4. Generating error IDs for support reference
 */

type ToastFunction = (message: string, options?: any) => void;

/**
 * Log error securely (development only)
 */
export const logError = (message: string, error?: unknown, context?: Record<string, any>) => {
  if (import.meta.env.DEV) {
    console.error(`[${new Date().toISOString()}] ${message}`, error, context);
  }
  // In production, would send to secure logging service (Sentry, LogRocket, etc.)
  // Example: captureException(error, { contexts: context });
};

/**
 * Handle error with user-friendly message
 *
 * @param error - The error object
 * @param context - Context about where error occurred (for logging)
 * @param toast - Toast function to show message
 * @param userMessage - Optional custom message for user (defaults to generic)
 */
export const handleError = (
  error: unknown,
  context: string,
  toast?: ToastFunction,
  userMessage?: string
) => {
  const errorId = crypto.randomUUID().substring(0, 8);
  const defaultMessage = "An error occurred. Please try again.";

  // Log detailed error in development only
  logError(`Error in ${context}`, error, { errorId });

  // Show generic message to user
  if (toast) {
    toast(userMessage || defaultMessage, {
      description: `Reference ID: ${errorId}`,
      duration: 4000,
    });
  }
};

/**
 * Handle async operation with error handling
 * Wrapper for try-catch blocks
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string,
  toast?: ToastFunction,
  errorMessage?: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context, toast, errorMessage);
    return null;
  }
};

/**
 * Sanitize error message for display
 * Removes sensitive information from error messages
 */
export const sanitizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Remove file paths, URLs, and other sensitive info
    return error.message
      .replace(/https?:\/\/[^\s]+/g, '[URL]')
      .replace(/\/[^\s]+\.(ts|tsx|js|jsx)/g, '[FILE]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]') // SSN pattern
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  }
  return 'An unexpected error occurred';
};

/**
 * HIPAA-compliant PHI sanitization
 * Redacts Protected Health Information from strings before logging or display
 *
 * PHI includes (per HIPAA Safe Harbor):
 * - Names, addresses, dates, phone/fax numbers
 * - SSN, MRN, health plan numbers, account numbers
 * - Email, URLs, IPs, biometric IDs, photos
 * - Any unique identifying number or code
 */
export const sanitizePHI = (text: string): string => {
  if (!text || typeof text !== 'string') return text;

  return text
    // Social Security Numbers (XXX-XX-XXXX or XXXXXXXXX)
    .replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, '[SSN-REDACTED]')

    // Medical Record Numbers (MRN patterns)
    .replace(/\b(MRN|mrn|Medical Record|Patient ID)[\s:]*[\w-]+/gi, '[MRN-REDACTED]')

    // Account/Invoice numbers that might contain patient identifiers
    .replace(/\b(Account|Acct|Invoice|Bill)[\s#:]*[\w-]{6,}/gi, '[ACCOUNT-REDACTED]')

    // Phone numbers (various formats)
    .replace(/\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE-REDACTED]')

    // Email addresses
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, '[EMAIL-REDACTED]')

    // Dates of birth (various formats)
    .replace(/\b(DOB|Date of Birth|Birth Date)[\s:]*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi, '[DOB-REDACTED]')

    // Insurance/Health Plan numbers
    .replace(/\b(Policy|Member|Subscriber|Group)[\s#:]*[\w-]{6,}/gi, '[INSURANCE-REDACTED]')

    // IP addresses
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP-REDACTED]')

    // URLs with patient data
    .replace(/https?:\/\/[^\s]+/g, '[URL-REDACTED]')

    // File paths that might contain patient names
    .replace(/[A-Za-z]:\\[^\s]+/g, '[PATH-REDACTED]')
    .replace(/\/[a-z]+\/[^\s]+/gi, '[PATH-REDACTED]')

    // Names following common prefixes
    .replace(/\b(Patient|Name|Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*/g, '[NAME-REDACTED]');
};

/**
 * Safe logging wrapper that sanitizes PHI
 * Use this instead of console.log for any data that might contain PHI
 */
export const safeLog = (message: string, data?: unknown) => {
  if (import.meta.env.DEV) {
    const sanitizedMessage = sanitizePHI(message);
    if (data) {
      const sanitizedData = typeof data === 'string'
        ? sanitizePHI(data)
        : JSON.parse(sanitizePHI(JSON.stringify(data)));
      console.log(`[${new Date().toISOString()}] ${sanitizedMessage}`, sanitizedData);
    } else {
      console.log(`[${new Date().toISOString()}] ${sanitizedMessage}`);
    }
  }
};

/**
 * Check if a value contains potential PHI
 * Returns true if PHI patterns are detected
 */
export const containsPHI = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;

  const phiPatterns = [
    /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/, // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i, // Email
    /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone
  ];

  return phiPatterns.some(pattern => pattern.test(value));
};
