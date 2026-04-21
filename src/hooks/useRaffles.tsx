import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const db = supabase as any;

export interface Raffle {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price_per_number: number;
  total_numbers: number;
  draw_date: string | null;
  status: string;
  winner_number: number | null;
  winner_user_id: string | null;
  federal_lottery_ref: string | null;
  created_at: string;
}

export interface RaffleNumber {
  id: string;
  raffle_id: string;
  user_id: string;
  number: number;
  created_at: string;
}

export const useRaffles = (activeOnly = false) => {
  return useQuery({
    queryKey: ["raffles", activeOnly],
    queryFn: async () => {
      let q = db.from("raffles").select("*").order("created_at", { ascending: false });
      if (activeOnly) q = q.eq("status", "active");
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Raffle[];
    },
  });
};

export const useRaffle = (id: string) => {
  return useQuery({
    queryKey: ["raffle", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db.from("raffles").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Raffle;
    },
  });
};

export const useRaffleNumbers = (raffleId: string) => {
  return useQuery({
    queryKey: ["raffle-numbers", raffleId],
    enabled: !!raffleId,
    queryFn: async () => {
      const { data, error } = await db.from("raffle_numbers").select("*").eq("raffle_id", raffleId).order("number", { ascending: true });
      if (error) throw error;
      return (data || []) as RaffleNumber[];
    },
  });
};

export const useBuyRaffleNumbers = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ raffleId, quantity }: { raffleId: string; quantity: number }) => {
      const { data, error } = await db.rpc("buy_raffle_number", { p_raffle_id: raffleId, p_quantity: quantity });
      if (error) throw error;
      return data as number[];
    },
    onSuccess: (numbers) => {
      qc.invalidateQueries({ queryKey: ["raffle-numbers"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
      toast.success(`Números comprados: ${numbers.join(", ")}`);
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useRaffleMutations = () => {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["raffles"] });

  const create = useMutation({
    mutationFn: async (raffle: { title: string; description?: string; image_url?: string; price_per_number: number; total_numbers: number; draw_date?: string; federal_lottery_ref?: string }) => {
      const { error } = await db.from("raffles").insert(raffle);
      if (error) throw error;
    },
    onSuccess: () => { inv(); toast.success("Rifa criada!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await db.from("raffles").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { inv(); toast.success("Rifa atualizada!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("raffles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { inv(); toast.success("Rifa removida!"); },
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update, remove };
};
