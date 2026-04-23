import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

const db = supabase as any;

export interface IntermediationRequest {
  id: string;
  user_id: string;
  type: "buy" | "sell" | "trade";
  item_description: string;
  estimated_value: string | null;
  contact_info: string;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export const useCreateIntermediation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { type: "buy" | "sell" | "trade"; item_description: string; estimated_value?: string; contact_info: string; notes?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Faça login");
      const { error } = await db.from("intermediation_requests").insert({ ...data, user_id: user.user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intermediation"] });
      toast.success("Solicitação enviada! Um admin entrará em contato.");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useMyIntermediations = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["intermediation", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.from("intermediation_requests").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as IntermediationRequest[];
    },
  });
};

export const useDonate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ amount, message }: { amount: number; message?: string }) => {
      const { error } = await db.rpc("donate_coins", { p_amount: amount, p_message: message || null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
      toast.success("Obrigado pela sua doação! 💛");
    },
    onError: (e: any) => toast.error(e.message),
  });
};
