import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Ad {
  id: string;
  user_id: string;
  item_id?: string | null;
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
  expires_at?: string | null;
  tier?: number | null;
  created_at: string;
  updated_at: string;
  profiles?: { username: string; avatar_url: string | null };
  items?: { tier: number | null } | null;
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
        .select("*, profiles!ads_user_id_fkey(username, avatar_url), items!ads_item_id_fkey(tier)")
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
      return (((data as unknown as Ad[]) || []).filter((ad) => !ad.expires_at || new Date(ad.expires_at).getTime() > Date.now())) as Ad[];
    },
  });
};

const PAGE_SIZE = 20;

export const useInfiniteAds = (filters?: {
  search?: string;
  type?: string;
  world?: string;
  pvpType?: string;
  category?: string;
  onlyWithPrice?: boolean;
  sortBy?: string;
}) => {
  return useInfiniteQuery({
    queryKey: ["ads", "infinite", filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("ads")
        .select(
          "id,user_id,item_id,title,type,price,currency,world,pvp_type,category,image_url,featured,status,likes_count,expires_at,tier,created_at,profiles!ads_user_id_fkey(username, avatar_url),items!ads_item_id_fkey(tier)"
        )
        .eq("status", "active");

      if (filters?.search) query = query.ilike("title", `%${filters.search}%`);
      if (filters?.type && filters.type !== "all") query = query.eq("type", filters.type);
      if (filters?.world) query = query.eq("world", filters.world);
      if (filters?.pvpType) query = query.eq("pvp_type", filters.pvpType);
      if (filters?.category) query = query.eq("category", filters.category);
      if (filters?.onlyWithPrice) query = query.not("price", "is", null).neq("price", "Aceita ofertas");

      switch (filters?.sortBy) {
        case "recent": query = query.order("created_at", { ascending: false }); break;
        case "price_asc": query = query.order("price", { ascending: true }); break;
        case "price_desc": query = query.order("price", { ascending: false }); break;
        default: query = query.order("likes_count", { ascending: false });
      }

      query = query.range(from, to);
      const { data, error } = await query;
      if (error) throw error;

      const filtered = ((data as unknown as Ad[]) || []).filter(
        (ad) => !ad.expires_at || new Date(ad.expires_at).getTime() > Date.now()
      );
      return { items: filtered, nextPage: filtered.length === PAGE_SIZE ? (pageParam as number) + 1 : undefined };
    },
    getNextPageParam: (last) => last.nextPage,
  });
};

export const useCreateAd = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ad: {
      title: string;
      item_id?: string;
      type: string;
      price?: string;
      currency?: string;
      world: string;
      pvp_type: string;
      category: string;
      description?: string;
      image_url?: string;
      tier?: number | null;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const db = supabase as any;
      const { data, error } = await db
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

      // Get current likes count
      const { data: adData } = await supabase
        .from("ads")
        .select("likes_count")
        .eq("id", adId)
        .single();
      
      const currentLikes = adData?.likes_count || 0;

      if (existing) {
        // Remove favorite and decrement likes_count
        await supabase.from("favorites").delete().eq("id", existing.id);
        await supabase
          .from("ads")
          .update({ likes_count: Math.max(0, currentLikes - 1) })
          .eq("id", adId);
        return { action: "removed" };
      } else {
        // Add favorite and increment likes_count
        await supabase.from("favorites").insert({ user_id: user.id, ad_id: adId });
        await supabase
          .from("ads")
          .update({ likes_count: currentLikes + 1 })
          .eq("id", adId);
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
        .select("*, profiles!ads_user_id_fkey(username), items!ads_item_id_fkey(tier)")
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
