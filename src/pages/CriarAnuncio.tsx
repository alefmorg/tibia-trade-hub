import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CriarAnuncio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "selling",
    price: "",
    world: "",
    description: "",
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Save to database
    toast.success("Anúncio criado com sucesso!");
    setTimeout(() => navigate("/anuncios"), 1000);
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container py-8 max-w-lg">
        <h1 className="text-xl mb-6">Criar Anúncio</h1>

        <form onSubmit={handleSubmit} className="card-gaming p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Título do item</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Golden Armor" required className="bg-secondary border-border" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-foreground">Tipo</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={form.type === "selling" ? "default" : "outline"} className={form.type === "selling" ? "bg-primary text-primary-foreground" : "border-border"} onClick={() => setForm({ ...form, type: "selling" })}>
                Vendendo
              </Button>
              <Button type="button" size="sm" variant={form.type === "buying" ? "default" : "outline"} className={form.type === "buying" ? "bg-warning text-warning-foreground" : "border-border"} onClick={() => setForm({ ...form, type: "buying" })}>
                Comprando
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-foreground">Preço (gp)</Label>
            <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Ex: 15.000.000 ou Aceita ofertas" className="bg-secondary border-border" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-foreground">Mundo</Label>
            <Input value={form.world} onChange={(e) => setForm({ ...form, world: e.target.value })} placeholder="Ex: Gentebra" required className="bg-secondary border-border" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-foreground">Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalhes sobre o item..." className="bg-secondary border-border min-h-[80px]" />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? "Publicando..." : "Publicar Anúncio"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CriarAnuncio;
