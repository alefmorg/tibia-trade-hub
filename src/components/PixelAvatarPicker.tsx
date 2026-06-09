import { useMemo, useState } from "react";
import { Check, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Modern circular avatar picker.
 * Uses DiceBear (free public API) to render polished SVG avatars
 * that fit perfectly inside circular Avatar components.
 *
 * URL persisted: full DiceBear SVG URL — works as <img src> directly.
 */

const STYLES: { id: string; label: string }[] = [
  { id: "pixel-art", label: "Pixel Hero" },
  { id: "pixel-art-neutral", label: "Pixel Neutro" },
  { id: "bottts", label: "Criatura" },
  { id: "adventurer", label: "Aventureiro" },
  { id: "big-ears", label: "Goblin" },
  { id: "micah", label: "Bardo" },
];

// Classes e personagens icônicos de Tibia/RPG — geram sprites únicos por seed.
const SEEDS = [
  "Knight", "EliteKnight", "RoyalPaladin", "MasterSorcerer", "ElderDruid",
  "Bozol", "Ferumbras", "Morgaroth", "Ghazbaran", "Orshabaal",
  "Zulazza", "Urgith", "Drakon", "Demon", "Hydra",
  "Necromancer",
];

// Paleta medieval/Tibia: pergaminho, sangue, bronze, esmeralda, royal blue, púrpura mística, dourado, terra.
const BG_COLORS = [
  "5b3a1e", // brown leather
  "8b5a2b", // bronze
  "a8323a", // blood red
  "c98a3a", // gold
  "3a5f3a", // forest green
  "2f4858", // steel blue
  "4b2e83", // mystic purple
  "1f2937", // shadow
  "d4b27a", // parchment
  "0f766e", // emerald
];

const dicebearUrl = (style: string, seed: string, bg: string) =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&radius=50&size=160`;

export const buildAvatarDataUrl = (style: string, seed: string, bg = BG_COLORS[0]) =>
  dicebearUrl(style || STYLES[0].id, seed || SEEDS[0], bg);

interface PixelAvatarPickerProps {
  value?: string | null;
  onChange: (url: string, meta: { style: string; seed: string; bg: string }) => void;
}

const PixelAvatarPicker = ({ value, onChange }: PixelAvatarPickerProps) => {
  const [style, setStyle] = useState<string>(STYLES[0].id);
  const [seed, setSeed] = useState<string>(SEEDS[0]);
  const [bg, setBg] = useState<string>(BG_COLORS[0]);

  const previewUrl = useMemo(() => dicebearUrl(style, seed, bg), [style, seed, bg]);

  const apply = (nextStyle = style, nextSeed = seed, nextBg = bg) => {
    const url = dicebearUrl(nextStyle, nextSeed, nextBg);
    onChange(url, { style: nextStyle, seed: nextSeed, bg: nextBg });
  };

  const randomize = () => {
    const s = STYLES[Math.floor(Math.random() * STYLES.length)].id;
    const sd = Math.random().toString(36).slice(2, 10);
    const b = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
    setStyle(s); setSeed(sd); setBg(b);
    apply(s, sd, b);
  };

  return (
    <div className="space-y-5">
      {/* Preview */}
      <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-gradient-to-br from-card/60 to-card/30 p-4">
        <div
          className="h-24 w-24 shrink-0 rounded-full overflow-hidden ring-2 ring-warning/40 shadow-[0_8px_24px_-8px_hsl(var(--warning)/0.45)]"
          style={{ background: `#${bg}` }}
        >
          <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Seu avatar
          </p>
          <p className="text-sm text-foreground/90 mt-1 leading-snug">
            Personalize com estilo, variação e cor de fundo. Tudo encaixa perfeitamente no círculo do seu perfil.
          </p>
          <Button type="button" size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={randomize}>
            <Shuffle className="h-3 w-3 mr-1.5" /> Sortear
          </Button>
        </div>
      </div>

      {/* Styles */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Estilo</p>
        <div className="flex flex-wrap gap-1.5">
          {STYLES.map((s) => {
            const active = s.id === style;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { setStyle(s.id); apply(s.id, seed, bg); }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  active
                    ? "bg-warning text-warning-foreground border-warning shadow-sm"
                    : "bg-card/60 text-muted-foreground border-border hover:border-warning/40 hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Variations (seeds) */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Variações</p>
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {SEEDS.map((sd) => {
            const url = dicebearUrl(style, sd, bg);
            const active = sd === seed;
            return (
              <button
                key={sd}
                type="button"
                onClick={() => { setSeed(sd); apply(style, sd, bg); }}
                className={cn(
                  "relative aspect-square rounded-full overflow-hidden transition-all",
                  active
                    ? "ring-2 ring-warning ring-offset-2 ring-offset-background scale-105"
                    : "ring-1 ring-border hover:ring-warning/50 hover:scale-105"
                )}
                style={{ background: `#${bg}` }}
                title={sd}
              >
                <img src={url} alt={sd} className="h-full w-full object-cover" loading="lazy" />
                {active && (
                  <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-warning text-warning-foreground shadow">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Background colors */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Cor de fundo</p>
        <div className="flex flex-wrap gap-2">
          {BG_COLORS.map((c) => {
            const active = c === bg;
            return (
              <button
                key={c}
                type="button"
                onClick={() => { setBg(c); apply(style, seed, c); }}
                className={cn(
                  "h-8 w-8 rounded-full transition-all relative",
                  active
                    ? "ring-2 ring-warning ring-offset-2 ring-offset-background scale-110"
                    : "ring-1 ring-border hover:scale-110"
                )}
                style={{ background: `#${c}` }}
                title={`#${c}`}
              >
                {active && <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PixelAvatarPicker;
