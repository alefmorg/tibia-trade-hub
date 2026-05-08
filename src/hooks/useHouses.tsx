import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export interface House {
  id: string;
  name: string;
  city: string | null;
  type: string;
  beds: number | null;
  size_sqm: number | null;
  rent_gold: number | null;
  image_url: string | null;
  wiki_url: string | null;
}

export const useHouses = () => {
  return useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("houses")
        .select("*")
        .order("city", { ascending: true })
        .order("name", { ascending: true })
        .limit(2000);
      if (error) throw error;
      return (data as House[]) || [];
    },
  });
};

export const useImportHouses = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("import-houses", { body: {} });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { success: boolean; imported: number; upserted: number };
    },
    onSuccess: (d) => {
      toast.success(`Importação concluída: ${d.imported} houses processadas`);
      qc.invalidateQueries({ queryKey: ["houses"] });
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao importar houses"),
  });
};

export const useDeleteHouse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("houses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("House removida");
      qc.invalidateQueries({ queryKey: ["houses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
