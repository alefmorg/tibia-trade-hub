import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, AppLocale, resolveTranslation } from "@/lib/i18n";

interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, params?: Record<string, any>) => string;
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const detectLocale = (): AppLocale => {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY) as AppLocale | null;
  if (stored === "pt-BR" || stored === "en" || stored === "es") return stored;

  const browser = window.navigator.language.toLowerCase();
  if (browser.startsWith("es")) return "es";
  if (browser.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
};

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<AppLocale>(detectLocale);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      document.documentElement.lang = locale;
    }
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.body;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,p,span,button,a,label,small,li,th,td,option,legend"));

    nodes.forEach((el) => {
      if (el.closest("[data-no-auto-translate='true']")) return;
      const text = (el.textContent || "").trim();
      if (!text) return;
      if (!(el.dataset.originalText)) el.dataset.originalText = text;
    });

    if (locale === "pt-BR") {
      nodes.forEach((el) => {
        if (el.dataset.originalText) el.textContent = el.dataset.originalText;
      });
      return;
    }

    const target = locale === "en" ? "en" : "es";
    const texts = nodes
      .map((el) => (el.dataset.originalText || "").trim())
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 300);

    if (texts.length === 0) return;

    const translateAll = async () => {
      const translatedMap = new Map<string, string>();

      for (const text of texts) {
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
          const response = await fetch(url);
          const payload = await response.json();
          const translated = payload?.[0]?.map((part: any) => part?.[0]).join("") || text;
          translatedMap.set(text, translated);
        } catch {
          translatedMap.set(text, text);
        }
      }

      nodes.forEach((el) => {
        const original = (el.dataset.originalText || "").trim();
        if (!original) return;
        const translated = translatedMap.get(original);
        if (translated) el.textContent = translated;
      });
    };

    translateAll();
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale: (nextLocale) => setLocaleState(nextLocale),
    t: (key, params) => resolveTranslation(locale, key, params),
    formatDate: (value, options) => new Intl.DateTimeFormat(locale, options).format(new Date(value)),
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
};
