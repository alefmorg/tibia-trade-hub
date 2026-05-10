import { useEffect, useState } from "react";
import { useWelcomeSettings } from "@/hooks/useWelcomeSettings";
import { Flame, X, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SESSION_KEY = "rubin_welcome_seen_v1";

/**
 * Tela de boas-vindas no estilo Tibia:
 * - Pergaminho/pedra com molduras pixel
 * - Tochas animadas nas laterais
 * - Cantos rebitados (pixel corners)
 * - Tipografia Press Start 2P
 */
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
    setTimeout(() => setOpen(false), 280);
  };

  const handleCta = () => {
    const url = settings.cta_url || "/";
    if (/^https?:\/\//i.test(url)) window.location.href = url;
    else navigate(url);
    close();
  };

  // Tocha pixel — chama animada via CSS
  const Torch = ({ side }: { side: "left" | "right" }) => (
    <div
      className={`absolute top-1/2 -translate-y-1/2 ${side === "left" ? "-left-3 sm:-left-7" : "-right-3 sm:-right-7"} hidden sm:flex flex-col items-center pointer-events-none`}
      aria-hidden
    >
      {/* Chama */}
      <div className="relative h-12 w-8 mb-1">
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: `radial-gradient(ellipse at center bottom, ${accent} 0%, ${accent}80 35%, transparent 70%)`,
            filter: "blur(2px)",
          }}
        />
        <div
          className="absolute left-1/2 bottom-0 -translate-x-1/2 w-3 h-7 rounded-t-full animate-[flicker_1.2s_ease-in-out_infinite]"
          style={{ background: accent, boxShadow: `0 0 14px ${accent}, 0 0 28px ${accent}80` }}
        />
        <div
          className="absolute left-1/2 bottom-0 -translate-x-1/2 w-1.5 h-4 rounded-t-full bg-white/80 animate-[flicker_0.8s_ease-in-out_infinite_reverse]"
        />
      </div>
      {/* Suporte de pedra */}
      <div className="w-6 h-10" style={{
        background: "linear-gradient(180deg, #3a3a3a, #1a1a1a)",
        boxShadow: "inset 0 0 0 2px #0b0b0b, inset 2px 2px 0 #4a4a4a",
        borderRadius: 2,
        imageRendering: "pixelated",
      }} />
    </div>
  );

  // Canto rebitado pixel
  const Corner = ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => {
    const positions: Record<string, string> = {
      tl: "top-1 left-1", tr: "top-1 right-1",
      bl: "bottom-1 left-1", br: "bottom-1 right-1",
    };
    return (
      <span
        aria-hidden
        className={`absolute ${positions[pos]} h-2 w-2`}
        style={{
          background: accent,
          boxShadow: "0 0 0 1px #0b0b0b, inset 1px 1px 0 rgba(255,255,255,0.4)",
        }}
      />
    );
  };

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 transition-opacity duration-300 ${
        exiting ? "opacity-0" : "opacity-100 animate-in fade-in"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Tela de boas-vindas"
      style={{
        background: "radial-gradient(ellipse at center, hsl(var(--background) / 0.92) 0%, hsl(var(--background) / 0.98) 70%)",
        backdropFilter: "blur(8px)",
      }}
    >
      <style>{`
        @keyframes flicker {
          0%, 100% { transform: translateX(-50%) scaleY(1) scaleX(1); opacity: 1; }
          50% { transform: translateX(-50%) scaleY(1.15) scaleX(0.92); opacity: 0.85; }
        }
        @keyframes torch-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* Background image */}
      {settings.background_image_url && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${settings.background_image_url})`, imageRendering: "pixelated" }}
        />
      )}

      {/* Vinhetas ambient */}
      <div aria-hidden className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl animate-[torch-glow_3s_ease-in-out_infinite]" style={{ background: `${accent}15` }} />
      <div aria-hidden className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-[torch-glow_4s_ease-in-out_infinite]" style={{ background: `${accent}10` }} />

      {/* Painel principal — moldura pixel/pedra */}
      <div
        className={`relative w-full max-w-xl transition-all duration-300 ${
          exiting ? "scale-95 opacity-0" : "scale-100 opacity-100 animate-in zoom-in-95"
        }`}
      >
        <Torch side="left" />
        <Torch side="right" />

        {/* Outer stone frame */}
        <div
          className="relative p-1.5"
          style={{
            background: "linear-gradient(180deg, #2a2a2a, #0f0f0f)",
            boxShadow: `0 0 0 2px #0b0b0b, 0 0 0 3px ${accent}40, 0 20px 60px hsl(0 0% 0% / 0.7), 0 0 60px ${accent}20`,
            borderRadius: 4,
            imageRendering: "pixelated",
          }}
        >
          {/* Inner content */}
          <div
            className="relative p-7 sm:p-9 text-center overflow-hidden"
            style={{
              background: "linear-gradient(180deg, hsl(0 0% 12%), hsl(0 0% 8%))",
              boxShadow: `inset 0 0 0 2px #0b0b0b, inset 0 0 0 3px ${accent}30, inset 0 0 80px hsl(0 0% 0% / 0.6)`,
              borderRadius: 2,
            }}
          >
            <Corner pos="tl" />
            <Corner pos="tr" />
            <Corner pos="bl" />
            <Corner pos="br" />

            {/* Padrão pixel sutil de fundo */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
                backgroundSize: "8px 8px",
              }}
            />

            {/* Close */}
            <button
              onClick={close}
              className="absolute top-2 right-2 h-7 w-7 inline-flex items-center justify-center bg-secondary/80 hover:bg-destructive/80 border border-border text-muted-foreground hover:text-foreground transition-colors z-10"
              style={{ borderRadius: 2 }}
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Banner topo "BEM-VINDO" */}
            <div className="relative inline-flex items-center gap-2 mb-5">
              <Sparkles className="h-3 w-3" style={{ color: accent }} />
              <span
                className="text-[9px] font-pixel uppercase tracking-[0.25em] px-3 py-1.5"
                style={{
                  color: accent,
                  background: `${accent}15`,
                  border: `2px solid ${accent}50`,
                  boxShadow: `0 0 0 1px #0b0b0b, inset 0 0 0 1px rgba(0,0,0,0.4)`,
                  borderRadius: 2,
                  textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
                }}
              >
                Bem-vindo, aventureiro
              </span>
              <Sparkles className="h-3 w-3" style={{ color: accent }} />
            </div>

            {/* Orb central com chama */}
            <div className="relative flex items-center justify-center mb-5">
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: 92, height: 92,
                  background: `radial-gradient(circle at 30% 30%, ${accent}40, ${accent}10 60%, transparent)`,
                  boxShadow: `0 0 0 2px #0b0b0b, 0 0 0 4px ${accent}60, 0 0 30px ${accent}50`,
                  borderRadius: "50%",
                  imageRendering: "pixelated",
                }}
              >
                <div
                  className="absolute inset-2 rounded-full"
                  style={{
                    background: "linear-gradient(180deg, hsl(0 0% 18%), hsl(0 0% 8%))",
                    boxShadow: "inset 0 0 12px rgba(0,0,0,0.8)",
                  }}
                />
                <Flame
                  className="relative animate-[flicker_1.5s_ease-in-out_infinite]"
                  style={{ color: accent, width: 48, height: 48, filter: `drop-shadow(0 0 10px ${accent})` }}
                  strokeWidth={2}
                />
              </div>
            </div>

            {/* Título pixel — destaque dramático */}
            <h1
              className="font-pixel text-base sm:text-2xl leading-relaxed mb-3 px-2"
              style={{
                color: "hsl(var(--foreground))",
                textShadow: `2px 2px 0 #0b0b0b, 0 0 12px ${accent}50`,
                letterSpacing: "0.05em",
              }}
            >
              {settings.title}
            </h1>

            {/* Separador pixel */}
            <div className="flex items-center justify-center gap-2 mb-4" aria-hidden>
              <div className="h-[2px] w-12" style={{ background: `${accent}70`, boxShadow: `0 0 6px ${accent}` }} />
              <div className="h-1.5 w-1.5 rotate-45" style={{ background: accent, boxShadow: "0 0 0 1px #0b0b0b" }} />
              <div className="h-[2px] w-12" style={{ background: `${accent}70`, boxShadow: `0 0 6px ${accent}` }} />
            </div>

            {/* Subtítulo */}
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mb-7 leading-relaxed font-body px-2">
              {settings.subtitle}
            </p>

            {/* CTA — botão pixel chamativo */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleCta}
                className="group relative inline-flex items-center gap-2 px-6 py-3 font-pixel text-[10px] sm:text-xs uppercase tracking-wider transition-all hover:translate-y-[-2px] active:translate-y-0"
                style={{
                  color: "hsl(var(--warning-foreground))",
                  background: `linear-gradient(180deg, ${accent}, ${accent}d0)`,
                  boxShadow: `0 0 0 2px #0b0b0b, 0 0 0 3px ${accent}90, 0 4px 0 ${accent}60, 0 6px 16px ${accent}50`,
                  borderRadius: 2,
                  textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
                  imageRendering: "pixelated",
                }}
              >
                {settings.cta_text}
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={close}
                className="text-[10px] font-pixel uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Entrar →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
