import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useCreateAd } from "@/hooks/useAds";
import { useItems } from "@/hooks/useItems";
import { useWorlds } from "@/hooks/useWorlds";
import { Switch } from "@/components/ui/switch";
import ItemCombobox from "@/components/ItemCombobox";
import { ArrowLeft, PackagePlus, Sparkles } from "lucide-react";
import { formatPriceWithDots } from "@/lib/price-utils";
import { useSiteAssets } from "@/hooks/useSiteAssets";
const CriarAnuncio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createAd = useCreateAd();
  const { data: items } = useItems();
  const { getCurrencyIcon } = useSiteAssets();
  const { data: worldsData } = useWorlds(true);
  const rubinotWorlds = (worldsData || []).map(w => ({ name: w.name, pvp: w.pvp_type, region: w.region }));
  const [form, setForm] = useState({
    itemId: "",
    type: "selling",
    price: "",
    currency: "kk",
    world: "",
    pvp_type: "Optional PvP",
    category: "item",
    description: "",
    acceptOffers: false,
    tier: "",
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  const selectedItem = items?.find(i => i.id === form.itemId);

  const handleWorldChange = (worldName: string) => {
    const world = rubinotWorlds.find(w => w.name === worldName);
    setForm({ ...form, world: worldName, pvp_type: world?.pvp || form.pvp_type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    await createAd.mutateAsync({
      title: selectedItem.name,
      item_id: selectedItem.id,
      type: form.type,
      price: form.acceptOffers ? "Aceita ofertas" : form.price,
      currency: form.currency,
      world: form.world,
      pvp_type: form.pvp_type,
      category: form.category,
      description: form.description || undefined,
      image_url: selectedItem.image_url || undefined,
      tier: form.tier && form.tier !== "none" ? Number(form.tier) : null,
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container py-8 max-w-xl">
        {/* Back button */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <PackagePlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg leading-tight">Criar Anúncio</h1>
            <p className="text-xs text-muted-foreground font-body">Publique seu item para vender ou comprar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Selection Card */}
          <div className="card-gaming p-5 space-y-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Selecione o Item</span>
            </div>
            <ItemCombobox
              items={items || []}
              value={form.itemId}
              onSelect={(id) => setForm({ ...form, itemId: id })}
            />
            {selectedItem?.image_url && (
              <div className="flex justify-center pt-1">
                <div className="h-20 w-20 rounded-xl bg-secondary/80 flex items-center justify-center border border-border">
                  <img src={selectedItem.image_url} alt={selectedItem.name} className="h-14 w-14 object-contain" />
                </div>
              </div>
            )}
            {items?.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum item cadastrado. O admin precisa cadastrar itens primeiro.</p>
            )}

            {/* Tier */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tier do Item</Label>
              <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                <SelectTrigger className="bg-secondary border-border rounded-xl h-11">
                  <SelectValue placeholder="Selecione o tier (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem tier</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(t => (
                    <SelectItem key={t} value={String(t)}>Tier {t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type & Price Card */}
          <div className="card-gaming p-5 space-y-4 rounded-2xl">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Tipo do Anúncio</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm"
                  className={`flex-1 rounded-xl h-11 font-semibold transition-all ${form.type === "selling" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary border border-border text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setForm({ ...form, type: "selling" })}>
                  Vendendo
                </Button>
                <Button type="button" size="sm"
                  className={`flex-1 rounded-xl h-11 font-semibold transition-all ${form.type === "buying" ? "bg-warning text-warning-foreground shadow-lg shadow-warning/20" : "bg-secondary border border-border text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setForm({ ...form, type: "buying" })}>
                  Comprando
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Preço</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Aceita ofertas</span>
                  <Switch checked={form.acceptOffers} onCheckedChange={(v) => setForm({ ...form, acceptOffers: v })} />
                </div>
              </div>
              {!form.acceptOffers && (
                <div className="flex gap-2">
                  <Input
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: formatPriceWithDots(e.target.value) })}
                    placeholder="Ex: 1.000.000"
                    className="bg-secondary border-border flex-1 rounded-xl h-11"
                  />
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger className="w-28 bg-secondary border-border rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kk">
                        <span className="flex items-center gap-2">
                          <img src={getCurrencyIcon("kk")} alt="kk" className="w-4 h-4 object-contain" />
                          kk
                        </span>
                      </SelectItem>
                      <SelectItem value="coins">
                        <span className="flex items-center gap-2">
                          <img src={getCurrencyIcon("coins")} alt="coins" className="w-4 h-4 object-contain" />
                          coins
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* World Card */}
          <div className="card-gaming p-5 space-y-4 rounded-2xl">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Mundo</Label>
              <Select value={form.world} onValueChange={handleWorldChange}>
                <SelectTrigger className="bg-secondary border-border rounded-xl h-11">
                  <SelectValue placeholder="Selecione o mundo" />
                </SelectTrigger>
                <SelectContent>
                  {rubinotWorlds.map(w => (
                    <SelectItem key={w.name} value={w.name}>
                      {w.name} ({w.pvp})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalhes sobre o item..." className="bg-secondary border-border min-h-[80px] rounded-xl" />
            </div>
          </div>

          <Button type="submit" disabled={createAd.isPending || !form.itemId || !form.world}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 transition-all">
            {createAd.isPending ? "Publicando..." : "Publicar Anúncio"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CriarAnuncio;
