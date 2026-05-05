import { useState } from "react";
import { useWorlds, useWorldMutations, type World } from "@/hooks/useWorlds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Pencil, Trash2, Plus, X } from "lucide-react";
import WorldFlag from "@/components/WorldFlag";
import { REGION_OPTIONS } from "@/lib/world-flags";

const PVP_TYPES = ["Optional PvP", "Open PvP", "Hardcore PvP", "Retro Open PvP", "Retro Hardcore PvP"];

const empty = {
  name: "",
  pvp_type: "Optional PvP",
  region: "BR",
  flag_url: "",
  flag_emoji: "",
  active: true,
  sort_order: 0,
};

export default function WorldsAdminPanel() {
  const { data: worlds } = useWorlds(false);
  const { create, update, remove } = useWorldMutations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);

  const reset = () => { setForm(empty); setEditingId(null); };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const payload: any = {
      name: form.name.trim(),
      pvp_type: form.pvp_type,
      region: form.region || null,
      flag_url: form.flag_url || null,
      flag_emoji: form.flag_emoji || null,
      active: form.active,
      sort_order: Number(form.sort_order) || 0,
    };
    if (editingId) update.mutate({ id: editingId, ...payload }, { onSuccess: reset });
    else create.mutate(payload, { onSuccess: reset });
  };

  const handleEdit = (w: World & any) => {
    setEditingId(w.id);
    setForm({
      name: w.name,
      pvp_type: w.pvp_type || "Optional PvP",
      region: w.region || "BR",
      flag_url: w.flag_url || "",
      flag_emoji: w.flag_emoji || "",
      active: w.active,
      sort_order: w.sort_order || 0,
    });
  };

  return (
    <div className="space-y-5">
      {/* Form */}
      <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/25">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground font-body">{editingId ? "Editar Mundo" : "Adicionar Mundo"}</h3>
            <p className="text-[10px] text-muted-foreground">Bandeira por região, PvP e ordem</p>
          </div>
          {editingId && (
            <Button size="sm" variant="ghost" className="ml-auto h-8" onClick={reset}>
              <X className="h-3.5 w-3.5 mr-1" /> Cancelar
            </Button>
          )}
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Aurera" className="bg-secondary/80" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo PvP</Label>
            <Select value={form.pvp_type} onValueChange={(v) => setForm({ ...form, pvp_type: v })}>
              <SelectTrigger className="bg-secondary/80"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PVP_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Região</Label>
            <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
              <SelectTrigger className="bg-secondary/80"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REGION_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Bandeira (emoji)</Label>
            <Input value={form.flag_emoji} onChange={(e) => setForm({ ...form, flag_emoji: e.target.value })} placeholder="🇧🇷" maxLength={6} className="bg-secondary/80" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs">URL da bandeira (opcional)</Label>
            <Input value={form.flag_url} onChange={(e) => setForm({ ...form, flag_url: e.target.value })} placeholder="https://flagcdn.com/w40/br.png" className="bg-secondary/80" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ordem</Label>
            <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })} className="bg-secondary/80" />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label className="text-xs cursor-pointer">Ativo</Label>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs text-muted-foreground">Preview:</span>
            <WorldFlag world={form} size="md" />
            <span className="text-xs font-semibold">{form.name || "—"}</span>
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button onClick={handleSubmit} disabled={!form.name.trim()} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> {editingId ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(worlds || []).map((w: any) => (
          <div key={w.id} className="bg-card/80 border border-border/60 rounded-xl p-3 flex items-center gap-3 hover:border-primary/30 transition-all">
            <WorldFlag world={w} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{w.name}</p>
              <p className="text-[10px] text-muted-foreground">{w.pvp_type} · {w.region || "—"}</p>
            </div>
            {!w.active && <span className="text-[9px] uppercase bg-destructive/15 text-destructive px-2 py-0.5 rounded">Inativo</span>}
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEdit(w)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-destructive/10"
              onClick={() => { if (confirm(`Remover mundo "${w.name}"?`)) remove.mutate(w.id); }}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
