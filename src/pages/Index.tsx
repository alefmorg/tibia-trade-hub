import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Header from "@/components/Header";
import TradeCard from "@/components/TradeCard";
import OffersPanel from "@/components/OffersPanel";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, ExternalLink, X, SlidersHorizontal, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInfiniteAds } from "@/hooks/useAds";
import { useAuth } from "@/hooks/useAuth";
import { rubinotWorlds, pvpTypes } from "@/lib/tibia-worlds";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavLinks, useSiteBanners } from "@/hooks/useSiteConfig";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { useRaffles } from "@/hooks/useRaffles";

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
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [customFilters, setCustomFilters] = useState<Record<string, string | undefined>>({});
  const [onlyWithPrice, setOnlyWithPrice] = useState(false);
  const [sortBy, setSortBy] = useState("most_liked");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: navLinks } = useNavLinks(true);
  const { data: banners } = useSiteBanners(true);
  const { data: filterOptions } = useFilterOptions(undefined, true);
  const { data: activeRaffles } = useRaffles(true);

  // Debounce da busca para não disparar query a cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const {
    data: adsPages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteAds({
    search,
    type: typeFilter === "Vendendo" ? "selling" : typeFilter === "Comprando" ? "buying" : undefined,
    pvpType: pvpFilter,
    world: worldFilter,
    category: categoryFilter,
    onlyWithPrice,
    sortBy,
  });

  const ads = useMemo(() => adsPages?.pages.flatMap((p) => p.items) ?? [], [adsPages]);

  const filterGroups = useMemo(() => {
    return (filterOptions || []).reduce<Record<string, typeof filterOptions>>((acc, fo) => {
      if (!acc[fo.filter_group]) acc[fo.filter_group] = [];
      acc[fo.filter_group]!.push(fo);
      return acc;
    }, {});
  }, [filterOptions]);

  const activeFilterCount = [typeFilter, pvpFilter, worldFilter, categoryFilter, ...Object.values(customFilters)].filter(Boolean).length + (onlyWithPrice ? 1 : 0);

  const clearFilters = useCallback(() => {
    setTypeFilter(undefined);
    setPvpFilter(undefined);
    setWorldFilter(undefined);
    setCategoryFilter(undefined);
    setCustomFilters({});
    setOnlyWithPrice(false);
  }, []);

  const featuredAds = useMemo(() => ads.filter((ad) => ad.featured), [ads]);
  const regularAds = useMemo(() => ads.filter((ad) => !ad.featured), [ads]);

  // Sentinel para scroll infinito.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { rootMargin: "400px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section - Welcome + Social + Banners */}
      <div className="container py-5">
        <div className="flex flex-col gap-4">
          {/* Welcome Card */}
          <div className="bg-card/80 border border-border/60 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
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
            {/* Social Icons */}
            <div className="flex items-center gap-2 shrink-0">
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

          {/* Banners Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Featured Items Showcase */}
            <div className="bg-card/80 border border-border/60 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Itens em Destaque</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(featuredAds.length > 0 ? featuredAds.slice(0, 4) : regularAds?.slice(0, 4) || []).map((ad) => (
                  <Link
                    key={ad.id}
                    to={`/anuncio/${ad.id}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50 border border-border/40 hover:border-primary/30 hover:bg-secondary/80 transition-all duration-200 text-left group"
                  >
                    {ad.image_url ? (
                      <img src={ad.image_url} alt={ad.title} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border/40" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <Flame className="w-4 h-4 text-primary/60" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">{ad.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${ad.type === "selling" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>
                          {ad.type === "selling" ? "Venda" : "Compra"}
                        </span>
                        {ad.price && (
                          <span className="text-[10px] text-primary font-semibold">{ad.price} {ad.currency}</span>
                        )}
                      </div>
                      <p className="text-[9px] text-muted-foreground truncate mt-0.5">
                        por {ad.profiles?.username || "Anônimo"}
                      </p>
                    </div>
                  </Link>
                ))}
                {(!featuredAds.length && !regularAds?.length) && (
                  <div className="col-span-2 text-center py-4">
                    <p className="text-xs text-muted-foreground/60">Nenhum item em destaque</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Raffle Banner */}
            {activeRaffles && activeRaffles.length > 0 ? (
              <Link
                to={`/rifa/${activeRaffles[0].id}`}
                className="block w-full rounded-2xl overflow-hidden border border-warning/30 bg-gradient-to-br from-warning/10 via-warning/5 to-primary/5 transition-all duration-300 hover:border-warning/50 hover:shadow-[0_0_30px_hsl(var(--warning)/0.15)] group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent z-10" />
                {activeRaffles[0].image_url ? (
                  <img src={activeRaffles[0].image_url} alt={activeRaffles[0].title} className="w-full h-full min-h-[200px] object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                ) : (
                  <div className="h-full min-h-[200px] flex items-center justify-center relative">
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute -top-8 -right-8 w-32 h-32 bg-warning/10 rounded-full blur-2xl" />
                      <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-primary/10 rounded-full blur-2xl" />
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-warning/15 flex items-center justify-center border border-warning/25 shadow-lg shadow-warning/10 z-20">
                      <span className="text-3xl">🎰</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-warning transition-colors">{activeRaffles[0].title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-warning font-semibold bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          💰 {activeRaffles[0].price_per_number} coins/nº
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {activeRaffles[0].total_numbers} números
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-warning-foreground bg-warning/90 px-3 py-1.5 rounded-xl uppercase tracking-wider group-hover:bg-warning transition-colors shadow-lg shadow-warning/20">
                      Participar →
                    </span>
                  </div>
                </div>
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Ativa</span>
                </div>
              </Link>
            ) : banners && banners.length > 0 ? (
              <a
                href={banners[0].link_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-2xl overflow-hidden border border-border/60 bg-card/80 transition-all duration-200 hover:border-primary/30 group relative min-h-[200px]"
              >
                {banners[0].image_url ? (
                  <img src={banners[0].image_url} alt={banners[0].title || "Banner"} className="w-full h-full min-h-[200px] object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                ) : (
                  <div className="h-full min-h-[200px] flex flex-col items-center justify-center px-6 gap-2">
                    <p className="text-sm font-bold text-foreground">{banners[0].title || "Banner"}</p>
                  </div>
                )}
              </a>
            ) : (
              <Link to="/rifa" className="block bg-card/80 border border-border/60 rounded-2xl flex flex-col items-center justify-center min-h-[200px] gap-3 hover:border-warning/30 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center border border-warning/20 group-hover:bg-warning/15 transition-colors">
                  <span className="text-2xl">🎰</span>
                </div>
                <p className="text-xs text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">Nenhuma rifa ativa</p>
              </Link>
            )}
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

              {Object.entries(filterGroups).map(([group, options]) => (
                <div key={group} className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group === "category" ? "Categoria" : group}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(options || []).map((opt) => (
                      <FilterChip
                        key={opt.id}
                        label={opt.label}
                        active={group === "category" ? categoryFilter === opt.value : customFilters[group] === opt.value}
                        onClick={() => {
                          if (group === "category") {
                            setCategoryFilter(categoryFilter === opt.value ? undefined : opt.value);
                          } else {
                            setCustomFilters((prev) => ({
                              ...prev,
                              [group]: prev[group] === opt.value ? undefined : opt.value,
                            }));
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {user && <OffersPanel />}
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 max-w-4xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {ads?.length || 0} resultados
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
                  <SelectItem value="price_asc">Menor preço</SelectItem>
                  <SelectItem value="price_desc">Maior preço</SelectItem>
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
                        <TradeCard key={ad.id} id={ad.id} title={ad.title} type={ad.type as "selling" | "buying"} price={ad.price} currency={ad.currency} world={ad.world} pvpType={ad.pvp_type} date={ad.created_at} imageUrl={ad.image_url} likes={ad.likes_count} featured tier={(ad as any).tier} profiles={ad.profiles} userId={ad.user_id} />
                      ))}
                    </div>
                  </div>
                )}
                {regularAds.length > 0 ? (
                  <div className="trade-card-list">
                    {regularAds.map((ad) => (
                      <TradeCard key={ad.id} id={ad.id} title={ad.title} type={ad.type as "selling" | "buying"} price={ad.price} currency={ad.currency} world={ad.world} pvpType={ad.pvp_type} date={ad.created_at} imageUrl={ad.image_url} likes={ad.likes_count} tier={(ad as any).tier} profiles={ad.profiles} userId={ad.user_id} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-card/50 rounded-2xl border border-border">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-muted-foreground text-sm mb-1">Nenhum anúncio encontrado</p>
                    <p className="text-muted-foreground/60 text-xs mb-5">Tente ajustar seus filtros ou crie o primeiro anúncio</p>
                    <Button className="bg-primary text-primary-foreground rounded-xl" onClick={() => navigate("/criar-anuncio")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeiro anúncio
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <footer className="border-t border-border/60 py-10 text-center">
        <p className="font-pixel text-xs text-foreground/80">
          RUBIN <span className="text-primary">TRADE</span>
        </p>
        <p className="mt-3 text-xs text-muted-foreground/60 max-w-lg mx-auto leading-relaxed">
          © 2026 — Rubin TRADE. Este projeto é independente e não possui qualquer vínculo oficial com a empresa RubinOT.
          Todas as imagens e conteúdos relacionados aos itens do jogo Tibia são de propriedade da CipSoft GmbH.
        </p>
      </footer>
    </div>
  );
};

export default Index;
