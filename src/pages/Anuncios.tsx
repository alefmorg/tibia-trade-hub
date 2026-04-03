import { useState } from "react";
import Header from "@/components/Header";
import TradeCard from "@/components/TradeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, X, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockAds = [
  { title: "Heavily Bound Book", type: "selling" as const, price: "Aceita ofertas", world: "Gentebra", pvpType: "Optional PvP", username: "vdapedro", date: "02/04/2026, 10:01:08", likes: 1, featured: true },
  { title: "Crypt Strike", type: "buying" as const, price: "530.000.000", world: "Ombra", pvpType: "Open PvP", username: "thymanka", date: "03/04/2026, 08:08:52", likes: 0, featured: true },
  { title: "Rainbow Torch", type: "selling" as const, price: "Aceita ofertas", world: "Honbra", pvpType: "Open PvP", username: "mondayhalk", date: "13/09/2025, 13:21:27", likes: 10 },
  { title: "The Epic Wisdom", type: "selling" as const, price: "Aceita ofertas", world: "Yonabra", pvpType: "Optional PvP", username: "alfa", date: "02/01/2026, 21:21:00", likes: 4 },
  { title: "Ferumbras Doll", type: "selling" as const, price: "Aceita ofertas", world: "Yonabra", pvpType: "Optional PvP", username: "alfa", date: "02/01/2026, 21:20:20", likes: 4 },
  { title: "Golden Armor", type: "buying" as const, price: "15.000.000", world: "Antica", pvpType: "Optional PvP", username: "oldschool", date: "01/04/2026, 14:30:00", likes: 2 },
  { title: "Magic Plate Armor", type: "selling" as const, price: "8.500.000", world: "Secura", pvpType: "Optional PvP", username: "trader99", date: "03/04/2026, 09:15:00", likes: 5 },
  { title: "Thunder Hammer", type: "buying" as const, price: "120.000.000", world: "Lobera", pvpType: "Optional PvP", username: "hammertime", date: "02/04/2026, 17:45:00", likes: 3 },
];

const categories = ["Item", "Casa"];
const battleEyeTypes = ["Amarelo", "Verde"];
const pvpTypes = ["Optional", "Open", "Retro Open", "Hardcore", "Retro Hardcore"];
const adTypes = ["Vendendo", "Comprando"];
const continents = ["Mainland", "Rookgaard"];

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

const Anuncios = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [pvpFilter, setPvpFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [onlyWithPrice, setOnlyWithPrice] = useState(false);
  const [sortBy, setSortBy] = useState("most_liked");
  const navigate = useNavigate();

  const activeFilterCount = typeFilter.length + pvpFilter.length + categoryFilter.length + (onlyWithPrice ? 1 : 0);

  const toggleFilter = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    setArr(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  const clearFilters = () => {
    setTypeFilter([]);
    setPvpFilter([]);
    setCategoryFilter([]);
    setOnlyWithPrice(false);
  };

  const filtered = mockAds.filter((ad) => {
    const matchSearch = ad.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter.length === 0 || typeFilter.includes(ad.type === "selling" ? "Vendendo" : "Comprando");
    const matchPvp = pvpFilter.length === 0 || pvpFilter.some(p => ad.pvpType.toLowerCase().includes(p.toLowerCase()));
    const matchPrice = !onlyWithPrice || ad.price !== "Aceita ofertas";
    return matchSearch && matchType && matchPvp && matchPrice;
  });

  const featuredAds = filtered.filter(ad => ad.featured);
  const regularAds = filtered.filter(ad => !ad.featured);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Search Bar */}
      <div className="border-b border-border bg-card/50">
        <div className="container py-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Busque por itens ou casas"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border h-11"
            />
          </div>
          <Button className="bg-secondary text-foreground border border-border hover:bg-secondary/80 h-11 px-6">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6"
            onClick={() => navigate("/criar-anuncio")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar anúncio
          </Button>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </h3>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Categoria</h4>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <FilterChip
                    key={cat}
                    label={cat}
                    active={categoryFilter.includes(cat)}
                    onClick={() => toggleFilter(categoryFilter, setCategoryFilter, cat)}
                  />
                ))}
              </div>
            </div>

            {/* Somente com preço */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Somente com preço</span>
              <Switch checked={onlyWithPrice} onCheckedChange={setOnlyWithPrice} />
            </div>

            {/* Servidor */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Servidor</h4>
              <Select>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Todos servidores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos servidores</SelectItem>
                  <SelectItem value="gentebra">Gentebra</SelectItem>
                  <SelectItem value="honbra">Honbra</SelectItem>
                  <SelectItem value="ombra">Ombra</SelectItem>
                  <SelectItem value="antica">Antica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* BattleEye */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">BattleEye</h4>
              <div className="flex flex-wrap gap-2">
                {battleEyeTypes.map(be => (
                  <FilterChip
                    key={be}
                    label={be}
                    active={false}
                    color={be === "Amarelo" ? "bg-warning" : "bg-success"}
                    onClick={() => {}}
                  />
                ))}
              </div>
            </div>

            {/* Tipo de PvP */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Tipo de PvP</h4>
              <div className="flex flex-wrap gap-2">
                {pvpTypes.map(pvp => (
                  <FilterChip
                    key={pvp}
                    label={pvp}
                    active={pvpFilter.includes(pvp)}
                    onClick={() => toggleFilter(pvpFilter, setPvpFilter, pvp)}
                  />
                ))}
              </div>
            </div>

            {/* Tipo do anúncio */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Tipo do anúncio</h4>
              <div className="flex flex-wrap gap-2">
                {adTypes.map(t => (
                  <FilterChip
                    key={t}
                    label={t}
                    active={typeFilter.includes(t)}
                    color={t === "Vendendo" ? "bg-destructive" : "bg-primary"}
                    onClick={() => toggleFilter(typeFilter, setTypeFilter, t)}
                  />
                ))}
              </div>
            </div>

            {/* Continente */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Continente</h4>
              <div className="flex flex-wrap gap-2">
                {continents.map(c => (
                  <FilterChip
                    key={c}
                    label={c}
                    active={false}
                    onClick={() => {}}
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Active Filters & Sort */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full font-pixel">
                      {activeFilterCount}
                    </span>
                  )}
                </span>
              </div>
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

            <p className="text-sm text-muted-foreground mb-6">{filtered.length} resultados</p>

            {/* Featured Ads */}
            {featuredAds.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-foreground font-body">Anúncios destacados</h2>
                  <button className="text-xs text-warning flex items-center gap-1 hover:underline">
                    🔥 Destaque seu anúncio!
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featuredAds.map((ad, i) => (
                    <TradeCard key={`featured-${i}`} {...ad} featured />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Ads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {regularAds.map((ad, i) => (
                <TradeCard key={i} {...ad} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Anuncios;
