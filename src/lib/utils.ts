import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency with proper localization
 * @param amount - The number to format
 * @param currency - The currency code (default: USD)
 * @param options - Additional Intl.NumberFormat options
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * Format a number with proper thousand separators
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 0)
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format a number as a percentage
 * @param num - The number to format (0-100)
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatPercent(num: number, decimals: number = 1): string {
  return `${num.toFixed(decimals)}%`;
}

/**
 * Compact large numbers (e.g., 1000 -> 1K, 1000000 -> 1M)
 * @param num - The number to format
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(num);
}
