import { useEffect, useRef, useState } from "react";
import { LOCALE_META, AppLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

// Mapeamento bandeira (flagcdn — SVG nítido em qualquer SO, sem depender de emoji)
const FLAG_SRC: Record<AppLocale, string> = {
  "pt-BR": "https://flagcdn.com/br.svg",
  en: "https://flagcdn.com/us.svg",
  es: "https://flagcdn.com/es.svg",
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

  const changeLocale = (code: AppLocale) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef} translate="no">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-xl border border-border bg-card/70 p-1.5 hover:bg-secondary transition-colors"
        title={t("common.language")}
        aria-label={t("common.language")}
      >
        <FlagImg code={locale} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-xl border border-border bg-card shadow-xl p-1 flex flex-col gap-0.5">
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
