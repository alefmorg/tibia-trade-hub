import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TradeCard from "@/components/TradeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Search, Plus, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { usePagedAds } from "@/hooks/useAds";
import { useHouses } from "@/hooks/useHouses";

const PAGE_SIZE = 24;

const HousesPage = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<"selling" | "buying" | undefined>();
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const { data: houses } = useHouses();

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => setPage(1), [search, cityFilter, typeFilter, sortBy]);

  const cities = useMemo(() => {
    const s = new Set<string>();
    (houses || []).forEach((h) => h.city && s.add(h.city));
    return Array.from(s).sort();
  }, [houses]);

  const { data: pagedData, isLoading } = usePagedAds(
    { search, type: typeFilter, category: "house", sortBy },
    page,
    PAGE_SIZE,
  );

  const ads = useMemo(() => {
    const items = pagedData?.items ?? [];
    if (!cityFilter) return items;
    // ad.house_city é uma coluna extra — não tipada no hook, acessamos via any.
    return items.filter((a: any) => a.house_city === cityFilter);
  }, [pagedData, cityFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8 max-w-6xl">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl mb-6 p-8 bg-gradient-to-br from-warning/15 via-card to-primary/10 border border-warning/20">
          <div aria-hidden className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-warning/15 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-warning to-warning/60 flex items-center justify-center shadow-lg shadow-warning/30">
              <Home className="h-8 w-8 text-warning-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold leading-tight">Houses do Tibia</h1>
              <p className="text-sm text-muted-foreground">
                Compre e venda casas — catálogo oficial da TibiaWiki/Fandom
              </p>
            </div>
            <Button
              onClick={() => navigate("/criar-anuncio")}
              className="bg-warning text-warning-foreground hover:bg-warning/90 rounded-xl gap-2"
            >
              <Plus className="h-4 w-4" /> Anunciar house
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome da house..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          <Select value={cityFilter || "all"} onValueChange={(v) => setCityFilter(v === "all" ? undefined : v)}>
            <SelectTrigger className="h-11 rounded-xl">
              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Todas cidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas cidades</SelectItem>
              {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? undefined : (v as any))}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Vendendo + Comprando</SelectItem>
              <SelectItem value="selling">Vendendo</SelectItem>
              <SelectItem value="buying">Comprando</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{ads.length} resultado{ads.length === 1 ? "" : "s"}</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 h-9 rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="most_liked">Mais curtidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-20 bg-card/50 rounded-2xl border border-border">
            <Home className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm mb-4">Nenhum anúncio de house encontrado</p>
            <Link to="/criar-anuncio">
              <Button className="bg-warning text-warning-foreground rounded-xl">
                <Plus className="h-4 w-4 mr-2" /> Criar primeiro anúncio
              </Button>
            </Link>
          </div>
        ) : (
          <div className="trade-card-list">
            {ads.map((ad: any) => (
              <TradeCard
                key={ad.id}
                id={ad.id}
                title={ad.title}
                type={ad.type}
                price={ad.price}
                currency={ad.currency}
                world={ad.world}
                pvpType={ad.pvp_type}
                date={ad.created_at}
                imageUrl={ad.image_url}
                likes={ad.likes_count}
                featured={ad.featured}
                profiles={ad.profiles}
                userId={ad.user_id}
                category="house"
                expiresAt={ad.expires_at}
                featuredUntil={ad.featured_until}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default HousesPage;
