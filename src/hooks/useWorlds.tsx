import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import { rubinotWorlds } from "@/lib/tibia-worlds";

export type World = {
  id: string;
  name: string;
  pvp_type: string;
  region: string | null;
  flag_url?: string | null;
  flag_emoji?: string | null;
  active: boolean;
  sort_order: number;
};

export const useWorlds = (onlyActive = false) => {
  return useQuery({
    queryKey: ["worlds", onlyActive],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("worlds")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) {
        // Fallback se a tabela ainda não existe
        return rubinotWorlds.map((w, i) => ({
          id: w.name,
          name: w.name,
          pvp_type: w.pvp,
          region: w.region,
          active: true,
          sort_order: i,
        })) as World[];
      }
      const list = (data || []) as World[];
      return onlyActive ? list.filter((w) => w.active) : list;
    },
  });
};

export const useWorldMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["worlds"] });

  const create = useMutation({
    mutationFn: async (w: { name: string; pvp_type: string; region?: string; sort_order?: number }) => {
      const { error } = await (supabase as any).from("worlds").insert({
        name: w.name.trim(),
        pvp_type: w.pvp_type,
        region: w.region || null,
        sort_order: w.sort_order ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Mundo adicionado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Partial<World> & { id: string }) => {
      const { error } = await (supabase as any).from("worlds").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Mundo atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("worlds").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Mundo removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update, remove };
};
