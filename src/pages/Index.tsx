import { useState } from "react";
import Header from "@/components/Header";
import TradeCard from "@/components/TradeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAds } from "@/hooks/useAds";
import { rubinotWorlds, pvpTypes } from "@/lib/tibia-worlds";
import { Skeleton } from "@/components/ui/skeleton";

const adTypes = ["Vendendo", "Comprando"];

const FilterChip = ({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
      active
        ? "bg-primary/15 border-primary/40 text-primary"
        : "bg-secondary/50 border-border text-muted-foreground hover:border-muted-foreground/50"
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
  const [onlyWithPrice, setOnlyWithPrice] = useState(false);
  const [sortBy, setSortBy] = useState("most_liked");
  const navigate = useNavigate();

  const { data: ads, isLoading } = useAds({
    search,
    type: typeFilter === "Vendendo" ? "selling" : typeFilter === "Comprando" ? "buying" : undefined,
    pvpType: pvpFilter,
    world: worldFilter,
    onlyWithPrice,
    sortBy,
  });

  const activeFilterCount = [typeFilter, pvpFilter, worldFilter].filter(Boolean).length + (onlyWithPrice ? 1 : 0);

  const clearFilters = () => {
    setTypeFilter(undefined);
    setPvpFilter(undefined);
    setWorldFilter(undefined);
    setOnlyWithPrice(false);
  };

  const featuredAds = ads?.filter(ad => ad.featured) || [];
  const regularAds = ads?.filter(ad => !ad.featured) || [];

  return (
    <div className="min-h-screen">
      <Header />

      <div className="border-b border-border bg-card/50">
        <div className="container py-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Busque por itens..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-border h-11" />
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6" onClick={() => navigate("/criar-anuncio")}>
            <Plus className="h-4 w-4 mr-2" />
            Criar anúncio
          </Button>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 shrink-0 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </h3>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline">Limpar filtros</button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Somente com preço</span>
              <Switch checked={onlyWithPrice} onCheckedChange={setOnlyWithPrice} />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Servidor</h4>
              <Select value={worldFilter || "all"} onValueChange={(v) => setWorldFilter(v === "all" ? undefined : v)}>
                <SelectTrigger className="bg-secondary border-border">
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
              <h4 className="text-sm font-medium text-foreground">Tipo de PvP</h4>
              <div className="flex flex-wrap gap-2">
                {pvpTypes.map(pvp => (
                  <FilterChip key={pvp} label={pvp.replace(" PvP", "")} active={pvpFilter === pvp} onClick={() => setPvpFilter(pvpFilter === pvp ? undefined : pvp)} />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Tipo do anúncio</h4>
              <div className="flex flex-wrap gap-2">
                {adTypes.map(t => (
                  <FilterChip key={t} label={t} active={typeFilter === t} color={t === "Vendendo" ? "bg-destructive" : "bg-primary"} onClick={() => setTypeFilter(typeFilter === t ? undefined : t)} />
                ))}
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                Filtros
                {activeFilterCount > 0 && (
                  <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full font-pixel">{activeFilterCount}</span>
                )}
              </span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-44 bg-secondary border-border">
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

            <p className="text-sm text-muted-foreground mb-6">{ads?.length || 0} resultados</p>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 rounded-lg" />)}
              </div>
            ) : (
              <>
                {featuredAds.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-foreground font-body">Anúncios destacados</h2>
                      <span className="text-xs text-warning flex items-center gap-1">🔥 Destaque seu anúncio!</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {featuredAds.map((ad) => (
                        <TradeCard key={ad.id} id={ad.id} title={ad.title} type={ad.type as "selling" | "buying"} price={ad.price} world={ad.world} pvpType={ad.pvp_type} date={ad.created_at} imageUrl={ad.image_url} likes={ad.likes_count} featured profiles={ad.profiles} />
                      ))}
                    </div>
                  </div>
                )}
                {regularAds.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {regularAds.map((ad) => (
                      <TradeCard key={ad.id} id={ad.id} title={ad.title} type={ad.type as "selling" | "buying"} price={ad.price} world={ad.world} pvpType={ad.pvp_type} date={ad.created_at} imageUrl={ad.image_url} likes={ad.likes_count} profiles={ad.profiles} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground text-sm">Nenhum anúncio encontrado</p>
                    <Button className="mt-4 bg-primary text-primary-foreground" onClick={() => navigate("/criar-anuncio")}>Criar primeiro anúncio</Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <p className="font-pixel text-[10px]">Rubin <span className="text-accent">TRADE</span></p>
        <p className="mt-2">© 2026 — Plataforma não oficial. RubinOT é marca da D'FATO GAMES.</p>
      </footer>
    </div>
  );
};

export default Index;
