import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

const db = supabase as any;

export interface AffiliateLink {
  id: string;
  slug: string;
  target_url: string;
  label: string;
  description: string | null;
  active: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export const useAffiliateLinks = () =>
  useQuery({
    queryKey: ["affiliate-links"],
    queryFn: async () => {
      const { data, error } = await db
        .from("affiliate_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as AffiliateLink[];
    },
  });

export const useAffiliateMutations = () => {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["affiliate-links"] });

  const create = useMutation({
    mutationFn: async (input: Omit<AffiliateLink, "id" | "click_count" | "created_at" | "updated_at">) => {
      const { error } = await db.from("affiliate_links").insert(input);
      if (error) throw error;
    },
    onSuccess: () => { inv(); toast.success("Link criado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<AffiliateLink> & { id: string }) => {
      const { error } = await db.from("affiliate_links").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { inv(); toast.success("Link atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("affiliate_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { inv(); toast.success("Link removido."); },
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update, remove };
};

export const registerAffiliateClick = async (slug: string) => {
  const referrer = typeof document !== "undefined" ? document.referrer || null : null;
  // Hash bem grosseiro do user-agent + dia (sem PII)
  let uaHash: string | null = null;
  try {
    if (typeof navigator !== "undefined" && typeof crypto !== "undefined" && crypto.subtle) {
      const day = new Date().toISOString().slice(0, 10);
      const enc = new TextEncoder().encode((navigator.userAgent || "") + "|" + day);
      const buf = await crypto.subtle.digest("SHA-256", enc);
      uaHash = Array.from(new Uint8Array(buf)).slice(0, 12).map(b => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {}
  const { data, error } = await db.rpc("register_affiliate_click", {
    p_slug: slug,
    p_referrer: referrer,
    p_ua_hash: uaHash,
  });
  if (error) throw error;
  return data as string | null;
};
