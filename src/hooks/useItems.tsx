import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Item {
  id: string;
  name: string;
  image_url: string | null;
  tier?: number | null;
  created_at: string;
}

export const useItems = () => {
  return useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as Item[];
    },
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, imageFile, tier }: { name: string; imageFile?: File; tier?: number | null }) => {
      let image_url: string | null = null;
      const db = supabase as any;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const filePath = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("item-images")
          .upload(filePath, imageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("item-images")
          .getPublicUrl(filePath);
        image_url = urlData.publicUrl;
      }

      const { data, error } = await db
        .from("items")
        .insert({ name, image_url, tier: tier ?? null })
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
