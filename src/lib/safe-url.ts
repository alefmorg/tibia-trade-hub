/**
 * Returns the URL only if it uses a safe http(s) protocol.
 * Prevents javascript:, data:, and other dangerous URL schemes from being rendered as links.
 */
export function safeHref(url: string | null | undefined): string {
  if (!url) return "#";
  try {
    const parsed = new URL(url, window.location.origin);
    return ["https:", "http:"].includes(parsed.protocol) ? url : "#";
  } catch {
    return "#";
  }
}
