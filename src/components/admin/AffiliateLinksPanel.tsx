import { useState } from "react";
import { useAffiliateLinks, useAffiliateMutations, type AffiliateLink } from "@/hooks/useAffiliateLinks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Link2, Copy, Trash2, Check, X, Edit, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { env } from "@/lib/env";

const buildShortUrl = (slug: string) => {
  const base = env.SITE_URL.replace(/\/$/, "");
  return `${base}/go/${slug}`;
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

const empty = { slug: "", target_url: "", label: "", description: "", active: true };

const AffiliateLinksPanel = () => {
  const { data: links, isLoading } = useAffiliateLinks();
  const { create, update, remove } = useAffiliateMutations();
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const reset = () => { setForm(empty); setEditing(null); };

  const submit = () => {
    if (!form.slug.trim() || !form.target_url.trim() || !form.label.trim()) {
      toast.error("Preencha slug, URL e rótulo.");
      return;
    }
    const slug = slugify(form.slug);
    const payload = { ...form, slug, description: form.description || null };
    if (editing) {
      update.mutate({ id: editing, ...payload }, { onSuccess: reset });
    } else {
      create.mutate(payload as any, { onSuccess: reset });
    }
  };

  const startEdit = (l: AffiliateLink) => {
    setEditing(l.id);
    setForm({
      slug: l.slug,
      target_url: l.target_url,
      label: l.label,
      description: l.description || "",
      active: l.active,
    });
  };

  const copy = (slug: string) => {
    navigator.clipboard.writeText(buildShortUrl(slug));
    toast.success("Link copiado!");
  };

  return (
    <div className="space-y-4">
      <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 bg-secondary/20 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{editing ? "Editando link" : "Novo link de afiliado"}</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Rótulo *</Label>
            <Input
              value={form.label}
              onChange={(e) => {
                const label = e.target.value;
                setForm((f) => ({ ...f, label, slug: editing ? f.slug : slugify(label) }));
              }}
              placeholder="Ex: Parceiro X"
              className="bg-secondary/80 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Slug (URL curta) *</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">/go/</span>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="parceiro-x"
                className="bg-secondary/80"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">URL de destino *</Label>
            <Input
              value={form.target_url}
              onChange={(e) => setForm((f) => ({ ...f, target_url: e.target.value }))}
              placeholder="https://exemplo.com/oferta"
              className="bg-secondary/80 mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Descrição (opcional)</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Para que serve esse link..."
              className="bg-secondary/80 mt-1 min-h-[60px]"
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-between gap-3 flex-wrap">
            <label className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
              <span className="text-xs">Link ativo</span>
            </label>
            <div className="flex items-center gap-2 ml-auto">
              {editing && (
                <Button variant="ghost" size="sm" onClick={reset}>
                  <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                </Button>
              )}
              <Button onClick={submit} disabled={create.isPending || update.isPending} size="sm">
                <Check className="h-3.5 w-3.5 mr-1" />
                {editing ? "Salvar" : "Criar link"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 bg-secondary/20 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Links existentes</h3>
        </div>
        <div className="divide-y divide-border/40">
          {isLoading && <p className="p-5 text-xs text-muted-foreground">Carregando...</p>}
          {!isLoading && (links || []).length === 0 && (
            <p className="p-5 text-xs text-muted-foreground">Nenhum link criado ainda.</p>
          )}
          {(links || []).map((l) => (
            <div key={l.id} className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center hover:bg-secondary/20 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{l.label}</span>
                  {l.active ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold uppercase">Ativo</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-bold uppercase">Inativo</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">→ {l.target_url}</p>
                <button
                  onClick={() => copy(l.slug)}
                  className="inline-flex items-center gap-1 mt-1 text-[11px] text-primary hover:text-primary/80"
                  title="Copiar link curto"
                >
                  <Copy className="h-3 w-3" />
                  {buildShortUrl(l.slug)}
                </button>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-lg font-bold text-warning leading-none">{l.click_count}</p>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">clicks</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => startEdit(l)} title="Editar">
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => { if (confirm(`Remover "${l.label}"?`)) remove.mutate(l.id); }}
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AffiliateLinksPanel;
