import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export type FilterOptionItem = {
  id: string;
  filter_option_id: string;
  item_id: string;
};

export const useFilterOptionItems = (filterOptionId?: string) =>
  useQuery({
    queryKey: ["filter-option-items", filterOptionId],
    enabled: !!filterOptionId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("filter_option_items").select("*").eq("filter_option_id", filterOptionId);
      if (error) throw error;
      return (data || []) as FilterOptionItem[];
    },
  });

export const useAllFilterOptionItems = () =>
  useQuery({
    queryKey: ["filter-option-items-all"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("filter_option_items").select("*");
      if (error) throw error;
      return (data || []) as FilterOptionItem[];
    },
  });

export const useFilterOptionItemMutations = () => {
  const qc = useQueryClient();
  const inv = () => {
    qc.invalidateQueries({ queryKey: ["filter-option-items"] });
    qc.invalidateQueries({ queryKey: ["filter-option-items-all"] });
  };

  const add = useMutation({
    mutationFn: async (vars: { filter_option_id: string; item_id: string }) => {
      const { error } = await (supabase as any).from("filter_option_items").insert(vars);
      if (error) throw error;
    },
    onSuccess: () => { inv(); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("filter_option_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { inv(); },
    onError: (e: any) => toast.error(e.message),
  });

  return { add, remove };
};
