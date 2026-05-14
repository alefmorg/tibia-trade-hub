import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, AppLocale, resolveTranslation } from "@/lib/i18n";

const clearGoogleTranslateState = () => {
  if (typeof window === "undefined") return;

  const host = window.location.hostname;
  const root = host.split(".").slice(-2).join(".");
  const expire = "expires=Thu, 01 Jan 1970 00:00:00 GMT";

  document.cookie = `googtrans=; path=/; ${expire}`;
  document.cookie = `googtrans=; domain=${host}; path=/; ${expire}`;
  if (root && root !== host) {
    document.cookie = `googtrans=; domain=.${root}; path=/; ${expire}`;
  }

  document.documentElement.classList.remove("translated-ltr", "translated-rtl");
  document.body.classList.remove("translated-ltr", "translated-rtl");
  document.body.style.top = "0px";
};

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
      clearGoogleTranslateState();
    }
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
