import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useAllAdsAdmin, useDeleteAd } from "@/hooks/useAds";
import { useItems, useCreateItem, useDeleteItem } from "@/hooks/useItems";
import { useAdminData, type AdStatus, type AppRole } from "@/hooks/useAdmin";
import { useNavLinks, useNavLinksMutations, type NavLink } from "@/hooks/useSiteConfig";
import { useFilterOptions, useFilterOptionsMutations, type FilterOption } from "@/hooks/useFilterOptions";
import { useAllWallets, useAddBalance, useHighlightPlans, useHighlightPlansMutations } from "@/hooks/useWallet";
import { useSendNotification } from "@/hooks/useNotifications";
import { useAllDeposits, useApproveDeposit, useRejectDeposit, useDepositConfig } from "@/hooks/useDeposits";
import { DepositScreenshot } from "@/components/DepositScreenshot";
import { useRaffles, useRaffleNumbers, useRaffleMutations } from "@/hooks/useRaffles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ItemCombobox from "@/components/ItemCombobox";
import { rubinotWorlds } from "@/lib/tibia-worlds";
import { formatPriceWithDots, formatDisplayPrice } from "@/lib/price-utils";
import {
  Ban, BarChart3, Bell, Check, ChevronDown, ChevronUp, Coins, Eye, Filter, Image, Link2, MessageCircle,
  Megaphone, Package, Plus, Search, Shield, ShieldAlert, ShieldCheck, Star, Trash2, Upload, UserCog, Users, X,
  Settings, PanelLeft, Ticket, Wallet, ImagePlus, FileText, CheckSquare, Square, BadgeCheck, Award, Crown, Gem,
  Sparkles, Activity, Clock, ArrowRightLeft, LifeBuoy, DollarSign, Globe, Home,
} from "lucide-react";
import { useBadgeMutations, useUserBadges, type BadgeType } from "@/hooks/useUserBadges";
import UserBadgeControls from "@/components/admin/UserBadgeControls";
import IntermediationsPanel from "@/components/admin/IntermediationsPanel";
import SupportPanel from "@/components/admin/SupportPanel";
import FinancialPanel from "@/components/admin/FinancialPanel";

import RealtimeDashboard from "@/components/admin/RealtimeDashboard";
import CleanupPanel from "@/components/admin/CleanupPanel";
import RafflesAdminPanel from "@/components/admin/RafflesAdminPanel";
import VipAdminPanel from "@/components/admin/VipAdminPanel";
import ItemsAdminPanel from "@/components/admin/ItemsAdminPanel";
import SponsorsAdminPanel from "@/components/admin/SponsorsAdminPanel";
import AssetsAdminPanel from "@/components/admin/AssetsAdminPanel";
import StreamersAdminPanel from "@/components/admin/StreamersAdminPanel";
import FiltersAdminPanel from "@/components/admin/FiltersAdminPanel";
import ResetsPanel from "@/components/admin/ResetsPanel";
import AuditLogPanel from "@/components/admin/AuditLogPanel";
import RafflePageSettingsPanel from "@/components/admin/RafflePageSettingsPanel";
import WorldsAdminPanel from "@/components/admin/WorldsAdminPanel";
import HousesAdminPanel from "@/components/admin/HousesAdminPanel";

import AffiliateLinksPanel from "@/components/admin/AffiliateLinksPanel";
import WelcomePanel from "@/components/admin/WelcomePanel";

type TabKey = "ads" | "users" | "items" | "conversations" | "stats" | "nav-links" | "banners" | "filters" | "wallet" | "plans" | "notifications" | "deposits" | "raffles" | "raffle-page" | "intermediations" | "support" | "financial" | "settings" | "cleanup" | "assets" | "streamers" | "resets" | "audit" | "worlds" | "houses" | "affiliates" | "welcome";

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
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === "undefined" ? true : window.innerWidth >= 1024);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Geral");
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  const [bulkItemNames, setBulkItemNames] = useState("");
  const [bulkItemCategory, setBulkItemCategory] = useState("Geral");
  const [bulkNewCategoryInput, setBulkNewCategoryInput] = useState("");
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
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [winnerNumberInput, setWinnerNumberInput] = useState<Record<string, string>>({});
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | AppRole>("all");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "banned" | "vip">("all");

  const [adForm, setAdForm] = useState({
    itemId: "", type: "selling", price: "", currency: "kk",
    world: "", pvp_type: "Optional PvP", category: "item",
    description: "", tier: "", userId: "",
  });

  const {
    profiles, userRoles, tradeSettings, adsCountByUser,
    allConversations, allFavorites,
    updateAdStatus, toggleFeatured, updateUserRole, banUser, deleteUser,
    updateTradeSettings, deleteConversation,
    getConversationMessages, createAdAdmin,
  } = useAdminData(isAdmin);

  const { data: navLinks } = useNavLinks();
  const navLinksMut = useNavLinksMutations();

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
  const [setBalanceForm, setSetBalanceForm] = useState({ userId: "", target: "" });
  const [planForm, setPlanForm] = useState({ name: "", price_coins: "", duration_days: "", sort_order: "0" });
  const [editingPlan, setEditingPlan] = useState<string | null>(null);

  const [nlForm, setNlForm] = useState({ label: "", url: "", color: "#3B82F6", icon_url: "", sort_order: "0" });
  const [editingNl, setEditingNl] = useState<string | null>(null);


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
  const filteredProfiles = profiles.filter((p) => {
    const currentRole = getUserRole(p.user_id);
    const banned = Boolean((p as any).banned);
    const vipUntil = (p as any).vip_until as string | null | undefined;
    const isVip = !!vipUntil && new Date(vipUntil).getTime() > Date.now();
    const searchable = `${p.username} ${(p as any).email || ""} ${p.user_id}`.toLowerCase().includes(searchTerm);
    const matchesRole = userRoleFilter === "all" || currentRole === userRoleFilter;
    const matchesStatus = userStatusFilter === "all"
      || (userStatusFilter === "banned" && banned)
      || (userStatusFilter === "active" && !banned)
      || (userStatusFilter === "vip" && isVip);

    return searchable && matchesRole && matchesStatus;
  });
  const filteredConversations = allConversations.filter((c) => `${getAdTitle(c.ad_id)} ${getProfileName(c.buyer_id)} ${getProfileName(c.seller_id)}`.toLowerCase().includes(searchTerm));

  const stats = {
    totalAds: ads?.length || 0, activeAds: ads?.filter((a) => a.status === "active").length || 0,
    featuredAds: ads?.filter((a) => a.featured).length || 0,
    sellingAds: ads?.filter((a) => a.type === "selling").length || 0,
    buyingAds: ads?.filter((a) => a.type === "buying").length || 0,
    totalUsers: profiles.length, totalItems: items?.length || 0,
    totalConversations: allConversations.length, totalFavorites: allFavorites || 0,
    bannedUsers: profiles.filter((p) => (p as any).banned).length,
    pendingDeposits: allDeposits?.filter((d) => d.status === "pending").length || 0,
    activeRaffles: allRaffles?.filter((r) => r.status === "active").length || 0,
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setNewItemImage(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    const finalCategory = newItemCategory === "__new" ? (newCategoryInput.trim() || "Geral") : newItemCategory;
    await createItem.mutateAsync({ name: newItemName.trim(), imageFile: newItemImage || undefined, category: finalCategory });
    setNewItemName(""); setNewItemImage(null); setImagePreview(null);
    setNewItemCategory("Geral"); setNewCategoryInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBulkAddItems = async () => {
    const names = bulkItemNames.split("\n").map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    const finalCategory = bulkItemCategory === "__new" ? (bulkNewCategoryInput.trim() || "Geral") : bulkItemCategory;
    for (let i = 0; i < names.length; i++) {
      const imageFile = bulkItemImages[i] || undefined;
      await createItem.mutateAsync({ name: names[i], imageFile, category: finalCategory });
    }
    setBulkItemNames("");
    setBulkItemCategory("Geral"); setBulkNewCategoryInput("");
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
      price: adForm.price,
      currency: adForm.currency, world: adForm.world, pvp_type: adForm.pvp_type,
      category: adForm.category, description: adForm.description || undefined,
      image_url: selectedItem.image_url || undefined,
      tier: adForm.tier && adForm.tier !== "none" ? Number(adForm.tier) : null,
      user_id: adForm.userId || user.id,
    });
    setAdForm({ itemId: "", type: "selling", price: "", currency: "kk", world: "", pvp_type: "Optional PvP", category: "item", description: "", tier: "", userId: "" });
  };

  const sidebarSections = [
    {
      title: "GERAL",
      items: [
        { key: "stats" as TabKey, label: "Dashboard", icon: BarChart3 },
        { key: "ads" as TabKey, label: "Anúncios", icon: Package, badge: stats.totalAds },
        { key: "users" as TabKey, label: "Usuários", icon: Users, badge: stats.totalUsers },
        { key: "items" as TabKey, label: "Itens", icon: Image, badge: stats.totalItems },
        { key: "houses" as TabKey, label: "Houses", icon: Home },
      ],
    },
    {
      title: "NEGOCIAÇÕES",
      items: [
        { key: "conversations" as TabKey, label: "Conversas", icon: MessageCircle },
        { key: "intermediations" as TabKey, label: "Intermediações", icon: ArrowRightLeft },
        { key: "support" as TabKey, label: "Suporte / Tickets", icon: LifeBuoy },
      ],
    },
    {
      title: "MONETIZAÇÃO",
      items: [
        { key: "financial" as TabKey, label: "Financeiro", icon: DollarSign },
        { key: "wallet" as TabKey, label: "Saldo / Coins", icon: Coins },
        { key: "deposits" as TabKey, label: "Depósitos", icon: Wallet, badge: allDeposits?.filter(d => d.status === "pending").length || undefined },
        { key: "plans" as TabKey, label: "Planos Destaque", icon: Star },
        { key: "raffles" as TabKey, label: "Rifas", icon: Ticket },
        { key: "raffle-page" as TabKey, label: "Página Rifas", icon: Sparkles },
      ],
    },
    {
      title: "COMUNICAÇÃO",
      items: [
        { key: "notifications" as TabKey, label: "Notificações", icon: Bell },
        { key: "banners" as TabKey, label: "Patrocinadores", icon: Megaphone },
        { key: "streamers" as TabKey, label: "Streamers Parceiros", icon: Activity },
      ],
    },
    {
      title: "PERSONALIZAÇÃO",
      items: [
        { key: "assets" as TabKey, label: "Ícones do Site", icon: ImagePlus },
        { key: "welcome" as TabKey, label: "Tela de Boas-Vindas", icon: Sparkles },
        { key: "affiliates" as TabKey, label: "Links de Afiliado", icon: Link2 },
      ],
    },
    {
      title: "CONFIGURAÇÕES",
      items: [
        { key: "settings" as TabKey, label: "Geral", icon: Settings },
        { key: "filters" as TabKey, label: "Filtros", icon: Filter },
        { key: "worlds" as TabKey, label: "Mundos", icon: Globe },
        { key: "nav-links" as TabKey, label: "Links Nav", icon: Link2 },
        { key: "cleanup" as TabKey, label: "Limpeza Histórico", icon: Trash2 },
        { key: "resets" as TabKey, label: "Resets Manuais", icon: ShieldAlert },
        { key: "audit" as TabKey, label: "Auditoria", icon: Activity },
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
      <div className="flex flex-1 overflow-hidden relative">
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "w-[260px] translate-x-0" : "w-0 -translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden"} fixed lg:relative inset-y-0 left-0 z-40 lg:z-auto transition-all duration-300 border-r border-border/60 bg-card lg:bg-card/50 backdrop-blur-md shrink-0 flex flex-col`}>
          <div className="px-4 py-4 border-b border-border/60 bg-gradient-to-br from-primary/10 via-card to-card relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{backgroundImage:"radial-gradient(currentColor 1px, transparent 1px)", backgroundSize:"6px 6px"}} />
            <div className="relative flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-primary/15 border-2 border-primary/40 flex items-center justify-center shadow-[2px_2px_0_0_hsl(var(--primary)/0.25)]">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-pixel text-[11px] text-foreground leading-none">Admin Panel</p>
                <p className="text-[9px] text-muted-foreground mt-1 font-body uppercase tracking-wider">Rubin Trade</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-secondary text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
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
                      onClick={() => { setTab(key); setSearch(""); if (typeof window !== "undefined" && window.innerWidth < 1024) setSidebarOpen(false); }}
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

          {/* Sidebar footer: live status */}
          <div className="p-3 border-t border-border/60 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-secondary/50 border border-border/40 rounded-lg p-2 text-center">
                <p className="font-pixel text-sm text-primary leading-none">{stats.totalAds}</p>
                <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wider">Anúncios</p>
              </div>
              <div className="bg-secondary/50 border border-border/40 rounded-lg p-2 text-center">
                <p className="font-pixel text-sm text-warning leading-none">{stats.pendingDeposits}</p>
                <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wider">Depósitos</p>
              </div>
            </div>
            <button
              onClick={() => setTab("settings")}
              className="w-full flex items-center justify-center gap-2 h-8 rounded-lg border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors font-body"
            >
              <Sparkles className="h-3 w-3" /> Configurações Rápidas
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full min-w-0">
          {/* Top bar */}
          <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/60 px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-colors shrink-0">
                <PanelLeft className="h-4 w-4" />
              </button>
              <h1 className="text-sm font-semibold text-foreground font-body truncate">{getTabTitle()}</h1>
            </div>
            {["ads", "users", "conversations"].includes(tab) && (
              <div className="relative w-36 sm:w-64 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/80 border-border h-9 rounded-xl text-sm" />
              </div>
            )}
          </div>

          <div className="p-3 sm:p-6 space-y-6 max-w-full overflow-x-hidden">
            {/* STATS / DASHBOARD */}
            {tab === "stats" && (
              <RealtimeDashboard onNavigate={(t) => setTab(t as TabKey)} />
            )}

            {tab === "cleanup" && <CleanupPanel isAdmin={isAdmin} />}
            {tab === "resets" && <ResetsPanel />}
            {tab === "audit" && <AuditLogPanel getProfileName={getProfileName} />}
            {tab === "affiliates" && <AffiliateLinksPanel />}
            {tab === "welcome" && <WelcomePanel />}

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
                            <span className="flex items-center gap-1"><img src={`/icons/${ad.currency || "kk"}.webp`} alt="" className="w-4 h-4 object-contain" loading="lazy" />{ad.price}</span>
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
              <div className="space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-border/60 bg-card/80 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Usuários visíveis</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{filteredProfiles.length}</p>
                    <p className="mt-1 text-xs text-muted-foreground">resultado após busca e filtros</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card/80 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Admins + mods</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {profiles.filter((p) => {
                        const role = getUserRole(p.user_id);
                        return role === "admin" || role === "moderator";
                      }).length}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">contas com permissão elevada</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card/80 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">VIP ativos</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {profiles.filter((p) => {
                        const vipUntil = (p as any).vip_until as string | null | undefined;
                        return !!vipUntil && new Date(vipUntil).getTime() > Date.now();
                      }).length}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">usuários com benefício ativo</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card/80 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Banidos</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{profiles.filter((p) => Boolean((p as any).banned)).length}</p>
                    <p className="mt-1 text-xs text-muted-foreground">contas bloqueadas</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/80 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div className="space-y-1">
                      <h2 className="text-sm font-semibold text-foreground">Central de usuários</h2>
                      <p className="text-xs text-muted-foreground">Busca global, filtros rápidos e ações principais em um bloco mais legível.</p>
                    </div>
                    <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-xl">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-body">Filtrar por cargo</Label>
                        <Select value={userRoleFilter} onValueChange={(value) => setUserRoleFilter(value as "all" | AppRole)}>
                          <SelectTrigger className="bg-secondary/80 border-border">
                            <SelectValue placeholder="Todos os cargos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="moderator">Moderador</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-body">Filtrar por status</Label>
                        <Select value={userStatusFilter} onValueChange={(value) => setUserStatusFilter(value as "all" | "active" | "banned" | "vip")}>
                          <SelectTrigger className="bg-secondary/80 border-border">
                            <SelectValue placeholder="Todos os status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="active">Ativos</SelectItem>
                            <SelectItem value="vip">VIP</SelectItem>
                            <SelectItem value="banned">Banidos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="px-2.5 py-1">Busca: {search.trim() ? search : "todas as contas"}</Badge>
                    <Badge variant="outline" className="px-2.5 py-1">Cargo: {userRoleFilter === "all" ? "todos" : userRoleFilter}</Badge>
                    <Badge variant="outline" className="px-2.5 py-1">Status: {userStatusFilter === "all" ? "todos" : userStatusFilter}</Badge>
                    <Button
                      type="button"
                      variant="outline"
                      className="ml-auto border-border"
                      onClick={() => {
                        setUserRoleFilter("all");
                        setUserStatusFilter("all");
                        setSearch("");
                      }}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                </div>

                {filteredProfiles.length === 0 ? (
                  <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-10 text-center">
                    <p className="text-sm font-medium text-foreground">Nenhum usuário encontrado</p>
                    <p className="mt-1 text-xs text-muted-foreground">Tente mudar a busca ou os filtros ativos.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                    {filteredProfiles.map((profile) => {
                      const currentRole = getUserRole(profile.user_id);
                      const adsCount = Number((profile as any).ads_count ?? adsCountByUser[profile.user_id] ?? 0);
                      const isCurrentUser = profile.user_id === user.id;
                      const banned = isUserBanned(profile.user_id);
                      const email = (profile as any).email as string | undefined;
                      const walletBalance = Number((profile as any).wallet_balance ?? 0);
                      const conversationsCount = Number((profile as any).conversations_count ?? 0);
                      const offersSentCount = Number((profile as any).offers_sent_count ?? 0);
                      const favoritesCount = Number((profile as any).favorites_count ?? 0);
                      const vipUntil = (profile as any).vip_until as string | null | undefined;
                      const lastSignInAt = (profile as any).last_sign_in_at as string | null | undefined;
                      const vipActive = !!vipUntil && new Date(vipUntil).getTime() > Date.now();

                      return (
                        <div
                          key={profile.id}
                          className={`rounded-xl border p-4 transition-colors ${banned ? "border-destructive/30 bg-destructive/5" : "border-border/60 bg-card/80 hover:bg-card"}`}
                        >
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="flex min-w-0 gap-3">
                              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border border-border/60">
                                {profile.avatar_url ? (
                                  <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-primary text-base font-bold">{profile.username?.charAt(0).toUpperCase()}</span>
                                )}
                              </div>

                              <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate text-base font-semibold text-foreground">{profile.username}</h3>
                                  {currentRole === "admin" && <Badge className="gap-1 bg-primary text-primary-foreground"><ShieldCheck className="h-3 w-3" />Admin</Badge>}
                                  {currentRole === "moderator" && <Badge variant="secondary" className="gap-1"><ShieldAlert className="h-3 w-3" />Moderador</Badge>}
                                  {vipActive && <Badge variant="secondary" className="gap-1"><Crown className="h-3 w-3" />VIP</Badge>}
                                  {banned && <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" />Banido</Badge>}
                                  {isCurrentUser && <Badge variant="outline">Sua conta</Badge>}
                                </div>

                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <p className="truncate">{email || "Sem email visível"}</p>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                                    <span>Criado em {new Date(profile.created_at).toLocaleDateString("pt-BR")}</span>
                                    <span>Último login {lastSignInAt ? new Date(lastSignInAt).toLocaleDateString("pt-BR") : "—"}</span>
                                    <span>ID {profile.user_id.slice(0, 8)}...</span>
                                  </div>
                                </div>

                                <p className="text-sm text-foreground/80 line-clamp-2">
                                  {profile.bio?.trim() || "Sem bio preenchida."}
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2 xl:w-[240px]">
                              <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Saldo</p>
                                <p className="mt-1 text-sm font-semibold text-foreground">{walletBalance} coins</p>
                              </div>
                              <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">VIP</p>
                                <p className="mt-1 text-sm font-semibold text-foreground">{vipActive ? new Date(vipUntil!).toLocaleDateString("pt-BR") : "Inativo"}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                            <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Anúncios</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{adsCount}</p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Conversas</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{conversationsCount}</p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Ofertas</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{offersSentCount}</p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Favoritos</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{favoritesCount}</p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Status</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{banned ? "Bloqueado" : "Ativo"}</p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 xl:grid-cols-[180px_minmax(0,1fr)_auto] xl:items-start">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground font-body">Cargo</Label>
                              <Select value={currentRole} onValueChange={(v) => updateUserRole.mutate({ userId: profile.user_id, role: v as AppRole })} disabled={isCurrentUser}>
                                <SelectTrigger className="bg-secondary border-border">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user"><span className="flex items-center gap-1"><UserCog className="h-3 w-3" />Usuário</span></SelectItem>
                                  <SelectItem value="moderator"><span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3 text-warning" />Moderador</span></SelectItem>
                                  <SelectItem value="admin"><span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-primary" />Admin</span></SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="min-w-0 space-y-1.5">
                              <Label className="text-xs text-muted-foreground font-body">Selos e benefícios</Label>
                              <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                                <UserBadgeControls userId={profile.user_id} />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                              <Button size="sm" variant="outline" className="border-border" onClick={() => navigate(`/perfil/${profile.user_id}`)}>
                                <Eye className="h-3.5 w-3.5 mr-1" /> Ver perfil
                              </Button>
                              {email && (
                                <Button size="sm" variant="outline" className="border-border" onClick={() => window.open(`mailto:${email}`, "_blank")}>
                                  <MessageCircle className="h-3.5 w-3.5 mr-1" /> Email
                                </Button>
                              )}
                              {!isCurrentUser && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={banned ? "border-primary/40 text-primary hover:bg-primary/10" : "border-warning/40 text-warning hover:bg-warning/10"}
                                    onClick={() => banUser.mutate({ userId: profile.user_id, banned: !banned })}
                                  >
                                    <Ban className="h-3.5 w-3.5 mr-1" /> {banned ? "Desbanir" : "Banir"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                                    onClick={() => { if (confirm(`Remover "${profile.username}"?`)) deleteUser.mutate(profile.user_id); }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ITEMS TAB */}
            {tab === "items" && <ItemsAdminPanel />}

            {/* OFFERS TAB removed */}

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

            {/* INTERMEDIATIONS TAB */}
            {tab === "intermediations" && <IntermediationsPanel getProfileName={getProfileName} />}

            {/* SUPPORT TAB */}
            {tab === "support" && <SupportPanel getProfileName={getProfileName} />}

            {/* FINANCIAL TAB */}
            {tab === "financial" && <FinancialPanel getProfileName={getProfileName} />}

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

            {/* SPONSORS TAB */}
            {tab === "banners" && <SponsorsAdminPanel />}
            {tab === "streamers" && <StreamersAdminPanel />}
            {tab === "assets" && <AssetsAdminPanel />}

            {/* FILTERS TAB */}
            {tab === "filters" && <FiltersAdminPanel />}
            {tab === "worlds" && <WorldsAdminPanel />}
            {tab === "houses" && <HousesAdminPanel />}

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

                <div className="bg-card/80 border border-warning/30 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 font-body">
                    <Coins className="h-4 w-4 text-warning" />Definir saldo exato
                    <span className="text-[10px] text-muted-foreground font-normal">(substitui o saldo atual pelo valor que você digitar)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Usuário</Label>
                      <Select value={setBalanceForm.userId} onValueChange={(v) => setSetBalanceForm({ ...setBalanceForm, userId: v })}>
                        <SelectTrigger className="bg-secondary/80 border-border"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{profiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.username}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Saldo final desejado</Label>
                      <Input type="number" min={0} value={setBalanceForm.target} onChange={(e) => setSetBalanceForm({ ...setBalanceForm, target: e.target.value })} className="bg-secondary/80 border-border" placeholder="0" />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={async () => {
                          if (!setBalanceForm.userId || setBalanceForm.target === "") return;
                          const target = Number(setBalanceForm.target);
                          if (target < 0 || isNaN(target)) return;
                          const username = getProfileName(setBalanceForm.userId);
                          if (!confirm(`Definir saldo de ${username} para exatamente ${target} coins?`)) return;
                          try {
                            const { callAdminActionRaw } = await import("@/hooks/useAdmin");
                            await callAdminActionRaw("setUserBalance", { userId: setBalanceForm.userId, target });
                            const { toast } = await import("sonner");
                            toast.success(`Saldo de ${username} definido para ${target}`);
                            setSetBalanceForm({ userId: "", target: "" });
                          } catch (e: any) {
                            const { toast } = await import("sonner");
                            toast.error(e.message || "Erro ao definir saldo");
                          }
                        }}
                        className="bg-warning text-warning-foreground hover:bg-warning/90 w-full"
                      >
                        Definir saldo
                      </Button>
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
                        <DepositScreenshot
                          value={dep.screenshot_url}
                          asLink
                          linkClassName="shrink-0"
                          className="h-16 w-16 object-cover rounded-xl border border-border/40 hover:border-primary/40 transition-colors cursor-pointer"
                        />
                        
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
            {tab === "raffles" && <RafflesAdminPanel getProfileName={getProfileName} />}
            {tab === "raffle-page" && <RafflePageSettingsPanel />}

            {/* LOGS TAB */}
            {/* SETTINGS TAB */}
            {tab === "settings" && (
              <div className="space-y-5 max-w-4xl">
                <div className="bg-gradient-to-br from-primary/5 via-card to-card border-2 border-primary/20 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{backgroundImage:"radial-gradient(currentColor 1px, transparent 1px)", backgroundSize:"8px 8px"}} />
                  <div className="relative flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-md bg-primary/15 border-2 border-primary/40 flex items-center justify-center shadow-[2px_2px_0_0_hsl(var(--primary)/0.25)]">
                      <Settings className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-pixel text-sm text-foreground">Configurações Gerais</h2>
                      <p className="text-xs text-muted-foreground font-body">Ajustes que afetam todo o marketplace</p>
                    </div>
                  </div>
                </div>

                {/* Anúncios */}
                <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border/60 bg-secondary/30 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground font-body">Anúncios</h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Duração padrão (dias)</Label>
                      <div className="flex gap-2">
                        <Input type="number" min="1" max="365" value={adDurationDays} onChange={(e) => setAdDurationDays(e.target.value)} className="bg-secondary/80 border-border" />
                        <Button onClick={() => updateTradeSettings.mutate({ days: Number(adDurationDays) })} disabled={updateTradeSettings.isPending || !adDurationDays} className="bg-primary text-primary-foreground">
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Após este período os anúncios expiram automaticamente.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Atalhos</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setTab("intermediations")}><ArrowRightLeft className="h-3.5 w-3.5 mr-1" />Intermediações</Button>
                        <Button size="sm" variant="outline" onClick={() => setTab("filters")}><Filter className="h-3.5 w-3.5 mr-1" />Filtros</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Economia */}
                <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border/60 bg-secondary/30 flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-warning" />
                    <h3 className="text-sm font-semibold text-foreground font-body">Economia &amp; Depósitos</h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Personagem de depósito</Label>
                      <Input value={depositCharName} onChange={(e) => setDepositCharName(e.target.value)} placeholder="RubinBank" className="bg-secondary/80 border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">Taxa (gold por 1 coin)</Label>
                      <Input type="number" value={goldToCoinsRate} onChange={(e) => setGoldToCoinsRate(e.target.value)} placeholder="1000" className="bg-secondary/80 border-border" />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={() => updateTradeSettings.mutate({ deposit_char_name: depositCharName, gold_to_coins_rate: Number(goldToCoinsRate) } as any)} className="bg-primary text-primary-foreground w-full">
                        <Check className="h-4 w-4 mr-1" /> Salvar
                      </Button>
                    </div>
                    <div className="md:col-span-3 flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => setTab("deposits")}><Wallet className="h-3.5 w-3.5 mr-1" />Ver depósitos ({stats.pendingDeposits} pendentes)</Button>
                      <Button size="sm" variant="outline" onClick={() => setTab("wallet")}><Coins className="h-3.5 w-3.5 mr-1" />Saldo / Coins</Button>
                      <Button size="sm" variant="outline" onClick={() => setTab("plans")}><Star className="h-3.5 w-3.5 mr-1" />Planos de destaque</Button>
                    </div>
                  </div>
                </div>

                {/* VIP — desativado por feature flag */}
                {false && <VipAdminPanel />}

                {/* Comunidade */}
                <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border/60 bg-secondary/30 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground font-body">Comunidade</h3>
                  </div>
                  <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-border" onClick={() => setTab("users")}>
                      <Users className="h-5 w-5 text-primary" />
                      <span className="text-xs font-body">Usuários</span>
                      <span className="text-[10px] text-muted-foreground">{stats.totalUsers} total</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-border" onClick={() => setTab("notifications")}>
                      <Bell className="h-5 w-5 text-primary" />
                      <span className="text-xs font-body">Notificações</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-border" onClick={() => setTab("conversations")}>
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <span className="text-xs font-body">Conversas</span>
                      <span className="text-[10px] text-muted-foreground">{stats.totalConversations}</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-border" onClick={() => setTab("raffles")}>
                      <Ticket className="h-5 w-5 text-warning" />
                      <span className="text-xs font-body">Rifas</span>
                      <span className="text-[10px] text-muted-foreground">{stats.activeRaffles} ativas</span>
                    </Button>
                  </div>
                </div>

                {/* Visual / Site */}
                <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border/60 bg-secondary/30 flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground font-body">Aparência do site</h3>
                  </div>
                  <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-border" onClick={() => setTab("nav-links")}>
                      <Link2 className="h-5 w-5 text-primary" />
                      <span className="text-xs font-body">Links de navegação</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-border" onClick={() => setTab("banners")}>
                      <Image className="h-5 w-5 text-primary" />
                      <span className="text-xs font-body">Banners / Carrossel</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-border" onClick={() => setTab("filters")}>
                      <Filter className="h-5 w-5 text-primary" />
                      <span className="text-xs font-body">Opções de filtros</span>
                    </Button>
                  </div>
                </div>

                {/* Diagnóstico */}
                <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border/60 bg-secondary/30 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground font-body">Diagnóstico</h3>
                  </div>
                  <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-secondary/40 border border-border rounded-lg p-3 text-center">
                      <p className="font-pixel text-base text-primary">{stats.totalAds}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Anúncios</p>
                    </div>
                    <div className="bg-secondary/40 border border-border rounded-lg p-3 text-center">
                      <p className="font-pixel text-base text-warning">{stats.featuredAds}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Destaques</p>
                    </div>
                    <div className="bg-secondary/40 border border-border rounded-lg p-3 text-center">
                      <p className="font-pixel text-base text-destructive">{stats.bannedUsers}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Banidos</p>
                    </div>
                    <div className="bg-secondary/40 border border-border rounded-lg p-3 text-center">
                      <p className="font-pixel text-base text-foreground">{stats.totalItems}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Itens</p>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <Button variant="outline" size="sm" onClick={() => setTab("stats")} className="w-full">
                      <BarChart3 className="h-3.5 w-3.5 mr-1" /> Ver Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
