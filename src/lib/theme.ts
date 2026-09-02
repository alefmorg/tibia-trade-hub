/**
 * Tema dinâmico por empresa (white label).
 * Nada de cor fixa em componente: tudo vem do banco e vira variável CSS.
 */

export type TenantTheme = {
  primary?: string; // hex
  secondary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
  buttonColor?: string;
  mode?: "light" | "dark";
  cardRadius?: number; // px
  buttonRadius?: number; // px
  fontDisplay?: string;
  fontBody?: string;
};

export const DEFAULT_THEME: Required<
  Pick<TenantTheme, "primary" | "secondary" | "accent" | "background" | "foreground" | "mode" | "cardRadius" | "buttonRadius">
> = {
  primary: "#F4531B",
  secondary: "#F3EFEA",
  accent: "#12A47A",
  background: "#FAF8F6",
  foreground: "#1F1B18",
  mode: "light",
  cardRadius: 20,
  buttonRadius: 12,
};

const hexToHsl = (hex: string): string | null => {
  const m = hex.trim().replace("#", "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(m)) return null;
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const luminance = (hex: string) => {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const readable = (hex: string) => (luminance(hex) > 0.6 ? "0 0% 10%" : "0 0% 100%");

export const applyTheme = (theme: TenantTheme | null | undefined, el?: HTMLElement) => {
  const root = el ?? document.documentElement;
  const t = { ...DEFAULT_THEME, ...(theme || {}) };

  const set = (name: string, value: string | null) => {
    if (value) root.style.setProperty(name, value);
  };

  const primary = hexToHsl(t.primary!);
  set("--primary", primary);
  set("--ring", primary);
  set("--sidebar-primary", primary);
  if (t.primary) set("--primary-foreground", readable(t.primary));

  const accent = hexToHsl(t.accent!);
  set("--accent", accent);
  if (t.accent) set("--accent-foreground", readable(t.accent));

  if (t.mode !== "dark") {
    set("--secondary", hexToHsl(t.secondary!));
    set("--muted", hexToHsl(t.secondary!));
    set("--background", hexToHsl(t.background!));
    set("--foreground", hexToHsl(t.foreground!));
    set("--card", hexToHsl("#FFFFFF"));
    set("--card-foreground", hexToHsl(t.foreground!));
  }

  root.style.setProperty("--card-radius", `${t.cardRadius}px`);
  root.style.setProperty("--button-radius", `${t.buttonRadius}px`);
  if (t.fontDisplay) root.style.setProperty("--font-display", t.fontDisplay);
  if (t.fontBody) root.style.setProperty("--font-body", t.fontBody);

  root.classList.toggle("dark", t.mode === "dark");
};

export const resetTheme = () => {
  const root = document.documentElement;
  [
    "--primary",
    "--primary-foreground",
    "--ring",
    "--sidebar-primary",
    "--accent",
    "--accent-foreground",
    "--secondary",
    "--muted",
    "--background",
    "--foreground",
    "--card",
    "--card-foreground",
    "--card-radius",
    "--button-radius",
    "--font-display",
    "--font-body",
  ].forEach((v) => root.style.removeProperty(v));
  root.classList.remove("dark");
};
