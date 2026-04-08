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
import { Search, Trash2, Shield, Users, BarChart3, Package, Plus, Upload, Image, Star, ShieldCheck, ShieldAlert, UserCog, HandCoins, MessageCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: ads } = useAllAdsAdmin();
  const deleteAd = useDeleteAd();
  const updateStatus = useUpdateAdStatus();
  const { data: items } = useItems();
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"ads" | "users" | "items" | "offers" | "stats">("ads");
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

  const { data: userRoles } = useQuery({
    queryKey: ["admin-user-roles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: adsCountByUser } = useQuery({
    queryKey: ["admin-ads-count"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("ads").select("user_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((ad) => { counts[ad.user_id] = (counts[ad.user_id] || 0) + 1; });
      return counts;
    },
  });

  // All offers for admin
  const { data: allOffers } = useQuery({
    queryKey: ["admin-offers"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // All conversations for admin
  const { data: allConversations } = useQuery({
    queryKey: ["admin-conversations"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("conversations").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // All favorites count
  const { data: allFavorites } = useQuery({
    queryKey: ["admin-favorites"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("id");
      if (error) throw error;
      return data?.length || 0;
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data: existing } = await supabase.from("user_roles").select("id").eq("user_id", userId).single();
      if (existing) {
        const { error } = await supabase.from("user_roles").update({ role }).eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Cargo atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar cargo"),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error: adsError } = await supabase.from("ads").delete().eq("user_id", userId);
      if (adsError) throw adsError;
      const { error: favsError } = await supabase.from("favorites").delete().eq("user_id", userId);
      if (favsError) throw favsError;
      const { error: roleError } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (roleError) throw roleError;
      const { error: profileError } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-ads-count"] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast.success("Usuário removido!");
    },
    onError: () => toast.error("Erro ao remover usuário"),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase.from("ads").update({ featured }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["ads", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["user-ads"] });
      toast.success("Destaque atualizado!");
    },
  });

  const getUserRole = (userId: string): AppRole => {
    return userRoles?.find((r) => r.user_id === userId)?.role || "user";
  };

  const getProfileName = (userId: string) => {
    return profiles?.find((p: any) => p.user_id === userId)?.username || "Desconhecido";
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!user || !isAdmin) { navigate("/"); return null; }

  const filteredAds = ads?.filter(ad => ad.title.toLowerCase().includes(search.toLowerCase())) || [];
  const filteredProfiles = profiles?.filter((p: any) => p.username.toLowerCase().includes(search.toLowerCase())) || [];

  const stats = {
    totalAds: ads?.length || 0,
    activeAds: ads?.filter(a => a.status === "active").length || 0,
    featuredAds: ads?.filter(a => a.featured).length || 0,
    sellingAds: ads?.filter(a => a.type === "selling").length || 0,
    buyingAds: ads?.filter(a => a.type === "buying").length || 0,
    totalUsers: profiles?.length || 0,
    totalItems: items?.length || 0,
    totalOffers: allOffers?.length || 0,
    pendingOffers: allOffers?.filter(o => o.status === "pending").length || 0,
    totalConversations: allConversations?.length || 0,
    totalFavorites: allFavorites || 0,
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setNewItemImage(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    await createItem.mutateAsync({ name: newItemName.trim(), imageFile: newItemImage || undefined });
    setNewItemName("");
    setNewItemImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const tabs = [
    { key: "ads", label: "Anúncios", icon: Package },
    { key: "users", label: "Usuários", icon: Users },
    { key: "items", label: "Itens", icon: Image },
    { key: "offers", label: "Ofertas", icon: HandCoins },
    { key: "stats", label: "Estatísticas", icon: BarChart3 },
  ] as const;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container py-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Painel Admin</h1>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {[
            { label: "Anúncios", value: stats.totalAds, color: "text-primary" },
            { label: "Ativos", value: stats.activeAds, color: "text-accent" },
            { label: "Usuários", value: stats.totalUsers, color: "text-primary" },
            { label: "Itens", value: stats.totalItems, color: "text-warning" },
            { label: "Ofertas", value: stats.totalOffers, color: "text-destructive" },
            { label: "Conversas", value: stats.totalConversations, color: "text-muted-foreground" },
          ].map((s) => (
            <div key={s.label} className="card-gaming p-3 text-center">
              <p className={`font-pixel text-lg ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <Button key={key} size="sm" variant={tab === key ? "default" : "outline"} onClick={() => { setTab(key); setSearch(""); }} className={`gap-1.5 ${tab === key ? "bg-primary text-primary-foreground" : "border-border"}`}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>

        {/* Search */}
        {(tab === "ads" || tab === "users") && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={tab === "ads" ? "Buscar anúncios..." : "Buscar usuários..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
          </div>
        )}

        {/* ===== ADS TAB ===== */}
        {tab === "ads" && (
          <div className="card-gaming overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Img</TableHead>
                  <TableHead className="text-muted-foreground">Título</TableHead>
                  <TableHead className="text-muted-foreground">Tipo</TableHead>
                  <TableHead className="text-muted-foreground">Preço</TableHead>
                  <TableHead className="text-muted-foreground">Mundo</TableHead>
                  <TableHead className="text-muted-foreground">Usuário</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-center">⭐</TableHead>
                  <TableHead className="text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAds.map((ad) => (
                  <TableRow key={ad.id} className="border-border">
                    <TableCell>
                      {ad.image_url ? (
                        <img src={ad.image_url} alt="" className="h-8 w-8 object-contain" />
                      ) : (
                        <div className="h-8 w-8 bg-secondary rounded flex items-center justify-center">
                          <Image className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground font-medium max-w-[160px] truncate">{ad.title}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded ${ad.type === "selling" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>
                        {ad.type === "selling" ? "Venda" : "Compra"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ad.price && ad.price !== "Aceita ofertas" ? (
                        <span className="flex items-center gap-1">
                          <img src={`/icons/${ad.currency || "kk"}.png`} alt="" className="w-4 h-4 object-contain" />
                          {ad.price}
                        </span>
                      ) : (
                        <span className="text-warning text-xs">Ofertas</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{ad.world}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{ad.profiles?.username || "-"}</TableCell>
                    <TableCell>
                      <Select value={ad.status} onValueChange={(v) => updateStatus.mutate({ id: ad.id, status: v })}>
                        <SelectTrigger className="w-24 h-7 text-xs bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                          <SelectItem value="sold">Vendido</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => toggleFeatured.mutate({ id: ad.id, featured: !ad.featured })}
                        className={`transition-colors ${ad.featured ? "text-warning" : "text-muted-foreground/40 hover:text-warning/60"}`}
                      >
                        <Star className={`h-4 w-4 ${ad.featured ? "fill-warning" : ""}`} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => {
                        if (!confirm("Remover este anúncio?")) return;
                        deleteAd.mutate(ad.id);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredAds.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Nenhum anúncio encontrado</p>}
          </div>
        )}

        {/* ===== USERS TAB ===== */}
        {tab === "users" && (
          <div className="card-gaming overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Avatar</TableHead>
                  <TableHead className="text-muted-foreground">Username</TableHead>
                  <TableHead className="text-muted-foreground">Anúncios</TableHead>
                  <TableHead className="text-muted-foreground">Cargo</TableHead>
                  <TableHead className="text-muted-foreground">Cadastro</TableHead>
                  <TableHead className="text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((p: any) => {
                  const currentRole = getUserRole(p.user_id);
                  const adsCount = adsCountByUser?.[p.user_id] || 0;
                  const isCurrentUser = p.user_id === user?.id;
                  return (
                    <TableRow key={p.id} className="border-border">
                      <TableCell>
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt={p.username} className="h-8 w-8 object-cover rounded-full" />
                          ) : (
                            <span className="text-primary text-xs font-bold">{p.username?.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        <div className="flex items-center gap-2">
                          {p.username}
                          {currentRole === "admin" && <ShieldCheck className="h-4 w-4 text-primary" />}
                          {currentRole === "moderator" && <ShieldAlert className="h-4 w-4 text-warning" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded ${adsCount > 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {adsCount} anúncio{adsCount !== 1 ? "s" : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select value={currentRole} onValueChange={(v) => updateUserRole.mutate({ userId: p.user_id, role: v as AppRole })} disabled={isCurrentUser}>
                          <SelectTrigger className="w-28 h-7 text-xs bg-secondary border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <span className="flex items-center gap-1"><UserCog className="h-3 w-3" /> Usuário</span>
                            </SelectItem>
                            <SelectItem value="moderator">
                              <span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3 text-warning" /> Moderador</span>
                            </SelectItem>
                            <SelectItem value="admin">
                              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-primary" /> Admin</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => navigate(`/perfil/${p.user_id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!isCurrentUser && (
                            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => {
                              if (!confirm(`Remover "${p.username}" e todos os seus dados?`)) return;
                              deleteUser.mutate(p.user_id);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredProfiles.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Nenhum usuário encontrado</p>}
          </div>
        )}

        {/* ===== ITEMS TAB ===== */}
        {tab === "items" && (
          <>
            <div className="card-gaming p-6 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" /> Adicionar Item
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
                      <Upload className="h-4 w-4 mr-1" /> {newItemImage ? "Trocar" : "Upload"}
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
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => {
                          if (!confirm(`Remover item "${item.name}"?`)) return;
                          deleteItem.mutate(item.id);
                        }}>
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

        {/* ===== OFFERS TAB ===== */}
        {tab === "offers" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="card-gaming p-3 text-center">
                <p className="font-pixel text-lg text-warning">{stats.pendingOffers}</p>
                <p className="text-[10px] text-muted-foreground">Pendentes</p>
              </div>
              <div className="card-gaming p-3 text-center">
                <p className="font-pixel text-lg text-accent">{allOffers?.filter(o => o.status === "accepted").length || 0}</p>
                <p className="text-[10px] text-muted-foreground">Aceitas</p>
              </div>
              <div className="card-gaming p-3 text-center">
                <p className="font-pixel text-lg text-destructive">{allOffers?.filter(o => o.status === "rejected").length || 0}</p>
                <p className="text-[10px] text-muted-foreground">Recusadas</p>
              </div>
            </div>

            <div className="card-gaming overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Remetente</TableHead>
                    <TableHead className="text-muted-foreground">Anúncio ID</TableHead>
                    <TableHead className="text-muted-foreground">Valor</TableHead>
                    <TableHead className="text-muted-foreground">Mensagem</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allOffers?.map((offer) => {
                    const ad = ads?.find(a => a.id === offer.ad_id);
                    return (
                      <TableRow key={offer.id} className="border-border">
                        <TableCell className="text-foreground text-xs">{getProfileName(offer.sender_id)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-[120px] truncate">{ad?.title || offer.ad_id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-foreground text-xs">
                            <img src={`/icons/${offer.currency}.png`} alt="" className="w-4 h-4 object-contain" />
                            {offer.amount}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-[140px] truncate">{offer.message || "-"}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            offer.status === "pending" ? "bg-warning/20 text-warning" :
                            offer.status === "accepted" ? "bg-accent/20 text-accent" :
                            "bg-destructive/20 text-destructive"
                          }`}>
                            {offer.status === "pending" ? "Pendente" : offer.status === "accepted" ? "Aceita" : "Recusada"}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{new Date(offer.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {(!allOffers || allOffers.length === 0) && <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma oferta encontrada</p>}
            </div>
          </div>
        )}

        {/* ===== STATS TAB ===== */}
        {tab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Anúncios", value: stats.totalAds, sub: `${stats.activeAds} ativos`, color: "text-primary" },
                { label: "Destaques", value: stats.featuredAds, sub: "anúncios", color: "text-warning" },
                { label: "Vendas", value: stats.sellingAds, sub: "anúncios de venda", color: "text-destructive" },
                { label: "Compras", value: stats.buyingAds, sub: "anúncios de compra", color: "text-primary" },
                { label: "Usuários", value: stats.totalUsers, sub: "registrados", color: "text-accent" },
                { label: "Itens", value: stats.totalItems, sub: "cadastrados", color: "text-warning" },
                { label: "Ofertas", value: stats.totalOffers, sub: `${stats.pendingOffers} pendentes`, color: "text-destructive" },
                { label: "Favoritos", value: stats.totalFavorites, sub: "total de curtidas", color: "text-primary" },
                { label: "Conversas", value: stats.totalConversations, sub: "abertas", color: "text-muted-foreground" },
              ].map((s) => (
                <div key={s.label} className="card-gaming p-4">
                  <p className={`font-pixel text-2xl ${s.color}`}>{s.value}</p>
                  <p className="text-sm text-foreground font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Top users by ads */}
            <div className="card-gaming p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Top Anunciantes</h3>
              <div className="space-y-2">
                {Object.entries(adsCountByUser || {})
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([userId, count], i) => (
                    <div key={userId} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs w-5">{i + 1}.</span>
                        <span className="text-foreground">{getProfileName(userId)}</span>
                      </span>
                      <span className="text-primary font-medium">{count}</span>
                    </div>
                  ))}
                {!adsCountByUser || Object.keys(adsCountByUser).length === 0 && (
                  <p className="text-muted-foreground text-xs text-center py-4">Sem dados</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
