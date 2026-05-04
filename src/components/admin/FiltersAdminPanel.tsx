import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Globe2, Tags, ArrowUp, ArrowDown, X, Search } from "lucide-react";
import { useFilterOptions, useFilterOptionsMutations, type FilterOption } from "@/hooks/useFilterOptions";
import { useWorlds, useWorldMutations } from "@/hooks/useWorlds";
import { useItems } from "@/hooks/useItems";
import { useAllFilterOptionItems, useFilterOptionItemMutations } from "@/hooks/useFilterOptionItems";
import { pvpTypes } from "@/lib/tibia-worlds";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "categoria";

const FILTER_GROUP = "category"; // único grupo: Categorias

export default function FiltersAdminPanel() {
  // Categorias (filter_options do grupo "category")
  const { data: filterOptions } = useFilterOptions(FILTER_GROUP);
  const fmut = useFilterOptionsMutations();

  // Vínculos categoria <-> itens
  const { data: links } = useAllFilterOptionItems();
  const linksMut = useFilterOptionItemMutations();

  // Itens cadastrados
  const { data: items } = useItems();

  // Mundos
  const { data: worlds } = useWorlds();
  const wmut = useWorldMutations();

  const [newLabel, setNewLabel] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState("");

  const [worldName, setWorldName] = useState("");
  const [worldPvp, setWorldPvp] = useState<string>("Optional PvP");
  const [worldRegion, setWorldRegion] = useState("South America");

  const categories = useMemo(
    () => (filterOptions || []).slice().sort((a, b) => a.sort_order - b.sort_order),
    [filterOptions]
  );

  const linksByOption = useMemo(() => {
    const m = new Map<string, string[]>();
    (links || []).forEach(l => {
      const arr = m.get(l.filter_option_id) || [];
      arr.push(l.item_id);
      m.set(l.filter_option_id, arr);
    });
    return m;
  }, [links]);

  const addCategory = () => {
    const label = newLabel.trim();
    if (!label) return;
    fmut.create.mutate(
      { filter_group: FILTER_GROUP, label, value: slugify(label), sort_order: categories.length, active: true },
      { onSuccess: () => setNewLabel("") }
    );
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = categories.findIndex(o => o.id === id);
    const target = categories[idx + dir];
    if (!target) return;
    fmut.update.mutate({ id, sort_order: target.sort_order });
    fmut.update.mutate({ id: target.id, sort_order: categories[idx].sort_order });
  };

  const addWorld = () => {
    const name = worldName.trim();
    if (!name) return;
    wmut.create.mutate(
      { name, pvp_type: worldPvp, region: worldRegion, sort_order: (worlds?.length ?? 0) },
      { onSuccess: () => setWorldName("") }
    );
  };

  return (
    <div className="space-y-6">
      {/* MUNDOS */}
      <Card className="p-5 bg-card/80 border-border/60">
        <div className="flex items-center gap-2 mb-1">
          <Globe2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold font-body">Mundos</h3>
          <Badge variant="outline" className="ml-auto">{worlds?.length ?? 0}</Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4 font-body">
          Mundos disponíveis ao criar anúncios e nos filtros do site.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px_auto] gap-2 mb-4">
          <Input
            value={worldName}
            onChange={(e) => setWorldName(e.target.value)}
            placeholder="Nome do mundo (ex: Novarian)"
            className="bg-secondary/80 border-border"
            onKeyDown={(e) => e.key === "Enter" && addWorld()}
          />
          <Select value={worldPvp} onValueChange={setWorldPvp}>
            <SelectTrigger className="bg-secondary/80 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {pvpTypes.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={worldRegion} onValueChange={setWorldRegion}>
            <SelectTrigger className="bg-secondary/80 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="South America">South America</SelectItem>
              <SelectItem value="North America">North America</SelectItem>
              <SelectItem value="Europe">Europe</SelectItem>
              <SelectItem value="Asia">Asia</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addWorld} disabled={!worldName.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(worlds || []).map((w) => (
            <div key={w.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/40 border border-border/40">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate font-body">{w.name}</div>
                <div className="text-[10px] text-muted-foreground font-body">{w.pvp_type} • {w.region || "—"}</div>
              </div>
              <Switch checked={w.active} onCheckedChange={(v) => wmut.update.mutate({ id: w.id, active: v })} />
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => { if (confirm(`Remover "${w.name}"?`)) wmut.remove.mutate(w.id); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* CATEGORIAS COM ITENS VINCULADOS */}
      <Card className="p-5 bg-card/80 border-border/60">
        <div className="flex items-center gap-2 mb-1">
          <Tags className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold font-body">Categorias de filtro</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4 font-body">
          Crie uma categoria (ex: <b>Raros</b>) e vincule os itens que devem aparecer nela (ex: Rotten Blood). Os usuários filtram por essa categoria na página inicial.
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nome da categoria (ex: Raros)"
            className="bg-secondary/80 border-border"
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <Button onClick={addCategory} disabled={!newLabel.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" /> Criar categoria
          </Button>
        </div>

        <div className="space-y-3">
          {categories.map((cat, i) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              i={i}
              total={categories.length}
              expanded={expandedId === cat.id}
              onToggle={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
              onMoveUp={() => move(cat.id, -1)}
              onMoveDown={() => move(cat.id, 1)}
              onUpdate={(patch) => fmut.update.mutate({ id: cat.id, ...patch })}
              onRemove={() => { if (confirm(`Remover "${cat.label}" e seus vínculos?`)) fmut.remove.mutate(cat.id); }}
              linkedItemIds={linksByOption.get(cat.id) || []}
              allItems={items || []}
              links={(links || []).filter(l => l.filter_option_id === cat.id)}
              search={itemSearch}
              setSearch={setItemSearch}
              onLink={(item_id) => linksMut.add.mutate({ filter_option_id: cat.id, item_id })}
              onUnlink={(linkId) => linksMut.remove.mutate(linkId)}
            />
          ))}
          {categories.length === 0 && (
            <p className="text-center py-6 text-muted-foreground text-xs font-body">
              Nenhuma categoria criada. Crie a primeira acima.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function CategoryRow({
  cat, i, total, expanded, onToggle, onMoveUp, onMoveDown, onUpdate, onRemove,
  linkedItemIds, allItems, links, search, setSearch, onLink, onUnlink,
}: any) {
  const linkedItems = (allItems as any[]).filter(it => linkedItemIds.includes(it.id));
  const availableItems = (allItems as any[]).filter(it => !linkedItemIds.includes(it.id));
  const filteredAvailable = search
    ? availableItems.filter(it => it.name.toLowerCase().includes(search.toLowerCase()))
    : availableItems;

  return (
    <div className="rounded-xl bg-secondary/30 border border-border/40">
      <div className="flex items-center gap-2 p-3">
        <div className="flex flex-col">
          <Button size="sm" variant="ghost" className="h-5 w-5 p-0" disabled={i === 0} onClick={onMoveUp}>
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-5 w-5 p-0" disabled={i === total - 1} onClick={onMoveDown}>
            <ArrowDown className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex-1 min-w-0">
          <Input
            value={cat.label}
            onChange={(e) => onUpdate({ label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
            className="h-8 bg-background/60 border-border text-sm font-medium"
          />
          <div className="text-[10px] text-muted-foreground mt-1 font-body">
            {linkedItems.length} item(ns) vinculado(s)
          </div>
        </div>
        <Switch checked={cat.active} onCheckedChange={(v) => onUpdate({ active: v })} />
        <Button size="sm" variant="outline" className="h-8" onClick={onToggle}>
          {expanded ? "Fechar" : "Vincular itens"}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {expanded && (
        <div className="p-3 pt-0 space-y-3 border-t border-border/40">
          {/* Itens vinculados */}
          <div>
            <div className="text-[11px] font-semibold text-foreground mb-2 font-body">
              Itens nesta categoria
            </div>
            {linkedItems.length === 0 ? (
              <p className="text-[11px] text-muted-foreground font-body">Nenhum item vinculado ainda.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {linkedItems.map(it => {
                  const link = links.find((l: any) => l.item_id === it.id);
                  return (
                    <span key={it.id} className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary rounded-full pl-2 pr-1 py-0.5 text-[11px]">
                      {it.image_url && <img src={it.image_url} alt="" className="h-4 w-4 object-contain" />}
                      {it.name}
                      <button onClick={() => link && onUnlink(link.id)} className="hover:bg-destructive/20 rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Buscar e adicionar */}
          <div>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar item para adicionar..."
                className="pl-7 h-8 bg-background/60 border-border text-sm"
              />
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1 bg-background/40 rounded-lg border border-border/40 p-1.5">
              {filteredAvailable.slice(0, 50).map(it => (
                <button key={it.id} onClick={() => onLink(it.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-primary/10 text-left">
                  {it.image_url && <img src={it.image_url} alt="" className="h-5 w-5 object-contain" />}
                  <span className="text-xs flex-1 truncate">{it.name}</span>
                  <span className="text-[10px] text-muted-foreground">{it.category}</span>
                  <Plus className="h-3 w-3 text-primary" />
                </button>
              ))}
              {filteredAvailable.length === 0 && (
                <p className="text-center text-[11px] text-muted-foreground py-3">Nenhum item disponível.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
