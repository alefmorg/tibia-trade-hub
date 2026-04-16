import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useAllAdsAdmin, useDeleteAd } from "@/hooks/useAds";
import { useItems, useCreateItem, useDeleteItem } from "@/hooks/useItems";
import { useAdminData, type AdStatus, type AppRole, type OfferStatus } from "@/hooks/useAdmin";
import { useNavLinks, useSiteBanners, useNavLinksMutations, useBannerMutations, type NavLink, type SiteBanner } from "@/hooks/useSiteConfig";
import { useFilterOptions, useFilterOptionsMutations, type FilterOption } from "@/hooks/useFilterOptions";
import { useAllWallets, useAddBalance, useHighlightPlans, useHighlightPlansMutations } from "@/hooks/useWallet";
import { useSendNotification } from "@/hooks/useNotifications";
import { useAllDeposits, useApproveDeposit, useRejectDeposit, useDepositConfig } from "@/hooks/useDeposits";
import { useRaffles, useRaffleNumbers, useRaffleMutations } from "@/hooks/useRaffles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ItemCombobox from "@/components/ItemCombobox";
import { rubinotWorlds } from "@/lib/tibia-worlds";
import { formatPriceWithDots } from "@/lib/price-utils";
import {
  Ban, BarChart3, Bell, Check, ChevronDown, ChevronUp, Coins, Eye, Filter, HandCoins, Image, Link2, MessageCircle,
  Megaphone, Package, Plus, Search, Shield, ShieldAlert, ShieldCheck, Star, Trash2, Upload, UserCog, Users, X,
  Settings, PanelLeft, Ticket, Wallet, ImagePlus, FileText, CheckSquare, Square,
} from "lucide-react";

type TabKey = "ads" | "users" | "items" | "offers" | "conversations" | "stats" | "create-ad" | "nav-links" | "banners" | "filters" | "wallet" | "plans" | "notifications" | "deposits" | "raffles" | "logs";

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { data: ads } = useAllAdsAdmin();
  const deleteAd = useDeleteAd();
  const { data: items } = useItems();
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabKey>("stats");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Geral");
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  const [bulkItemNames, setBulkItemNames] = useState("");
  const [bulkItemCategory, setBulkItemCategory] = useState("Geral");
  const [itemAddMode, setItemAddMode] = useState<"single" | "bulk">("single");
  const [adDurationDays, setAdDurationDays] = useState("7");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [notifForm, setNotifForm] = useState({ userId: "", title: "", message: "" });

  const { data: allDeposits } = useAllDeposits();
  const approveDeposit = useApproveDeposit();
  const rejectDeposit = useRejectDeposit();
  const { data: depositConfig } = useDepositConfig();
  const [depositCharName, setDepositCharName] = useState("");
  const [goldToCoinsRate, setGoldToCoinsRate] = useState("1");

  const { data: allRaffles } = useRaffles();
  const raffleMut = useRaffleMutations();
  const [raffleForm, setRaffleForm] = useState({ title: "", description: "", image_url: "", price_per_number: "", total_numbers: "100", draw_date: "", federal_lottery_ref: "" });
  const [editingRaffle, setEditingRaffle] = useState<string | null>(null);

  const [bulkItemImages, setBulkItemImages] = useState<Record<number, File>>({});
  const bulkFileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [winnerNumberInput, setWinnerNumberInput] = useState<Record<string, string>>({});

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

  const { data: filterOptions } = useFilterOptions();
  const filterMut = useFilterOptionsMutations();
  const [foForm, setFoForm] = useState({ filter_group: "", label: "", value: "", sort_order: "0" });
  const [editingFo, setEditingFo] = useState<string | null>(null);

  const sendNotification = useSendNotification();
  const { data: allWallets } = useAllWallets();
  const addBalance = useAddBalance();
  const { data: highlightPlans } = useHighlightPlans();
  const plansMut = useHighlightPlansMutations();
  const [walletForm, setWalletForm] = useState({ userId: "", amount: "", reason: "" });
  const [planForm, setPlanForm] = useState({ name: "", price_coins: "", duration_days: "", sort_order: "0" });
  const [editingPlan, setEditingPlan] = useState<string | null>(null);

  const [nlForm, setNlForm] = useState({ label: "", url: "", color: "#3B82F6", icon_url: "", sort_order: "0" });
  const [editingNl, setEditingNl] = useState<string | null>(null);

  const [bnForm, setBnForm] = useState({ title: "", image_url: "", link_url: "", sort_order: "0" });
  const [editingBn, setEditingBn] = useState<string | null>(null);

  useEffect(() => {
    if (tradeSettings?.ad_duration_days) setAdDurationDays(String(tradeSettings.ad_duration_days));
  }, [tradeSettings]);

  useEffect(() => {
    if (depositConfig) {
      setDepositCharName(depositConfig.deposit_char_name || "");
      setGoldToCoinsRate(String(depositConfig.gold_to_coins_rate || 1));
    }
  }, [depositConfig]);

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
    await createItem.mutateAsync({ name: newItemName.trim(), imageFile: newItemImage || undefined, category: newItemCategory });
    setNewItemName(""); setNewItemImage(null); setImagePreview(null); setNewItemCategory("Geral");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBulkAddItems = async () => {
    const names = bulkItemNames.split("\n").map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    for (let i = 0; i < names.length; i++) {
      const imageFile = bulkItemImages[i] || undefined;
      await createItem.mutateAsync({ name: names[i], imageFile, category: bulkItemCategory });
    }
    setBulkItemNames("");
    setBulkItemCategory("Geral");
    setBulkItemImages({});
  };

  // Get unique categories from existing items
  const existingCategories = [...new Set((items || []).map(i => (i as any).category || "Geral"))].sort();

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

  const sidebarSections = [
    {
      title: "GERAL",
      items: [
        { key: "stats" as TabKey, label: "Dashboard", icon: BarChart3 },
        { key: "ads" as TabKey, label: "Anúncios", icon: Package, badge: stats.totalAds },
        { key: "users" as TabKey, label: "Usuários", icon: Users, badge: stats.totalUsers },
        { key: "items" as TabKey, label: "Itens", icon: Image, badge: stats.totalItems },
      ],
    },
    {
      title: "NEGOCIAÇÕES",
      items: [
        { key: "offers" as TabKey, label: "Ofertas", icon: HandCoins, badge: stats.pendingOffers > 0 ? stats.pendingOffers : undefined },
        { key: "conversations" as TabKey, label: "Conversas", icon: MessageCircle },
      ],
    },
    {
      title: "MONETIZAÇÃO",
      items: [
        { key: "wallet" as TabKey, label: "Saldo / Coins", icon: Coins },
        { key: "deposits" as TabKey, label: "Depósitos", icon: Wallet, badge: allDeposits?.filter(d => d.status === "pending").length || undefined },
        { key: "plans" as TabKey, label: "Planos Destaque", icon: Star },
        { key: "raffles" as TabKey, label: "Rifas", icon: Ticket },
      ],
    },
    {
      title: "COMUNICAÇÃO",
      items: [
        { key: "notifications" as TabKey, label: "Notificações", icon: Bell },
      ],
    },
    {
      title: "CONFIGURAÇÕES",
      items: [
        { key: "filters" as TabKey, label: "Filtros", icon: Filter },
        { key: "nav-links" as TabKey, label: "Links Nav", icon: Link2 },
        { key: "banners" as TabKey, label: "Banners / Rifa", icon: Megaphone },
        { key: "create-ad" as TabKey, label: "Criar Anúncio", icon: Plus },
        { key: "logs" as TabKey, label: "Logs / Atividade", icon: FileText },
      ],
    },
  ];

  const getTabTitle = () => {
    for (const section of sidebarSections) {
      const found = section.items.find(i => i.key === tab);
      if (found) return found.label;
    }
    return "Admin";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "w-60" : "w-0 overflow-hidden"} transition-all duration-300 border-r border-border/60 bg-card/50 backdrop-blur-sm shrink-0 flex flex-col`}>
          <div className="p-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-pixel text-xs text-foreground">Admin Panel</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
            {sidebarSections.map((section) => (
              <div key={section.title}>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-3 mb-1.5">{section.title}</p>
                <div className="space-y-0.5">
                  {section.items.map(({ key, label, icon: Icon, badge }) => (
                    <button
                      key={key}
                      onClick={() => { setTab(key); setSearch(""); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        tab === key
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate font-body">{label}</span>
                      {badge !== undefined && (
                        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          tab === key ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                        }`}>
                          {badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Settings shortcut */}
          <div className="p-3 border-t border-border/60">
            <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Duração de anúncios</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={adDurationDays}
                  onChange={(e) => setAdDurationDays(e.target.value)}
                  className="bg-background border-border h-8 text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => updateTradeSettings.mutate({ days: Number(adDurationDays) })}
                  disabled={updateTradeSettings.isPending || !adDurationDays}
                  className="bg-primary text-primary-foreground h-8 px-3 text-xs"
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Top bar */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/60 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <PanelLeft className="h-4 w-4" />
              </button>
              <h1 className="text-sm font-semibold text-foreground font-body">{getTabTitle()}</h1>
            </div>
            {["ads", "users", "offers", "conversations"].includes(tab) && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/80 border-border h-9 rounded-xl text-sm" />
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* STATS / DASHBOARD */}
            {tab === "stats" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { label: "Anúncios", value: stats.totalAds, sub: `${stats.activeAds} ativos`, icon: Package, color: "text-primary", bg: "from-primary/5 to-primary/10", border: "border-primary/20" },
                    { label: "Destaques", value: stats.featuredAds, sub: "promovidos", icon: Star, color: "text-warning", bg: "from-warning/5 to-warning/10", border: "border-warning/20" },
                    { label: "Vendas", value: stats.sellingAds, sub: "de venda", icon: Package, color: "text-destructive", bg: "from-destructive/5 to-destructive/10", border: "border-destructive/20" },
                    { label: "Compras", value: stats.buyingAds, sub: "de compra", icon: Package, color: "text-primary", bg: "from-primary/5 to-primary/10", border: "border-primary/20" },
                    { label: "Usuários", value: stats.totalUsers, sub: `${stats.bannedUsers} banidos`, icon: Users, color: "text-primary", bg: "from-primary/5 to-primary/10", border: "border-primary/20" },
                    { label: "Itens", value: stats.totalItems, sub: "cadastrados", icon: Image, color: "text-warning", bg: "from-warning/5 to-warning/10", border: "border-warning/20" },
                    { label: "Ofertas", value: stats.totalOffers, sub: `${stats.pendingOffers} pendentes`, icon: HandCoins, color: "text-destructive", bg: "from-destructive/5 to-destructive/10", border: "border-destructive/20" },
                    { label: "Favoritos", value: stats.totalFavorites, sub: "total", icon: Star, color: "text-primary", bg: "from-primary/5 to-primary/10", border: "border-primary/20" },
                    { label: "Conversas", value: stats.totalConversations, sub: "abertas", icon: MessageCircle, color: "text-muted-foreground", bg: "from-secondary/50 to-secondary/80", border: "border-border/60" },
                    { label: "Banidos", value: stats.bannedUsers, sub: "usuários", icon: Ban, color: "text-destructive", bg: "from-destructive/5 to-destructive/10", border: "border-destructive/20" },
                  ].map((s) => (
                    <div key={s.label} className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-2xl p-4 hover:shadow-md transition-all duration-200`}>
                      <div className="flex items-center justify-between mb-3">
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                      </div>
                      <p className={`font-pixel text-2xl ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-foreground font-medium font-body mt-1">{s.label}</p>
                      <p className="text-[10px] text-muted-foreground font-body">{s.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-card/80 border border-border/60 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4 font-body">Top Anunciantes</h3>
                    <div className="space-y-2">
                      {Object.entries(adsCountByUser as Record<string, number>).sort(([, a], [, b]) => b - a).slice(0, 10).map(([uid, count], i) => (
                        <div key={uid} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-secondary/40 transition-colors">
                          <span className="flex items-center gap-3">
                            <span className="text-muted-foreground text-xs w-5 font-body">{i + 1}.</span>
                            <span className="text-foreground font-body">{getProfileName(uid)}</span>
                          </span>
                          <span className="text-primary font-semibold font-body">{count}</span>
                        </div>
                      ))}
                      {Object.keys(adsCountByUser || {}).length === 0 && <p className="text-muted-foreground text-xs text-center py-4 font-body">Sem dados</p>}
                    </div>
                  </div>
                  <div className="bg-card/80 border border-border/60 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4 font-body">Resumo de Ofertas</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-warning/5 border border-warning/20 rounded-lg">
                        <p className="font-pixel text-lg text-warning">{stats.pendingOffers}</p>
                        <p className="text-[10px] text-muted-foreground font-body">Pendentes</p>
                      </div>
                      <div className="text-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="font-pixel text-lg text-primary">{allOffers.filter((o) => o.status === "accepted").length}</p>
                        <p className="text-[10px] text-muted-foreground font-body">Aceitas</p>
                      </div>
                      <div className="text-center p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                        <p className="font-pixel text-lg text-destructive">{allOffers.filter((o) => o.status === "rejected").length}</p>
                        <p className="text-[10px] text-muted-foreground font-body">Recusadas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADS TAB */}
            {tab === "ads" && (
              <div className="space-y-3">
                {selectedAds.size > 0 && (
                  <div className="flex items-center gap-3 bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
                    <p className="text-sm text-foreground font-body">{selectedAds.size} selecionado{selectedAds.size > 1 ? "s" : ""}</p>
                    <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => {
                      if (confirm(`Remover ${selectedAds.size} anúncio(s)?`)) {
                        selectedAds.forEach(id => deleteAd.mutate(id));
                        setSelectedAds(new Set());
                      }
                    }}>
                      <Trash2 className="h-3 w-3 mr-1" />Remover selecionados
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedAds(new Set())}>Limpar</Button>
                  </div>
                )}
                <div className="bg-card/80 border border-border/60 rounded-xl overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 bg-secondary/30">
                      <TableHead className="text-muted-foreground text-xs w-10">
                        <button onClick={() => {
                          if (selectedAds.size === filteredAds.length) setSelectedAds(new Set());
                          else setSelectedAds(new Set(filteredAds.map(a => a.id)));
                        }}>
                          {selectedAds.size === filteredAds.length && filteredAds.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">Img</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Título</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Tipo</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Preço</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Mundo</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Usuário</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Expira</TableHead>
                      <TableHead className="text-muted-foreground text-xs text-center">⭐</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAds.map((ad) => (
                      <TableRow key={ad.id} className={`border-border/40 hover:bg-secondary/20 transition-colors ${selectedAds.has(ad.id) ? "bg-primary/5" : ""}`}>
                        <TableCell>
                          <button onClick={() => {
                            const next = new Set(selectedAds);
                            if (next.has(ad.id)) next.delete(ad.id); else next.add(ad.id);
                            setSelectedAds(next);
                          }}>
                            {selectedAds.has(ad.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                          </button>
                        </TableCell>
                        <TableCell>
                          {ad.image_url ? <img src={ad.image_url} alt="" className="h-8 w-8 object-contain rounded" /> : <div className="h-8 w-8 bg-secondary rounded flex items-center justify-center"><Image className="h-3 w-3 text-muted-foreground" /></div>}
                        </TableCell>
                        <TableCell className="text-foreground font-medium max-w-[160px] truncate text-sm font-body">{ad.title}</TableCell>
                        <TableCell>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ad.type === "selling" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>
                            {ad.type === "selling" ? "Venda" : "Compra"}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-body">
                          {ad.price && ad.price !== "Aceita ofertas" ? (
                            <span className="flex items-center gap-1"><img src={`/icons/${ad.currency || "kk"}.png`} alt="" className="w-4 h-4 object-contain" />{ad.price}</span>
                          ) : <span className="text-warning text-xs">Ofertas</span>}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-body">{ad.world}</TableCell>
                        <TableCell className="text-muted-foreground text-xs font-body">{ad.profiles?.username || "-"}</TableCell>
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
                        <TableCell className="text-muted-foreground text-xs font-body">{ad.expires_at ? new Date(ad.expires_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                        <TableCell className="text-center">
                          <button onClick={() => toggleFeatured.mutate({ id: ad.id, featured: !ad.featured })}
                            className={`transition-colors ${ad.featured ? "text-warning" : "text-muted-foreground/40 hover:text-warning/60"}`}>
                            <Star className={`h-4 w-4 ${ad.featured ? "fill-warning" : ""}`} />
                          </button>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                            onClick={() => { if (confirm("Remover este anúncio?")) deleteAd.mutate(ad.id); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredAds.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm font-body">Nenhum anúncio encontrado</p>}
              </div>
              </div>
            )}

            {/* USERS TAB */}
            {tab === "users" && (
              <div className="bg-card/80 border border-border/60 rounded-xl overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 bg-secondary/30">
                      <TableHead className="text-muted-foreground text-xs">Avatar</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Username</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Anúncios</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Cargo</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Cadastro</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => {
                      const currentRole = getUserRole(profile.user_id);
                      const adsCount = adsCountByUser[profile.user_id] || 0;
                      const isCurrentUser = profile.user_id === user.id;
                      const banned = isUserBanned(profile.user_id);
                      return (
                        <TableRow key={profile.id} className={`border-border/40 hover:bg-secondary/20 transition-colors ${banned ? "opacity-60 bg-destructive/5" : ""}`}>
                          <TableCell>
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.username} className="h-8 w-8 object-cover rounded-full" /> :
                                <span className="text-primary text-xs font-bold">{profile.username?.charAt(0).toUpperCase()}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground font-medium font-body">
                            <div className="flex items-center gap-2">
                              {profile.username}
                              {currentRole === "admin" && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                              {currentRole === "moderator" && <ShieldAlert className="h-3.5 w-3.5 text-warning" />}
                              {banned && <Ban className="h-3.5 w-3.5 text-destructive" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${adsCount > 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                              {adsCount}
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
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-semibold">Banido</span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">Ativo</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs font-body">{new Date(profile.created_at).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => navigate(`/perfil/${profile.user_id}`)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {!isCurrentUser && (
                                <>
                                  <Button size="sm" variant="ghost" className={`h-7 w-7 p-0 ${banned ? "text-primary hover:bg-primary/10" : "text-warning hover:bg-warning/10"}`}
                                    onClick={() => banUser.mutate({ userId: profile.user_id, banned: !banned })}>
                                    <Ban className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                    onClick={() => { if (confirm(`Remover "${profile.username}"?`)) deleteUser.mutate(profile.user_id); }}>
                                    <Trash2 className="h-3.5 w-3.5" />
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
                {filteredProfiles.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm font-body">Nenhum usuário encontrado</p>}
              </div>
            )}

            {/* ITEMS TAB */}
            {tab === "items" && (
              <>
                <div className="bg-card/80 border border-border/60 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 font-body"><Plus className="h-4 w-4 text-primary" /> Adicionar Itens</h3>
                    <div className="flex gap-1">
                      <Button size="sm" variant={itemAddMode === "single" ? "default" : "outline"} onClick={() => setItemAddMode("single")} className="text-xs h-7">Individual</Button>
                      <Button size="sm" variant={itemAddMode === "bulk" ? "default" : "outline"} onClick={() => setItemAddMode("bulk")} className="text-xs h-7">Em Massa</Button>
                    </div>
                  </div>

                  {itemAddMode === "single" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-body">Nome</Label>
                        <Input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Golden Armor" className="bg-secondary/80 border-border" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-body">Categoria</Label>
                        <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                          <SelectTrigger className="bg-secondary/80 border-border"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {existingCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            <SelectItem value="__new">+ Nova categoria...</SelectItem>
                          </SelectContent>
                        </Select>
                        {newItemCategory === "__new" && (
                          <Input value="" onChange={(e) => setNewItemCategory(e.target.value)} placeholder="Nome da nova categoria" className="bg-secondary/80 border-border mt-1" />
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-body">Imagem</Label>
                        <div className="flex items-center gap-2">
                          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                          <Button type="button" variant="outline" size="sm" className="border-border" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="h-3.5 w-3.5 mr-1" /> {newItemImage ? "Trocar" : "Upload"}
                          </Button>
                          {imagePreview && <img src={imagePreview} alt="" className="h-8 w-8 object-contain rounded border border-border" />}
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleAddItem} disabled={createItem.isPending || !newItemName.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                          {createItem.isPending ? "Salvando..." : "Adicionar"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground font-body">Categoria (para todos)</Label>
                          <Select value={bulkItemCategory} onValueChange={setBulkItemCategory}>
                            <SelectTrigger className="bg-secondary/80 border-border"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {existingCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              <SelectItem value="__new">+ Nova categoria...</SelectItem>
                            </SelectContent>
                          </Select>
                          {bulkItemCategory === "__new" && (
                            <Input value="" onChange={(e) => setBulkItemCategory(e.target.value)} placeholder="Nome da nova categoria" className="bg-secondary/80 border-border mt-1" />
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-body">Nomes dos itens (um por linha)</Label>
                        <Textarea
                          value={bulkItemNames}
                          onChange={(e) => setBulkItemNames(e.target.value)}
                          placeholder={"Golden Armor\nMagic Plate Armor\nDemon Helmet\nThunder Hammer"}
                          className="bg-secondary/80 border-border min-h-[120px] font-mono text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground font-body">
                          {bulkItemNames.split("\n").filter(n => n.trim()).length} itens para adicionar
                        </p>
                      </div>
                      {bulkItemNames.split("\n").filter(n => n.trim()).length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground font-body">Imagens (opcional, uma por item)</Label>
                          {bulkItemNames.split("\n").filter(n => n.trim()).map((name, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground w-6 text-right font-body">{idx + 1}.</span>
                              <span className="text-foreground truncate flex-1 font-body">{name.trim()}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={el => { bulkFileRefs.current[idx] = el; }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setBulkItemImages(prev => ({ ...prev, [idx]: file }));
                                }}
                              />
                              <Button type="button" variant="outline" size="sm" className="border-border h-7 text-xs" onClick={() => bulkFileRefs.current[idx]?.click()}>
                                <ImagePlus className="h-3 w-3 mr-1" />{bulkItemImages[idx] ? "Trocar" : "Img"}
                              </Button>
                              {bulkItemImages[idx] && (
                                <img src={URL.createObjectURL(bulkItemImages[idx])} alt="" className="h-7 w-7 object-contain rounded border border-border" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <Button onClick={handleBulkAddItems} disabled={createItem.isPending || !bulkItemNames.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        {createItem.isPending ? "Adicionando..." : `Adicionar ${bulkItemNames.split("\n").filter(n => n.trim()).length} itens`}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="bg-card/80 border border-border/60 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/60 bg-secondary/30">
                        <TableHead className="text-muted-foreground text-xs w-16">Imagem</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Nome</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Categoria</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Cadastro</TableHead>
                        <TableHead className="text-muted-foreground text-xs w-20">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items?.map((item) => (
                        <TableRow key={item.id} className="border-border/40 hover:bg-secondary/20 transition-colors">
                          <TableCell>
                            {item.image_url ? <img src={item.image_url} alt={item.name} className="h-8 w-8 object-contain" /> :
                              <div className="h-8 w-8 bg-secondary rounded flex items-center justify-center"><Image className="h-3.5 w-3.5 text-muted-foreground" /></div>}
                          </TableCell>
                          <TableCell className="text-foreground font-medium font-body">{item.name}</TableCell>
                          <TableCell><span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{(item as any).category || "Geral"}</span></TableCell>
                          <TableCell className="text-muted-foreground text-xs font-body">{new Date(item.created_at).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => { if (confirm(`Remover "${item.name}"?`)) deleteItem.mutate(item.id); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {(!items || items.length === 0) && <p className="text-center py-8 text-muted-foreground text-sm font-body">Nenhum item cadastrado</p>}
                </div>
              </>
            )}

            {/* OFFERS TAB */}
            {tab === "offers" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 text-center">
                    <p className="font-pixel text-lg text-warning">{stats.pendingOffers}</p>
                    <p className="text-[10px] text-muted-foreground font-body">Pendentes</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                    <p className="font-pixel text-lg text-primary">{allOffers.filter((o) => o.status === "accepted").length}</p>
                    <p className="text-[10px] text-muted-foreground font-body">Aceitas</p>
                  </div>
                  <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
                    <p className="font-pixel text-lg text-destructive">{allOffers.filter((o) => o.status === "rejected").length}</p>
                    <p className="text-[10px] text-muted-foreground font-body">Recusadas</p>
                  </div>
                </div>
                <div className="bg-card/80 border border-border/60 rounded-xl overflow-hidden overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/60 bg-secondary/30">
                        <TableHead className="text-muted-foreground text-xs">Remetente</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Anúncio</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Valor</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Mensagem</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Data</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOffers.map((offer) => (
                        <TableRow key={offer.id} className="border-border/40 hover:bg-secondary/20 transition-colors">
                          <TableCell className="text-foreground text-xs font-body">{getProfileName(offer.sender_id)}</TableCell>
                          <TableCell className="text-muted-foreground text-xs max-w-[140px] truncate font-body">{getAdTitle(offer.ad_id)}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-foreground text-xs font-body">
                              <img src={`/icons/${offer.currency}.png`} alt="" className="w-4 h-4 object-contain" />{offer.amount}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs max-w-[160px] truncate font-body">{offer.message || "-"}</TableCell>
                          <TableCell>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${offer.status === "pending" ? "bg-warning/15 text-warning" : offer.status === "accepted" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                              {offer.status === "pending" ? "Pendente" : offer.status === "accepted" ? "Aceita" : "Recusada"}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs font-body">{new Date(offer.created_at).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              {offer.status === "pending" && (
                                <>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary hover:bg-primary/10" onClick={() => updateOfferStatus.mutate({ offerId: offer.id, status: "accepted" as OfferStatus })}><Check className="h-3.5 w-3.5" /></Button>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-warning hover:bg-warning/10" onClick={() => updateOfferStatus.mutate({ offerId: offer.id, status: "rejected" as OfferStatus })}><X className="h-3.5 w-3.5" /></Button>
                                </>
                              )}
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                onClick={() => { if (confirm("Remover esta oferta?")) deleteOffer.mutate(offer.id); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredOffers.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm font-body">Nenhuma oferta encontrada</p>}
                </div>
              </div>
            )}

            {/* CONVERSATIONS TAB */}
            {tab === "conversations" && (
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <div key={conv.id} className="bg-card/80 border border-border/60 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/20 transition-colors" onClick={() => handleExpandConversation(conv.id)}>
                      <div className="flex items-center gap-4 text-sm font-body">
                        <span className="text-foreground font-medium">{getAdTitle(conv.ad_id)}</span>
                        <span className="text-border">|</span>
                        <span className="text-muted-foreground">{getProfileName(conv.buyer_id)} ↔ {getProfileName(conv.seller_id)}</span>
                        <span className="text-muted-foreground text-xs">{new Date(conv.updated_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {expandedConversation === conv.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); if (confirm("Remover esta conversa?")) deleteConversation.mutate(conv.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {expandedConversation === conv.id && (
                      <div className="border-t border-border/60 p-4 bg-secondary/10 max-h-80 overflow-y-auto">
                        {loadingMessages ? <p className="text-muted-foreground text-xs text-center py-4 font-body">Carregando...</p> :
                          conversationMessages.length === 0 ? <p className="text-muted-foreground text-xs text-center py-4 font-body">Nenhuma mensagem</p> :
                            <div className="space-y-2">
                              {conversationMessages.map((msg: any) => (
                                <div key={msg.id} className="flex gap-2 text-xs font-body">
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
                {filteredConversations.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm font-body">Nenhuma conversa encontrada</p>}
              </div>
            )}

            {/* CREATE AD TAB */}
            {tab === "create-ad" && (
              <div className="bg-card/80 border border-border/60 rounded-xl p-6 max-w-lg">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 font-body"><Plus className="h-4 w-4 text-primary" /> Criar Anúncio (Admin)</h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-body">Criar em nome de</Label>
                    <Select value={adForm.userId || "self"} onValueChange={(v) => setAdForm({ ...adForm, userId: v === "self" ? "" : v })}>
                      <SelectTrigger className="bg-secondary/80 border-border"><SelectValue placeholder="Você mesmo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Você mesmo (Admin)</SelectItem>
                        {profiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.username}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-body">Item</Label>
                    <ItemCombobox items={items || []} value={adForm.itemId} onSelect={(id) => setAdForm({ ...adForm, itemId: id })} />
                    {selectedItem?.image_url && <div className="flex justify-center pt-2"><img src={selectedItem.image_url} alt={selectedItem.name} className="h-16 w-16 object-contain" /></div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-body">Tier</Label>
                    <Select value={adForm.tier} onValueChange={(v) => setAdForm({ ...adForm, tier: v })}>
                      <SelectTrigger className="bg-secondary/80 border-border"><SelectValue placeholder="Opcional" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem tier</SelectItem>
                        {[0,1,2,3,4,5,6,7,8,9,10].map((t) => <SelectItem key={t} value={String(t)}>Tier {t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-body">Tipo</Label>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant={adForm.type === "selling" ? "default" : "outline"} onClick={() => setAdForm({ ...adForm, type: "selling" })}>Vendendo</Button>
                      <Button type="button" size="sm" variant={adForm.type === "buying" ? "default" : "outline"} onClick={() => setAdForm({ ...adForm, type: "buying" })}>Comprando</Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground font-body">Preço</Label>
                      <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground font-body">Aceita ofertas</span><Switch checked={adForm.acceptOffers} onCheckedChange={(v) => setAdForm({ ...adForm, acceptOffers: v })} /></div>
                    </div>
                    {!adForm.acceptOffers && (
                      <div className="flex gap-2">
                        <Input value={adForm.price} onChange={(e) => setAdForm({ ...adForm, price: formatPriceWithDots(e.target.value) })} placeholder="1.000.000" className="bg-secondary/80 border-border flex-1" />
                        <Select value={adForm.currency} onValueChange={(v) => setAdForm({ ...adForm, currency: v })}>
                          <SelectTrigger className="w-28 bg-secondary/80 border-border"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kk"><span className="flex items-center gap-2"><img src="/icons/kk.png" alt="kk" className="w-4 h-4 object-contain" />kk</span></SelectItem>
                            <SelectItem value="coins"><span className="flex items-center gap-2"><img src="/icons/coins.png" alt="coins" className="w-4 h-4 object-contain" />coins</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-body">Mundo</Label>
                    <Select value={adForm.world} onValueChange={handleWorldChange}>
                      <SelectTrigger className="bg-secondary/80 border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {rubinotWorlds.map((w) => <SelectItem key={w.name} value={w.name}>{w.name} ({w.pvp})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-body">Descrição</Label>
                    <Textarea value={adForm.description} onChange={(e) => setAdForm({ ...adForm, description: e.target.value })} placeholder="Detalhes..." className="bg-secondary/80 border-border min-h-[80px]" />
                  </div>
                  <Button onClick={handleCreateAd} disabled={createAdAdmin.isPending || !adForm.itemId || !adForm.world} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    {createAdAdmin.isPending ? "Criando..." : "Criar Anúncio"}
                  </Button>
                </div>
              </div>
            )}

            {/* NAV LINKS TAB */}
            {tab === "nav-links" && (
              <div className="space-y-4">
                <div className="bg-card/80 border border-border/60 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 font-body">
                    <Plus className="h-4 w-4 text-primary" /> {editingNl ? "Editar Link" : "Novo Link"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Label</Label>
                      <Input value={nlForm.label} onChange={(e) => setNlForm({ ...nlForm, label: e.target.value })} placeholder="Discord" className="bg-secondary/80 border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">URL</Label>
                      <Input value={nlForm.url} onChange={(e) => setNlForm({ ...nlForm, url: e.target.value })} placeholder="https://..." className="bg-secondary/80 border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Cor</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={nlForm.color} onChange={(e) => setNlForm({ ...nlForm, color: e.target.value })} className="w-8 h-8 rounded border border-border cursor-pointer" />
                        <Input value={nlForm.color} onChange={(e) => setNlForm({ ...nlForm, color: e.target.value })} className="bg-secondary/80 border-border flex-1" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">URL do ícone</Label>
                      <Input value={nlForm.icon_url} onChange={(e) => setNlForm({ ...nlForm, icon_url: e.target.value })} placeholder="https://...icon.png" className="bg-secondary/80 border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Ordem</Label>
                      <Input type="number" value={nlForm.sort_order} onChange={(e) => setNlForm({ ...nlForm, sort_order: e.target.value })} className="bg-secondary/80 border-border w-24" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => {
                      if (editingNl) { navLinksMut.update.mutate({ id: editingNl, label: nlForm.label, url: nlForm.url, color: nlForm.color, icon_url: nlForm.icon_url || null, sort_order: Number(nlForm.sort_order) }); setEditingNl(null); }
                      else { navLinksMut.create.mutate({ label: nlForm.label, url: nlForm.url, color: nlForm.color, icon_url: nlForm.icon_url || null, sort_order: Number(nlForm.sort_order), active: true }); }
                      setNlForm({ label: "", url: "", color: "#3B82F6", icon_url: "", sort_order: "0" });
                    }} disabled={!nlForm.label || !nlForm.url} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {editingNl ? "Salvar" : "Adicionar"}
                    </Button>
                    {editingNl && <Button variant="outline" onClick={() => { setEditingNl(null); setNlForm({ label: "", url: "", color: "#3B82F6", icon_url: "", sort_order: "0" }); }}>Cancelar</Button>}
                  </div>
                </div>
                <div className="bg-card/80 border border-border/60 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="border-border/60 bg-secondary/30">
                      <TableHead className="text-muted-foreground text-xs">Preview</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Label</TableHead>
                      <TableHead className="text-muted-foreground text-xs">URL</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Ordem</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Ativo</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Ações</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(navLinks || []).map((link) => (
                        <TableRow key={link.id} className="border-border/40 hover:bg-secondary/20 transition-colors">
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white" style={{ backgroundColor: link.color }}>
                              {link.icon_url && <img src={link.icon_url} alt="" className="w-3.5 h-3.5 object-contain" />}
                              {link.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-foreground text-sm font-body">{link.label}</TableCell>
                          <TableCell className="text-muted-foreground text-xs max-w-[180px] truncate font-body">{link.url}</TableCell>
                          <TableCell className="text-muted-foreground text-sm font-body">{link.sort_order}</TableCell>
                          <TableCell><Switch checked={link.active} onCheckedChange={(v) => navLinksMut.update.mutate({ id: link.id, active: v })} /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                                onClick={() => { setEditingNl(link.id); setNlForm({ label: link.label, url: link.url, color: link.color, icon_url: link.icon_url || "", sort_order: String(link.sort_order) }); }}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                onClick={() => { if (confirm("Remover?")) navLinksMut.remove.mutate(link.id); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {(!navLinks || navLinks.length === 0) && <p className="text-center py-8 text-muted-foreground text-sm font-body">Nenhum link</p>}
                </div>
              </div>
            )}

            {/* BANNERS TAB */}
            {tab === "banners" && (
              <div className="space-y-4">
                <div className="bg-card/80 border border-border/60 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 font-body">
                    <Plus className="h-4 w-4 text-primary" /> {editingBn ? "Editar Banner" : "Novo Banner"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Título</Label>
                      <Input value={bnForm.title} onChange={(e) => setBnForm({ ...bnForm, title: e.target.value })} placeholder="Promoção" className="bg-secondary/80 border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">URL da imagem</Label>
                      <Input value={bnForm.image_url} onChange={(e) => setBnForm({ ...bnForm, image_url: e.target.value })} placeholder="https://...banner.png" className="bg-secondary/80 border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Link de destino</Label>
                      <Input value={bnForm.link_url} onChange={(e) => setBnForm({ ...bnForm, link_url: e.target.value })} placeholder="https://..." className="bg-secondary/80 border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Ordem</Label>
                      <Input type="number" value={bnForm.sort_order} onChange={(e) => setBnForm({ ...bnForm, sort_order: e.target.value })} className="bg-secondary/80 border-border w-24" />
                    </div>
                  </div>
                  {bnForm.image_url && (
                    <div className="mt-3 p-2 bg-secondary/30 rounded-lg">
                      <p className="text-[10px] text-muted-foreground mb-1 font-body">Preview:</p>
                      <img src={bnForm.image_url} alt="" className="w-full max-h-24 object-cover rounded" />
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => {
                      if (editingBn) { bannerMut.update.mutate({ id: editingBn, title: bnForm.title || null, image_url: bnForm.image_url || null, link_url: bnForm.link_url || null, sort_order: Number(bnForm.sort_order) }); setEditingBn(null); }
                      else { bannerMut.create.mutate({ title: bnForm.title || null, image_url: bnForm.image_url || null, link_url: bnForm.link_url || null, sort_order: Number(bnForm.sort_order), active: true }); }
                      setBnForm({ title: "", image_url: "", link_url: "", sort_order: "0" });
                    }} disabled={!bnForm.title && !bnForm.image_url} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {editingBn ? "Salvar" : "Adicionar"}
                    </Button>
                    {editingBn && <Button variant="outline" onClick={() => { setEditingBn(null); setBnForm({ title: "", image_url: "", link_url: "", sort_order: "0" }); }}>Cancelar</Button>}
                  </div>
                </div>
                <div className="bg-card/80 border border-border/60 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="border-border/60 bg-secondary/30">
                      <TableHead className="text-muted-foreground text-xs">Preview</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Título</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Link</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Ordem</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Ativo</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Ações</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(siteBanners || []).map((banner) => (
                        <TableRow key={banner.id} className="border-border/40 hover:bg-secondary/20 transition-colors">
                          <TableCell>{banner.image_url ? <img src={banner.image_url} alt="" className="h-8 w-20 object-cover rounded" /> : <span className="text-xs text-muted-foreground font-body">—</span>}</TableCell>
                          <TableCell className="text-foreground text-sm font-body">{banner.title || "-"}</TableCell>
                          <TableCell className="text-muted-foreground text-xs max-w-[180px] truncate font-body">{banner.link_url || "-"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm font-body">{banner.sort_order}</TableCell>
                          <TableCell><Switch checked={banner.active} onCheckedChange={(v) => bannerMut.update.mutate({ id: banner.id, active: v })} /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                                onClick={() => { setEditingBn(banner.id); setBnForm({ title: banner.title || "", image_url: banner.image_url || "", link_url: banner.link_url || "", sort_order: String(banner.sort_order) }); }}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                onClick={() => { if (confirm("Remover?")) bannerMut.remove.mutate(banner.id); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {(!siteBanners || siteBanners.length === 0) && <p className="text-center py-8 text-muted-foreground text-sm font-body">Nenhum banner</p>}
                </div>
              </div>
            )}

            {/* FILTERS TAB */}
            {tab === "filters" && (
              <div className="space-y-4">
                <div className="bg-card/80 border border-border/60 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2 font-body">
                    <Plus className="h-4 w-4 text-primary" /> {editingFo ? "Editar Filtro" : "Novo Filtro"}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mb-4 font-body">
                    Crie grupos de filtros (ex: "category") e as opções aparecerão como chips na página inicial.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Grupo</Label>
                      <Input value={foForm.filter_group} onChange={(e) => setFoForm({ ...foForm, filter_group: e.target.value })} placeholder="category" className="bg-secondary/80 border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Label</Label>
                      <Input value={foForm.label} onChange={(e) => setFoForm({ ...foForm, label: e.target.value })} placeholder="Equipamentos" className="bg-secondary/80 border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Valor</Label>
                      <Input value={foForm.value} onChange={(e) => setFoForm({ ...foForm, value: e.target.value })} placeholder="equipment" className="bg-secondary/80 border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Ordem</Label>
                      <Input type="number" value={foForm.sort_order} onChange={(e) => setFoForm({ ...foForm, sort_order: e.target.value })} className="bg-secondary/80 border-border" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => {
                      if (editingFo) { filterMut.update.mutate({ id: editingFo, filter_group: foForm.filter_group, label: foForm.label, value: foForm.value, sort_order: Number(foForm.sort_order) }); setEditingFo(null); }
                      else { filterMut.create.mutate({ filter_group: foForm.filter_group, label: foForm.label, value: foForm.value, sort_order: Number(foForm.sort_order), active: true }); }
                      setFoForm({ filter_group: "", label: "", value: "", sort_order: "0" });
                    }} disabled={!foForm.filter_group || !foForm.label || !foForm.value} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {editingFo ? "Salvar" : "Adicionar"}
                    </Button>
                    {editingFo && <Button variant="outline" onClick={() => { setEditingFo(null); setFoForm({ filter_group: "", label: "", value: "", sort_order: "0" }); }}>Cancelar</Button>}
                  </div>
                </div>
                {(() => {
                  const groups = [...new Set((filterOptions || []).map((fo) => fo.filter_group))];
                  return groups.map((group) => (
                    <div key={group} className="bg-card/80 border border-border/60 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-border/60 bg-secondary/20">
                        <h4 className="text-sm font-semibold text-foreground font-body">Grupo: <span className="text-primary">{group}</span></h4>
                      </div>
                      <Table>
                        <TableHeader><TableRow className="border-border/60">
                          <TableHead className="text-muted-foreground text-xs">Label</TableHead>
                          <TableHead className="text-muted-foreground text-xs">Valor</TableHead>
                          <TableHead className="text-muted-foreground text-xs">Ordem</TableHead>
                          <TableHead className="text-muted-foreground text-xs">Ativo</TableHead>
                          <TableHead className="text-muted-foreground text-xs">Ações</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {(filterOptions || []).filter((fo) => fo.filter_group === group).map((fo) => (
                            <TableRow key={fo.id} className="border-border/40 hover:bg-secondary/20 transition-colors">
                              <TableCell className="text-foreground text-sm font-body">{fo.label}</TableCell>
                              <TableCell className="text-muted-foreground text-xs font-body">{fo.value}</TableCell>
                              <TableCell className="text-muted-foreground text-sm font-body">{fo.sort_order}</TableCell>
                              <TableCell><Switch checked={fo.active} onCheckedChange={(v) => filterMut.update.mutate({ id: fo.id, active: v })} /></TableCell>
                              <TableCell>
                                <div className="flex items-center gap-0.5">
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                                    onClick={() => { setEditingFo(fo.id); setFoForm({ filter_group: fo.filter_group, label: fo.label, value: fo.value, sort_order: String(fo.sort_order) }); }}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                    onClick={() => { if (confirm(`Remover "${fo.label}"?`)) filterMut.remove.mutate(fo.id); }}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ));
                })()}
                {(!filterOptions || filterOptions.length === 0) && <p className="text-center py-8 text-muted-foreground text-sm font-body">Nenhum filtro cadastrado</p>}
              </div>
            )}

            {/* WALLET TAB */}
            {tab === "wallet" && (
              <div className="space-y-4">
                <div className="bg-card/80 border border-border/60 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 font-body"><Coins className="h-4 w-4 text-warning" />Adicionar / Remover Saldo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Usuário</Label>
                      <Select value={walletForm.userId} onValueChange={(v) => setWalletForm({ ...walletForm, userId: v })}>
                        <SelectTrigger className="bg-secondary/80 border-border"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{profiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.username}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Quantidade</Label>
                      <Input type="number" value={walletForm.amount} onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })} className="bg-secondary/80 border-border" placeholder="100" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Motivo</Label>
                      <Input value={walletForm.reason} onChange={(e) => setWalletForm({ ...walletForm, reason: e.target.value })} className="bg-secondary/80 border-border" placeholder="Compra de coins" />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={() => {
                        if (!walletForm.userId || !walletForm.amount) return;
                        addBalance.mutate({ userId: walletForm.userId, amount: Number(walletForm.amount), reason: walletForm.reason || undefined });
                        setWalletForm({ userId: "", amount: "", reason: "" });
                      }} className="bg-primary text-primary-foreground w-full"><Plus className="h-4 w-4 mr-1" />Aplicar</Button>
                    </div>
                  </div>
                </div>
                <div className="bg-card/80 border border-border/60 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/60 bg-secondary/20">
                    <h3 className="text-sm font-semibold text-foreground font-body">Saldos dos Usuários</h3>
                  </div>
                  <Table>
                    <TableHeader><TableRow className="border-border/60">
                      <TableHead className="text-muted-foreground text-xs">Usuário</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Saldo (Rubini Coins)</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Atualizado</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(allWallets || []).map((w) => (
                        <TableRow key={w.id} className="border-border/40 hover:bg-secondary/20 transition-colors">
                          <TableCell className="text-foreground text-sm font-body">{getProfileName(w.user_id)}</TableCell>
                          <TableCell><span className="text-warning font-semibold font-body">{w.balance}</span></TableCell>
                          <TableCell className="text-muted-foreground text-xs font-body">{new Date(w.updated_at).toLocaleDateString("pt-BR")}</TableCell>
                        </TableRow>
                      ))}
                      {(!allWallets || allWallets.length === 0) && (
                        <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-6 font-body">Nenhuma carteira</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* HIGHLIGHT PLANS TAB */}
            {tab === "plans" && (
              <div className="space-y-4">
                <div className="bg-card/80 border border-border/60 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 font-body"><Star className="h-4 w-4 text-warning" />{editingPlan ? "Editar Plano" : "Novo Plano"}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs text-muted-foreground font-body">Nome</Label><Input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} className="bg-secondary/80 border-border" placeholder="Bronze" /></div>
                    <div className="space-y-1.5"><Label className="text-xs text-muted-foreground font-body">Preço (Coins)</Label><Input type="number" value={planForm.price_coins} onChange={(e) => setPlanForm({ ...planForm, price_coins: e.target.value })} className="bg-secondary/80 border-border" placeholder="50" /></div>
                    <div className="space-y-1.5"><Label className="text-xs text-muted-foreground font-body">Duração (dias)</Label><Input type="number" value={planForm.duration_days} onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })} className="bg-secondary/80 border-border" placeholder="7" /></div>
                    <div className="space-y-1.5"><Label className="text-xs text-muted-foreground font-body">Ordem</Label><Input type="number" value={planForm.sort_order} onChange={(e) => setPlanForm({ ...planForm, sort_order: e.target.value })} className="bg-secondary/80 border-border" /></div>
                    <div className="flex items-end gap-2">
                      <Button className="bg-primary text-primary-foreground flex-1" onClick={() => {
                        if (!planForm.name || !planForm.price_coins || !planForm.duration_days) return;
                        const data = { name: planForm.name, price_coins: Number(planForm.price_coins), duration_days: Number(planForm.duration_days), sort_order: Number(planForm.sort_order) };
                        if (editingPlan) { plansMut.update.mutate({ id: editingPlan, ...data }); setEditingPlan(null); }
                        else plansMut.create.mutate(data);
                        setPlanForm({ name: "", price_coins: "", duration_days: "", sort_order: "0" });
                      }}>{editingPlan ? "Salvar" : "Criar"}</Button>
                      {editingPlan && <Button variant="outline" size="sm" onClick={() => { setEditingPlan(null); setPlanForm({ name: "", price_coins: "", duration_days: "", sort_order: "0" }); }}><X className="h-4 w-4" /></Button>}
                    </div>
                  </div>
                </div>
                <div className="bg-card/80 border border-border/60 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="border-border/60 bg-secondary/30">
                      <TableHead className="text-muted-foreground text-xs">Nome</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Preço</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Duração</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Ativo</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Ações</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(highlightPlans || []).map((p) => (
                        <TableRow key={p.id} className="border-border/40 hover:bg-secondary/20 transition-colors">
                          <TableCell className="text-foreground font-medium font-body">{p.name}</TableCell>
                          <TableCell><span className="text-warning font-semibold font-body">{p.price_coins} coins</span></TableCell>
                          <TableCell className="text-muted-foreground font-body">{p.duration_days} dias</TableCell>
                          <TableCell><Switch checked={p.active} onCheckedChange={(v) => plansMut.update.mutate({ id: p.id, active: v })} /></TableCell>
                          <TableCell>
                            <div className="flex gap-0.5">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary hover:bg-primary/10" onClick={() => { setEditingPlan(p.id); setPlanForm({ name: p.name, price_coins: String(p.price_coins), duration_days: String(p.duration_days), sort_order: String(p.sort_order) }); }}><Eye className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => { if (confirm(`Remover "${p.name}"?`)) plansMut.remove.mutate(p.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!highlightPlans || highlightPlans.length === 0) && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-6 font-body">Nenhum plano</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {tab === "notifications" && (
              <div className="space-y-4">
                <div className="bg-card/80 border border-border/60 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 font-body">
                    <Bell className="h-4 w-4 text-primary" /> Enviar Notificação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Destinatário</Label>
                      <Select value={notifForm.userId || "all"} onValueChange={(v) => setNotifForm({ ...notifForm, userId: v === "all" ? "" : v })}>
                        <SelectTrigger className="bg-secondary/80 border-border"><SelectValue placeholder="Todos os usuários" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">📢 Todos os usuários (broadcast)</SelectItem>
                          {profiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.username}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Título</Label>
                      <Input value={notifForm.title} onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })} placeholder="Atualização importante" className="bg-secondary/80 border-border" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-body">Mensagem</Label>
                    <Textarea value={notifForm.message} onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })} placeholder="Escreva a notificação..." className="bg-secondary/80 border-border min-h-[80px]" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => {
                        if (!notifForm.title || !notifForm.message) return;
                        sendNotification.mutate({
                          userId: notifForm.userId || undefined,
                          title: notifForm.title,
                          message: notifForm.message,
                        });
                        setNotifForm({ userId: "", title: "", message: "" });
                      }}
                      disabled={sendNotification.isPending || !notifForm.title || !notifForm.message}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      {sendNotification.isPending ? "Enviando..." : "Enviar Notificação"}
                    </Button>
                    <p className="text-[10px] text-muted-foreground font-body">
                      {notifForm.userId ? `Para: ${getProfileName(notifForm.userId)}` : "Para: Todos os usuários"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* DEPOSITS TAB */}
            {tab === "deposits" && (
              <div className="space-y-5">
                {/* Deposit Config */}
                <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/25">
                      <Settings className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground font-body">Configuração de Depósito</h3>
                      <p className="text-[10px] text-muted-foreground">Defina o personagem e a taxa de conversão</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-body">Nome do Personagem</Label>
                        <Input value={depositCharName} onChange={(e) => setDepositCharName(e.target.value)} placeholder="RubinBank" className="bg-secondary/80 border-border" />
                        <p className="text-[10px] text-muted-foreground">Personagem que recebe o gold</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-body">Taxa (gold → 1 coin)</Label>
                        <Input type="number" value={goldToCoinsRate} onChange={(e) => setGoldToCoinsRate(e.target.value)} placeholder="1000" className="bg-secondary/80 border-border" />
                        <p className="text-[10px] text-muted-foreground">Ex: 1000 = cada 1000 gold = 1 coin</p>
                      </div>
                      <div className="flex items-end">
                        <Button onClick={() => {
                          updateTradeSettings.mutate({ deposit_char_name: depositCharName, gold_to_coins_rate: Number(goldToCoinsRate) } as any);
                        }} className="bg-primary text-primary-foreground w-full h-10">
                          <Check className="h-4 w-4 mr-1" /> Salvar Configuração
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 text-center">
                    <p className="font-pixel text-xl text-warning">{allDeposits?.filter(d => d.status === "pending").length || 0}</p>
                    <p className="text-[10px] text-muted-foreground font-body">Pendentes</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                    <p className="font-pixel text-xl text-primary">{allDeposits?.filter(d => d.status === "approved").length || 0}</p>
                    <p className="text-[10px] text-muted-foreground font-body">Aprovados</p>
                  </div>
                  <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
                    <p className="font-pixel text-xl text-destructive">{allDeposits?.filter(d => d.status === "rejected").length || 0}</p>
                    <p className="text-[10px] text-muted-foreground font-body">Rejeitados</p>
                  </div>
                </div>

                {/* Deposits List */}
                <div className="space-y-3">
                  {(allDeposits || []).map((dep) => (
                    <div key={dep.id} className={`bg-card/80 border rounded-2xl overflow-hidden transition-all ${dep.status === "pending" ? "border-warning/30" : "border-border/60"}`}>
                      <div className="flex items-center gap-4 p-4">
                        {/* Screenshot */}
                        <a href={dep.screenshot_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <img src={dep.screenshot_url} alt="Comprovante" className="h-16 w-16 object-cover rounded-xl border border-border/40 hover:border-primary/40 transition-colors cursor-pointer" />
                        </a>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-foreground font-body">{getProfileName(dep.user_id)}</p>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${dep.status === "pending" ? "bg-warning/15 text-warning" : dep.status === "approved" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                              {dep.status === "pending" ? "Pendente" : dep.status === "approved" ? "Aprovado" : "Rejeitado"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">💰 <strong className="text-foreground">{dep.amount_gold.toLocaleString("pt-BR")}</strong> gold</span>
                            <span className="text-border">→</span>
                            <span className="flex items-center gap-1"><Coins className="h-3 w-3 text-warning" /><strong className="text-warning">{dep.amount_coins}</strong> coins</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(dep.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        </div>

                        {/* Actions */}
                        {dep.status === "pending" && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-xl text-xs" onClick={() => approveDeposit.mutate(dep.id)} disabled={approveDeposit.isPending}>
                              <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                            </Button>
                            <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 h-9 px-4 rounded-xl text-xs" onClick={() => rejectDeposit.mutate({ depositId: dep.id })} disabled={rejectDeposit.isPending}>
                              <X className="h-3.5 w-3.5 mr-1" /> Rejeitar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {(!allDeposits || allDeposits.length === 0) && (
                  <div className="text-center py-12 bg-card/50 rounded-2xl border border-border/60">
                    <Wallet className="h-8 w-8 text-primary/20 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm font-body">Nenhum depósito</p>
                  </div>
                )}
              </div>
            )}

            {/* RAFFLES TAB */}
            {tab === "raffles" && (
              <div className="space-y-5">
                {/* Create/Edit Form */}
                <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/60 bg-gradient-to-r from-warning/5 to-transparent flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center border border-warning/25">
                      <Ticket className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground font-body">{editingRaffle ? "Editar Rifa" : "Criar Nova Rifa"}</h3>
                      <p className="text-[10px] text-muted-foreground">Configure os detalhes da rifa</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-body">Título *</Label>
                        <Input value={raffleForm.title} onChange={(e) => setRaffleForm({ ...raffleForm, title: e.target.value })} placeholder="Rifa Golden Armor" className="bg-secondary/80 border-border" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-body">Preço por número (coins) *</Label>
                        <Input type="number" value={raffleForm.price_per_number} onChange={(e) => setRaffleForm({ ...raffleForm, price_per_number: e.target.value })} placeholder="10" className="bg-secondary/80 border-border" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-body">Total de números</Label>
                        <Input type="number" value={raffleForm.total_numbers} onChange={(e) => setRaffleForm({ ...raffleForm, total_numbers: e.target.value })} placeholder="100" className="bg-secondary/80 border-border" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-body">Data do sorteio</Label>
                        <Input type="date" value={raffleForm.draw_date} onChange={(e) => setRaffleForm({ ...raffleForm, draw_date: e.target.value })} className="bg-secondary/80 border-border" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-body">Ref. Loteria Federal</Label>
                        <Input value={raffleForm.federal_lottery_ref} onChange={(e) => setRaffleForm({ ...raffleForm, federal_lottery_ref: e.target.value })} placeholder="Concurso 5XXX" className="bg-secondary/80 border-border" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-body">URL da imagem</Label>
                        <Input value={raffleForm.image_url} onChange={(e) => setRaffleForm({ ...raffleForm, image_url: e.target.value })} placeholder="https://..." className="bg-secondary/80 border-border" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Descrição</Label>
                      <Textarea value={raffleForm.description} onChange={(e) => setRaffleForm({ ...raffleForm, description: e.target.value })} placeholder="Detalhes da rifa, prêmio, regras..." className="bg-secondary/80 border-border min-h-[70px]" />
                    </div>
                    {raffleForm.image_url && (
                      <div className="bg-secondary/30 rounded-xl p-3">
                        <p className="text-[10px] text-muted-foreground mb-1.5 font-body">Preview da imagem:</p>
                        <img src={raffleForm.image_url} alt="" className="w-full max-h-32 object-cover rounded-lg border border-border/40" />
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button onClick={() => {
                        if (!raffleForm.title || !raffleForm.price_per_number) return;
                        const data = {
                          title: raffleForm.title,
                          description: raffleForm.description || undefined,
                          image_url: raffleForm.image_url || undefined,
                          price_per_number: Number(raffleForm.price_per_number),
                          total_numbers: Number(raffleForm.total_numbers) || 100,
                          draw_date: raffleForm.draw_date ? new Date(raffleForm.draw_date).toISOString() : undefined,
                          federal_lottery_ref: raffleForm.federal_lottery_ref || undefined,
                        };
                        if (editingRaffle) { raffleMut.update.mutate({ id: editingRaffle, ...data }); setEditingRaffle(null); }
                        else raffleMut.create.mutate(data);
                        setRaffleForm({ title: "", description: "", image_url: "", price_per_number: "", total_numbers: "100", draw_date: "", federal_lottery_ref: "" });
                      }} disabled={!raffleForm.title || !raffleForm.price_per_number} className="bg-warning text-warning-foreground hover:bg-warning/90 px-6">
                        <Ticket className="h-4 w-4 mr-1" />
                        {editingRaffle ? "Salvar Alterações" : "Criar Rifa"}
                      </Button>
                      {editingRaffle && <Button variant="outline" onClick={() => { setEditingRaffle(null); setRaffleForm({ title: "", description: "", image_url: "", price_per_number: "", total_numbers: "100", draw_date: "", federal_lottery_ref: "" }); }}>Cancelar</Button>}
                    </div>
                  </div>
                </div>

                {/* Raffles List as Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(allRaffles || []).map((r) => {
                    const raffleNums = undefined; // numbers loaded on raffle detail page
                    return (
                      <div key={r.id} className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden hover:border-warning/30 transition-all">
                        {/* Header */}
                        <div className="relative">
                          {r.image_url ? (
                            <img src={r.image_url} alt={r.title} className="w-full h-32 object-cover" />
                          ) : (
                            <div className="w-full h-20 bg-gradient-to-r from-warning/10 to-primary/5 flex items-center justify-center">
                              <Ticket className="h-8 w-8 text-warning/20" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${r.status === "active" ? "bg-primary/90 text-primary-foreground" : r.status === "completed" ? "bg-warning/90 text-warning-foreground" : "bg-destructive/90 text-destructive-foreground"}`}>
                              {r.status === "active" ? "Ativa" : r.status === "completed" ? "Finalizada" : "Cancelada"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-bold text-foreground">{r.title}</h4>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-warning/5 border border-warning/15 rounded-lg py-2">
                              <p className="font-pixel text-sm text-warning">{r.price_per_number}</p>
                              <p className="text-[9px] text-muted-foreground">coins/nº</p>
                            </div>
                            <div className="bg-primary/5 border border-primary/15 rounded-lg py-2">
                              <p className="font-pixel text-sm text-primary">{r.total_numbers}</p>
                              <p className="text-[9px] text-muted-foreground">total</p>
                            </div>
                            <div className="bg-secondary/50 border border-border/40 rounded-lg py-2">
                              <p className="font-pixel text-sm text-foreground">{r.draw_date ? new Date(r.draw_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}</p>
                              <p className="text-[9px] text-muted-foreground">sorteio</p>
                            </div>
                          </div>

                          {r.federal_lottery_ref && (
                            <p className="text-[10px] text-muted-foreground bg-secondary/30 rounded-lg px-2.5 py-1.5">🎰 {r.federal_lottery_ref}</p>
                          )}

                          {/* Winner input */}
                          {r.status === "completed" && r.winner_number != null && (
                            <div className="bg-warning/10 border border-warning/25 rounded-lg p-2.5 text-center">
                              <p className="text-[10px] text-muted-foreground">Vencedor:</p>
                              <p className="font-pixel text-lg text-warning">Nº {r.winner_number}</p>
                            </div>
                          )}
                          {r.status !== "cancelled" && r.winner_number == null && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                max={r.total_numbers}
                                placeholder="Nº vencedor"
                                value={winnerNumberInput[r.id] || ""}
                                onChange={(e) => setWinnerNumberInput(prev => ({ ...prev, [r.id]: e.target.value }))}
                                className="bg-secondary/80 border-border h-8 text-xs flex-1"
                              />
                              <Button size="sm" className="h-8 bg-warning text-warning-foreground text-xs" disabled={!winnerNumberInput[r.id]}
                                onClick={() => {
                                  const num = Number(winnerNumberInput[r.id]);
                                  if (num >= 1 && num <= r.total_numbers) {
                                    raffleMut.update.mutate({ id: r.id, winner_number: num, status: "completed" });
                                    setWinnerNumberInput(prev => { const n = { ...prev }; delete n[r.id]; return n; });
                                  }
                                }}>
                                🏆 Definir
                              </Button>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1">
                            <Select value={r.status} onValueChange={(v) => raffleMut.update.mutate({ id: r.id, status: v })}>
                              <SelectTrigger className="flex-1 h-8 text-xs bg-secondary border-border rounded-lg"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Ativa</SelectItem>
                                <SelectItem value="completed">Finalizada</SelectItem>
                                <SelectItem value="cancelled">Cancelada</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-border" onClick={() => {
                              setEditingRaffle(r.id);
                              setRaffleForm({
                                title: r.title, description: r.description || "", image_url: r.image_url || "",
                                price_per_number: String(r.price_per_number), total_numbers: String(r.total_numbers),
                                draw_date: r.draw_date ? r.draw_date.slice(0, 10) : "", federal_lottery_ref: r.federal_lottery_ref || "",
                              });
                            }}><Eye className="h-3.5 w-3.5 text-primary" /></Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-border hover:bg-destructive/10 hover:border-destructive/30"
                              onClick={() => { if (confirm(`Remover "${r.title}"?`)) raffleMut.remove.mutate(r.id); }}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(!allRaffles || allRaffles.length === 0) && (
                  <div className="text-center py-12 bg-card/50 rounded-2xl border border-border/60">
                    <Ticket className="h-8 w-8 text-warning/20 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm font-body">Nenhuma rifa criada</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Crie sua primeira rifa acima</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
