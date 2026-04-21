import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const db = supabase as any;

export interface DepositRequest {
  id: string;
  user_id: string;
  amount_gold: number;
  amount_coins: number;
  screenshot_url: string;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useDepositConfig = () => {
  return useQuery({
    queryKey: ["deposit-config"],
    queryFn: async () => {
      const { data, error } = await db.from("trade_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as { id: string; deposit_char_name: string; gold_to_coins_rate: number } | null;
    },
  });
};

export const useMyDeposits = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-deposits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.from("deposit_requests").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as DepositRequest[];
    },
  });
};

export const useAllDeposits = () => {
  return useQuery({
    queryKey: ["admin-deposits"],
    queryFn: async () => {
      const { data, error } = await db.from("deposit_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as DepositRequest[];
    },
  });
};

export const useCreateDeposit = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ amountGold, amountCoins, screenshotFile }: { amountGold: number; amountCoins: number; screenshotFile: File }) => {
      const ext = screenshotFile.name.split(".").pop();
      const filePath = `${user!.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("deposit-screenshots").upload(filePath, screenshotFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("deposit-screenshots").getPublicUrl(filePath);

      const { error } = await db.from("deposit_requests").insert({
        user_id: user!.id,
        amount_gold: amountGold,
        amount_coins: amountCoins,
        screenshot_url: urlData.publicUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-deposits"] });
      toast.success("Solicitação de depósito enviada!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao enviar depósito"),
  });
};

export const useApproveDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (depositId: string) => {
      const { error } = await db.rpc("approve_deposit", { p_deposit_id: depositId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-deposits"] });
      qc.invalidateQueries({ queryKey: ["wallets-admin"] });
      toast.success("Depósito aprovado!");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useRejectDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ depositId, notes }: { depositId: string; notes?: string }) => {
      const { error } = await db.from("deposit_requests").update({ status: "rejected", admin_notes: notes || null, updated_at: new Date().toISOString() }).eq("id", depositId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-deposits"] });
      toast.success("Depósito rejeitado.");
    },
    onError: (e: any) => toast.error(e.message),
  });
};
