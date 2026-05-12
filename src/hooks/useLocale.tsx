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

  // NOTE: Auto-translation via direct DOM mutation was removed because it
  // conflicts with React's reconciler (causes "removeChild" NotFoundError).
  // Use the t() function below for translations instead.

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
