import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type FilterOption = {
  id: string;
  filter_group: string;
  label: string;
  value: string;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export const useFilterOptions = (group?: string, onlyActive = false) => {
  return useQuery({
    queryKey: ["filter-options", group, onlyActive],
    queryFn: async () => {
      let q = (supabase as any).from("filter_options").select("*").order("sort_order", { ascending: true });
      if (group) q = q.eq("filter_group", group);
      if (onlyActive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as FilterOption[];
    },
  });
};

export const useFilterOptionsMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["filter-options"] });

  const create = useMutation({
    mutationFn: async (opt: Omit<FilterOption, "id" | "created_at">) => {
      const { error } = await (supabase as any).from("filter_options").insert(opt);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Opção de filtro criada!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Partial<FilterOption> & { id: string }) => {
      const { error } = await (supabase as any).from("filter_options").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Opção atualizada!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("filter_options").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Opção removida!"); },
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update, remove };
};
