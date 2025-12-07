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
