import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import { callAdminActionRaw } from "@/hooks/useAdmin";

export const useRafflePrizes = (raffleId?: string) =>
  useQuery({
    queryKey: ["raffle-prizes", raffleId],
    enabled: !!raffleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raffle_prizes")
        .select("*")
        .eq("raffle_id", raffleId!)
        .order("prize_number");
      if (error) throw error;
      return data || [];
    },
  });

export const useRaffleNumbersAdmin = (raffleId?: string) =>
  useQuery({
    queryKey: ["raffle-numbers-admin", raffleId],
    enabled: !!raffleId,
    queryFn: async () => callAdminActionRaw<any[]>("listRaffleNumbers", { raffleId }),
  });

export const useRafflesAdminMutations = () => {
  const qc = useQueryClient();
  const invalidate = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["raffles"] }),
      qc.invalidateQueries({ queryKey: ["raffle-prizes"] }),
      qc.invalidateQueries({ queryKey: ["raffle-numbers-admin"] }),
    ]);

  const drawWinner = useMutation({
    mutationFn: (vars: { raffleId: string; winnerNumber: number; lotteryRef?: string }) =>
      callAdminActionRaw<{ winnerId: string | null }>("drawRaffleWinner", vars),
    onSuccess: async (data) => {
      await invalidate();
      toast.success(data?.winnerId ? "Vencedor definido!" : "Sorteio salvo (ninguém comprou esse número)");
    },
    onError: (e: any) => toast.error(e.message || "Erro no sorteio"),
  });

  const createPrize = useMutation({
    mutationFn: (vars: { raffle_id: string; prize_number: number; prize_name: string; prize_description?: string }) =>
      callAdminActionRaw("createRafflePrize", vars),
    onSuccess: async () => {
      await invalidate();
      toast.success("Prêmio cadastrado!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao cadastrar prêmio"),
  });

  const deletePrize = useMutation({
    mutationFn: (id: string) => callAdminActionRaw("deleteRafflePrize", { id }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Prêmio removido");
    },
    onError: (e: any) => toast.error(e.message || "Erro"),
  });

  const markDelivered = useMutation({
    mutationFn: (vars: { id: string; delivered: boolean }) =>
      callAdminActionRaw("markPrizeDelivered", vars),
    onSuccess: async () => {
      await invalidate();
      toast.success("Status atualizado");
    },
    onError: (e: any) => toast.error(e.message || "Erro"),
  });

  return { drawWinner, createPrize, deletePrize, markDelivered };
};

export const useAdminStats = (enabled: boolean) =>
  useQuery({
    queryKey: ["admin-stats-rt"],
    enabled,
    refetchInterval: 15_000, // tempo "real" leve (15s)
    queryFn: async () => callAdminActionRaw<any>("getStats"),
  });
