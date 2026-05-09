import { useEffect, useState } from "react";
import { useWelcomeSettings } from "@/hooks/useWelcomeSettings";
import { Flame, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SESSION_KEY = "rubin_welcome_seen_v1";

const WelcomeOverlay = () => {
  const { data: settings } = useWelcomeSettings();
  const [open, setOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!settings?.enabled) return;
    if (settings.show_once_per_session && typeof sessionStorage !== "undefined") {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    }
    setOpen(true);
  }, [settings]);

  if (!open || !settings) return null;

  const accent = settings.accent_color || "hsl(var(--warning))";

  const close = () => {
    setExiting(true);
    if (settings.show_once_per_session && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, "1");
    }
    setTimeout(() => setOpen(false), 300);
  };

  const handleCta = () => {
    const url = settings.cta_url || "/";
    if (/^https?:\/\//i.test(url)) {
      window.location.href = url;
    } else {
      navigate(url);
    }
    close();
  };

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md transition-opacity duration-300 ${
        exiting ? "opacity-0" : "opacity-100 animate-in fade-in"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Tela de boas-vindas"
    >
      {/* Background image */}
      {settings.background_image_url && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-15 bg-cover bg-center"
          style={{ backgroundImage: `url(${settings.background_image_url})` }}
        />
      )}

      {/* Subtle ambient glow */}
      <div aria-hidden className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-warning/10 blur-3xl" />

      <div
        className={`relative w-full max-w-lg trade-card gradient-border p-8 sm:p-10 text-center transition-all duration-300 ${
          exiting ? "scale-95 opacity-0" : "scale-100 opacity-100 animate-in zoom-in-95"
        }`}
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-3 right-3 h-8 w-8 inline-flex items-center justify-center rounded-lg bg-secondary/60 hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Pixel-style icon orb */}
        <div className="flex items-center justify-center mb-5">
          <div
            className="trade-card-item-orb trade-card-item-orb-featured"
            style={{ width: 88, height: 88 }}
          >
            <Flame
              className="h-10 w-10"
              style={{ color: accent }}
              strokeWidth={2.2}
            />
          </div>
        </div>

        {/* Pixel uppercase tag */}
        <span
          className="inline-block text-[9px] font-pixel uppercase tracking-widest px-2.5 py-1 rounded-full border mb-4"
          style={{
            color: accent,
            borderColor: `${accent}40`,
            background: `${accent}1A`,
          }}
        >
          Bem-vindo
        </span>

        {/* Title — pixel font, on-brand */}
        <h1 className="font-pixel text-lg sm:text-2xl text-foreground leading-snug mb-3">
          {settings.title}
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mb-7 leading-relaxed font-body">
          {settings.subtitle}
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            onClick={handleCta}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm shadow-[0_8px_24px_hsl(var(--warning)/0.25)] hover:shadow-[0_10px_28px_hsl(var(--warning)/0.4)] transition-all"
            style={{
              background: accent,
              color: "hsl(var(--warning-foreground))",
            }}
          >
            {settings.cta_text}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={close}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Entrar no site →
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
