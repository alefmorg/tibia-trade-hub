import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const db = supabase as any;

export const useMyVipStatus = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-vip", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.from("profiles").select("vip_until").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      const vipUntil = data?.vip_until ? new Date(data.vip_until) : null;
      return { vipUntil, isVip: !!vipUntil && vipUntil.getTime() > Date.now() };
    },
  });
};

export const useUserVipStatus = (userId?: string) => {
  return useQuery({
    queryKey: ["vip", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db.from("profiles").select("vip_until").eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      const vipUntil = data?.vip_until ? new Date(data.vip_until) : null;
      return { vipUntil, isVip: !!vipUntil && vipUntil.getTime() > Date.now() };
    },
  });
};

export const useVipSettings = () => {
  return useQuery({
    queryKey: ["vip-settings"],
    queryFn: async () => {
      const { data, error } = await db.from("trade_settings").select("vip_price_coins, vip_duration_days, vip_extra_ad_days, vip_max_active_ads, normal_max_active_ads, vip_free_highlights").limit(1).maybeSingle();
      if (error) throw error;
      return data as {
        vip_price_coins: number;
        vip_duration_days: number;
        vip_extra_ad_days: number;
        vip_max_active_ads: number;
        normal_max_active_ads: number;
        vip_free_highlights: number;
      } | null;
    },
  });
};

export const usePurchaseVip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await db.rpc("purchase_vip");
      if (error) throw error;
      return data as string;
    },
    onSuccess: (until) => {
      qc.invalidateQueries({ queryKey: ["my-vip"] });
      qc.invalidateQueries({ queryKey: ["vip"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`VIP ativo até ${new Date(until).toLocaleDateString("pt-BR")}`);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao comprar VIP"),
  });
};

export const useAdminSetVip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, until }: { userId: string; until: string | null }) => {
      const { error } = await db.rpc("admin_set_vip", { p_user_id: userId, p_until: until });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vip"] });
      qc.invalidateQueries({ queryKey: ["my-vip"] });
      qc.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success("VIP atualizado!");
    },
    onError: (e: any) => toast.error(e.message),
  });
};
