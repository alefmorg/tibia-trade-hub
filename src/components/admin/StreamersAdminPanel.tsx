import { useRef, useState } from "react";
import { usePartnerStreamers, usePartnerStreamerMutations, type PartnerStreamer } from "@/hooks/usePartnerStreamers";
import { supabase } from "@/lib/supabase-client";
import { compressImage } from "@/lib/image-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, X, Twitch, ExternalLink } from "lucide-react";

const empty = { display_name: "", twitch_login: "", sort_order: "0" };

const uploadAvatar = async (file: File): Promise<string> => {
  const c = await compressImage(file, { maxWidth: 256, maxHeight: 256, quality: 0.9, mimeType: "image/webp" });
  const path = `streamers/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from("site-icons").upload(path, c, { contentType: c.type, cacheControl: "31536000" });
  if (error) throw error;
  return supabase.storage.from("site-icons").getPublicUrl(path).data.publicUrl;
};

const StreamersAdminPanel = () => {
  const { data: list } = usePartnerStreamers(false);
  const { create, update, remove } = usePartnerStreamerMutations();

  const [form, setForm] = useState({ ...empty });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setForm({ ...empty });
    setEditingId(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    setActive(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const startEdit = (s: PartnerStreamer) => {
    setEditingId(s.id);
    setForm({ display_name: s.display_name, twitch_login: s.twitch_login, sort_order: String(s.sort_order) });
    setAvatarPreview(s.avatar_url);
    setAvatarFile(null);
    setActive(s.active);
  };

  const submit = async () => {
    if (!form.display_name.trim() || !form.twitch_login.trim()) {
      toast.error("Preencha nome e login da Twitch");
      return;
    }
    setBusy(true);
    try {
      let avatar_url: string | null | undefined;
      if (avatarFile) avatar_url = await uploadAvatar(avatarFile);
      else if (editingId && !avatarPreview) avatar_url = null;

      const payload: any = {
        display_name: form.display_name.trim(),
        twitch_login: form.twitch_login.trim().toLowerCase().replace(/^@/, ""),
        sort_order: parseInt(form.sort_order) || 0,
        active,
      };
      if (avatar_url !== undefined) payload.avatar_url = avatar_url;

      if (editingId) await update.mutateAsync({ id: editingId, ...payload });
      else await create.mutateAsync(payload);
      reset();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-foreground">Streamers parceiros</h2>
        <p className="text-xs text-muted-foreground">Cadastre streamers da Twitch que aparecem ao lado do "Bem-vindo". Use o switch "Ao vivo" para destacar quem está transmitindo.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Ex: RubinStreamer" />
          </div>
          <div>
            <Label className="text-xs">Login Twitch</Label>
            <Input value={form.twitch_login} onChange={(e) => setForm({ ...form, twitch_login: e.target.value })} placeholder="ex: gaules" />
          </div>
          <div>
            <Label className="text-xs">Ordem</Label>
            <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
          }} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5 mr-1" /> Avatar
          </Button>
          {avatarPreview && (
            <div className="relative">
              <img src={avatarPreview} alt="" className="w-12 h-12 rounded-full object-cover border border-border" />
              <button onClick={() => { setAvatarPreview(null); setAvatarFile(null); }} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <Label className="text-xs">Ao vivo / Ativo</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={submit} disabled={busy} size="sm">
            <Plus className="h-3.5 w-3.5 mr-1" />
            {editingId ? "Salvar" : "Adicionar"}
          </Button>
          {editingId && <Button variant="ghost" size="sm" onClick={reset}>Cancelar</Button>}
        </div>
      </div>

      <div className="space-y-2">
        {(list || []).map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border">
                {s.avatar_url ? <img src={s.avatar_url} alt={s.display_name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-secondary flex items-center justify-center"><Twitch className="h-5 w-5 text-muted-foreground" /></div>}
              </div>
              {s.active && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-destructive border-2 border-card animate-pulse" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{s.display_name}</p>
              <a href={`https://twitch.tv/${s.twitch_login}`} target="_blank" rel="noreferrer" className="text-xs text-purple-400 hover:underline inline-flex items-center gap-1">
                @{s.twitch_login} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${s.active ? "bg-destructive/20 text-destructive" : "bg-secondary text-muted-foreground"}`}>
              {s.active ? "Ao vivo" : "Offline"}
            </span>
            <Button size="sm" variant="ghost" onClick={() => startEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover?")) remove.mutate(s.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
          </div>
        ))}
        {(!list || list.length === 0) && <p className="text-xs text-muted-foreground text-center py-6">Nenhum streamer cadastrado</p>}
      </div>
    </div>
  );
};

export default StreamersAdminPanel;
