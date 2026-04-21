import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export type NavLink = {
  id: string;
  label: string;
  url: string;
  color: string;
  icon_url: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export type SiteBanner = {
  id: string;
  title: string | null;
  image_url: string | null;
  link_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export const useNavLinks = (onlyActive = false) => {
  return useQuery({
    queryKey: ["nav-links", onlyActive],
    queryFn: async () => {
      let q = supabase.from("nav_links" as any).select("*").order("sort_order", { ascending: true });
      if (onlyActive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as NavLink[];
    },
  });
};

export const useSiteBanners = (onlyActive = false) => {
  return useQuery({
    queryKey: ["site-banners", onlyActive],
    queryFn: async () => {
      let q = supabase.from("site_banners" as any).select("*").order("sort_order", { ascending: true });
      if (onlyActive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as SiteBanner[];
    },
  });
};

export const useNavLinksMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["nav-links"] });
  };

  const create = useMutation({
    mutationFn: async (link: Omit<NavLink, "id" | "created_at">) => {
      const { error } = await supabase.from("nav_links" as any).insert(link as any);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Link criado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Partial<NavLink> & { id: string }) => {
      const { error } = await supabase.from("nav_links" as any).update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Link atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nav_links" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Link removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update, remove };
};

export const useBannerMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["site-banners"] });
  };

  const create = useMutation({
    mutationFn: async (banner: Omit<SiteBanner, "id" | "created_at">) => {
      const { error } = await supabase.from("site_banners" as any).insert(banner as any);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Banner criado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Partial<SiteBanner> & { id: string }) => {
      const { error } = await supabase.from("site_banners" as any).update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Banner atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_banners" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Banner removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update, remove };
};
