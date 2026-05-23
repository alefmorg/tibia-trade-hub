import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { toast } from "sonner";

export interface Conversation {
  id: string;
  ad_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  ads?: {
    id?: string;
    title: string;
    image_url: string | null;
    price?: string | null;
    currency?: string;
    world?: string;
    pvp_type?: string;
    item_reference_url?: string | null;
    extra_info?: string | null;
  };
  buyer_profile?: { username: string; avatar_url: string | null };
  seller_profile?: { username: string; avatar_url: string | null };
  unread_count?: number;
  last_message?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export const useConversations = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, ads(id, title, image_url, price, currency, world, pvp_type, item_reference_url, extra_info)")
        .order("updated_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles for each conversation & unread counts
      const enriched = await Promise.all(
        (data || []).map(async (conv: any) => {
          const [buyerRes, sellerRes, unreadRes, lastMsgRes] = await Promise.all([
            supabase.from("profiles").select("username, avatar_url").eq("user_id", conv.buyer_id).single(),
            supabase.from("profiles").select("username, avatar_url").eq("user_id", conv.seller_id).single(),
            supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", conv.id).eq("read", false).neq("sender_id", user!.id),
            supabase.from("messages").select("content, created_at").eq("conversation_id", conv.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          ]);
          return {
            ...conv,
            buyer_profile: buyerRes.data,
            seller_profile: sellerRes.data,
            unread_count: unreadRes.count || 0,
            last_message: lastMsgRes.data?.content || "",
          } as Conversation;
        })
      );
      return enriched;
    },
  });
};

export const useMessages = (conversationId: string | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Message[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  return query;
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      if (!user) throw new Error("Não autenticado");
      const trimmed = content.trim();
      if (!trimmed) throw new Error("Mensagem vazia");
      if (trimmed.length > 4000) throw new Error("Mensagem muito longa (máx 4000 caracteres)");
      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: user.id, content: trimmed })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["messages", vars.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: any) => toast.error(err.message),
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, conversationId }: { id: string; conversationId: string }) => {
      const { error } = await supabase.from("messages").delete().eq("id", id);
      if (error) throw error;
      return conversationId;
    },
    onSuccess: (conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Mensagem apagada");
    },
    onError: (err: any) => toast.error(err.message),
  });
};

export const useStartConversation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ adId, sellerId }: { adId: string; sellerId: string }) => {
      if (!user) throw new Error("Faça login para enviar mensagem");
      // Check existing
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("ad_id", adId)
        .eq("buyer_id", user.id)
        .maybeSingle();
      if (existing) return existing.id as string;

      const { data, error } = await supabase
        .from("conversations")
        .insert({ ad_id: adId, buyer_id: user.id, seller_id: sellerId })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: any) => toast.error(err.message),
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) return;
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("read", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
};

export const useUnreadCount = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["unread-count", user?.id],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      // Get all conversation ids where user is participant
      const { data: convs } = await supabase
        .from("conversations")
        .select("id");
      if (!convs || convs.length === 0) return 0;

      const ids = convs.map((c: any) => c.id);
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", ids)
        .eq("read", false)
        .neq("sender_id", user!.id);
      return count || 0;
    },
  });

  // Realtime for new messages across all conversations
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("unread-global")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return query;
};
