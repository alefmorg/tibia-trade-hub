import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export type SiteAssetKey =
  | "icon_kk"
  | "icon_coins"
  | "icon_pvp_open"
  | "icon_pvp_optional"
  | "icon_pvp_retro";

export type SiteAsset = {
  id: string;
  key: SiteAssetKey;
  url: string;
  updated_at: string;
};

const DEFAULTS: Record<SiteAssetKey, string> = {
  icon_kk: "/icons/kk.webp",
  icon_coins: "/icons/coins.webp",
  icon_pvp_open: "/icons/pvp-open.webp",
  icon_pvp_optional: "/icons/pvp-optional.webp",
  icon_pvp_retro: "/icons/pvp-retro.webp",
};

export const useSiteAssets = () => {
  const query = useQuery({
    queryKey: ["site-assets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_assets" as any).select("*");
      if (error) throw error;
      return (data || []) as unknown as SiteAsset[];
    },
    staleTime: 60_000,
  });

  const map: Record<SiteAssetKey, string> = { ...DEFAULTS };
  (query.data || []).forEach((a) => {
    if (a.url) map[a.key] = a.url;
  });

  const get = (key: SiteAssetKey) => map[key];

  const getCurrencyIcon = (currency: string) =>
    currency === "coins" ? map.icon_coins : map.icon_kk;

  const getPvpIcon = (pvpType: string) => {
    if (pvpType === "Open PvP") return map.icon_pvp_open;
    if (pvpType === "Retro Hardcore PvP" || pvpType === "Retro Open PvP") return map.icon_pvp_retro;
    return map.icon_pvp_optional;
  };

  return { ...query, assets: map, get, getCurrencyIcon, getPvpIcon };
};

export const useUpdateSiteAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, url }: { key: SiteAssetKey; url: string }) => {
      const { error } = await supabase
        .from("site_assets" as any)
        .upsert({ key, url, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-assets"] });
      toast.success("Ícone atualizado!");
    },
    onError: (e: any) => toast.error(e.message),
  });
};
