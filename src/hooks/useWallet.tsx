import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const db = supabase as any;

export const useWallet = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wallet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.from("wallets").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data as { id: string; user_id: string; balance: number } | null;
    },
  });
};

export const useWalletTransactions = (userId?: string) => {
  const { user } = useAuth();
  const uid = userId || user?.id;
  return useQuery({
    queryKey: ["wallet-transactions", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await db.from("wallet_transactions").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return (data || []) as { id: string; user_id: string; amount: number; type: string; reason: string | null; created_at: string }[];
    },
  });
};

export const useAllWallets = () => {
  return useQuery({
    queryKey: ["wallets-admin"],
    queryFn: async () => {
      const { data, error } = await db.from("wallets").select("*").order("balance", { ascending: false });
      if (error) throw error;
      return (data || []) as { id: string; user_id: string; balance: number; updated_at: string }[];
    },
  });
};

export const useAddBalance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason?: string }) => {
      const { error } = await db.rpc("add_balance", { p_user_id: userId, p_amount: amount, p_reason: reason || null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallets-admin"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
      toast.success("Saldo atualizado!");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useHighlightPlans = () => {
  return useQuery({
    queryKey: ["highlight-plans"],
    queryFn: async () => {
      const { data, error } = await db.from("highlight_plans").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as { id: string; name: string; price_coins: number; duration_days: number; active: boolean; sort_order: number }[];
    },
  });
};

export const useHighlightPlansMutations = () => {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["highlight-plans"] });

  const create = useMutation({
    mutationFn: async (plan: { name: string; price_coins: number; duration_days: number; sort_order?: number }) => {
      const { error } = await db.from("highlight_plans").insert(plan);
      if (error) throw error;
    },
    onSuccess: () => { inv(); toast.success("Plano criado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; price_coins?: number; duration_days?: number; active?: boolean; sort_order?: number }) => {
      const { error } = await db.from("highlight_plans").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { inv(); toast.success("Plano atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("highlight_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { inv(); toast.success("Plano removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update, remove };
};

export const useHighlightAd = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ adId, planId }: { adId: string; planId: string }) => {
      const { error } = await db.rpc("highlight_ad", { p_ad_id: adId, p_plan_id: planId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ads"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
      toast.success("Anúncio destacado!");
    },
    onError: (e: any) => toast.error(e.message),
  });
};
