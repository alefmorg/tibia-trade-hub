import { useRef, useState } from "react";
import { useSiteAssets, useUpdateSiteAsset, type SiteAssetKey } from "@/hooks/useSiteAssets";
import { supabase } from "@/lib/supabase-client";
import { compressImage } from "@/lib/image-utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Coins, Swords, ShieldCheck, Skull } from "lucide-react";

const ASSETS: { key: SiteAssetKey; label: string; description: string; Icon: any }[] = [
  { key: "icon_kk", label: "Moeda KK", description: "Ícone usado quando o preço é em kk", Icon: Coins },
  { key: "icon_coins", label: "Moeda Coin", description: "Ícone usado quando o preço é em coins", Icon: Coins },
  { key: "icon_pvp_open", label: "Open PvP", description: "Ícone para mundos Open PvP", Icon: Swords },
  { key: "icon_pvp_optional", label: "Optional PvP", description: "Ícone para mundos Optional PvP", Icon: ShieldCheck },
  { key: "icon_pvp_retro", label: "Retro PvP", description: "Ícone para mundos Retro Hardcore PvP", Icon: Skull },
];

const uploadIcon = async (file: File, key: string): Promise<string> => {
  const compressed = await compressImage(file, { maxWidth: 256, maxHeight: 256, quality: 0.92, mimeType: "image/webp" });
  const path = `${key}-${Date.now()}.webp`;
  const { error } = await supabase.storage.from("site-icons").upload(path, compressed, {
    contentType: compressed.type,
    cacheControl: "31536000",
    upsert: true,
  });
  if (error) throw error;
  return supabase.storage.from("site-icons").getPublicUrl(path).data.publicUrl;
};

const AssetRow = ({ k, label, description, Icon }: { k: SiteAssetKey; label: string; description: string; Icon: any }) => {
  const { get } = useSiteAssets();
  const update = useUpdateSiteAsset();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const url = get(k);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const newUrl = await uploadIcon(f, k);
      await update.mutateAsync({ key: k, url: newUrl });
    } catch (err: any) {
      toast.error(err.message || "Falha no upload");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
      <div className="w-16 h-16 rounded-full bg-secondary/40 border border-border flex items-center justify-center overflow-hidden shrink-0">
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-contain" />
        ) : (
          <Icon className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-[10px] text-muted-foreground/70 truncate mt-1">{url}</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
      <Button size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
        <Upload className="h-3.5 w-3.5 mr-1" />
        {busy ? "Enviando..." : "Trocar"}
      </Button>
    </div>
  );
};

const AssetsAdminPanel = () => {
  return (
    <div className="space-y-3 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-foreground">Ícones do site</h2>
        <p className="text-xs text-muted-foreground">Faça upload para customizar os ícones de moeda e tipo de PvP. Recomendado PNG quadrado, 256x256.</p>
      </div>
      <div className="space-y-2">
        {ASSETS.map((a) => (
          <AssetRow key={a.key} k={a.key} label={a.label} description={a.description} Icon={a.Icon} />
        ))}
      </div>
    </div>
  );
};

export default AssetsAdminPanel;
