import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-utils";

export type ItemSource = "tibia" | "custom";

export interface Item {
  id: string;
  name: string;
  image_url: string | null;
  tier?: number | null;
  category: string;
  source: ItemSource;
  sort_order: number;
  created_at: string;
}

export const useItems = () => {
  return useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("items")
        .select("*")
        .order("source", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as Item[];
    },
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      imageFile,
      imageUrl,
      tier,
      category,
      source,
    }: {
      name: string;
      imageFile?: File;
      imageUrl?: string;
      tier?: number | null;
      category?: string;
      source?: ItemSource;
    }) => {
      let image_url: string | null = imageUrl || null;
      const db = supabase as any;

      if (imageFile) {
        const compressed = await compressImage(imageFile, { maxWidth: 256, maxHeight: 256, quality: 0.85, mimeType: "image/webp" });
        const ext = compressed.name.split(".").pop();
        const filePath = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("item-images")
          .upload(filePath, compressed, { contentType: compressed.type, cacheControl: "31536000" });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("item-images").getPublicUrl(filePath);
        image_url = urlData.publicUrl;
      }

      // Tier 0 não é permitido — força null
      const finalTier = tier && tier >= 1 && tier <= 10 ? tier : null;

      const { data, error } = await db
        .from("items")
        .insert({
          name,
          image_url,
          tier: finalTier,
          category: category || "Geral",
          source: source || "tibia",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item adicionado!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao adicionar item");
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Item> & { id: string }) => {
      const data: any = { ...patch };
      if ("tier" in data) {
        data.tier = data.tier && data.tier >= 1 && data.tier <= 10 ? data.tier : null;
      }
      const { error } = await (supabase as any).from("items").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar item"),
  });
};

export const useReorderItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Array<{ id: string; sort_order: number }>) => {
      // batch updates sequenciais (rápido, poucos itens por reorder)
      for (const u of updates) {
        const { error } = await (supabase as any)
          .from("items")
          .update({ sort_order: u.sort_order })
          .eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao reordenar"),
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item removido!");
    },
  });
};
