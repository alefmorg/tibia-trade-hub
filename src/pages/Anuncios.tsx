import { useState } from "react";
import Header from "@/components/Header";
import TradeCard from "@/components/TradeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";

const mockAds = [
  { title: "Heavily Bound Book", type: "selling" as const, price: "Aceita ofertas", world: "Gentebra", pvpType: "Optional PvP", username: "vdapedro", date: "02/04/2026", likes: 1 },
  { title: "Crypt Strike", type: "buying" as const, price: "530.000.000", world: "Ombra", pvpType: "Open PvP", username: "thymanka", date: "03/04/2026", likes: 0 },
  { title: "Rainbow Torch", type: "selling" as const, price: "Aceita ofertas", world: "Honbra", pvpType: "Open PvP", username: "mondayhalk", date: "13/09/2025", likes: 10 },
  { title: "The Epic Wisdom", type: "selling" as const, price: "Aceita ofertas", world: "Yonabra", pvpType: "Optional PvP", username: "alfa", date: "02/01/2026", likes: 4 },
  { title: "Ferumbras Doll", type: "selling" as const, price: "Aceita ofertas", world: "Yonabra", pvpType: "Optional PvP", username: "alfa", date: "02/01/2026", likes: 4 },
  { title: "Golden Armor", type: "buying" as const, price: "15.000.000", world: "Antica", pvpType: "Optional PvP", username: "oldschool", date: "01/04/2026", likes: 2 },
  { title: "Magic Plate Armor", type: "selling" as const, price: "8.500.000", world: "Secura", pvpType: "Optional PvP", username: "trader99", date: "03/04/2026", likes: 5 },
  { title: "Thunder Hammer", type: "buying" as const, price: "120.000.000", world: "Lobera", pvpType: "Optional PvP", username: "hammertime", date: "02/04/2026", likes: 3 },
];

const Anuncios = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "selling" | "buying">("all");

  const filtered = mockAds.filter((ad) => {
    const matchSearch = ad.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || ad.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container py-8">
        <h1 className="text-xl mb-6">Anúncios</h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar itens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "selling", "buying"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                className={filter === f ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "Todos" : f === "selling" ? "Vendendo" : "Comprando"}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{filtered.length} resultados</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ad, i) => (
            <TradeCard key={i} {...ad} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Anuncios;
