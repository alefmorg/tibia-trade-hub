import { Link } from "react-router-dom";
import { Shield, Lock, Mail, MessageCircle, Sparkles, CheckCircle2, Globe2, Zap } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border/60 bg-gradient-to-b from-card/30 to-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "8px 8px" }} />

      {/* Trust strip */}
      <div className="relative border-b border-border/50">
        <div className="container max-w-6xl py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Shield, title: "Negociação Segura", desc: "Intermediação por admins" },
            { icon: Lock, title: "Dados Protegidos", desc: "Conformidade LGPD" },
            { icon: Zap, title: "Tempo Real", desc: "Notificações instantâneas" },
            { icon: CheckCircle2, title: "Suporte Ativo", desc: "Tickets respondidos rápido" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground leading-tight">{title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main columns */}
      <div className="relative container max-w-6xl py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-primary/15 border-2 border-primary/40 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <p className="font-pixel text-xs text-foreground">
              RUBIN <span className="text-primary">TRADE</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            O marketplace independente da comunidade RubinOT. Compre, venda e negocie com segurança.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-success/15 text-success border border-success/30">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Online
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
              <Globe2 className="h-3 w-3" /> BR
            </span>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold text-foreground uppercase tracking-widest mb-3">Plataforma</p>
          <ul className="space-y-2 text-xs">
            <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Início</Link></li>
            <li><Link to="/criar-anuncio" className="text-muted-foreground hover:text-primary transition-colors">Criar Anúncio</Link></li>
            <li><Link to="/rifa" className="text-muted-foreground hover:text-primary transition-colors">Rifas</Link></li>
            <li><Link to="/perfil" className="text-muted-foreground hover:text-primary transition-colors">Meu Perfil</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-bold text-foreground uppercase tracking-widest mb-3">Suporte</p>
          <ul className="space-y-2 text-xs">
            <li><Link to="/suporte" className="text-muted-foreground hover:text-primary transition-colors">Central de Ajuda</Link></li>
            <li><Link to="/suporte" className="text-muted-foreground hover:text-primary transition-colors">Abrir Ticket</Link></li>
            <li><a href="mailto:contato@rubintrade.com" className="text-muted-foreground hover:text-primary transition-colors">Contato</a></li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-bold text-foreground uppercase tracking-widest mb-3">Legal</p>
          <ul className="space-y-2 text-xs">
            <li><Link to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors">Privacidade</Link></li>
            <li><Link to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors">Termos de Uso</Link></li>
            <li><Link to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors">Cookies</Link></li>
          </ul>
        </div>
      </div>

      {/* Badges row */}
      <div className="relative border-t border-border/50">
        <div className="container max-w-6xl py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex items-center gap-3 text-muted-foreground">
            <a href="mailto:contato@rubintrade.com" className="hover:text-primary transition-colors" aria-label="Email">
              <Mail className="h-4 w-4" />
            </a>
            <Link to="/suporte" className="hover:text-primary transition-colors" aria-label="Suporte">
              <MessageCircle className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="relative border-t border-border/50">
        <div className="container max-w-6xl py-5 text-center">
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed max-w-2xl mx-auto">
            © {year} <span className="font-pixel text-foreground/80">RUBIN TRADE</span> — Projeto independente, sem vínculo oficial com RubinOT.
            Todas as imagens e conteúdos do jogo Tibia pertencem à <span className="text-foreground/80">CipSoft GmbH</span>.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
