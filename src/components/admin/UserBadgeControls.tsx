import { useState } from "react";
import { useUserBadges, useBadgeMutations, type BadgeType } from "@/hooks/useUserBadges";
import { supabase } from "@/lib/supabase-client";
import { BadgeCheck, Award, Crown, Gem, Plus, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FEATURES } from "@/lib/feature-flags";

interface UserBadgeControlsProps {
  userId: string;
}

const OPTIONS: { type: Exclude<BadgeType, "custom">; label: string; Icon: typeof BadgeCheck; activeCls: string }[] = [
  { type: "premium_verified", label: "Premium", Icon: BadgeCheck, activeCls: "bg-primary text-primary-foreground border-primary" },
  { type: "trusted_trader", label: "Confiável", Icon: Award, activeCls: "bg-primary/80 text-primary-foreground border-primary/80" },
  { type: "top_trader", label: "Top", Icon: Crown, activeCls: "bg-warning text-warning-foreground border-warning" },
  { type: "veteran", label: "Veterano", Icon: Gem, activeCls: "bg-secondary text-foreground border-foreground/40" },
];

const db = supabase as any;

const UserBadgeControls = ({ userId }: UserBadgeControlsProps) => {
  const { data: badges = [] } = useUserBadges(userId);
  const { grant, revoke } = useBadgeMutations();
  const pending = grant.isPending || revoke.isPending;

  const [customOpen, setCustomOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customColor, setCustomColor] = useState("#F59E0B");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filtra Premium se VIP estiver desativado
  const visibleOptions = FEATURES.VIP_ENABLED
    ? OPTIONS
    : OPTIONS.filter((o) => o.type !== "premium_verified");

  const has = (t: BadgeType) => badges.some((b) => b.badge_type === t);
  const customBadges = badges.filter((b) => b.badge_type === "custom");

  const onPickIcon = (f: File | null) => {
    setIconFile(f);
    setIconPreview(f ? URL.createObjectURL(f) : null);
  };

  const submitCustom = async () => {
    if (!customLabel.trim()) { toast.error("Defina um rótulo."); return; }
    setSaving(true);
    try {
      let iconUrl: string | null = null;
      if (iconFile) {
        if (iconFile.size > 200 * 1024) throw new Error("Ícone muito grande (máx 200KB).");
        const ext = iconFile.name.split(".").pop() || "png";
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("badge-icons").upload(path, iconFile, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from("badge-icons").getPublicUrl(path);
        iconUrl = data.publicUrl;
      }
      const { error } = await db.from("user_badges").insert({
        user_id: userId,
        badge_type: "custom",
        custom_label: customLabel.trim(),
        custom_color: customColor,
        custom_icon_url: iconUrl,
      });
      if (error) throw error;
      toast.success("Selo customizado criado!");
      setCustomOpen(false);
      setCustomLabel(""); setCustomColor("#F59E0B"); setIconFile(null); setIconPreview(null);
      // refetch via revoke/grant invalidation handled by other paths; force a quick reload
      window.dispatchEvent(new Event("focus"));
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const removeCustom = (id: string) => {
    db.from("user_badges").delete().eq("id", id).then(({ error }: any) => {
      if (error) toast.error(error.message);
      else { toast.success("Selo removido."); window.dispatchEvent(new Event("focus")); }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1">
        {visibleOptions.map(({ type, label, Icon, activeCls }) => {
          const active = has(type);
          return (
            <button
              key={type}
              type="button"
              disabled={pending}
              onClick={() => {
                if (active) revoke.mutate({ user_id: userId, badge_type: type });
                else grant.mutate({ user_id: userId, badge_type: type });
              }}
              title={active ? `Remover ${label}` : `Conceder ${label}`}
              className={cn(
                "inline-flex items-center gap-1 px-1.5 h-6 rounded-md border text-[10px] font-semibold transition-colors disabled:opacity-50",
                active ? activeCls : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          );
        })}

        {customBadges.map((b) => (
          <span
            key={b.id}
            className="inline-flex items-center gap-1 px-1.5 h-6 rounded-md border text-[10px] font-semibold"
            style={{
              color: b.custom_color || undefined,
              borderColor: b.custom_color || undefined,
              background: b.custom_color ? `color-mix(in oklab, ${b.custom_color} 14%, transparent)` : undefined,
            }}
            title={b.custom_label || "Selo"}
          >
            {b.custom_icon_url ? (
              <img src={b.custom_icon_url} alt="" className="h-3 w-3 object-contain" />
            ) : (
              <Award className="h-3 w-3" />
            )}
            {b.custom_label || "Selo"}
            <button onClick={() => removeCustom(b.id)} className="ml-0.5 opacity-60 hover:opacity-100">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => setCustomOpen(true)}
          className="inline-flex items-center gap-1 px-1.5 h-6 rounded-md border border-dashed border-border text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30"
          title="Criar selo personalizado"
        >
          <Plus className="h-3 w-3" /> Custom
        </button>
      </div>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Criar selo personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Rótulo</Label>
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value.slice(0, 20))}
                placeholder="Ex: Lendário"
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">{customLabel.length}/20</p>
            </div>
            <div>
              <Label className="text-xs">Cor</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer bg-secondary border border-border" />
                <Input value={customColor} onChange={(e) => setCustomColor(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Ícone customizado (PNG/SVG, máx 200KB)</Label>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-12 h-12 rounded-lg bg-secondary/60 border border-border flex items-center justify-center overflow-hidden">
                  {iconPreview ? <img src={iconPreview} alt="" className="w-full h-full object-contain" /> : <Award className="h-5 w-5 text-muted-foreground" />}
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/png,image/svg+xml,image/webp" className="hidden" onChange={(e) => onPickIcon(e.target.files?.[0] || null)} />
                  <Button size="sm" variant="outline" asChild>
                    <span><Upload className="h-3.5 w-3.5 mr-1" />Enviar ícone</span>
                  </Button>
                </label>
              </div>
            </div>
            <div className="rounded-xl border border-border p-3 bg-secondary/30">
              <p className="text-[10px] text-muted-foreground mb-2">Pré-visualização</p>
              <span
                className="inline-flex items-center gap-1 px-2 h-6 rounded-md border text-[11px] font-semibold"
                style={{ color: customColor, borderColor: customColor, background: `color-mix(in oklab, ${customColor} 14%, transparent)` }}
              >
                {iconPreview ? <img src={iconPreview} alt="" className="h-3.5 w-3.5 object-contain" /> : <Award className="h-3.5 w-3.5" />}
                {customLabel || "Selo"}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCustomOpen(false)}>Cancelar</Button>
            <Button onClick={submitCustom} disabled={saving || !customLabel.trim()}>
              {saving ? "Salvando..." : "Criar selo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserBadgeControls;
