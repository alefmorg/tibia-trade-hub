import { useState } from "react";
import Header from "@/components/Header";
import TradeCard from "@/components/TradeCard";
import OffersPanel from "@/components/OffersPanel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, ExternalLink, X, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAds } from "@/hooks/useAds";
import { useAuth } from "@/hooks/useAuth";
import { rubinotWorlds, pvpTypes } from "@/lib/tibia-worlds";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavLinks, useSiteBanners } from "@/hooks/useSiteConfig";
import { useFilterOptions } from "@/hooks/useFilterOptions";

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

  const { data: ads, isLoading } = useAds({
    search,
    type: typeFilter === "Vendendo" ? "selling" : typeFilter === "Comprando" ? "buying" : undefined,
    pvpType: pvpFilter,
    world: worldFilter,
    category: categoryFilter,
    onlyWithPrice,
    sortBy,
  });

  const filterGroups = (filterOptions || []).reduce<Record<string, typeof filterOptions>>((acc, fo) => {
    if (!acc[fo.filter_group]) acc[fo.filter_group] = [];
    acc[fo.filter_group]!.push(fo);
    return acc;
  }, {});

  const activeFilterCount = [typeFilter, pvpFilter, worldFilter, categoryFilter, ...Object.values(customFilters)].filter(Boolean).length + (onlyWithPrice ? 1 : 0);

  const clearFilters = () => {
    setTypeFilter(undefined);
    setPvpFilter(undefined);
    setWorldFilter(undefined);
    setCategoryFilter(undefined);
    setCustomFilters({});
    setOnlyWithPrice(false);
  };

  const featuredAds = ads?.filter(ad => ad.featured) || [];
  const regularAds = ads?.filter(ad => !ad.featured) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

{/* Nav Links Bar - Sleek Gaming Style */}
      {navLinks && navLinks.length > 0 && (
        <div className="border-b border-border/40 bg-[#0d0d0d]/80 backdrop-blur-sm">
          <div className="container py-2.5">
            <div className="flex items-center justify-between">
              {/* Left: Navigation Links */}
              <div className="flex items-center gap-1">
                {navLinks.filter(l => !l.label.toLowerCase().includes('discord') && !l.label.toLowerCase().includes('youtube')).map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target={link.url.startsWith('http') ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground/80 transition-all duration-200 hover:text-foreground hover:bg-white/[0.03]"
                  >
                    {link.icon_url && (
                      <img 
                        src={link.icon_url} 
                        alt="" 
                        className="w-4 h-4 object-contain opacity-60 group-hover:opacity-100 transition-opacity" 
                      />
                    )}
                    <span>{link.label}</span>
                    {link.url.startsWith('http') && (
                      <ExternalLink className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-40 group-hover:ml-0 transition-all" />
                    )}
                  </a>
                ))}
              </div>

              {/* Right: Social Icons */}
              <div className="flex items-center gap-1">
                {navLinks.filter(l => l.label.toLowerCase().includes('discord') || l.label.toLowerCase().includes('youtube') || l.icon_url).slice(0, 4).map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground/60 transition-all duration-200 hover:text-foreground hover:bg-white/[0.05]"
                    title={link.label}
                  >
                    {link.icon_url ? (
                      <img src={link.icon_url} alt="" className="w-5 h-5 object-contain" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Site Banner */}
      {banners && banners.length > 0 && (
        <div className="border-b border-border/60">
          <div className="container py-3">
            <div className="flex flex-col gap-3">
              {banners.map((banner) => (
                <a
                  key={banner.id}
                  href={banner.link_url || "#"}
                  target={banner.link_url?.startsWith("http") ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="block w-full rounded-xl overflow-hidden transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                >
                  {banner.image_url ? (
                    <img src={banner.image_url} alt={banner.title || "Banner"} className="w-full h-auto max-h-24 object-cover rounded-xl" />
                  ) : banner.title ? (
                    <div className="bg-primary/8 border border-primary/15 rounded-xl px-6 py-4 text-center">
                      <p className="text-sm font-semibold text-primary">{banner.title}</p>
                    </div>
                  ) : null}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

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
