import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

const db = supabase as any;

export type BadgeType = "premium_verified" | "trusted_trader" | "top_trader" | "veteran" | "custom";

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  custom_label: string | null;
  custom_color: string | null;
  custom_icon_url?: string | null;
  granted_by: string | null;
  created_at: string;
}

export const useUserBadges = (userId?: string) => {
  return useQuery({
    queryKey: ["user-badges", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db
        .from("user_badges")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as UserBadge[];
    },
  });
};

export const useBadgeMutations = () => {
  const qc = useQueryClient();
  const inv = (uid?: string) => {
    qc.invalidateQueries({ queryKey: ["user-badges"] });
    if (uid) qc.invalidateQueries({ queryKey: ["user-badges", uid] });
  };

  const grant = useMutation({
    mutationFn: async (b: { user_id: string; badge_type: BadgeType; custom_label?: string; custom_color?: string }) => {
      const { error } = await db.from("user_badges").insert({
        user_id: b.user_id,
        badge_type: b.badge_type,
        custom_label: b.custom_label ?? null,
        custom_color: b.custom_color ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => { inv(v.user_id); toast.success("Selo concedido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async (b: { user_id: string; badge_type: BadgeType }) => {
      const { error } = await db
        .from("user_badges")
        .delete()
        .eq("user_id", b.user_id)
        .eq("badge_type", b.badge_type);
      if (error) throw error;
    },
    onSuccess: (_d, v) => { inv(v.user_id); toast.success("Selo removido."); },
    onError: (e: any) => toast.error(e.message),
  });

  return { grant, revoke };
};
