/**
 * Wraps a Supabase query function with a 5-second AbortController timeout.
 * Pairs with `.abortSignal(signal)` on the query builder so a stalled request
 * fails fast instead of hanging the page forever (Wave 2 review finding #1).
 *
 * Usage:
 *   queryFn: () => withQueryTimeout(async (signal) => {
 *     const { data, error } = await supabase
 *       .from("invoices")
 *       .select("*")
 *       .abortSignal(signal);
 *     if (error) throw error;
 *     return data;
 *   })
 */
export async function withQueryTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms = 5000,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
}
