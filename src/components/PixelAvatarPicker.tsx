import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pixel-art avatar picker no estilo Tibia.
 * Renderiza presets como SVG (rects) e permite escolher cor primária.
 * Retorna um data URL SVG via onChange para salvar em profiles.avatar_url.
 */

// Cada arte: matriz 12x12 — caracteres:
// '.'  = transparente
// 'X'  = cor primária (escolhida)
// 'O'  = contorno escuro
// 'S'  = pele clara
// 'L'  = highlight (clarear primária)
// 'D'  = sombra (escurecer primária)

const ART_SIZE = 12;

const PRESETS: { id: string; label: string; grid: string[] }[] = [
  {
    id: "knight",
    label: "Knight",
    grid: [
      "....OOOO....",
      "...OXXXXO...",
      "..OXLLXXXO..",
      ".OXLLXXXXXO.",
      ".OXOXXXXOXO.",
      ".OXOSSSSOXO.",
      ".OXXSSSSXXO.",
      ".OXXSSSSXXO.",
      "..OXXSSXXO..",
      "...OOXXOO...",
      "....OXXO....",
      "....OOOO....",
    ],
  },
  {
    id: "paladin",
    label: "Paladin",
    grid: [
      "....OOOO....",
      "...OLXXLO...",
      "..OLXXXXLO..",
      ".OXXSSSSXXO.",
      ".OXSSDDSSXO.",
      ".OXSSSSSSXO.",
      "..OXSSSSXO..",
      "...OXXXXO...",
      "..OXLXXLXO..",
      ".OXXXOOXXXO.",
      ".OXXO..OXXO.",
      ".OOO....OOO.",
    ],
  },
  {
    id: "sorcerer",
    label: "Sorcerer",
    grid: [
      ".....OO.....",
      "....OXXO....",
      "...OXLXXO...",
      "..OXXLXXXO..",
      ".OXXXXXXXXO.",
      "..OSSSSSSO..",
      ".OSSDSSDSSO.",
      ".OSSSSSSSSO.",
      ".OXSSSSSSXO.",
      "..OXXXXXXO..",
      "...OOOOOO...",
      "............",
    ],
  },
  {
    id: "druid",
    label: "Druid",
    grid: [
      "....OOOO....",
      "...OXLLXO...",
      "..OXXLXXXO..",
      ".OXXXLXXXXO.",
      "OXXOOSSOOXXO",
      "OXXSSSSSSXXO",
      ".OSSDSSDSSO.",
      ".OSSSSSSSSO.",
      "..OSSSSSSO..",
      "...OXXXXO...",
      "...OXXXXO...",
      "....OOOO....",
    ],
  },
  {
    id: "monk",
    label: "Monk",
    grid: [
      "....SSSS....",
      "...SSSSSS...",
      "..SSDSSDSS..",
      "..SSSSSSSS..",
      "..SSDOODSS..",
      "...SSSSSS...",
      "....OOOO....",
      "...OXXXXO...",
      "..OXXLLXXO..",
      ".OXXXXXXXXO.",
      ".OXXOOOOXXO.",
      ".OOO....OOO.",
    ],
  },
  {
    id: "rogue",
    label: "Rogue",
    grid: [
      "....OOOO....",
      "...OXXXXO...",
      "..OXXLLXXO..",
      ".OXXXXXXXXO.",
      ".OXOSSSSOXO.",
      ".OXOSSSSOXO.",
      "..OSSSSSSO..",
      "...OSDDSO...",
      "..OXXXXXXO..",
      ".OXXOXXOXXO.",
      ".OXO.OO.OXO.",
      ".OO........O",
    ],
  },
  {
    id: "warlord",
    label: "Warlord",
    grid: [
      "...OOOOOO...",
      "..OXXLLXXO..",
      ".OXLXXXXLXO.",
      ".OXXOOOOXXO.",
      ".OXOSSSSOXO.",
      ".OXOSDDSOXO.",
      "..OXSSSSXO..",
      "..OXXSSXXO..",
      ".OXXXXXXXXO.",
      "OXXOOXXOOXXO",
      "OOO..OO..OOO",
      ".....OO.....",
    ],
  },
  {
    id: "mage",
    label: "Arch Mage",
    grid: [
      "......O.....",
      ".....OXO....",
      "....OXLXO...",
      "...OXXXXXO..",
      "..OXXLXXXXO.",
      ".OXXXXXXXXXO",
      "..OOSSSSSOO.",
      "...OSDSDSO..",
      "...OSSSSSO..",
      "...OXSSSXO..",
      "..OXXXXXXXO.",
      "..OOOOOOOOO.",
    ],
  },
];

const COLORS = [
  "#22c55e", // verde tibia
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#ef4444", // red
  "#a16207", // brown
  "#94a3b8", // silver
];

const adjust = (hex: string, amt: number) => {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (num & 255) + amt));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

const buildSvg = (grid: string[], color: string) => {
  const px = 4; // pixel size in svg units
  const size = ART_SIZE * px;
  const colors: Record<string, string> = {
    X: color,
    L: adjust(color, 50),
    D: adjust(color, -45),
    O: "#0b0b0b",
    S: "#f1d3a8",
  };
  const rects: string[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const ch = grid[y][x];
      if (ch === "." || !colors[ch]) continue;
      rects.push(
        `<rect x="${x * px}" y="${y * px}" width="${px}" height="${px}" fill="${colors[ch]}"/>`
      );
    }
  }
  // Background: subtle dark stone
  const bg = `<rect width="${size}" height="${size}" fill="#181818"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${bg}${rects.join("")}</svg>`;
};

export const buildAvatarDataUrl = (presetId: string, color: string) => {
  const p = PRESETS.find((x) => x.id === presetId) || PRESETS[0];
  const svg = buildSvg(p.grid, color);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

interface PixelAvatarPickerProps {
  value?: string | null; // current data url
  onChange: (dataUrl: string, meta: { presetId: string; color: string }) => void;
}

const PixelAvatarPicker = ({ value, onChange }: PixelAvatarPickerProps) => {
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const [color, setColor] = useState<string>(COLORS[0]);

  const previewUrl = useMemo(() => buildAvatarDataUrl(presetId, color), [presetId, color]);

  const apply = (nextPreset = presetId, nextColor = color) => {
    const url = buildAvatarDataUrl(nextPreset, nextColor);
    onChange(url, { presetId: nextPreset, color: nextColor });
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div className="flex items-center gap-3">
        <div
          className="h-20 w-20 shrink-0 overflow-hidden"
          style={{
            borderRadius: 4,
            boxShadow: "0 0 0 2px hsl(var(--border)), inset 0 0 0 2px #0b0b0b",
            imageRendering: "pixelated",
          }}
        >
          <img src={previewUrl} alt="Preview" className="h-full w-full" style={{ imageRendering: "pixelated" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-pixel">
            Pré-visualização
          </p>
          <p className="text-xs text-foreground/80 mt-1">
            Escolha um sprite e uma cor para o seu avatar pixel art.
          </p>
        </div>
      </div>

      {/* Sprites */}
      <div>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-pixel mb-2">Sprites</p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {PRESETS.map((p) => {
            const url = buildAvatarDataUrl(p.id, color);
            const active = p.id === presetId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { setPresetId(p.id); apply(p.id, color); }}
                className={cn(
                  "relative aspect-square overflow-hidden transition-all",
                  active ? "ring-2 ring-warning" : "ring-1 ring-border hover:ring-foreground/40"
                )}
                style={{ borderRadius: 3 }}
                title={p.label}
              >
                <img src={url} alt={p.label} className="h-full w-full" style={{ imageRendering: "pixelated" }} />
                {active && (
                  <span className="absolute top-0.5 right-0.5 inline-flex h-3.5 w-3.5 items-center justify-center bg-warning text-warning-foreground" style={{ borderRadius: 2 }}>
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-pixel mb-2">Cor</p>
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map((c) => {
            const active = c === color;
            return (
              <button
                key={c}
                type="button"
                onClick={() => { setColor(c); apply(presetId, c); }}
                className={cn(
                  "h-7 w-7 transition-all relative",
                  active ? "ring-2 ring-warning ring-offset-2 ring-offset-background" : "ring-1 ring-border hover:scale-110"
                )}
                style={{ background: c, borderRadius: 3, boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.35)" }}
                title={c}
              >
                {active && <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PixelAvatarPicker;
