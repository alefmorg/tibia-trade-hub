/**
 * Formats a numeric string with dots as thousand separators.
 * Example: "1000000" → "1.000.000"
 */
export const formatPriceWithDots = (value: string): string => {
  // Remove any non-digit characters
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  // Add dots as thousand separators
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/**
 * Removes dots from a formatted price string.
 * Example: "1.000.000" → "1000000"
 */
export const unformatPrice = (value: string): string => {
  return value.replace(/\./g, "");
};
