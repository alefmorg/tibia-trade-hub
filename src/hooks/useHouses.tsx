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

// Busca imagens (thumbnail) no Tibia Fandom para houses sem image_url
export const useBackfillHouseImages = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: rows, error } = await supabase
        .from("houses")
        .select("id,name")
        .is("image_url", null)
        .limit(80);
      if (error) throw error;
      const houses = (rows || []) as { id: string; name: string }[];
      if (houses.length === 0) return { updated: 0, processed: 0 };

      let updated = 0;
      // processa em lotes de 8 para não estourar a edge function
      for (let i = 0; i < houses.length; i += 8) {
        const slice = houses.slice(i, i + 8);
        const { data, error: fnErr } = await supabase.functions.invoke("fetch-tibia-image", {
          body: { names: slice.map((h) => h.name) },
        });
        if (fnErr) continue;
        const results = (data as any)?.results || [];
        for (let j = 0; j < slice.length; j++) {
          const url = results[j]?.url;
          if (!url) continue;
          const { error: upErr } = await supabase
            .from("houses")
            .update({ image_url: url })
            .eq("id", slice[j].id);
          if (!upErr) {
            updated++;
            // propaga imagem para anúncios já vinculados a essa house
            await supabase.from("ads").update({ image_url: url }).eq("house_id", slice[j].id);
          }
        }
      }
      return { updated, processed: houses.length };
    },
    onSuccess: (d) => {
      toast.success(`Imagens atualizadas: ${d.updated}/${d.processed}`);
      qc.invalidateQueries({ queryKey: ["houses"] });
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao buscar imagens"),
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
