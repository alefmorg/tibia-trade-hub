import { useEffect, useMemo, useState } from "react";
import {
  useWelcomeSettings,
  useUpdateWelcomeSettings,
  type WelcomeSettings,
} from "@/hooks/useWelcomeSettings";
import { supabase } from "@/lib/supabase-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Upload,
  Save,
  Eye,
  X as XIcon,
  RotateCcw,
  Wand2,
  Smartphone,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";

const PRESETS = [
  {
    name: "Clássico Dourado",
    accent: "#F59E0B",
    title: "Bem-vindo ao Trade Hub",
    subtitle:
      "Compre e venda com segurança. Negociações mais rápidas, claras e confiáveis.",
    cta: "Entrar no Mercado",
  },
  {
    name: "Noturno Arcano",
    accent: "#8B5CF6",
    title: "A noite das melhores ofertas",
    subtitle:
      "Itens raros, serviços e casas em um só lugar para dominar o seu mundo.",
    cta: "Explorar Ofertas",
  },
  {
    name: "PvP Turbo",
    accent: "#EF4444",
    title: "Pronto para o combate?",
    subtitle:
      "Acerte seu setup com as melhores oportunidades do servidor antes dos outros.",
    cta: "Ver Oportunidades",
  },
];

const WelcomePanel = () => {
  const { data: settings } = useWelcomeSettings();
  const update = useUpdateWelcomeSettings();
  const [form, setForm] = useState<Partial<WelcomeSettings>>({});
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const dirty = useMemo(() => {
    if (!settings) return false;
    return (
      JSON.stringify({ ...settings, ...form }) !== JSON.stringify(settings)
    );
  }, [form, settings]);

  if (!settings)
    return <p className="text-xs text-muted-foreground">Carregando...</p>;

  const save = () => update.mutate({ id: settings.id, ...form });

  const resetForm = () => {
    setForm(settings);
    toast.success("Alterações descartadas.");
  };

  const onUploadBg = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB).");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `bg-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("welcome-bg")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("welcome-bg").getPublicUrl(path);
      setForm((f) => ({ ...f, background_image_url: data.publicUrl }));
      toast.success("Imagem enviada!");
    } catch (e: any) {
      toast.error(e.message);
    }
    setUploading(false);
  };

  const mergedForm = { ...settings, ...form } as WelcomeSettings;

  return (
    <>
      {previewing && (
        <div className="fixed inset-0 z-[1100]">
          <button
            onClick={() => setPreviewing(false)}
            className="absolute top-4 left-4 z-[1200] inline-flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2 text-xs hover:bg-secondary"
          >
            <XIcon className="h-3.5 w-3.5" /> Fechar preview
          </button>
          <PreviewOverlay
            form={mergedForm}
            onClose={() => setPreviewing(false)}
            mobile={mobilePreview}
          />
        </div>
      )}

      <div className="bg-card/80 border border-warning/30 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 bg-warning/5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold">Tela de Boas-Vindas</h3>
          </div>
          {dirty && (
            <span className="text-[11px] text-warning font-medium">
              Alterações não salvas
            </span>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
            <p className="text-xs font-semibold mb-2">Presets rápidos</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      accent_color: preset.accent,
                      title: preset.title,
                      subtitle: preset.subtitle,
                      cta_text: preset.cta,
                    }))
                  }
                  className="text-left p-3 rounded-lg border border-border/60 hover:border-warning/50 hover:bg-warning/5 transition"
                >
                  <p className="text-xs font-semibold">{preset.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {preset.title}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40">
            <div>
              <p className="text-sm font-semibold">Splash ativa</p>
              <p className="text-[11px] text-muted-foreground">
                Quando ligada, é exibida antes do site carregar.
              </p>
            </div>
            <Switch
              checked={!!form.enabled}
              onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40">
            <div>
              <p className="text-sm font-semibold">
                Mostrar uma vez por sessão
              </p>
              <p className="text-[11px] text-muted-foreground">
                Se desligado, aparece a cada visita.
              </p>
            </div>
            <Switch
              checked={!!form.show_once_per_session}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, show_once_per_session: v }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">
                Título ({(form.title || "").length}/70)
              </Label>
              <Input
                value={form.title || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value.slice(0, 70) }))
                }
                className="bg-secondary/80 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Cor de destaque (hex)</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={form.accent_color || "#F59E0B"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, accent_color: e.target.value }))
                  }
                  className="h-10 w-14 rounded cursor-pointer bg-secondary border border-border"
                />
                <Input
                  value={form.accent_color || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, accent_color: e.target.value }))
                  }
                  className="bg-secondary/80"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">
                Subtítulo ({(form.subtitle || "").length}/160)
              </Label>
              <Textarea
                value={form.subtitle || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    subtitle: e.target.value.slice(0, 160),
                  }))
                }
                className="bg-secondary/80 mt-1 min-h-[60px]"
              />
            </div>
            <div>
              <Label className="text-xs">
                Texto do botão CTA ({(form.cta_text || "").length}/28)
              </Label>
              <Input
                value={form.cta_text || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    cta_text: e.target.value.slice(0, 28),
                  }))
                }
                className="bg-secondary/80 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">URL do CTA</Label>
              <Input
                value={form.cta_url || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cta_url: e.target.value }))
                }
                placeholder="/criar-anuncio  ou  https://..."
                className="bg-secondary/80 mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Imagem de fundo (opcional)</Label>
            <div className="flex items-center gap-3 mt-1">
              {form.background_image_url ? (
                <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border">
                  <img
                    src={form.background_image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() =>
                      setForm((f) => ({ ...f, background_image_url: null }))
                    }
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-20 rounded-lg border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground">
                  Sem imagem
                </div>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadBg(f);
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    {uploading ? "Enviando..." : "Enviar imagem"}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 pt-2">
            <Button
              onClick={save}
              disabled={update.isPending || !dirty}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              <Save className="h-4 w-4 mr-1" /> Salvar configurações
            </Button>
            <Button variant="outline" onClick={() => setPreviewing(true)}>
              <Eye className="h-4 w-4 mr-1" /> Pré-visualizar
            </Button>
            <Button
              variant="outline"
              onClick={() => setMobilePreview((s) => !s)}
            >
              {mobilePreview ? (
                <Monitor className="h-4 w-4 mr-1" />
              ) : (
                <Smartphone className="h-4 w-4 mr-1" />
              )}
              {mobilePreview ? "Modo Desktop" : "Modo Mobile"}
            </Button>
            <Button variant="ghost" onClick={resetForm} disabled={!dirty}>
              <RotateCcw className="h-4 w-4 mr-1" /> Descartar
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  title: "Bem-vindo ao Trade Hub",
                  subtitle:
                    "Seu mercado de Tibia mais rápido, seguro e inteligente.",
                  cta_text: "Começar agora",
                  accent_color: "#22C55E",
                }))
              }
            >
              <Wand2 className="h-4 w-4 mr-1" /> Gerar sugestão
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

const PreviewOverlay = ({
  form,
  onClose,
  mobile,
}: {
  form: WelcomeSettings;
  onClose: () => void;
  mobile: boolean;
}) => {
  useEffect(() => {
    try {
      sessionStorage.removeItem("rubin_welcome_seen_v1");
    } catch {}
  }, []);
  return (
    <div className="absolute inset-0">
      <InlineSplash form={form} onClose={onClose} mobile={mobile} />
    </div>
  );
};

const InlineSplash = ({
  form,
  onClose,
  mobile,
}: {
  form: WelcomeSettings;
  onClose: () => void;
  mobile: boolean;
}) => {
  const accent = form.accent_color || "#F59E0B";
  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-4"
      style={{
        background: `radial-gradient(ellipse at center, ${accent}26 0%, hsl(var(--background)) 70%), hsl(var(--background) / 0.97)`,
        backdropFilter: "blur(8px)",
      }}
    >
      {form.background_image_url && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${form.background_image_url})` }}
        />
      )}
      <div
        className={`relative w-full text-center ${mobile ? "max-w-[360px] border rounded-[28px] p-6 bg-card/70" : "max-w-2xl"}`}
      >
        <h1
          className="font-pixel text-2xl sm:text-4xl mb-4"
          style={{ color: accent }}
        >
          {form.title}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">
          {form.subtitle}
        </p>
        <button
          onClick={onClose}
          className="px-8 py-4 rounded-2xl text-white font-bold"
          style={{
            background: `linear-gradient(135deg, ${accent}, hsl(var(--primary)))`,
          }}
        >
          {form.cta_text}
        </button>
      </div>
    </div>
  );
};

export default WelcomePanel;
