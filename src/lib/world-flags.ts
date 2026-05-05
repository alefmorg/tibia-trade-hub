// Default region -> emoji map (fallback when world has no custom flag)
export const REGION_FLAGS: Record<string, string> = {
  BR: "🇧🇷",
  EU: "🇪🇺",
  NA: "🇺🇸",
  US: "🇺🇸",
  SA: "🌎",
  ASIA: "🌏",
  AS: "🌏",
  OCE: "🇦🇺",
  AU: "🇦🇺",
};

export const REGION_OPTIONS = [
  { value: "BR", label: "Brasil 🇧🇷" },
  { value: "NA", label: "North America 🇺🇸" },
  { value: "SA", label: "South America 🌎" },
  { value: "EU", label: "Europe 🇪🇺" },
  { value: "ASIA", label: "Asia 🌏" },
  { value: "OCE", label: "Oceania 🇦🇺" },
];

export interface WorldFlagInput {
  region?: string | null;
  flag_url?: string | null;
  flag_emoji?: string | null;
}

export function getWorldFlag(world: WorldFlagInput | null | undefined): {
  url?: string;
  emoji: string;
} {
  if (!world) return { emoji: "🏳️" };
  if (world.flag_url) return { url: world.flag_url, emoji: world.flag_emoji || "🏳️" };
  if (world.flag_emoji) return { emoji: world.flag_emoji };
  if (world.region && REGION_FLAGS[world.region.toUpperCase()]) {
    return { emoji: REGION_FLAGS[world.region.toUpperCase()] };
  }
  return { emoji: "🏳️" };
}
