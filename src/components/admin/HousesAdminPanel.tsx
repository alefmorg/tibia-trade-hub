import { useState, useMemo } from "react";
import { useHouses, useImportHouses, useDeleteHouse, useBackfillHouseImages } from "@/hooks/useHouses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Trash2, Home, Search, Loader2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { safeHref } from "@/lib/safe-url";

export default function HousesAdminPanel() {
  const { data: houses, isLoading } = useHouses();
  const importMut = useImportHouses();
  const backfillMut = useBackfillHouseImages();
  const del = useDeleteHouse();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return (houses || []).filter(
      (h) => !s || h.name.toLowerCase().includes(s) || (h.city || "").toLowerCase().includes(s),
    );
  }, [houses, search]);

  const byCity = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    filtered.forEach((h) => {
      const k = h.city || "Sem cidade";
      (map[k] = map[k] || []).push(h);
    });
    return map;
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Home className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Houses (TibiaWiki)</h2>
            <p className="text-[11px] text-muted-foreground">
              Catálogo importado de tibiawiki.com.br/wiki/Todas_as_casas
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => backfillMut.mutate()}
            disabled={backfillMut.isPending}
            variant="outline"
            className="gap-2"
            title="Busca thumbnails no Tibia Fandom para houses sem imagem (lotes de 80)"
          >
            {backfillMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            Buscar imagens (Fandom)
          </Button>
          <Button
            onClick={() => importMut.mutate()}
            disabled={importMut.isPending}
            className="gap-2"
          >
            {importMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Importar da TibiaWiki
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (houses || []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma house cadastrada. Clique em <b>Importar da TibiaWiki</b> para popular o catálogo.
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {Object.keys(byCity).sort().map((city) => (
            <div key={city}>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                {city} <span className="opacity-60">({byCity[city].length})</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {byCity[city].map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 p-2.5 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{h.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {h.beds ?? "?"} cama(s) · {h.size_sqm ?? "?"} sqm · {h.rent_gold?.toLocaleString() ?? "?"} gp
                      </p>
                    </div>
                    {h.wiki_url && (
                      <a href={safeHref(h.wiki_url)} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => confirm(`Remover ${h.name}?`) && del.mutate(h.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
