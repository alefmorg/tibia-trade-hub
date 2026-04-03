import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useAllAdsAdmin, useDeleteAd, useUpdateAdStatus } from "@/hooks/useAds";
import { useItems, useCreateItem, useDeleteItem } from "@/hooks/useItems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Trash2, Shield, Users, BarChart3, Package, Plus, Upload, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { data: ads } = useAllAdsAdmin();
  const deleteAd = useDeleteAd();
  const updateStatus = useUpdateAdStatus();
  const { data: items } = useItems();
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"ads" | "users" | "items">("ads");
  const [newItemName, setNewItemName] = useState("");
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!user || !isAdmin) {
    navigate("/");
    return null;
  }

  const filteredAds = ads?.filter(ad => ad.title.toLowerCase().includes(search.toLowerCase())) || [];

  const stats = {
    totalAds: ads?.length || 0,
    activeAds: ads?.filter(a => a.status === "active").length || 0,
    totalUsers: profiles?.length || 0,
    totalItems: items?.length || 0,
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewItemImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    await createItem.mutateAsync({ name: newItemName.trim(), imageFile: newItemImage || undefined });
    setNewItemName("");
    setNewItemImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container py-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl">Painel Admin</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Package, label: "Total Anúncios", value: stats.totalAds, color: "text-primary" },
            { icon: BarChart3, label: "Ativos", value: stats.activeAds, color: "text-accent" },
            { icon: Users, label: "Usuários", value: stats.totalUsers, color: "text-primary" },
            { icon: Image, label: "Itens Cadastrados", value: stats.totalItems, color: "text-warning" },
          ].map((s) => (
            <div key={s.label} className="card-gaming p-4">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className={`font-pixel text-lg ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["ads", "users", "items"] as const).map((t) => (
            <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)} className={tab === t ? "bg-primary text-primary-foreground" : "border-border"}>
              {t === "ads" ? "Anúncios" : t === "users" ? "Usuários" : "Itens"}
            </Button>
          ))}
        </div>

        {tab === "ads" && (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar anúncios..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
            </div>
            <div className="card-gaming overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Título</TableHead>
                    <TableHead className="text-muted-foreground">Tipo</TableHead>
                    <TableHead className="text-muted-foreground">Preço</TableHead>
                    <TableHead className="text-muted-foreground">Mundo</TableHead>
                    <TableHead className="text-muted-foreground">Usuário</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAds.map((ad) => (
                    <TableRow key={ad.id} className="border-border">
                      <TableCell className="text-foreground font-medium">{ad.title}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded ${ad.type === "selling" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>
                          {ad.type === "selling" ? "Venda" : "Compra"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ad.price || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{ad.world}</TableCell>
                      <TableCell className="text-muted-foreground">{ad.profiles?.username || "-"}</TableCell>
                      <TableCell>
                        <Select value={ad.status} onValueChange={(v) => updateStatus.mutate({ id: ad.id, status: v })}>
                          <SelectTrigger className="w-28 h-7 text-xs bg-secondary border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="sold">Vendido</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => deleteAd.mutate(ad.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredAds.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Nenhum anúncio encontrado</p>}
            </div>
          </>
        )}

        {tab === "users" && (
          <div className="card-gaming overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Username</TableHead>
                  <TableHead className="text-muted-foreground">Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles?.map((p: any) => (
                  <TableRow key={p.id} className="border-border">
                    <TableCell className="text-foreground font-medium">{p.username}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(!profiles || profiles.length === 0) && <p className="text-center py-8 text-muted-foreground text-sm">Nenhum usuário</p>}
          </div>
        )}

        {tab === "items" && (
          <>
            {/* Add Item Form */}
            <div className="card-gaming p-6 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Adicionar Item
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs text-muted-foreground">Nome do item</Label>
                  <Input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Ex: Golden Armor" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Imagem</Label>
                  <div className="flex items-center gap-3">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <Button type="button" variant="outline" size="sm" className="border-border" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-1" />
                      {newItemImage ? "Trocar" : "Upload"}
                    </Button>
                    {imagePreview && <img src={imagePreview} alt="Preview" className="h-10 w-10 object-contain rounded border border-border" />}
                  </div>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddItem} disabled={createItem.isPending || !newItemName.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {createItem.isPending ? "Salvando..." : "Adicionar"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="card-gaming overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground w-16">Imagem</TableHead>
                    <TableHead className="text-muted-foreground">Nome</TableHead>
                    <TableHead className="text-muted-foreground">Cadastro</TableHead>
                    <TableHead className="text-muted-foreground w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map((item) => (
                    <TableRow key={item.id} className="border-border">
                      <TableCell>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-10 w-10 object-contain" />
                        ) : (
                          <div className="h-10 w-10 bg-secondary rounded flex items-center justify-center">
                            <Image className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-foreground font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(item.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => deleteItem.mutate(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!items || items.length === 0) && <p className="text-center py-8 text-muted-foreground text-sm">Nenhum item cadastrado</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
