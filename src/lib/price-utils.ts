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

/**
 * Formats a BRL value for display: comma decimal, dot thousands.
 * Example: "100000" → "1.000,00"   (assumes 2 decimal places for BRL)
 * Example: "1000.50" → "1.000,50"
 */
export const formatBRL = (value: string): string => {
  // Remove everything except digits and comma
  let clean = value.replace(/[^\d,]/g, "");
  // Replace comma with dot for parsing
  const numeric = parseFloat(clean.replace(",", "."));
  if (isNaN(numeric)) return value;
  return numeric.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Universal display formatter: chooses format based on currency.
 * - brl / pix → pt-BR format (1.000,00)
 * - kk / coins → Tibia format (1.000.000)
 */
export const formatDisplayPrice = (price: string | null | undefined, currency?: string | null): string => {
  if (!price || price === "Aceita ofertas") return price || "";
  const c = (currency || "kk").toLowerCase();
  if (c === "brl" || c === "pix") {
    // Try to parse as number and format BRL style
    const numeric = parseFloat(price.replace(/\./g, "").replace(",", "."));
    if (!isNaN(numeric)) {
      return numeric.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return price;
  }
  // kk / coins: keep as-is (already formatted with dots as thousands)
  return price;
};

/**
 * Input formatter: formats while typing based on currency.
 * - brl / pix → accepts comma/dot, formats to pt-BR
 * - kk / coins → digits only with dot thousands
 */
export const formatPriceInput = (value: string, currency: string): string => {
  const c = currency.toLowerCase();
  if (c === "brl" || c === "pix") {
    // Allow digits, comma, dot. Keep only last comma as decimal separator
    let cleaned = value.replace(/[^\d.,]/g, "");
    // Count commas - keep only the last one
    const commaCount = (cleaned.match(/,/g) || []).length;
    if (commaCount > 1) {
      const lastComma = cleaned.lastIndexOf(",");
      cleaned = cleaned.slice(0, lastComma).replace(/,/g, "") + cleaned.slice(lastComma);
    }
    // Remove dots (they'll be added back by toLocaleString)
    cleaned = cleaned.replace(/\./g, "");
    if (!cleaned) return "";
    // If has comma, it's decimal
    if (cleaned.includes(",")) {
      const [intPart, decPart] = cleaned.split(",");
      const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return `${intFormatted},${decPart.slice(0, 2)}`;
    }
    // Just integer part
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  // kk / coins
  return formatPriceWithDots(value);
};
