import { useEffect, useRef, useState } from "react";
import { LOCALE_META, AppLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

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

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-xl border border-border bg-card/70 px-2 py-1.5 text-sm hover:bg-secondary transition-colors"
        title={t("common.language")}
        aria-label={t("common.language")}
      >
        <span>{LOCALE_META[locale].flag}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-xl border border-border bg-card shadow-xl p-1 flex flex-col">
          {(Object.keys(LOCALE_META) as AppLocale[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setLocale(code);
                setOpen(false);
              }}
              className={`inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-sm transition-colors ${locale === code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              aria-label={LOCALE_META[code].label}
            >
              <span>{LOCALE_META[code].flag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
