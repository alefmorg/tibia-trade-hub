import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

const db = supabase as any;

export interface WelcomeSettings {
  id: string;
  enabled: boolean;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_url: string;
  background_image_url: string | null;
  accent_color: string;
  show_once_per_session: boolean;
  updated_at: string;
}

export const useWelcomeSettings = () =>
  useQuery({
    queryKey: ["welcome-settings"],
    queryFn: async () => {
      const { data, error } = await db
        .from("welcome_screen_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data || null) as WelcomeSettings | null;
    },
    staleTime: 30_000,
  });

export const useUpdateWelcomeSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<WelcomeSettings> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await db
        .from("welcome_screen_settings")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["welcome-settings"] });
      toast.success("Tela de boas-vindas atualizada!");
    },
    onError: (e: any) => toast.error(e.message),
  });
};
