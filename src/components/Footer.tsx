import { Link } from "react-router-dom";
import { Shield, Lock, Mail, MessageCircle, CheckCircle2 } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border/60 bg-gradient-to-b from-card/30 to-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "8px 8px" }} />

      <div className="relative">
        <div className="container max-w-6xl py-8 flex flex-col items-center gap-6">
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-card border border-border text-muted-foreground">
              <Shield className="h-3 w-3 text-primary" /> SSL Seguro
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-card border border-border text-muted-foreground">
              <Lock className="h-3 w-3 text-primary" /> LGPD
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-card border border-border text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-primary" /> Verificado
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-card border border-border text-muted-foreground">
              <Mail className="h-3 w-3 text-primary" /> notify.rubintrade.com
            </span>
          </div>

          {/* Icons + Copyright */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-3 text-muted-foreground">
              <a href="mailto:contato@rubintrade.com" className="hover:text-primary transition-colors" aria-label="Email">
                <Mail className="h-4 w-4" />
              </a>
              <Link to="/suporte" className="hover:text-primary transition-colors" aria-label="Suporte">
                <MessageCircle className="h-4 w-4" />
              </Link>
            </div>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed max-w-2xl">
              © {year} <span className="font-pixel text-foreground/80">RUBIN TRADE</span> — Projeto independente, sem vínculo oficial com RubinOT.
              Todas as imagens e conteúdos do jogo Tibia pertencem à <span className="text-foreground/80">CipSoft GmbH</span>.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
