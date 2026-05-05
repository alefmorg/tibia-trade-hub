import { useEffect, useState } from "react";
import { Megaphone, Sparkles } from "lucide-react";
import type { SiteBanner } from "@/hooks/useSiteConfig";
import { safeHref } from "@/lib/safe-url";

interface Props {
  banners?: SiteBanner[];
  /** Slots visíveis ao mesmo tempo. Default 2 */
  slots?: number;
  /** Intervalo de rotação em ms. Default 5000 */
  intervalMs?: number;
}

const SponsorCard = ({ b }: { b: SiteBanner }) => {
  const logo = b.logo_url || b.image_url;
  const name = b.sponsor_name || b.title || "Patrocinador";
  return (
    <a
      href={safeHref(b.link_url)}
      target={b.link_url ? "_blank" : undefined}
      rel="noopener noreferrer sponsored"
      className="group relative flex-1 flex items-center gap-3 px-3 py-2.5 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-secondary/40 via-secondary/20 to-transparent transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_24px_hsl(var(--primary)/0.18)] hover:-translate-y-0.5 animate-in fade-in slide-in-from-right-2"
    >
      {/* shimmer */}
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      <div className="relative w-11 h-11 rounded-full bg-card border-2 border-primary/30 overflow-hidden flex items-center justify-center shrink-0 group-hover:border-primary/70 group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.4)] transition-all">
        {logo ? (
          <img src={logo} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <Megaphone className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="relative flex-1 min-w-0">
        <p className="text-[13px] font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">{name}</p>
        <p className="text-[9px] text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5 text-primary/60" />
          Patrocinador oficial
        </p>
      </div>
    </a>
  );
};

const EmptySlot = () => (
  <div className="relative flex-1 rounded-xl border border-dashed border-border/50 bg-secondary/10 flex items-center justify-center min-h-[64px] hover:border-primary/30 transition-colors">
    <div className="flex flex-col items-center gap-1 opacity-50">
      <Megaphone className="h-4 w-4 text-muted-foreground" />
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Espaço disponível</p>
    </div>
  </div>
);

const SponsorsCarousel = ({ banners, slots = 2, intervalMs = 5000 }: Props) => {
  const list = banners || [];
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(list.length / slots));

  useEffect(() => {
    if (list.length <= slots) return;
    const t = setInterval(() => setPage((p) => (p + 1) % totalPages), intervalMs);
    return () => clearInterval(t);
  }, [list.length, slots, totalPages, intervalMs]);

  const visible: (SiteBanner | null)[] = [];
  for (let i = 0; i < slots; i++) {
    const idx = (page * slots + i) % Math.max(list.length, 1);
    visible.push(list[idx] || null);
  }

  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/[0.03] flex flex-col shadow-[0_0_30px_hsl(var(--primary)/0.05)]">
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-warning/5 blur-3xl" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/25 to-primary/10 border border-primary/30 shadow-[0_0_10px_hsl(var(--primary)/0.2)]">
            <Megaphone className="h-3.5 w-3.5 text-primary" />
          </span>
          <div>
            <h3 className="text-[12px] font-bold text-foreground tracking-tight leading-none">Patrocinadores</h3>
            <p className="text-[9px] text-muted-foreground/70 mt-0.5">Apoiam o RubinTrade</p>
          </div>
        </div>
        <span className="text-[8px] font-bold text-primary uppercase tracking-widest bg-primary/15 border border-primary/30 px-2 py-0.5 rounded-full">
          Ad
        </span>
      </div>

      {/* Slots */}
      <div className="relative flex-1 px-3 py-3 flex flex-col gap-2 min-h-[160px]">
        {visible.map((b, i) =>
          b ? <SponsorCard key={`${b.id}-${page}-${i}`} b={b} /> : <EmptySlot key={`empty-${page}-${i}`} />
        )}
      </div>

      {/* Indicadores */}
      {totalPages > 1 && (
        <div className="relative flex items-center justify-center gap-1.5 pb-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              aria-label={`Página ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === page ? "w-5 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Footer CTA */}
      <a
        href="mailto:contato@rubintrade.com?subject=Quero%20anunciar%20no%20RubinTrade"
        className="relative border-t border-border/40 px-3 py-2 flex items-center justify-between text-[10px] hover:bg-primary/5 transition-colors group"
      >
        <span className="text-muted-foreground">Quer anunciar aqui?</span>
        <span className="font-bold text-primary group-hover:translate-x-0.5 transition-transform">Anuncie →</span>
      </a>
    </div>
  );
};

export default SponsorsCarousel;
