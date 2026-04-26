import { useState, useRef } from "react";
import { useSiteBanners, useBannerMutations, type SiteBanner } from "@/hooks/useSiteConfig";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { compressImage } from "@/lib/image-utils";
import { toast } from "sonner";
import { Building2, ExternalLink, Pencil, Plus, Trash2, Upload, X } from "lucide-react";

const emptyForm = {
  sponsor_name: "",
  link_url: "",
  sort_order: "0",
};

const uploadLogo = async (file: File): Promise<string> => {
  const compressed = await compressImage(file, { maxWidth: 256, maxHeight: 256, quality: 0.9, mimeType: "image/webp" });
  const path = `sponsors/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from("item-images").upload(path, compressed, {
    contentType: compressed.type,
    cacheControl: "31536000",
  });
  if (error) throw error;
  return supabase.storage.from("item-images").getPublicUrl(path).data.publicUrl;
};

const SponsorsAdminPanel = () => {
  const { data: banners } = useSiteBanners();
  const mut = useBannerMutations();

  const [form, setForm] = useState({ ...emptyForm });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setLogoFile(f);
      setLogoPreview(URL.createObjectURL(f));
    }
  };

  const reset = () => {
    setForm({ ...emptyForm });
    setLogoFile(null);
    setLogoPreview(null);
    setEditingId(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const startEdit = (b: SiteBanner) => {
    setEditingId(b.id);
    setForm({
      sponsor_name: b.sponsor_name || b.title || "",
      link_url: b.link_url || "",
      sort_order: String(b.sort_order),
    });
    setLogoPreview(b.logo_url || b.image_url || null);
    setLogoFile(null);
  };

  const submit = async () => {
    if (!form.sponsor_name.trim()) {
      toast.error("Informe o nome do patrocinador");
      return;
    }
    setUploading(true);
    try {
      let logo_url: string | null | undefined = undefined;
      if (logoFile) logo_url = await uploadLogo(logoFile);
      else if (editingId && !logoPreview) logo_url = null;

      const payload: any = {
        sponsor_name: form.sponsor_name.trim(),
        title: form.sponsor_name.trim(),
        link_url: form.link_url.trim() || null,
        sort_order: Number(form.sort_order) || 0,
      };
      if (logo_url !== undefined) payload.logo_url = logo_url;

      if (editingId) {
        await mut.update.mutateAsync({ id: editingId, ...payload });
      } else {
        await mut.create.mutateAsync({
          ...payload,
          logo_url: logo_url ?? null,
          image_url: null,
          active: true,
        } as any);
      }
      reset();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="bg-card/80 border border-border/60 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 font-body">
          <Plus className="h-4 w-4 text-primary" /> {editingId ? "Editar Patrocinador" : "Novo Patrocinador"}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr,1fr,auto] gap-4 items-start">
          {/* Logo upload */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Logo (circular)</Label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                <Button type="button" size="sm" variant="outline" className="text-xs h-7" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3 w-3 mr-1" /> {logoPreview ? "Trocar" : "Upload"}
                </Button>
                {logoPreview && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 text-destructive"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    <X className="h-3 w-3 mr-1" /> Remover
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nome do Patrocinador</Label>
            <Input
              value={form.sponsor_name}
              onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })}
              placeholder="Ex: RubinotShop"
              className="bg-secondary/80 border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Link (opcional)</Label>
            <Input
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="https://..."
              className="bg-secondary/80 border-border"
            />
          </div>

          <div className="space-y-1.5 w-24">
            <Label className="text-xs text-muted-foreground">Ordem</Label>
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              className="bg-secondary/80 border-border"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={submit} disabled={uploading || !form.sponsor_name.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {uploading ? "Salvando..." : editingId ? "Salvar Alterações" : "Adicionar"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={reset}>
              Cancelar
            </Button>
          )}
        </div>

        {/* Live preview */}
        {form.sponsor_name && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Preview no site</p>
            <div className="max-w-sm">
              <div className="group flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 hover:border-primary/40 transition-all p-3">
                <div className="w-12 h-12 rounded-full bg-card border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{form.sponsor_name}</p>
                  <p className="text-[10px] text-muted-foreground">Patrocinador</p>
                </div>
                {form.link_url && <ExternalLink className="h-3.5 w-3.5 text-primary opacity-60" />}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="bg-card/80 border border-border/60 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground">Patrocinadores cadastrados ({banners?.length || 0})</h4>
        </div>
        {(!banners || banners.length === 0) ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Nenhum patrocinador cadastrado</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {banners.map((b) => {
              const logo = b.logo_url || b.image_url;
              const name = b.sponsor_name || b.title || "Sem nome";
              return (
                <div key={b.id} className="group flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 hover:border-primary/40 transition-all p-3">
                  <div className="w-12 h-12 rounded-full bg-card border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
                    {logo ? (
                      <img src={logo} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {b.link_url || "(sem link)"} · ordem {b.sort_order}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={b.active} onCheckedChange={(v) => mut.update.mutate({ id: b.id, active: v })} />
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-primary hover:bg-primary/10" onClick={() => startEdit(b)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Remover patrocinador "${name}"?`)) mut.remove.mutate(b.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsorsAdminPanel;
