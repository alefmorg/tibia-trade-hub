import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TradeCard from "@/components/TradeCard";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, ExternalLink, X, SlidersHorizontal, Flame, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LiveStreamersWidget from "@/components/LiveStreamersWidget";
import { usePagedAds } from "@/hooks/useAds";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAuth } from "@/hooks/useAuth";
import { pvpTypes } from "@/lib/tibia-worlds";
import { useWorlds } from "@/hooks/useWorlds";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavLinks, useSiteBanners } from "@/hooks/useSiteConfig";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { useAllFilterOptionItems } from "@/hooks/useFilterOptionItems";
import { useSiteAssets } from "@/hooks/useSiteAssets";
import { useRaffles } from "@/hooks/useRaffles";
import SponsorsCarousel from "@/components/SponsorsCarousel";

const adTypes = ["Vendendo", "Comprando"];

const FilterChip = ({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 flex items-center gap-1.5 font-medium ${
      active
        ? "bg-primary/15 border-primary/40 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.1)]"
        : "bg-secondary/60 border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
    }`}
  >
    {color && <span className={`w-2 h-2 rounded-full ${color}`} />}
    {label}
  </button>
);

const Index = () => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [pvpFilter, setPvpFilter] = useState<string | undefined>();
  const [worldFilter, setWorldFilter] = useState<string | undefined>();
  const [categoryFilterId, setCategoryFilterId] = useState<string | undefined>();
  const [onlyWithPrice, setOnlyWithPrice] = useState(false);
  const [sortBy, setSortBy] = useState("most_liked");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: navLinks } = useNavLinks(true);
  const { data: banners } = useSiteBanners(true);
  const { data: filterOptions } = useFilterOptions("category", true);
  const { data: filterLinks } = useAllFilterOptionItems();
  const { data: worldsData } = useWorlds(true);
  const rubinotWorlds = (worldsData || []).map(w => ({ name: w.name, pvp: w.pvp_type, region: w.region }));
  const { getCurrencyIcon } = useSiteAssets();
  const { data: activeRaffles } = useRaffles(true);

  // Itens vinculados à categoria escolhida (array vazio = não há itens, retorna 0 resultados)
  const itemIds = useMemo(() => {
    if (!categoryFilterId) return undefined;
    const ids = (filterLinks || []).filter(l => l.filter_option_id === categoryFilterId).map(l => l.item_id);
    return ids.length === 0 ? ["__none__"] : ids;
  }, [filterLinks, categoryFilterId]);

  // Debounce da busca para não disparar query a cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;

  // Reset à página 1 quando filtros/busca mudam
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, pvpFilter, worldFilter, categoryFilterId, onlyWithPrice, sortBy]);

  const {
    data: pagedData,
    isLoading,
    isFetching,
  } = usePagedAds(
    {
      search,
      type: typeFilter === "Vendendo" ? "selling" : typeFilter === "Comprando" ? "buying" : undefined,
      pvpType: pvpFilter,
      world: worldFilter,
      itemIds,
      onlyWithPrice,
      sortBy,
    },
    page,
    PAGE_SIZE,
  );

  const ads = pagedData?.items ?? [];
  const total = pagedData?.total ?? 0;
  const totalPages = pagedData?.totalPages ?? 1;

  const activeFilterCount = [typeFilter, pvpFilter, worldFilter, categoryFilterId].filter(Boolean).length + (onlyWithPrice ? 1 : 0);

  const clearFilters = useCallback(() => {
    setTypeFilter(undefined);
    setPvpFilter(undefined);
    setWorldFilter(undefined);
    setCategoryFilterId(undefined);
    setOnlyWithPrice(false);
  }, []);

  const featuredAds = useMemo(() => ads.filter((ad) => ad.featured), [ads]);
  const regularAds = useMemo(() => ads.filter((ad) => !ad.featured), [ads]);

  const listTopRef = useRef<HTMLDivElement | null>(null);
  const goToPage = useCallback((p: number) => {
    const target = Math.max(1, Math.min(totalPages, p));
    setPage(target);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [totalPages]);

  // Gera lista de páginas com elipses (1 … prev cur next … last)
  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) add(i);
    } else {
      add(1);
      if (page > 3) pages.push("ellipsis");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i);
      if (page < totalPages - 2) pages.push("ellipsis");
      add(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section - Welcome + Social + Banners */}
      <div className="container py-5">
        <div className="flex flex-col gap-4">
          {/* Welcome Card */}
          <div className="bg-card/80 border border-border/60 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {/* Logo */}
            <div className="shrink-0">
              <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Flame className="h-10 w-10 text-primary" />
              </div>
            </div>
            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-lg font-bold text-foreground mb-1">
                Bem-vindo ao <span className="text-primary">Rubin TRADE</span>!
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                Encontre os melhores itens, equipamentos e trades do servidor RubinOT.
              </p>
            </div>
            {/* Streamers parceiros ao vivo */}
            <LiveStreamersWidget />
            {/* Social Icons */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-center">
              {(navLinks && navLinks.length > 0 ? navLinks : []).map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg"
                  style={{ backgroundColor: link.color }}
                  title={link.label}
                >
                  {link.icon_url ? (
                    <img src={link.icon_url} alt={link.label} className="w-5 h-5 object-contain brightness-0 invert" />
                  ) : (
                    <ExternalLink className="w-4 h-4 text-white" />
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Banners Row: Destaques (TradeCards) + Rifa compacta + Banner extra */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Featured Items Showcase — usando o mesmo TradeCard */}
            <div className="md:col-span-2 lg:col-span-4 relative overflow-hidden rounded-2xl border border-warning/25 bg-card">
              <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-warning/10 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-12 w-56 h-56 rounded-full bg-primary/10 blur-3xl" />

              <div className="relative p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15 border border-warning/30">
                      <Flame className="h-3.5 w-3.5 text-warning" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground tracking-tight">Itens em Destaque</h3>
                      <p className="text-[10px] text-muted-foreground/80">Anúncios promovidos pelos vendedores</p>
                    </div>
                  </div>
                  {featuredAds.length > 0 && (
                    <span className="text-[9px] font-bold text-warning uppercase tracking-widest bg-warning/10 border border-warning/25 px-2 py-1 rounded-full">
                      Top {Math.min(3, featuredAds.length)}
                    </span>
                  )}
                </div>

                {featuredAds.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {featuredAds.slice(0, 3).map((ad) => (
                      <TradeCard
                        key={ad.id}
                        id={ad.id}
                        title={ad.title}
                        type={ad.type as "selling" | "buying"}
                        price={ad.price}
                        currency={ad.currency}
                        world={ad.world}
                        pvpType={ad.pvp_type}
                        date={ad.created_at}
                        imageUrl={ad.image_url}
                        likes={ad.likes_count}
                        featured={ad.featured}
                        tier={(ad as any).tier}
                        profiles={ad.profiles}
                        userId={ad.user_id}
                        category={ad.category}
                      />
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(user ? "/perfil" : "/login")}
                    className="group relative w-full overflow-hidden rounded-xl border-2 border-warning/40 min-h-[260px] flex flex-col sm:flex-row items-center gap-5 p-6 sm:p-8 text-left transition-all duration-300 hover:border-warning/70 hover:shadow-[0_0_40px_hsl(var(--warning)/0.35)]"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(var(--warning) / 0.18) 0%, hsl(var(--card)) 45%, hsl(var(--primary) / 0.12) 100%)",
                    }}
                  >
                    {/* Animated orbs */}
                    <span aria-hidden className="pointer-events-none absolute -top-12 -left-10 w-44 h-44 rounded-full bg-warning/30 blur-3xl animate-pulse" />
                    <span aria-hidden className="pointer-events-none absolute -bottom-16 -right-10 w-56 h-56 rounded-full bg-primary/25 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                    {/* Diagonal shine */}
                    <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative shrink-0 flex flex-col items-center justify-center">
                      <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-warning to-warning/60 flex items-center justify-center shadow-[0_0_30px_hsl(var(--warning)/0.5)] group-hover:scale-105 transition-transform duration-300">
                        <Flame className="h-12 w-12 text-warning-foreground drop-shadow-md animate-pulse" strokeWidth={2.4} />
                      </div>
                      <span className="mt-3 text-[9px] font-pixel uppercase tracking-widest text-warning">Espaço VIP</span>
                    </div>

                    <div className="relative flex-1 min-w-0 text-center sm:text-left space-y-3">
                      <div>
                        <h4 className="font-pixel text-base sm:text-xl text-foreground leading-tight mb-1">
                          Seu anúncio <span className="text-warning">no topo</span>
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
                          Fure a fila, ganhe destaque dourado e venda <span className="text-warning font-semibold">3x mais rápido</span>.
                        </p>
                      </div>
                      <ul className="hidden sm:flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-foreground/80">
                        <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-warning" /> Fixado no topo da home</li>
                        <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-warning" /> Selo dourado de destaque</li>
                        <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-warning" /> Mais visualizações e ofertas</li>
                      </ul>
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-warning text-warning-foreground font-bold text-sm shadow-[0_8px_24px_hsl(var(--warning)/0.4)] group-hover:shadow-[0_12px_32px_hsl(var(--warning)/0.6)] transition-all">
                        <Megaphone className="h-4 w-4" />
                        Destacar meu anúncio
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Coluna lateral: Rifa compacta (em cima) + Banner extra (embaixo) */}
            <div className="md:col-span-2 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-1 gap-4">
              {/* Rifa compacta com item em pedestal */}
              {activeRaffles && activeRaffles.length > 0 ? (
                <Link
                  to={`/rifa/${activeRaffles[0].id}`}
                  className="relative block overflow-hidden rounded-2xl border border-warning/30 bg-card group transition-all duration-300 hover:border-warning/60 hover:shadow-[0_0_30px_hsl(var(--warning)/0.15)]"
                >
                  {/* Background decorativo */}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-warning/[0.05] via-transparent to-primary/[0.05]" />
                  <div aria-hidden className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-warning/10 blur-2xl" />

                  <div className="relative p-3 flex items-center gap-3">
                    {/* Pedestal com item 64x64 */}
                    <div className="shrink-0 flex flex-col items-center">
                      <div
                        className="w-16 h-16 flex items-center justify-center bg-gradient-to-b from-warning/20 to-warning/5 group-hover:scale-105 transition-transform duration-300"
                        style={{
                          borderRadius: 2,
                          boxShadow: "0 0 0 2px hsl(var(--warning) / 0.5), inset 0 0 8px hsl(var(--warning) / 0.2), 0 4px 0 hsl(var(--warning) / 0.4)",
                        }}
                      >
                        {activeRaffles[0].image_url ? (
                          <img
                            src={activeRaffles[0].image_url}
                            alt={activeRaffles[0].title}
                            className="w-12 h-12 object-contain"
                            style={{ imageRendering: "pixelated" as const }}
                          />
                        ) : (
                          <span className="text-2xl">🏆</span>
                        )}
                      </div>
                      {/* Base do pedestal */}
                      <div
                        className="w-20 h-1.5 -mt-0.5 bg-warning/30"
                        style={{ borderRadius: 1, boxShadow: "0 1px 0 hsl(var(--warning) / 0.5)" }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center gap-1 text-[8px] font-bold text-warning bg-warning/15 border border-warning/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                        <span className="w-1 h-1 rounded-full bg-warning animate-pulse" />
                        Rifa Ativa
                      </span>
                      <h3 className="text-sm font-bold text-foreground leading-tight group-hover:text-warning transition-colors line-clamp-1">
                        {activeRaffles[0].title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <img src={getCurrencyIcon("coins")} alt="" className="w-3 h-3 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        <span className="text-warning font-bold text-xs">{activeRaffles[0].price_per_number}</span>
                        <span className="text-[9px] text-muted-foreground">/bilhete</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="shrink-0 text-warning group-hover:translate-x-0.5 transition-transform">
                      →
                    </div>
                  </div>
                </Link>
              ) : (
                <Link
                  to="/rifa"
                  className="relative block overflow-hidden rounded-2xl border border-border bg-card hover:border-warning/30 transition-all group p-3 flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20 shrink-0">
                    <span className="text-xl">🎰</span>
                  </div>
                  <p className="text-xs text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">Nenhuma rifa ativa</p>
                </Link>
              )}

              {/* Bloco Patrocinadores — carrossel rotativo */}
              <SponsorsCarousel banners={banners as any} />

            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-border/60">
        <div className="container py-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full max-w-2xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Busque por itens, equipamentos, armas..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-11 bg-secondary/80 border-border h-12 rounded-xl text-base focus:border-primary/40 focus:bg-secondary transition-all duration-200"
            />
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-7 rounded-xl font-semibold transition-all duration-200 hover:shadow-[0_0_16px_hsl(var(--primary)/0.2)]"
            onClick={() => navigate("/criar-anuncio")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar anúncio
          </Button>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-5 sticky top-20">
            <div className="bg-card/80 border border-border rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 font-body">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Filtros
                </h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Limpar
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-xl">
                <span className="text-sm text-foreground">Somente com preço</span>
                <Switch checked={onlyWithPrice} onCheckedChange={setOnlyWithPrice} />
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Servidor</h4>
                <Select value={worldFilter || "all"} onValueChange={(v) => setWorldFilter(v === "all" ? undefined : v)}>
                  <SelectTrigger className="bg-secondary/80 border-border rounded-xl">
                    <SelectValue placeholder="Todos servidores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos servidores</SelectItem>
                    {rubinotWorlds.map(w => (
                      <SelectItem key={w.name} value={w.name}>{w.name} ({w.pvp})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo de PvP</h4>
                <div className="flex flex-wrap gap-1.5">
                  {pvpTypes.map(pvp => (
                    <FilterChip key={pvp} label={pvp.replace(" PvP", "")} active={pvpFilter === pvp} onClick={() => setPvpFilter(pvpFilter === pvp ? undefined : pvp)} />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo do anúncio</h4>
                <div className="flex flex-wrap gap-1.5">
                  {adTypes.map(t => (
                    <FilterChip key={t} label={t} active={typeFilter === t} color={t === "Vendendo" ? "bg-destructive" : "bg-primary"} onClick={() => setTypeFilter(typeFilter === t ? undefined : t)} />
                  ))}
                </div>
              </div>

              {(filterOptions && filterOptions.length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categorias</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {filterOptions.map((opt) => (
                      <FilterChip
                        key={opt.id}
                        label={opt.label}
                        active={categoryFilterId === opt.id}
                        onClick={() => setCategoryFilterId(categoryFilterId === opt.id ? undefined : opt.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

          </aside>

          {/* Main Content */}
          <main ref={listTopRef} className="flex-1 min-w-0 max-w-4xl scroll-mt-20">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {total} resultado{total === 1 ? "" : "s"}
                </span>
                {activeFilterCount > 0 && (
                  <span className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full font-semibold">
                    {activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-44 bg-secondary/80 border-border rounded-xl h-10 px-4 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most_liked">Mais curtidos</SelectItem>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-2xl bg-secondary/50" />
                ))}
              </div>
            ) : (
              <>
                {featuredAds.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-foreground font-body flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                        Anúncios destacados
                      </h2>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 border border-warning/20 text-warning text-xs px-3 py-1 font-semibold">
                        ✨ Destaque seu anúncio!
                      </span>
                    </div>
                    <div className="trade-card-list-featured">
                      {featuredAds.map((ad) => (
                        <TradeCard key={ad.id} id={ad.id} title={ad.title} type={ad.type as "selling" | "buying"} price={ad.price} currency={ad.currency} world={ad.world} pvpType={ad.pvp_type} date={ad.created_at} imageUrl={ad.image_url} likes={ad.likes_count} featured tier={(ad as any).tier} profiles={ad.profiles} userId={ad.user_id} category={ad.category} />
                      ))}
                    </div>
                  </div>
                )}
                {regularAds.length > 0 ? (
                  <div className="trade-card-list">
                    {regularAds.map((ad) => (
                      <TradeCard key={ad.id} id={ad.id} title={ad.title} type={ad.type as "selling" | "buying"} price={ad.price} currency={ad.currency} world={ad.world} pvpType={ad.pvp_type} date={ad.created_at} imageUrl={ad.image_url} likes={ad.likes_count} tier={(ad as any).tier} profiles={ad.profiles} userId={ad.user_id} category={ad.category} />
                    ))}
                  </div>
                ) : featuredAds.length === 0 ? (
                  <div className="text-center py-20 bg-card/50 rounded-2xl border border-border">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-muted-foreground text-sm mb-1">Nenhum anúncio encontrado</p>
                    <p className="text-muted-foreground/60 text-xs mb-5">Tente ajustar seus filtros ou crie o primeiro anúncio</p>
                    <Button className="bg-primary text-primary-foreground rounded-xl" onClick={() => navigate("/criar-anuncio")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeiro anúncio
                    </Button>
                  </div>
                ) : null}

                {totalPages > 1 && (
                  <Pagination className="mt-8">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={(e) => { e.preventDefault(); if (page > 1) goToPage(page - 1); }}
                          className={`cursor-pointer ${page === 1 ? "pointer-events-none opacity-40" : ""}`}
                        />
                      </PaginationItem>
                      {pageNumbers.map((p, idx) =>
                        p === "ellipsis" ? (
                          <PaginationItem key={`e-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={p}>
                            <PaginationLink
                              isActive={p === page}
                              onClick={(e) => { e.preventDefault(); goToPage(p); }}
                              className="cursor-pointer"
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={(e) => { e.preventDefault(); if (page < totalPages) goToPage(page + 1); }}
                          className={`cursor-pointer ${page === totalPages ? "pointer-events-none opacity-40" : ""}`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}

                {isFetching && !isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
