import { useEffect, useState } from "react";
import { useWelcomeSettings } from "@/hooks/useWelcomeSettings";
import { Flame, Sparkles, X, ArrowRight } from "lucide-react";
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

  const accent = settings.accent_color || "#F59E0B";

  const close = () => {
    setExiting(true);
    if (settings.show_once_per_session && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, "1");
    }
    setTimeout(() => setOpen(false), 350);
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
      className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 transition-opacity duration-300 ${
        exiting ? "opacity-0" : "opacity-100 animate-in fade-in"
      }`}
      style={{
        background: `radial-gradient(ellipse at center, ${accent}26 0%, hsl(var(--background)) 70%), hsl(var(--background) / 0.97)`,
        backdropFilter: "blur(8px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Tela de boas-vindas"
    >
      {/* Background image */}
      {settings.background_image_url && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${settings.background_image_url})` }}
        />
      )}

      {/* Floating glow blobs */}
      <div aria-hidden className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ background: `${accent}33` }} />
      <div aria-hidden className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ background: `hsl(var(--primary) / 0.18)`, animationDelay: "1s" }} />

      {/* Close button */}
      <button
        onClick={close}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-card/60 hover:bg-card border border-border text-muted-foreground hover:text-foreground transition-all"
        aria-label="Fechar"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className={`relative max-w-2xl w-full mx-auto text-center transition-all duration-500 ${
          exiting ? "scale-95 opacity-0" : "scale-100 opacity-100 animate-in zoom-in-95"
        }`}
      >
        {/* Animated icon */}
        <div className="flex items-center justify-center mb-6">
          <div
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${accent}, hsl(var(--primary)))`,
              boxShadow: `0 0 60px ${accent}80, 0 20px 40px hsl(var(--background) / 0.5)`,
            }}
          >
            <Flame className="h-12 w-12 sm:h-14 sm:w-14 text-white drop-shadow-lg animate-pulse" strokeWidth={2.2} />
            <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-white/90 animate-pulse" style={{ animationDelay: "0.5s" }} />
            <Sparkles className="absolute -bottom-1 -left-2 h-4 w-4 text-white/80 animate-pulse" style={{ animationDelay: "1s" }} />
          </div>
        </div>

        {/* Title */}
        <h1
          className="font-pixel text-2xl sm:text-4xl md:text-5xl mb-4 leading-tight"
          style={{
            background: `linear-gradient(135deg, ${accent}, hsl(var(--foreground)))`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: `0 0 30px ${accent}40`,
          }}
        >
          {settings.title}
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed font-body">
          {settings.subtitle}
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleCta}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base sm:text-lg shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
            style={{
              background: `linear-gradient(135deg, ${accent}, hsl(var(--primary)))`,
              boxShadow: `0 10px 40px ${accent}60`,
            }}
          >
            {settings.cta_text}
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={close}
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
          >
            Continuar para o site →
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
