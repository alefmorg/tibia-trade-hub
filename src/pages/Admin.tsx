import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useAllAdsAdmin, useDeleteAd } from "@/hooks/useAds";
import { useItems, useCreateItem, useDeleteItem } from "@/hooks/useItems";
import { useAdminData, type AdStatus, type AppRole, type OfferStatus } from "@/hooks/useAdmin";
import { useNavLinks, useSiteBanners, useNavLinksMutations, useBannerMutations, type NavLink, type SiteBanner } from "@/hooks/useSiteConfig";
import { useFilterOptions, useFilterOptionsMutations, type FilterOption } from "@/hooks/useFilterOptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ItemCombobox from "@/components/ItemCombobox";
import { rubinotWorlds } from "@/lib/tibia-worlds";
import {
  Ban, BarChart3, Check, ChevronDown, ChevronUp, Eye, Filter, HandCoins, Image, Link2, MessageCircle,
  Megaphone, Package, Plus, Search, Shield, ShieldAlert, ShieldCheck, Star, Trash2, Upload, UserCog, Users, X,
} from "lucide-react";

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { data: ads } = useAllAdsAdmin();
  const deleteAd = useDeleteAd();
  const { data: items } = useItems();
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"ads" | "users" | "items" | "offers" | "conversations" | "stats" | "create-ad" | "nav-links" | "banners" | "filters">("ads");
  const [newItemName, setNewItemName] = useState("");
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  const [adDurationDays, setAdDurationDays] = useState("7");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Create ad form
  const [adForm, setAdForm] = useState({
    itemId: "", type: "selling", price: "", currency: "kk",
    world: "", pvp_type: "Optional PvP", category: "item",
    description: "", acceptOffers: false, tier: "", userId: "",
  });

  const {
    profiles, userRoles, tradeSettings, adsCountByUser,
    allOffers, allConversations, allFavorites,
    updateAdStatus, toggleFeatured, updateUserRole, banUser, deleteUser,
    updateTradeSettings, updateOfferStatus, deleteOffer, deleteConversation,
    getConversationMessages, createAdAdmin,
  } = useAdminData(isAdmin);

  const { data: navLinks } = useNavLinks();
  const { data: siteBanners } = useSiteBanners();
  const navLinksMut = useNavLinksMutations();
  const bannerMut = useBannerMutations();

  // Filter options
  const { data: filterOptions } = useFilterOptions();
  const filterMut = useFilterOptionsMutations();
  const [foForm, setFoForm] = useState({ filter_group: "", label: "", value: "", sort_order: "0" });
  const [editingFo, setEditingFo] = useState<string | null>(null);

  // Nav link form
  const [nlForm, setNlForm] = useState({ label: "", url: "", color: "#3B82F6", icon_url: "", sort_order: "0" });
  const [editingNl, setEditingNl] = useState<string | null>(null);

  // Banner form
  const [bnForm, setBnForm] = useState({ title: "", image_url: "", link_url: "", sort_order: "0" });
  const [editingBn, setEditingBn] = useState<string | null>(null);

  useEffect(() => {
    if (tradeSettings?.ad_duration_days) setAdDurationDays(String(tradeSettings.ad_duration_days));
  }, [tradeSettings]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [loading, user, isAdmin, navigate]);

  const getUserRole = (userId: string): AppRole => userRoles.find((r) => r.user_id === userId)?.role || "user";
  const getProfileName = (userId: string) => profiles.find((p) => p.user_id === userId)?.username || "Desconhecido";
  const getAdTitle = (adId: string) => ads?.find((ad) => ad.id === adId)?.title || adId.slice(0, 8);
  const isUserBanned = (userId: string) => (profiles.find((p) => p.user_id === userId) as any)?.banned === true;

  if (loading || !user || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;
  }

  const searchTerm = search.toLowerCase();
  const filteredAds = (ads || []).filter((ad) => `${ad.title} ${ad.profiles?.username || ""} ${ad.world}`.toLowerCase().includes(searchTerm));
  const filteredProfiles = profiles.filter((p) => p.username.toLowerCase().includes(searchTerm));
  const filteredOffers = allOffers.filter((o) => `${getProfileName(o.sender_id)} ${getAdTitle(o.ad_id)} ${o.amount} ${o.status}`.toLowerCase().includes(searchTerm));
  const filteredConversations = allConversations.filter((c) => `${getAdTitle(c.ad_id)} ${getProfileName(c.buyer_id)} ${getProfileName(c.seller_id)}`.toLowerCase().includes(searchTerm));

  const stats = {
    totalAds: ads?.length || 0, activeAds: ads?.filter((a) => a.status === "active").length || 0,
    featuredAds: ads?.filter((a) => a.featured).length || 0,
    sellingAds: ads?.filter((a) => a.type === "selling").length || 0,
    buyingAds: ads?.filter((a) => a.type === "buying").length || 0,
    totalUsers: profiles.length, totalItems: items?.length || 0,
    totalOffers: allOffers.length, pendingOffers: allOffers.filter((o) => o.status === "pending").length,
    totalConversations: allConversations.length, totalFavorites: allFavorites || 0,
    bannedUsers: profiles.filter((p) => (p as any).banned).length,
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setNewItemImage(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    await createItem.mutateAsync({ name: newItemName.trim(), imageFile: newItemImage || undefined });
    setNewItemName(""); setNewItemImage(null); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExpandConversation = async (convId: string) => {
    if (expandedConversation === convId) { setExpandedConversation(null); return; }
    setLoadingMessages(true);
    try {
      const msgs = await getConversationMessages(convId);
      setConversationMessages(msgs || []);
      setExpandedConversation(convId);
    } catch { setConversationMessages([]); }
    setLoadingMessages(false);
  };

  const handleWorldChange = (worldName: string) => {
    const world = rubinotWorlds.find((w) => w.name === worldName);
    setAdForm({ ...adForm, world: worldName, pvp_type: world?.pvp || adForm.pvp_type });
  };

  const selectedItem = items?.find((i) => i.id === adForm.itemId);

  const handleCreateAd = async () => {
    if (!selectedItem || !adForm.world) return;
    await createAdAdmin.mutateAsync({
      title: selectedItem.name, item_id: selectedItem.id, type: adForm.type,
      price: adForm.acceptOffers ? "Aceita ofertas" : adForm.price,
      currency: adForm.currency, world: adForm.world, pvp_type: adForm.pvp_type,
      category: adForm.category, description: adForm.description || undefined,
      image_url: selectedItem.image_url || undefined,
      tier: adForm.tier && adForm.tier !== "none" ? Number(adForm.tier) : null,
      user_id: adForm.userId || user.id,
    });
    setAdForm({ itemId: "", type: "selling", price: "", currency: "kk", world: "", pvp_type: "Optional PvP", category: "item", description: "", acceptOffers: false, tier: "", userId: "" });
  };

  const tabs = [
    { key: "ads", label: "Anúncios", icon: Package },
    { key: "users", label: "Usuários", icon: Users },
    { key: "items", label: "Itens", icon: Image },
    { key: "offers", label: "Ofertas", icon: HandCoins },
    { key: "conversations", label: "Conversas", icon: MessageCircle },
    { key: "nav-links", label: "Links Nav", icon: Link2 },
    { key: "banners", label: "Banners", icon: Megaphone },
    { key: "create-ad", label: "Criar Anúncio", icon: Plus },
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3 mb-8">
          {[
            { label: "Anúncios", value: stats.totalAds, color: "text-primary" },
            { label: "Ativos", value: stats.activeAds, color: "text-accent" },
            { label: "Usuários", value: stats.totalUsers, color: "text-primary" },
            { label: "Banidos", value: stats.bannedUsers, color: "text-destructive" },
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

        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <Button key={key} size="sm" variant={tab === key ? "default" : "outline"}
              onClick={() => { setTab(key); setSearch(""); }}
              className={`gap-1.5 ${tab === key ? "bg-primary text-primary-foreground" : "border-border"}`}>
              <Icon className="h-3.5 w-3.5" />{label}
            </Button>
          ))}
        </div>

        {["ads", "users", "offers", "conversations"].includes(tab) && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
          </div>
        )}

        {/* Settings card */}
        <div className="card-gaming p-4 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Duração padrão dos anúncios</p>
              <p className="text-xs text-muted-foreground">Todo novo card expira automaticamente após esse período.</p>
            </div>
            <div className="flex items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Dias</Label>
                <Input type="number" min="1" max="365" value={adDurationDays} onChange={(e) => setAdDurationDays(e.target.value)} className="w-24 bg-secondary border-border" />
              </div>
              <Button onClick={() => updateTradeSettings.mutate(Number(adDurationDays))} disabled={updateTradeSettings.isPending || !adDurationDays} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {updateTradeSettings.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>

        {/* ADS TAB */}
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
                  <TableHead className="text-muted-foreground">Expira</TableHead>
                  <TableHead className="text-muted-foreground text-center">⭐</TableHead>
                  <TableHead className="text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAds.map((ad) => (
                  <TableRow key={ad.id} className="border-border">
                    <TableCell>
                      {ad.image_url ? <img src={ad.image_url} alt="" className="h-8 w-8 object-contain" /> : <div className="h-8 w-8 bg-secondary rounded flex items-center justify-center"><Image className="h-3 w-3 text-muted-foreground" /></div>}
                    </TableCell>
                    <TableCell className="text-foreground font-medium max-w-[160px] truncate">{ad.title}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded ${ad.type === "selling" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>
                        {ad.type === "selling" ? "Venda" : "Compra"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ad.price && ad.price !== "Aceita ofertas" ? (
                        <span className="flex items-center gap-1"><img src={`/icons/${ad.currency || "kk"}.png`} alt="" className="w-4 h-4 object-contain" />{ad.price}</span>
                      ) : <span className="text-warning text-xs">Ofertas</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{ad.world}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{ad.profiles?.username || "-"}</TableCell>
                    <TableCell>
                      <Select value={ad.status} onValueChange={(v) => updateAdStatus.mutate({ id: ad.id, status: v as AdStatus })}>
                        <SelectTrigger className="w-24 h-7 text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                          <SelectItem value="sold">Vendido</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{ad.expires_at ? new Date(ad.expires_at).toLocaleDateString("pt-BR") : "Sem prazo"}</TableCell>
                    <TableCell className="text-center">
                      <button onClick={() => toggleFeatured.mutate({ id: ad.id, featured: !ad.featured })}
                        className={`transition-colors ${ad.featured ? "text-warning" : "text-muted-foreground/40 hover:text-warning/60"}`}>
                        <Star className={`h-4 w-4 ${ad.featured ? "fill-warning" : ""}`} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                        onClick={() => { if (confirm("Remover este anúncio?")) deleteAd.mutate(ad.id); }}>
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

        {/* USERS TAB */}
        {tab === "users" && (
          <div className="card-gaming overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Avatar</TableHead>
                  <TableHead className="text-muted-foreground">Username</TableHead>
                  <TableHead className="text-muted-foreground">Anúncios</TableHead>
                  <TableHead className="text-muted-foreground">Cargo</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Cadastro</TableHead>
                  <TableHead className="text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => {
                  const currentRole = getUserRole(profile.user_id);
                  const adsCount = adsCountByUser[profile.user_id] || 0;
                  const isCurrentUser = profile.user_id === user.id;
                  const banned = isUserBanned(profile.user_id);

                  return (
                    <TableRow key={profile.id} className={`border-border ${banned ? "opacity-60 bg-destructive/5" : ""}`}>
                      <TableCell>
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.username} className="h-8 w-8 object-cover rounded-full" /> :
                            <span className="text-primary text-xs font-bold">{profile.username?.charAt(0).toUpperCase()}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        <div className="flex items-center gap-2">
                          {profile.username}
                          {currentRole === "admin" && <ShieldCheck className="h-4 w-4 text-primary" />}
                          {currentRole === "moderator" && <ShieldAlert className="h-4 w-4 text-warning" />}
                          {banned && <Ban className="h-4 w-4 text-destructive" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded ${adsCount > 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {adsCount} anúncio{adsCount !== 1 ? "s" : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select value={currentRole} onValueChange={(v) => updateUserRole.mutate({ userId: profile.user_id, role: v as AppRole })} disabled={isCurrentUser}>
                          <SelectTrigger className="w-28 h-7 text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user"><span className="flex items-center gap-1"><UserCog className="h-3 w-3" /> Usuário</span></SelectItem>
                            <SelectItem value="moderator"><span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3 text-warning" /> Moderador</span></SelectItem>
                            <SelectItem value="admin"><span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-primary" /> Admin</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {banned ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive">Banido</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">Ativo</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(profile.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => navigate(`/perfil/${profile.user_id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!isCurrentUser && (
                            <>
                              <Button size="sm" variant="ghost" className={banned ? "text-accent hover:bg-accent/10" : "text-warning hover:bg-warning/10"}
                                onClick={() => banUser.mutate({ userId: profile.user_id, banned: !banned })}
                                title={banned ? "Desbanir" : "Banir"}>
                                <Ban className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                                onClick={() => { if (confirm(`Remover "${profile.username}" e todos os seus dados?`)) deleteUser.mutate(profile.user_id); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
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

        {/* ITEMS TAB */}
        {tab === "items" && (
          <>
            <div className="card-gaming p-6 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Adicionar Item</h3>
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
                        {item.image_url ? <img src={item.image_url} alt={item.name} className="h-10 w-10 object-contain" /> :
                          <div className="h-10 w-10 bg-secondary rounded flex items-center justify-center"><Image className="h-4 w-4 text-muted-foreground" /></div>}
                      </TableCell>
                      <TableCell className="text-foreground font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(item.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                          onClick={() => { if (confirm(`Remover item "${item.name}"?`)) deleteItem.mutate(item.id); }}>
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

        {/* OFFERS TAB */}
        {tab === "offers" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="card-gaming p-3 text-center"><p className="font-pixel text-lg text-warning">{stats.pendingOffers}</p><p className="text-[10px] text-muted-foreground">Pendentes</p></div>
              <div className="card-gaming p-3 text-center"><p className="font-pixel text-lg text-accent">{allOffers.filter((o) => o.status === "accepted").length}</p><p className="text-[10px] text-muted-foreground">Aceitas</p></div>
              <div className="card-gaming p-3 text-center"><p className="font-pixel text-lg text-destructive">{allOffers.filter((o) => o.status === "rejected").length}</p><p className="text-[10px] text-muted-foreground">Recusadas</p></div>
            </div>
            <div className="card-gaming overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Remetente</TableHead>
                    <TableHead className="text-muted-foreground">Anúncio</TableHead>
                    <TableHead className="text-muted-foreground">Valor</TableHead>
                    <TableHead className="text-muted-foreground">Mensagem</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Data</TableHead>
                    <TableHead className="text-muted-foreground">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOffers.map((offer) => (
                    <TableRow key={offer.id} className="border-border">
                      <TableCell className="text-foreground text-xs">{getProfileName(offer.sender_id)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[140px] truncate">{getAdTitle(offer.ad_id)}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-foreground text-xs">
                          <img src={`/icons/${offer.currency}.png`} alt="" className="w-4 h-4 object-contain" />{offer.amount}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[160px] truncate">{offer.message || "-"}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded ${offer.status === "pending" ? "bg-warning/20 text-warning" : offer.status === "accepted" ? "bg-accent/20 text-accent" : "bg-destructive/20 text-destructive"}`}>
                          {offer.status === "pending" ? "Pendente" : offer.status === "accepted" ? "Aceita" : "Recusada"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(offer.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {offer.status === "pending" && (
                            <>
                              <Button size="sm" variant="ghost" className="text-accent hover:bg-accent/10" onClick={() => updateOfferStatus.mutate({ offerId: offer.id, status: "accepted" as OfferStatus })}><Check className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" className="text-warning hover:bg-warning/10" onClick={() => updateOfferStatus.mutate({ offerId: offer.id, status: "rejected" as OfferStatus })}><X className="h-4 w-4" /></Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                            onClick={() => { if (confirm("Remover esta oferta?")) deleteOffer.mutate(offer.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredOffers.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma oferta encontrada</p>}
            </div>
          </div>
        )}

        {/* CONVERSATIONS TAB */}
        {tab === "conversations" && (
          <div className="space-y-2">
            {filteredConversations.map((conv) => (
              <div key={conv.id} className="card-gaming overflow-hidden">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30" onClick={() => handleExpandConversation(conv.id)}>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-foreground font-medium">{getAdTitle(conv.ad_id)}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground">{getProfileName(conv.buyer_id)} ↔ {getProfileName(conv.seller_id)}</span>
                    <span className="text-muted-foreground text-xs">{new Date(conv.updated_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedConversation === conv.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                      onClick={(e) => { e.stopPropagation(); if (confirm("Remover esta conversa e suas mensagens?")) deleteConversation.mutate(conv.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {expandedConversation === conv.id && (
                  <div className="border-t border-border p-4 bg-secondary/20 max-h-80 overflow-y-auto">
                    {loadingMessages ? <p className="text-muted-foreground text-xs text-center py-4">Carregando...</p> :
                      conversationMessages.length === 0 ? <p className="text-muted-foreground text-xs text-center py-4">Nenhuma mensagem</p> :
                        <div className="space-y-2">
                          {conversationMessages.map((msg: any) => (
                            <div key={msg.id} className="flex gap-2 text-xs">
                              <span className="text-primary font-medium whitespace-nowrap">{getProfileName(msg.sender_id)}:</span>
                              <span className="text-foreground">{msg.content}</span>
                              <span className="text-muted-foreground ml-auto whitespace-nowrap">{new Date(msg.created_at).toLocaleString("pt-BR")}</span>
                            </div>
                          ))}
                        </div>}
                  </div>
                )}
              </div>
            ))}
            {filteredConversations.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma conversa encontrada</p>}
          </div>
        )}

        {/* CREATE AD TAB */}
        {tab === "create-ad" && (
          <div className="card-gaming p-6 max-w-lg">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Criar Anúncio (Admin)</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Criar em nome de (opcional)</Label>
                <Select value={adForm.userId || "self"} onValueChange={(v) => setAdForm({ ...adForm, userId: v === "self" ? "" : v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Você mesmo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Você mesmo (Admin)</SelectItem>
                    {profiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.username}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Item</Label>
                <ItemCombobox items={items || []} value={adForm.itemId} onSelect={(id) => setAdForm({ ...adForm, itemId: id })} />
                {selectedItem?.image_url && <div className="flex justify-center pt-2"><img src={selectedItem.image_url} alt={selectedItem.name} className="h-16 w-16 object-contain" /></div>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Tier do Item</Label>
                <Select value={adForm.tier} onValueChange={(v) => setAdForm({ ...adForm, tier: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione o tier (opcional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem tier</SelectItem>
                    {[0,1,2,3,4,5,6,7,8,9,10].map((t) => <SelectItem key={t} value={String(t)}>Tier {t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Tipo</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant={adForm.type === "selling" ? "default" : "outline"} onClick={() => setAdForm({ ...adForm, type: "selling" })}>Vendendo</Button>
                  <Button type="button" size="sm" variant={adForm.type === "buying" ? "default" : "outline"} onClick={() => setAdForm({ ...adForm, type: "buying" })}>Comprando</Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-foreground">Preço</Label>
                  <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Aceita ofertas</span><Switch checked={adForm.acceptOffers} onCheckedChange={(v) => setAdForm({ ...adForm, acceptOffers: v })} /></div>
                </div>
                {!adForm.acceptOffers && (
                  <div className="flex gap-2">
                    <Input value={adForm.price} onChange={(e) => setAdForm({ ...adForm, price: e.target.value })} placeholder="Ex: 15" className="bg-secondary border-border flex-1" />
                    <Select value={adForm.currency} onValueChange={(v) => setAdForm({ ...adForm, currency: v })}>
                      <SelectTrigger className="w-28 bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kk"><span className="flex items-center gap-2"><img src="/icons/kk.png" alt="kk" className="w-4 h-4 object-contain" />kk</span></SelectItem>
                        <SelectItem value="coins"><span className="flex items-center gap-2"><img src="/icons/coins.png" alt="coins" className="w-4 h-4 object-contain" />coins</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Mundo</Label>
                <Select value={adForm.world} onValueChange={handleWorldChange}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione o mundo" /></SelectTrigger>
                  <SelectContent>
                    {rubinotWorlds.map((w) => <SelectItem key={w.name} value={w.name}>{w.name} ({w.pvp})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Descrição</Label>
                <Textarea value={adForm.description} onChange={(e) => setAdForm({ ...adForm, description: e.target.value })} placeholder="Detalhes..." className="bg-secondary border-border min-h-[80px]" />
              </div>
              <Button onClick={handleCreateAd} disabled={createAdAdmin.isPending || !adForm.itemId || !adForm.world} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {createAdAdmin.isPending ? "Criando..." : "Criar Anúncio"}
              </Button>
            </div>
          </div>
        )}

        {/* NAV LINKS TAB */}
        {tab === "nav-links" && (
          <div className="space-y-6">
            <div className="card-gaming p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" /> {editingNl ? "Editar Link" : "Adicionar Link"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Label</Label>
                  <Input value={nlForm.label} onChange={(e) => setNlForm({ ...nlForm, label: e.target.value })} placeholder="Ex: Anúncios" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">URL</Label>
                  <Input value={nlForm.url} onChange={(e) => setNlForm({ ...nlForm, url: e.target.value })} placeholder="https://..." className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Cor (hex)</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={nlForm.color} onChange={(e) => setNlForm({ ...nlForm, color: e.target.value })} className="w-10 h-10 rounded border border-border cursor-pointer" />
                    <Input value={nlForm.color} onChange={(e) => setNlForm({ ...nlForm, color: e.target.value })} className="bg-secondary border-border flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">URL do ícone (opcional)</Label>
                  <Input value={nlForm.icon_url} onChange={(e) => setNlForm({ ...nlForm, icon_url: e.target.value })} placeholder="https://...icon.png" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Ordem</Label>
                  <Input type="number" value={nlForm.sort_order} onChange={(e) => setNlForm({ ...nlForm, sort_order: e.target.value })} className="bg-secondary border-border w-24" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => {
                    if (editingNl) {
                      navLinksMut.update.mutate({ id: editingNl, label: nlForm.label, url: nlForm.url, color: nlForm.color, icon_url: nlForm.icon_url || null, sort_order: Number(nlForm.sort_order) });
                      setEditingNl(null);
                    } else {
                      navLinksMut.create.mutate({ label: nlForm.label, url: nlForm.url, color: nlForm.color, icon_url: nlForm.icon_url || null, sort_order: Number(nlForm.sort_order), active: true });
                    }
                    setNlForm({ label: "", url: "", color: "#3B82F6", icon_url: "", sort_order: "0" });
                  }}
                  disabled={!nlForm.label || !nlForm.url}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {editingNl ? "Salvar" : "Adicionar"}
                </Button>
                {editingNl && (
                  <Button variant="outline" onClick={() => { setEditingNl(null); setNlForm({ label: "", url: "", color: "#3B82F6", icon_url: "", sort_order: "0" }); }}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            <div className="card-gaming overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Preview</TableHead>
                    <TableHead className="text-muted-foreground">Label</TableHead>
                    <TableHead className="text-muted-foreground">URL</TableHead>
                    <TableHead className="text-muted-foreground">Ordem</TableHead>
                    <TableHead className="text-muted-foreground">Ativo</TableHead>
                    <TableHead className="text-muted-foreground">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(navLinks || []).map((link) => (
                    <TableRow key={link.id} className="border-border">
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: link.color }}>
                          {link.icon_url && <img src={link.icon_url} alt="" className="w-4 h-4 object-contain" />}
                          {link.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground text-sm">{link.label}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{link.url}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{link.sort_order}</TableCell>
                      <TableCell>
                        <Switch checked={link.active} onCheckedChange={(v) => navLinksMut.update.mutate({ id: link.id, active: v })} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10"
                            onClick={() => { setEditingNl(link.id); setNlForm({ label: link.label, url: link.url, color: link.color, icon_url: link.icon_url || "", sort_order: String(link.sort_order) }); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                            onClick={() => { if (confirm("Remover este link?")) navLinksMut.remove.mutate(link.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!navLinks || navLinks.length === 0) && <p className="text-center py-8 text-muted-foreground text-sm">Nenhum link cadastrado</p>}
            </div>
          </div>
        )}

        {/* BANNERS TAB */}
        {tab === "banners" && (
          <div className="space-y-6">
            <div className="card-gaming p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" /> {editingBn ? "Editar Banner" : "Adicionar Banner"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Título (fallback se sem imagem)</Label>
                  <Input value={bnForm.title} onChange={(e) => setBnForm({ ...bnForm, title: e.target.value })} placeholder="Ex: Promoção especial" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">URL da imagem do banner</Label>
                  <Input value={bnForm.image_url} onChange={(e) => setBnForm({ ...bnForm, image_url: e.target.value })} placeholder="https://...banner.png" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">URL de destino (clique)</Label>
                  <Input value={bnForm.link_url} onChange={(e) => setBnForm({ ...bnForm, link_url: e.target.value })} placeholder="https://..." className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Ordem</Label>
                  <Input type="number" value={bnForm.sort_order} onChange={(e) => setBnForm({ ...bnForm, sort_order: e.target.value })} className="bg-secondary border-border w-24" />
                </div>
              </div>
              {bnForm.image_url && (
                <div className="mt-4 p-2 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <img src={bnForm.image_url} alt="Preview" className="w-full max-h-24 object-cover rounded" />
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => {
                    if (editingBn) {
                      bannerMut.update.mutate({ id: editingBn, title: bnForm.title || null, image_url: bnForm.image_url || null, link_url: bnForm.link_url || null, sort_order: Number(bnForm.sort_order) });
                      setEditingBn(null);
                    } else {
                      bannerMut.create.mutate({ title: bnForm.title || null, image_url: bnForm.image_url || null, link_url: bnForm.link_url || null, sort_order: Number(bnForm.sort_order), active: true });
                    }
                    setBnForm({ title: "", image_url: "", link_url: "", sort_order: "0" });
                  }}
                  disabled={!bnForm.title && !bnForm.image_url}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {editingBn ? "Salvar" : "Adicionar"}
                </Button>
                {editingBn && (
                  <Button variant="outline" onClick={() => { setEditingBn(null); setBnForm({ title: "", image_url: "", link_url: "", sort_order: "0" }); }}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            <div className="card-gaming overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Preview</TableHead>
                    <TableHead className="text-muted-foreground">Título</TableHead>
                    <TableHead className="text-muted-foreground">Link</TableHead>
                    <TableHead className="text-muted-foreground">Ordem</TableHead>
                    <TableHead className="text-muted-foreground">Ativo</TableHead>
                    <TableHead className="text-muted-foreground">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(siteBanners || []).map((banner) => (
                    <TableRow key={banner.id} className="border-border">
                      <TableCell>
                        {banner.image_url ? (
                          <img src={banner.image_url} alt="" className="h-10 w-24 object-cover rounded" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem imagem</span>
                        )}
                      </TableCell>
                      <TableCell className="text-foreground text-sm">{banner.title || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{banner.link_url || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{banner.sort_order}</TableCell>
                      <TableCell>
                        <Switch checked={banner.active} onCheckedChange={(v) => bannerMut.update.mutate({ id: banner.id, active: v })} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10"
                            onClick={() => { setEditingBn(banner.id); setBnForm({ title: banner.title || "", image_url: banner.image_url || "", link_url: banner.link_url || "", sort_order: String(banner.sort_order) }); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                            onClick={() => { if (confirm("Remover este banner?")) bannerMut.remove.mutate(banner.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!siteBanners || siteBanners.length === 0) && <p className="text-center py-8 text-muted-foreground text-sm">Nenhum banner cadastrado</p>}
            </div>
          </div>
        )}


        {tab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Anúncios", value: stats.totalAds, sub: `${stats.activeAds} ativos`, color: "text-primary" },
                { label: "Destaques", value: stats.featuredAds, sub: "anúncios", color: "text-warning" },
                { label: "Vendas", value: stats.sellingAds, sub: "anúncios de venda", color: "text-destructive" },
                { label: "Compras", value: stats.buyingAds, sub: "anúncios de compra", color: "text-primary" },
                { label: "Usuários", value: stats.totalUsers, sub: "registrados", color: "text-accent" },
                { label: "Banidos", value: stats.bannedUsers, sub: "usuários", color: "text-destructive" },
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
            <div className="card-gaming p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Top Anunciantes</h3>
              <div className="space-y-2">
                {Object.entries(adsCountByUser as Record<string, number>).sort(([, a], [, b]) => b - a).slice(0, 10).map(([userId, count], i) => (
                  <div key={userId} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><span className="text-muted-foreground text-xs w-5">{i + 1}.</span><span className="text-foreground">{getProfileName(userId)}</span></span>
                    <span className="text-primary font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(adsCountByUser || {}).length === 0 && <p className="text-muted-foreground text-xs text-center py-4">Sem dados</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
