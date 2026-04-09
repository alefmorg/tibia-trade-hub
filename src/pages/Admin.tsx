import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useAllAdsAdmin, useDeleteAd } from "@/hooks/useAds";
import { useItems, useCreateItem, useDeleteItem } from "@/hooks/useItems";
import { useAdminData, type AdStatus, type AppRole, type OfferStatus } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart3,
  Check,
  Eye,
  HandCoins,
  Image,
  MessageCircle,
  Package,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  UserCog,
  Users,
  X,
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
  const [tab, setTab] = useState<"ads" | "users" | "items" | "offers" | "conversations" | "stats">("ads");
  const [newItemName, setNewItemName] = useState("");
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  const [adDurationDays, setAdDurationDays] = useState("7");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    profiles,
    userRoles,
    tradeSettings,
    adsCountByUser,
    allOffers,
    allConversations,
    allFavorites,
    updateAdStatus,
    toggleFeatured,
    updateUserRole,
    deleteUser,
    updateTradeSettings,
    updateOfferStatus,
    deleteOffer,
    deleteConversation,
  } = useAdminData(isAdmin);

  useEffect(() => {
    if (tradeSettings?.ad_duration_days) {
      setAdDurationDays(String(tradeSettings.ad_duration_days));
    }
  }, [tradeSettings]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [loading, user, isAdmin, navigate]);

  const getUserRole = (userId: string): AppRole => {
    return userRoles.find((role) => role.user_id === userId)?.role || "user";
  };

  const getProfileName = (userId: string) => {
    return profiles.find((profile) => profile.user_id === userId)?.username || "Desconhecido";
  };

  const getAdTitle = (adId: string) => {
    return ads?.find((ad) => ad.id === adId)?.title || adId.slice(0, 8);
  };

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const searchTerm = search.toLowerCase();
  const filteredAds = (ads || []).filter((ad) => {
    const owner = ad.profiles?.username || "";
    return `${ad.title} ${owner} ${ad.world}`.toLowerCase().includes(searchTerm);
  });
  const filteredProfiles = profiles.filter((profile) => profile.username.toLowerCase().includes(searchTerm));
  const filteredOffers = allOffers.filter((offer) => {
    const sender = getProfileName(offer.sender_id);
    const adTitle = getAdTitle(offer.ad_id);
    return `${sender} ${adTitle} ${offer.amount} ${offer.status} ${offer.message || ""}`.toLowerCase().includes(searchTerm);
  });
  const filteredConversations = allConversations.filter((conversation) => {
    const adTitle = getAdTitle(conversation.ad_id);
    const buyer = getProfileName(conversation.buyer_id);
    const seller = getProfileName(conversation.seller_id);
    return `${adTitle} ${buyer} ${seller}`.toLowerCase().includes(searchTerm);
  });

  const stats = {
    totalAds: ads?.length || 0,
    activeAds: ads?.filter((ad) => ad.status === "active").length || 0,
    featuredAds: ads?.filter((ad) => ad.featured).length || 0,
    sellingAds: ads?.filter((ad) => ad.type === "selling").length || 0,
    buyingAds: ads?.filter((ad) => ad.type === "buying").length || 0,
    totalUsers: profiles.length || 0,
    totalItems: items?.length || 0,
    totalOffers: allOffers.length || 0,
    pendingOffers: allOffers.filter((offer) => offer.status === "pending").length || 0,
    totalConversations: allConversations.length || 0,
    totalFavorites: allFavorites || 0,
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewItemImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    await createItem.mutateAsync({
      name: newItemName.trim(),
      imageFile: newItemImage || undefined,
    });

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
    { key: "conversations", label: "Conversas", icon: MessageCircle },
    { key: "stats", label: "Estatísticas", icon: BarChart3 },
  ] as const;

  const searchPlaceholder = {
    ads: "Buscar anúncios...",
    users: "Buscar usuários...",
    offers: "Buscar ofertas...",
    conversations: "Buscar conversas...",
  } as const;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container py-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Painel Admin</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {[
            { label: "Anúncios", value: stats.totalAds, color: "text-primary" },
            { label: "Ativos", value: stats.activeAds, color: "text-accent" },
            { label: "Usuários", value: stats.totalUsers, color: "text-primary" },
            { label: "Itens", value: stats.totalItems, color: "text-warning" },
            { label: "Ofertas", value: stats.totalOffers, color: "text-destructive" },
            { label: "Conversas", value: stats.totalConversations, color: "text-muted-foreground" },
          ].map((stat) => (
            <div key={stat.label} className="card-gaming p-3 text-center">
              <p className={`font-pixel text-lg ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              size="sm"
              variant={tab === key ? "default" : "outline"}
              onClick={() => {
                setTab(key);
                setSearch("");
              }}
              className={`gap-1.5 ${tab === key ? "bg-primary text-primary-foreground" : "border-border"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>

        {(tab === "ads" || tab === "users" || tab === "offers" || tab === "conversations") && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder[tab as keyof typeof searchPlaceholder]}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        )}

        <div className="card-gaming p-4 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Duração padrão dos anúncios</p>
              <p className="text-xs text-muted-foreground">Todo novo card criado expira automaticamente após esse período.</p>
            </div>
            <div className="flex items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Dias</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={adDurationDays}
                  onChange={(event) => setAdDurationDays(event.target.value)}
                  className="w-24 bg-secondary border-border"
                />
              </div>
              <Button
                onClick={() => updateTradeSettings.mutate(Number(adDurationDays))}
                disabled={updateTradeSettings.isPending || !adDurationDays}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {updateTradeSettings.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>

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
                      <Select value={ad.status} onValueChange={(value) => updateAdStatus.mutate({ id: ad.id, status: value as AdStatus })}>
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
                    <TableCell className="text-muted-foreground text-xs">
                      {(ad.expires_at && new Date(ad.expires_at).toLocaleDateString("pt-BR")) || "Sem prazo"}
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
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (!confirm("Remover este anúncio?")) return;
                          deleteAd.mutate(ad.id);
                        }}
                      >
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
                {filteredProfiles.map((profile) => {
                  const currentRole = getUserRole(profile.user_id);
                  const adsCount = adsCountByUser[profile.user_id] || 0;
                  const isCurrentUser = profile.user_id === user.id;

                  return (
                    <TableRow key={profile.id} className="border-border">
                      <TableCell>
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.username} className="h-8 w-8 object-cover rounded-full" />
                          ) : (
                            <span className="text-primary text-xs font-bold">{profile.username?.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        <div className="flex items-center gap-2">
                          {profile.username}
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
                        <Select value={currentRole} onValueChange={(value) => updateUserRole.mutate({ userId: profile.user_id, role: value as AppRole })} disabled={isCurrentUser}>
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
                      <TableCell className="text-muted-foreground text-xs">{new Date(profile.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => navigate(`/perfil/${profile.user_id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!isCurrentUser && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (!confirm(`Remover "${profile.username}" e todos os seus dados?`)) return;
                                deleteUser.mutate(profile.user_id);
                              }}
                            >
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

        {tab === "items" && (
          <>
            <div className="card-gaming p-6 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" /> Adicionar Item
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs text-muted-foreground">Nome do item</Label>
                  <Input value={newItemName} onChange={(event) => setNewItemName(event.target.value)} placeholder="Ex: Golden Armor" className="bg-secondary border-border" />
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
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (!confirm(`Remover item "${item.name}"?`)) return;
                            deleteItem.mutate(item.id);
                          }}
                        >
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

        {tab === "offers" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="card-gaming p-3 text-center">
                <p className="font-pixel text-lg text-warning">{stats.pendingOffers}</p>
                <p className="text-[10px] text-muted-foreground">Pendentes</p>
              </div>
              <div className="card-gaming p-3 text-center">
                <p className="font-pixel text-lg text-accent">{allOffers.filter((offer) => offer.status === "accepted").length || 0}</p>
                <p className="text-[10px] text-muted-foreground">Aceitas</p>
              </div>
              <div className="card-gaming p-3 text-center">
                <p className="font-pixel text-lg text-destructive">{allOffers.filter((offer) => offer.status === "rejected").length || 0}</p>
                <p className="text-[10px] text-muted-foreground">Recusadas</p>
              </div>
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
                          <img src={`/icons/${offer.currency}.png`} alt="" className="w-4 h-4 object-contain" />
                          {offer.amount}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[160px] truncate">{offer.message || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            offer.status === "pending"
                              ? "bg-warning/20 text-warning"
                              : offer.status === "accepted"
                                ? "bg-accent/20 text-accent"
                                : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {offer.status === "pending" ? "Pendente" : offer.status === "accepted" ? "Aceita" : "Recusada"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(offer.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {offer.status === "pending" && (
                            <>
                              <Button size="sm" variant="ghost" className="text-accent hover:bg-accent/10" onClick={() => updateOfferStatus.mutate({ offerId: offer.id, status: "accepted" as OfferStatus })}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-warning hover:bg-warning/10" onClick={() => updateOfferStatus.mutate({ offerId: offer.id, status: "rejected" as OfferStatus })}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (!confirm("Remover esta oferta?")) return;
                              deleteOffer.mutate(offer.id);
                            }}
                          >
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

        {tab === "conversations" && (
          <div className="card-gaming overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Anúncio</TableHead>
                  <TableHead className="text-muted-foreground">Comprador</TableHead>
                  <TableHead className="text-muted-foreground">Vendedor</TableHead>
                  <TableHead className="text-muted-foreground">Criada em</TableHead>
                  <TableHead className="text-muted-foreground">Atualizada em</TableHead>
                  <TableHead className="text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.map((conversation) => (
                  <TableRow key={conversation.id} className="border-border">
                    <TableCell className="text-foreground text-xs max-w-[180px] truncate">{getAdTitle(conversation.ad_id)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{getProfileName(conversation.buyer_id)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{getProfileName(conversation.seller_id)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(conversation.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(conversation.updated_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (!confirm("Remover esta conversa e suas mensagens?")) return;
                          deleteConversation.mutate(conversation.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredConversations.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma conversa encontrada</p>}
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
                { label: "Itens", value: stats.totalItems, sub: "cadastrados", color: "text-warning" },
                { label: "Ofertas", value: stats.totalOffers, sub: `${stats.pendingOffers} pendentes`, color: "text-destructive" },
                { label: "Favoritos", value: stats.totalFavorites, sub: "total de curtidas", color: "text-primary" },
                { label: "Conversas", value: stats.totalConversations, sub: "abertas", color: "text-muted-foreground" },
              ].map((stat) => (
                <div key={stat.label} className="card-gaming p-4">
                  <p className={`font-pixel text-2xl ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-foreground font-medium">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="card-gaming p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Top Anunciantes</h3>
              <div className="space-y-2">
                {Object.entries(adsCountByUser as Record<string, number>)
                  .sort(([, left], [, right]) => right - left)
                  .slice(0, 10)
                  .map(([userId, count], index) => (
                    <div key={userId} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs w-5">{index + 1}.</span>
                        <span className="text-foreground">{getProfileName(userId)}</span>
                      </span>
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
