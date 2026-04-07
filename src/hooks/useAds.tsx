import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Ad {
  id: string;
  user_id: string;
  title: string;
  type: "selling" | "buying";
  price: string | null;
  currency: string;
  world: string;
  pvp_type: string;
  category: string;
  description: string | null;
  image_url: string | null;
  featured: boolean;
  status: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  profiles?: { username: string; avatar_url: string | null };
}

export const useAds = (filters?: {
  search?: string;
  type?: string;
  world?: string;
  pvpType?: string;
  category?: string;
  onlyWithPrice?: boolean;
  sortBy?: string;
}) => {
  return useQuery({
    queryKey: ["ads", filters],
    queryFn: async () => {
      let query = supabase
        .from("ads")
        .select("*, profiles!ads_user_id_fkey(username, avatar_url)")
        .eq("status", "active");

      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }
      if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type);
      }
      if (filters?.world) {
        query = query.eq("world", filters.world);
      }
      if (filters?.pvpType) {
        query = query.eq("pvp_type", filters.pvpType);
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.onlyWithPrice) {
        query = query.not("price", "is", null).neq("price", "Aceita ofertas");
      }

      switch (filters?.sortBy) {
        case "recent":
          query = query.order("created_at", { ascending: false });
          break;
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        default:
          query = query.order("likes_count", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as Ad[]) || [];
    },
  });
};

export const useCreateAd = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ad: {
      title: string;
      type: string;
      price?: string;
      currency?: string;
      world: string;
      pvp_type: string;
      category: string;
      description?: string;
      image_url?: string;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("ads")
        .insert({ ...ad, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast.success("Anúncio criado com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao criar anúncio");
    },
  });
};

export const useDeleteAd = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adId: string) => {
      const { error } = await (supabase as any).rpc("delete_ad_cascade", { _ad_id: adId });
      if (error) throw error;
      return adId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["ads", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["user-ads"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-ads"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Anúncio removido!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao remover anúncio");
    },
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (adId: string) => {
      if (!user) throw new Error("Faça login para favoritar");
      // Check if already favorited
      const { data: existing } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("ad_id", adId)
        .maybeSingle();

      if (existing) {
        // Remove favorite and decrement likes_count
        await supabase.from("favorites").delete().eq("id", existing.id);
        await supabase.rpc("decrement_likes", { ad_id: adId }).catch(() => {
          // Fallback: update directly if RPC doesn't exist
          return supabase.from("ads").update({ likes_count: supabase.sql`likes_count - 1` }).eq("id", adId);
        });
        return { action: "removed" };
      } else {
        // Add favorite and increment likes_count
        await supabase.from("favorites").insert({ user_id: user.id, ad_id: adId });
        await supabase.rpc("increment_likes", { ad_id: adId }).catch(() => {
          // Fallback: update directly if RPC doesn't exist
          return supabase.from("ads").update({ likes_count: supabase.sql`likes_count + 1` }).eq("id", adId);
        });
        return { action: "added" };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-ads"] });
      toast.success(result.action === "added" ? "Adicionado aos favoritos!" : "Removido dos favoritos!");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });
};

export const useUserFavorites = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("ad_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data || []).map((f: any) => f.ad_id as string);
    },
  });
};

export const useAllAdsAdmin = () => {
  return useQuery({
    queryKey: ["ads", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*, profiles!ads_user_id_fkey(username)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Ad[]) || [];
    },
  });
};

export const useUpdateAdStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("ads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["ads", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["user-ads"] });
      toast.success("Status atualizado!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar status");
    },
  });
};
