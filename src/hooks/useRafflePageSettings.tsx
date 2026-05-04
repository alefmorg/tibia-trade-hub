import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export type RafflePageSettings = {
  id: string;
  coming_soon: boolean;
  coming_soon_title: string;
  coming_soon_message: string;
  coming_soon_image_url: string | null;
  page_title: string;
  page_subtitle: string;
  accent_color: string;
  cta_text: string;
};

export const useRafflePageSettings = () =>
  useQuery({
    queryKey: ["raffle-page-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("raffle_page_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as RafflePageSettings | null;
    },
  });

export const useUpdateRafflePageSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<RafflePageSettings> & { id: string }) => {
      const { id, ...data } = patch;
      const { error } = await (supabase as any)
        .from("raffle_page_settings").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["raffle-page-settings"] });
      toast.success("Configurações da página de rifas salvas!");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useRaffleHistory = (raffleId?: string) =>
  useQuery({
    queryKey: ["raffle-history", raffleId],
    enabled: !!raffleId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_raffle_history", {
        p_raffle_id: raffleId, p_limit: 300,
      });
      if (error) throw error;
      return (data || []) as Array<{
        id: string; action: string; details: any; actor_id: string | null; actor_name: string | null; created_at: string;
      }>;
    },
  });
