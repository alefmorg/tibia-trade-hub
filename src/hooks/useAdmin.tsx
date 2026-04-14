import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type AdStatus = "active" | "inactive" | "sold";
export type OfferStatus = "pending" | "accepted" | "rejected";

type AdminActionResponse<T = unknown> = {
  success?: boolean;
  data?: T;
  error?: string;
};

const invalidateAdminQueries = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] }),
    queryClient.invalidateQueries({ queryKey: ["trade-settings"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-ads-count"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-offers"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-conversations"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-favorites"] }),
    queryClient.invalidateQueries({ queryKey: ["ads"] }),
    queryClient.invalidateQueries({ queryKey: ["ads", "admin"] }),
    queryClient.invalidateQueries({ queryKey: ["user-ads"] }),
    queryClient.invalidateQueries({ queryKey: ["favorites"] }),
    queryClient.invalidateQueries({ queryKey: ["favorite-ads"] }),
    queryClient.invalidateQueries({ queryKey: ["conversations"] }),
    queryClient.invalidateQueries({ queryKey: ["messages"] }),
    queryClient.invalidateQueries({ queryKey: ["unread-count"] }),
  ]);
};

const callAdminAction = async <T = unknown>(action: string, payload?: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke<AdminActionResponse<T>>("admin-actions", {
    body: { action, payload },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.data as T;
};

export const useAdminData = (enabled: boolean) => {
  const queryClient = useQueryClient();

  const profilesQuery = useQuery({
    queryKey: ["admin-profiles"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const userRolesQuery = useQuery({
    queryKey: ["admin-user-roles"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const tradeSettingsQuery = useQuery({
    queryKey: ["trade-settings"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("trade_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as { id: string; ad_duration_days: number } | null;
    },
  });

  const adsCountQuery = useQuery({
    queryKey: ["admin-ads-count"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("ads").select("user_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((ad) => { counts[ad.user_id] = (counts[ad.user_id] || 0) + 1; });
      return counts;
    },
  });

  const offersQuery = useQuery({
    queryKey: ["admin-offers"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const conversationsQuery = useQuery({
    queryKey: ["admin-conversations"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("conversations").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const favoritesQuery = useQuery({
    queryKey: ["admin-favorites"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("id");
      if (error) throw error;
      return data?.length || 0;
    },
  });

  const updateAdStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdStatus }) => callAdminAction("updateAdStatus", { id, status }),
    onSuccess: async () => { await invalidateAdminQueries(queryClient); toast.success("Status atualizado!"); },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar status"),
  });

  const toggleFeatured = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => callAdminAction("toggleAdFeatured", { id, featured }),
    onSuccess: async () => { await invalidateAdminQueries(queryClient); toast.success("Destaque atualizado!"); },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar destaque"),
  });

  const updateUserRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) => callAdminAction("updateUserRole", { userId, role }),
    onSuccess: async () => { await invalidateAdminQueries(queryClient); toast.success("Cargo atualizado!"); },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar cargo"),
  });

  const banUser = useMutation({
    mutationFn: ({ userId, banned }: { userId: string; banned: boolean }) => callAdminAction("banUser", { userId, banned }),
    onSuccess: async (_, vars) => { await invalidateAdminQueries(queryClient); toast.success(vars.banned ? "Usuário banido!" : "Usuário desbanido!"); },
    onError: (err: any) => toast.error(err.message || "Erro ao banir usuário"),
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) => callAdminAction("deleteUser", { userId }),
    onSuccess: async () => { await invalidateAdminQueries(queryClient); toast.success("Usuário removido!"); },
    onError: (err: any) => toast.error(err.message || "Erro ao remover usuário"),
  });

  const updateTradeSettings = useMutation({
    mutationFn: (payload: Record<string, unknown>) => callAdminAction("updateTradeSettings", payload),
    onSuccess: async () => { await invalidateAdminQueries(queryClient); toast.success("Configuração salva!"); },
    onError: (err: any) => toast.error(err.message || "Erro ao salvar configuração"),
  });

  const updateOfferStatus = useMutation({
    mutationFn: ({ offerId, status }: { offerId: string; status: OfferStatus }) => callAdminAction("updateOfferStatus", { offerId, status }),
    onSuccess: async (_, vars) => { await invalidateAdminQueries(queryClient); toast.success(vars.status === "accepted" ? "Oferta aceita!" : vars.status === "rejected" ? "Oferta recusada!" : "Oferta atualizada!"); },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar oferta"),
  });

  const deleteOffer = useMutation({
    mutationFn: (offerId: string) => callAdminAction("deleteOffer", { offerId }),
    onSuccess: async () => { await invalidateAdminQueries(queryClient); toast.success("Oferta removida!"); },
    onError: (err: any) => toast.error(err.message || "Erro ao remover oferta"),
  });

  const deleteConversation = useMutation({
    mutationFn: (conversationId: string) => callAdminAction("deleteConversation", { conversationId }),
    onSuccess: async () => { await invalidateAdminQueries(queryClient); toast.success("Conversa removida!"); },
    onError: (err: any) => toast.error(err.message || "Erro ao remover conversa"),
  });

  const getConversationMessages = async (conversationId: string) => {
    return callAdminAction<any[]>("getConversationMessages", { conversationId });
  };

  const createAdAdmin = useMutation({
    mutationFn: (adData: Record<string, unknown>) => callAdminAction("createAd", adData),
    onSuccess: async () => { await invalidateAdminQueries(queryClient); toast.success("Anúncio criado!"); },
    onError: (err: any) => toast.error(err.message || "Erro ao criar anúncio"),
  });

  return {
    profiles: profilesQuery.data || [],
    userRoles: userRolesQuery.data || [],
    tradeSettings: tradeSettingsQuery.data || null,
    adsCountByUser: adsCountQuery.data || {},
    allOffers: offersQuery.data || [],
    allConversations: conversationsQuery.data || [],
    allFavorites: favoritesQuery.data || 0,
    isLoading:
      profilesQuery.isLoading || userRolesQuery.isLoading || tradeSettingsQuery.isLoading ||
      adsCountQuery.isLoading || offersQuery.isLoading || conversationsQuery.isLoading || favoritesQuery.isLoading,
    updateAdStatus, toggleFeatured, updateUserRole, banUser, deleteUser,
    updateTradeSettings, updateOfferStatus, deleteOffer, deleteConversation,
    getConversationMessages, createAdAdmin,
  };
};
