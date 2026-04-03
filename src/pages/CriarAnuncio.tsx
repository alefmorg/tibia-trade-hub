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
import { rubinotWorlds, pvpTypes } from "@/lib/tibia-worlds";
import { Switch } from "@/components/ui/switch";

const CriarAnuncio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createAd = useCreateAd();
  const { data: items } = useItems();
  const [form, setForm] = useState({
    itemId: "",
    type: "selling",
    price: "",
    world: "",
    pvp_type: "Optional PvP",
    category: "item",
    description: "",
    acceptOffers: false,
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  const selectedItem = items?.find(i => i.id === form.itemId);

  // Auto-fill pvp_type when world is selected
  const handleWorldChange = (worldName: string) => {
    const world = rubinotWorlds.find(w => w.name === worldName);
    setForm({ ...form, world: worldName, pvp_type: world?.pvp || form.pvp_type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    await createAd.mutateAsync({
      title: selectedItem.name,
      type: form.type,
      price: form.acceptOffers ? "Aceita ofertas" : form.price,
      world: form.world,
      pvp_type: form.pvp_type,
      category: form.category,
      description: form.description || undefined,
      image_url: selectedItem.image_url || undefined,
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container py-8 max-w-lg">
        <h1 className="text-xl mb-6">Criar Anúncio</h1>
        <form onSubmit={handleSubmit} className="card-gaming p-6 space-y-4">
          {/* Item selection */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Item</Label>
            <Select value={form.itemId} onValueChange={(v) => setForm({ ...form, itemId: v })}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Selecione o item" />
              </SelectTrigger>
              <SelectContent>
                {items?.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex items-center gap-2">
                      {item.image_url && <img src={item.image_url} alt={item.name} className="h-5 w-5 object-contain" />}
                      <span>{item.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedItem?.image_url && (
              <div className="flex justify-center pt-2">
                <img src={selectedItem.image_url} alt={selectedItem.name} className="h-16 w-16 object-contain" />
              </div>
            )}
            {items?.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum item cadastrado. O admin precisa cadastrar itens primeiro.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-foreground">Tipo</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={form.type === "selling" ? "default" : "outline"} className={form.type === "selling" ? "bg-primary text-primary-foreground" : "border-border"} onClick={() => setForm({ ...form, type: "selling" })}>Vendendo</Button>
              <Button type="button" size="sm" variant={form.type === "buying" ? "default" : "outline"} className={form.type === "buying" ? "bg-warning text-warning-foreground" : "border-border"} onClick={() => setForm({ ...form, type: "buying" })}>Comprando</Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">Preço (gp)</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Aceita ofertas</span>
                <Switch checked={form.acceptOffers} onCheckedChange={(v) => setForm({ ...form, acceptOffers: v })} />
              </div>
            </div>
            {!form.acceptOffers && (
              <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Ex: 15.000.000" className="bg-secondary border-border" />
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-foreground">Mundo</Label>
            <Select value={form.world} onValueChange={handleWorldChange}>
              <SelectTrigger className="bg-secondary border-border">
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

          <div className="space-y-2">
            <Label className="text-sm text-foreground">Tipo de PvP</Label>
            <Select value={form.pvp_type} onValueChange={(v) => setForm({ ...form, pvp_type: v })}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pvpTypes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-foreground">Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalhes sobre o item..." className="bg-secondary border-border min-h-[80px]" />
          </div>

          <Button type="submit" disabled={createAd.isPending || !form.itemId || !form.world} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {createAd.isPending ? "Publicando..." : "Publicar Anúncio"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CriarAnuncio;
