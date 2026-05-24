import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useCreateAd } from "@/hooks/useAds";
import { useItems } from "@/hooks/useItems";
import { useWorlds } from "@/hooks/useWorlds";
import { Switch } from "@/components/ui/switch";
import ItemCombobox from "@/components/ItemCombobox";
import HouseCombobox from "@/components/HouseCombobox";
import { useHouses } from "@/hooks/useHouses";
import WorldFlag from "@/components/WorldFlag";
import { ArrowLeft, PackagePlus, Sparkles, Gem, Boxes, Globe, Tag, Coins as CoinsIcon, ShoppingBag, ShoppingCart, Search, CheckCircle2, Home } from "lucide-react";
import { formatPriceWithDots, formatPriceInput } from "@/lib/price-utils";
import { useSiteAssets } from "@/hooks/useSiteAssets";
import { cn } from "@/lib/utils";
import { safeHref } from "@/lib/safe-url";

const REGION_LABEL: Record<string, string> = {
  BR: "Brasil", NA: "North America", SA: "South America",
  EU: "Europe", ASIA: "Asia", AS: "Asia", OCE: "Oceania", AU: "Oceania", US: "North America",
};

const CriarAnuncio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createAd = useCreateAd();
  const { data: items } = useItems();
  const { data: houses } = useHouses();
  const { getCurrencyIcon } = useSiteAssets();
  const { data: worldsData } = useWorlds(true);
  const [kindTab, setKindTab] = useState<"item" | "house">("item");
  const [sourceTab, setSourceTab] = useState<"tibia" | "custom">("tibia");
  const [worldSearch, setWorldSearch] = useState("");
  const [houseId, setHouseId] = useState("");
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

  const tibiaItems = useMemo(() => (items || []).filter(i => i.source !== "custom"), [items]);
  const customItems = useMemo(() => (items || []).filter(i => i.source === "custom"), [items]);

  // Group worlds by region
  const worldsByRegion = useMemo(() => {
    const filtered = (worldsData || []).filter(w =>
      !worldSearch || w.name.toLowerCase().includes(worldSearch.toLowerCase())
    );
    const grouped: Record<string, typeof filtered> = {};
    filtered.forEach(w => {
      const key = (w.region || "OUTROS").toUpperCase();
      (grouped[key] = grouped[key] || []).push(w);
    });
    return grouped;
  }, [worldsData, worldSearch]);

  if (!user) {
    navigate("/login");
    return null;
  }

  const selectedItem = items?.find(i => i.id === form.itemId);
  const selectedWorld = (worldsData || []).find(w => w.name === form.world);

  const handleWorldSelect = (worldName: string) => {
    const world = (worldsData || []).find(w => w.name === worldName);
    setForm({ ...form, world: worldName, pvp_type: world?.pvp_type || form.pvp_type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kindTab === "house") {
      const house = (houses || []).find((h) => h.id === houseId);
      if (!house || !form.world) return;
      await createAd.mutateAsync({
        title: house.name,
        house_id: house.id,
        house_city: house.city || undefined,
        type: form.type,
        price: form.acceptOffers ? "Aceita ofertas" : form.price,
        currency: form.currency,
        world: form.world,
        pvp_type: form.pvp_type,
        category: "house",
        description: form.description || undefined,
        image_url: house.image_url || undefined,
      });
      navigate("/");
      return;
    }
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

  const stepDoneItem = kindTab === "item" ? !!form.itemId : !!houseId;
  const steps = [
    { n: 1, label: kindTab === "house" ? "House" : "Item", icon: kindTab === "house" ? Home : Sparkles, done: stepDoneItem },
    { n: 2, label: "Tipo & Preço", icon: Tag, done: stepDoneItem && (form.acceptOffers || !!form.price) },
    { n: 3, label: "Mundo", icon: Globe, done: !!form.world },
    { n: 4, label: "Publicar", icon: CheckCircle2, done: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <Header />
      <div className="container py-8 max-w-2xl">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl mb-6 p-6 bg-gradient-to-br from-primary/15 via-card to-warning/10 border border-primary/20">
          <div aria-hidden className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
              <PackagePlus className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold leading-tight">Criar Anúncio</h1>
              <p className="text-xs text-muted-foreground font-body">Publique seu item e comece a negociar</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="relative mt-5 flex items-center justify-between gap-2">
            {steps.map((s, idx) => (
              <div key={s.n} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border",
                  s.done ? "bg-primary text-primary-foreground border-primary shadow shadow-primary/30"
                         : "bg-secondary border-border text-muted-foreground"
                )}>
                  {s.done ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                </div>
                <span className={cn("text-[10px] uppercase tracking-wider hidden sm:block",
                  s.done ? "text-primary font-semibold" : "text-muted-foreground"
                )}>{s.label}</span>
                {idx < steps.length - 1 && (
                  <div className={cn("flex-1 h-px", s.done ? "bg-primary/40" : "bg-border")} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Anúncios de House temporariamente desativados */}

          {/* Item / House Selection */}
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5 space-y-4 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", kindTab === "house" ? "bg-warning/15" : "bg-primary/15")}>
                {kindTab === "house" ? <Home className="h-4 w-4 text-warning" /> : <Sparkles className="h-4 w-4 text-primary" />}
              </div>
              <div>
                <h2 className="text-sm font-bold">1. {kindTab === "house" ? "Selecione a house" : "Selecione o item"}</h2>
                <p className="text-[10px] text-muted-foreground">
                  {kindTab === "house" ? "Catálogo importado da TibiaWiki" : "Escolha entre Tibia oficial ou itens custom"}
                </p>
              </div>
            </div>

            {kindTab === "item" ? (
              <>
                <Tabs value={sourceTab} onValueChange={(v) => { setSourceTab(v as any); setForm({ ...form, itemId: "" }); }}>
                  <TabsList className="grid grid-cols-2 w-full bg-secondary/60 rounded-xl p-1 h-12">
                    <TabsTrigger value="tibia" className="rounded-lg h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow data-[state=active]:shadow-primary/20">
                      <Gem className="h-4 w-4 mr-1.5" /> Tibia <span className="ml-1.5 text-[10px] opacity-70">({tibiaItems.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="rounded-lg h-10 data-[state=active]:bg-warning data-[state=active]:text-warning-foreground data-[state=active]:shadow data-[state=active]:shadow-warning/20">
                      <Boxes className="h-4 w-4 mr-1.5" /> Custom <span className="ml-1.5 text-[10px] opacity-70">({customItems.length})</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="tibia" className="mt-3">
                    <ItemCombobox items={tibiaItems} value={form.itemId} onSelect={(id) => setForm({ ...form, itemId: id })} />
                  </TabsContent>
                  <TabsContent value="custom" className="mt-3">
                    <ItemCombobox items={customItems} value={form.itemId} onSelect={(id) => setForm({ ...form, itemId: id })} />
                  </TabsContent>
                </Tabs>

                {selectedItem && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 animate-fade-in">
                    {selectedItem.image_url && (
                      <div className="h-16 w-16 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                        <img src={selectedItem.image_url} alt={selectedItem.name} className="h-12 w-12 object-contain" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{selectedItem.name}</p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                          {selectedItem.category}
                        </span>
                        {selectedItem.source === "custom" && (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-warning/15 text-warning">Custom</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tier */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tier do item (opcional)</Label>
                  <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                    <SelectTrigger className="bg-secondary/60 border-border rounded-xl h-11">
                      <SelectValue placeholder="Sem tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem tier</SelectItem>
                      {[1,2,3,4,5,6,7,8,9,10].map(t => <SelectItem key={t} value={String(t)}>Tier {t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <HouseCombobox houses={houses || []} value={houseId} onSelect={setHouseId} />
                {(() => {
                  const h = (houses || []).find((x) => x.id === houseId);
                  if (!h) return null;
                  return (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-warning/5 to-transparent border border-warning/20 animate-fade-in">
                      <div className="h-16 w-16 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                        <Home className="h-7 w-7 text-warning" />
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="text-sm font-bold truncate">{h.name}</p>
                        <p className="text-muted-foreground">{h.city || "Sem cidade"} · {h.beds ?? "?"} cama(s) · {h.size_sqm ?? "?"} sqm · aluguel {h.rent_gold?.toLocaleString() ?? "?"} gp</p>
                        {h.wiki_url && (
                          <a href={safeHref(h.wiki_url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px]">Ver na TibiaWiki ↗</a>
                        )}
                      </div>
                    </div>
                  );
                })()}
                {(houses || []).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhuma house cadastrada ainda. Peça a um admin para importar da TibiaWiki.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Type & Price */}
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-warning/15 flex items-center justify-center">
                <Tag className="h-4 w-4 text-warning" />
              </div>
              <div>
                <h2 className="text-sm font-bold">2. Tipo & Preço</h2>
                <p className="text-[10px] text-muted-foreground">Define como o anúncio vai aparecer</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm({ ...form, type: "selling" })}
                className={cn(
                  "rounded-2xl p-4 text-left transition-all border-2",
                  form.type === "selling"
                    ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground border-primary shadow-lg shadow-primary/30 scale-[1.02]"
                    : "bg-secondary/40 border-border hover:border-primary/40"
                )}>
                <ShoppingBag className="h-5 w-5 mb-2" />
                <p className="text-sm font-bold">Vendendo</p>
                <p className="text-[10px] opacity-80 mt-0.5">Tenho o item para vender</p>
              </button>
              <button type="button" onClick={() => setForm({ ...form, type: "buying" })}
                className={cn(
                  "rounded-2xl p-4 text-left transition-all border-2",
                  form.type === "buying"
                    ? "bg-gradient-to-br from-warning to-warning/70 text-warning-foreground border-warning shadow-lg shadow-warning/30 scale-[1.02]"
                    : "bg-secondary/40 border-border hover:border-warning/40"
                )}>
                <ShoppingCart className="h-5 w-5 mb-2" />
                <p className="text-sm font-bold">Comprando</p>
                <p className="text-[10px] opacity-80 mt-0.5">Procurando este item</p>
              </button>
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
                  <div className="relative flex-1">
                    <CoinsIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: formatPriceInput(e.target.value, form.currency) })}
                      placeholder={form.currency === "brl" ? "1.000,00" : "1.000.000"}
                      className="bg-secondary/60 border-border rounded-xl h-12 pl-10 font-semibold"
                    />
                  </div>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger className="w-28 bg-secondary/60 border-border rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kk">
                        <span className="flex items-center gap-2">
                          <img src={getCurrencyIcon("kk")} alt="kk" className="w-4 h-4 object-contain" /> kk
                        </span>
                      </SelectItem>
                      <SelectItem value="coins">
                        <span className="flex items-center gap-2">
                          <img src={getCurrencyIcon("coins")} alt="coins" className="w-4 h-4 object-contain" /> coins
                        </span>
                      </SelectItem>
                      <SelectItem value="brl">
                        <span className="flex items-center gap-2">
                          <img src={getCurrencyIcon("brl")} alt="R$" className="w-4 h-4 object-contain" /> R$ (PIX)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* World */}
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold">3. Mundo</h2>
                <p className="text-[10px] text-muted-foreground">Selecione o mundo onde está o item</p>
              </div>
              {selectedWorld && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30">
                  <WorldFlag world={selectedWorld} size="sm" />
                  <span className="text-xs font-semibold">{selectedWorld.name}</span>
                </div>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar mundo..."
                value={worldSearch}
                onChange={(e) => setWorldSearch(e.target.value)}
                className="bg-secondary/60 border-border rounded-xl h-10 pl-10"
              />
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {Object.keys(worldsByRegion).sort().map((region) => (
                <div key={region} className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-1">
                    {REGION_LABEL[region] || region}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {worldsByRegion[region].map((w) => {
                      const active = form.world === w.name;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => handleWorldSelect(w.name)}
                          className={cn(
                            "flex items-center gap-2 rounded-xl p-2.5 border-2 transition-all text-left",
                            active
                              ? "bg-primary/15 border-primary shadow shadow-primary/20 scale-[1.02]"
                              : "bg-secondary/40 border-border/40 hover:border-primary/40 hover:bg-secondary/70"
                          )}
                        >
                          <WorldFlag world={w} size="md" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate">{w.name}</p>
                            <p className="text-[9px] text-muted-foreground truncate">{w.pvp_type}</p>
                          </div>
                          {active && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {Object.keys(worldsByRegion).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhum mundo encontrado</p>
              )}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <Label className="text-xs text-muted-foreground">Descrição (opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value.slice(0, 500) })}
                placeholder="Detalhes sobre o item, condições, etc..."
                className="bg-secondary/60 border-border min-h-[80px] rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground text-right">{form.description.length}/500</p>
            </div>
          </div>

          <Button type="submit" disabled={createAd.isPending || !stepDoneItem || !form.world}
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 h-14 rounded-2xl font-bold text-sm shadow-xl shadow-primary/30 transition-all">
            <Sparkles className="h-5 w-5 mr-2" />
            {createAd.isPending ? "Publicando..." : "Publicar Anúncio"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CriarAnuncio;
