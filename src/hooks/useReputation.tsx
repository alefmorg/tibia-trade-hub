import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const db = supabase as any;

export interface UserReview {
  id: string;
  reviewed_user_id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  reviewer_profile?: { username: string; avatar_url: string | null };
}

export const useUserReputation = (userId?: string) => {
  return useQuery({
    queryKey: ["user-reputation", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db.rpc("get_user_reputation", { p_user_id: userId });
      if (error) throw error;
      return data as { avg: number; count: number };
    },
  });
};

export const useUserReviews = (userId?: string) => {
  return useQuery({
    queryKey: ["user-reviews", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db
        .from("user_reviews")
        .select("*")
        .eq("reviewed_user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const reviews = (data || []) as UserReview[];
      // fetch reviewer profiles in parallel
      const enriched = await Promise.all(
        reviews.map(async (r) => {
          const { data: prof } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("user_id", r.reviewer_id)
            .maybeSingle();
          return { ...r, reviewer_profile: prof || undefined };
        })
      );
      return enriched;
    },
  });
};

export const useMyReviewFor = (userId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-review", userId, user?.id],
    enabled: !!userId && !!user,
    queryFn: async () => {
      const { data } = await db
        .from("user_reviews")
        .select("*")
        .eq("reviewed_user_id", userId)
        .eq("reviewer_id", user!.id)
        .maybeSingle();
      return data as UserReview | null;
    },
  });
};

export const useReviewMutations = (reviewedUserId?: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const inv = () => {
    qc.invalidateQueries({ queryKey: ["user-reviews", reviewedUserId] });
    qc.invalidateQueries({ queryKey: ["user-reputation", reviewedUserId] });
    qc.invalidateQueries({ queryKey: ["my-review", reviewedUserId] });
  };

  const upsert = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment?: string }) => {
      if (!user || !reviewedUserId) throw new Error("Não autenticado");
      // try update first
      const { data: existing } = await db
        .from("user_reviews")
        .select("id")
        .eq("reviewed_user_id", reviewedUserId)
        .eq("reviewer_id", user.id)
        .maybeSingle();
      if (existing) {
        const { error } = await db
          .from("user_reviews")
          .update({ rating, comment: comment || null })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await db
          .from("user_reviews")
          .insert({ reviewed_user_id: reviewedUserId, reviewer_id: user.id, rating, comment: comment || null });
        if (error) throw error;
      }
    },
    onSuccess: () => { inv(); toast.success("Avaliação salva!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("user_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { inv(); toast.success("Avaliação removida"); },
    onError: (e: any) => toast.error(e.message),
  });

  return { upsert, remove };
};
