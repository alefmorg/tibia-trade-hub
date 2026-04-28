import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export type PartnerStreamer = {
  id: string;
  display_name: string;
  twitch_login: string;
  avatar_url: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export const usePartnerStreamers = (onlyActive = false) => {
  return useQuery({
    queryKey: ["partner-streamers", onlyActive],
    queryFn: async () => {
      let q = supabase.from("partner_streamers" as any).select("*").order("sort_order", { ascending: true });
      if (onlyActive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as PartnerStreamer[];
    },
    refetchInterval: 60_000,
  });
};

export const usePartnerStreamerMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["partner-streamers"] });

  const create = useMutation({
    mutationFn: async (s: Omit<PartnerStreamer, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("partner_streamers" as any).insert(s as any);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Streamer adicionado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Partial<PartnerStreamer> & { id: string }) => {
      const { error } = await supabase.from("partner_streamers" as any).update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Streamer atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partner_streamers" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Streamer removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update, remove };
};
