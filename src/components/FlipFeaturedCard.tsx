import { useState } from "react";
import TradeCard from "@/components/TradeCard";
import { Sparkles, Eye } from "lucide-react";
import type { Ad } from "@/hooks/useAds";

interface Props {
  ad?: Ad;
  index: number;
}

/**
 * Card "virado" para destaque diário. Mostra o verso decorativo até o usuário clicar
 * para revelar o anúncio. Apenas efeito visual — não persiste estado entre sessões.
 */
const FlipFeaturedCard = ({ ad, index }: Props) => {
  const [flipped, setFlipped] = useState(false);

  if (!ad) {
    return (
      <div className="relative h-[280px] rounded-2xl border border-dashed border-border/50 bg-secondary/10 flex items-center justify-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sem destaque</p>
      </div>
    );
  }

  return (
    <div
      className="group relative h-[280px] [perspective:1200px] cursor-pointer"
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* VERSO (mostrado primeiro) */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl border-2 border-warning/40 bg-gradient-to-br from-warning/10 via-card to-primary/10 overflow-hidden flex flex-col items-center justify-center p-5 shadow-[0_0_24px_hsl(var(--warning)/0.15)]">
          {/* Padrão decorativo */}
          <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: "repeating-linear-gradient(45deg, hsl(var(--warning)) 0 2px, transparent 2px 14px)"
          }} />
          <div aria-hidden className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-warning/15 blur-2xl" />
          <div aria-hidden className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-primary/15 blur-2xl" />

          <div className="relative flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warning/30 to-warning/10 border-2 border-warning/50 flex items-center justify-center shadow-[0_0_20px_hsl(var(--warning)/0.3)] group-hover:scale-110 transition-transform">
                <Sparkles className="h-8 w-8 text-warning animate-pulse" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
                {index + 1}
              </span>
            </div>
            <div>
              <p className="text-[9px] font-bold text-warning uppercase tracking-[0.2em]">Destaque do dia</p>
              <h4 className="text-base font-bold text-foreground mt-1">Item misterioso</h4>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">
                Clique para revelar o anúncio em destaque de hoje
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/15 border border-primary/30 px-3 py-1.5 rounded-full mt-1 group-hover:bg-primary/25 transition-colors">
              <Eye className="h-3 w-3" />
              Revelar
            </span>
          </div>
        </div>

        {/* FRENTE (anúncio real) */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl overflow-hidden">
          <TradeCard
            id={ad.id}
            title={ad.title}
            type={ad.type as "selling" | "buying"}
            price={ad.price}
            currency={ad.currency}
            world={ad.world}
            pvpType={ad.pvp_type}
            date={ad.created_at}
            imageUrl={ad.image_url}
            likes={ad.likes_count}
            featured={ad.featured}
            tier={(ad as any).tier}
            profiles={ad.profiles}
            userId={ad.user_id}
            category={ad.category}
          />
        </div>
      </div>
    </div>
  );
};

export default FlipFeaturedCard;
