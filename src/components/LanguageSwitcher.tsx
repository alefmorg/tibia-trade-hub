import { useEffect, useRef, useState } from "react";
import { LOCALE_META, AppLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

// Mapeamento bandeira (flagcdn — SVG nítido em qualquer SO, sem depender de emoji)
const FLAG_SRC: Record<AppLocale, string> = {
  "pt-BR": "https://flagcdn.com/br.svg",
  en: "https://flagcdn.com/us.svg",
  es: "https://flagcdn.com/es.svg",
};

// Mapeia AppLocale -> código usado pelo Google Translate
const GT_CODE: Record<AppLocale, string> = {
  "pt-BR": "pt",
  en: "en",
  es: "es",
};

const setGoogTransCookie = (target: string) => {
  // Para PT (idioma original) usamos /pt/pt para forçar o widget a restaurar o texto.
  const value = `/pt/${target}`;
  const host = window.location.hostname;
  const rootHost = host.split(".").slice(-2).join(".");
  const expire = "expires=Fri, 31 Dec 9999 23:59:59 GMT";
  document.cookie = `googtrans=${value}; path=/; ${expire}`;
  document.cookie = `googtrans=${value}; domain=${host}; path=/; ${expire}`;
  if (rootHost && rootHost !== host) {
    document.cookie = `googtrans=${value}; domain=.${rootHost}; path=/; ${expire}`;
  }
};

const FlagImg = ({ code, className = "" }: { code: AppLocale; className?: string }) => (
  <img
    src={FLAG_SRC[code]}
    alt={LOCALE_META[code].label}
    className={`w-6 h-4 object-cover rounded-[2px] shadow-sm ${className}`}
    loading="lazy"
    draggable={false}
  />
);

const LanguageSwitcher = () => {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const triggerGoogleTranslate = (target: string, attempt = 0) => {
    const select = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
    if (!select) {
      // Widget ainda carregando — tenta novamente
      if (attempt < 30) setTimeout(() => triggerGoogleTranslate(target, attempt + 1), 200);
      return;
    }
    select.value = target;
    select.dispatchEvent(new Event("change"));
    // Para voltar ao PT, o widget às vezes precisa de um "restore" extra
    if (target === "pt") {
      setTimeout(() => {
        const restore = document.querySelector<HTMLAnchorElement>("a.goog-te-menu-value span");
        if (restore && (window as any).google?.translate) {
          try { (window as any).google.translate.TranslateElement.getInstance()?.restore?.(); } catch {}
        }
        // fallback: recarrega só se o restore não funcionar
        const stillTranslated = document.documentElement.className.includes("translated");
        if (stillTranslated) window.location.reload();
      }, 400);
    }
  };

  const changeLocale = (code: AppLocale) => {
    setLocale(code);
    setGoogTransCookie(GT_CODE[code]);
    triggerGoogleTranslate(GT_CODE[code]);
    setOpen(false);
  };

  return (
    <div className="relative shrink-0" ref={wrapperRef} translate="no">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-xl border border-border bg-card/70 p-1.5 hover:bg-secondary transition-colors shrink-0"
        title={t("common.language")}
        aria-label={t("common.language")}
      >
        <FlagImg code={locale} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-xl border border-border bg-card shadow-xl p-1 flex flex-col gap-0.5 max-w-[calc(100vw-1rem)]">

          {(Object.keys(LOCALE_META) as AppLocale[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => changeLocale(code)}
              className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-colors ${
                locale === code ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-secondary"
              }`}
              aria-label={LOCALE_META[code].label}
              title={LOCALE_META[code].label}
            >
              <FlagImg code={code} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
