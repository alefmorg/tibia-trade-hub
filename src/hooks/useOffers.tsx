import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Offer {
  id: string;
  ad_id: string;
  sender_id: string;
  amount: string;
  currency: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: { username: string; avatar_url: string | null };
}

// Offers received on a specific ad (for ad owner)
export const useAdOffers = (adId?: string) => {
  return useQuery({
    queryKey: ["offers", adId],
    enabled: !!adId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("ad_id", adId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Offer[];
    },
  });
};

// All offers the current user has sent
export const useMyOffers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-offers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("sender_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Offer[];
    },
  });
};

// All offers on the current user's ads
export const useReceivedOffers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["received-offers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get user's ad ids first
      const { data: ads } = await supabase
        .from("ads")
        .select("id")
        .eq("user_id", user!.id);
      if (!ads || ads.length === 0) return [];

      const adIds = ads.map((a) => a.id);
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .in("ad_id", adIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Offer[];
    },
  });
};

export const useSendOffer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (offer: { ad_id: string; amount: string; currency: string; message?: string }) => {
      if (!user) throw new Error("Faça login para enviar oferta");
      const msg = offer.message?.trim() || undefined;
      if (msg && msg.length > 2000) throw new Error("Mensagem da oferta muito longa (máx 2000 caracteres)");
      const { data, error } = await supabase
        .from("offers")
        .insert({ ...offer, message: msg, sender_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["offers", vars.ad_id] });
      queryClient.invalidateQueries({ queryKey: ["my-offers"] });
      toast.success("Oferta enviada!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao enviar oferta");
    },
  });
};

export const useRespondOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId, status }: { offerId: string; status: "accepted" | "rejected" }) => {
      const { error } = await supabase
        .from("offers")
        .update({ status })
        .eq("id", offerId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["received-offers"] });
      queryClient.invalidateQueries({ queryKey: ["my-offers"] });
      toast.success(vars.status === "accepted" ? "Oferta aceita!" : "Oferta recusada.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao responder oferta");
    },
  });
};
