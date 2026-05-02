import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Globe2, Tags, ArrowUp, ArrowDown } from "lucide-react";
import { useFilterOptions, useFilterOptionsMutations } from "@/hooks/useFilterOptions";
import { useWorlds, useWorldMutations } from "@/hooks/useWorlds";
import { pvpTypes } from "@/lib/tibia-worlds";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "opcao";

// Grupos pré-definidos: o admin não precisa entender o conceito de "grupo" — mostramos abas.
const GROUPS: { key: string; label: string; description: string }[] = [
  { key: "category", label: "Categorias", description: "Tipos de itens (ex: Armas, Armaduras, Anéis)." },
  { key: "tier", label: "Tiers", description: "Níveis de itens (ex: T1, T2, T3)." },
];

export default function FiltersAdminPanel() {
  const { data: filterOptions } = useFilterOptions();
  const fmut = useFilterOptionsMutations();

  const { data: worlds } = useWorlds();
  const wmut = useWorldMutations();

  const [activeGroup, setActiveGroup] = useState<string>(GROUPS[0].key);
  const [newLabel, setNewLabel] = useState("");

  const [worldName, setWorldName] = useState("");
  const [worldPvp, setWorldPvp] = useState<string>("Optional PvP");
  const [worldRegion, setWorldRegion] = useState("South America");

  const groupOptions = useMemo(
    () => (filterOptions || []).filter((o) => o.filter_group === activeGroup)
      .sort((a, b) => a.sort_order - b.sort_order),
    [filterOptions, activeGroup]
  );

  const addOption = () => {
    const label = newLabel.trim();
    if (!label) return;
    const value = slugify(label);
    const sort_order = groupOptions.length;
    fmut.create.mutate(
      { filter_group: activeGroup, label, value, sort_order, active: true },
      { onSuccess: () => setNewLabel("") }
    );
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = groupOptions.findIndex((o) => o.id === id);
    const target = groupOptions[idx + dir];
    if (!target) return;
    fmut.update.mutate({ id, sort_order: target.sort_order });
    fmut.update.mutate({ id: target.id, sort_order: groupOptions[idx].sort_order });
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
              <Switch
                checked={w.active}
                onCheckedChange={(v) => wmut.update.mutate({ id: w.id, active: v })}
              />
              <Button
                size="sm" variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => { if (confirm(`Remover "${w.name}"?`)) wmut.remove.mutate(w.id); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* FILTROS */}
      <Card className="p-5 bg-card/80 border-border/60">
        <div className="flex items-center gap-2 mb-1">
          <Tags className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold font-body">Filtros do site</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4 font-body">
          Escolha o tipo de filtro e adicione opções. Elas aparecem como chips na página inicial.
        </p>

        <div className="flex gap-2 mb-4 flex-wrap">
          {GROUPS.map((g) => (
            <Button
              key={g.key}
              size="sm"
              variant={activeGroup === g.key ? "default" : "outline"}
              onClick={() => setActiveGroup(g.key)}
              className={activeGroup === g.key ? "bg-primary text-primary-foreground" : ""}
            >
              {g.label}
            </Button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground mb-3 font-body">
          {GROUPS.find((g) => g.key === activeGroup)?.description}
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nome da opção (ex: Armaduras)"
            className="bg-secondary/80 border-border"
            onKeyDown={(e) => e.key === "Enter" && addOption()}
          />
          <Button onClick={addOption} disabled={!newLabel.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>

        <div className="space-y-2">
          {groupOptions.map((o, i) => (
            <div key={o.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/40 border border-border/40">
              <div className="flex flex-col">
                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" disabled={i === 0} onClick={() => move(o.id, -1)}>
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" disabled={i === groupOptions.length - 1} onClick={() => move(o.id, 1)}>
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <Input
                  value={o.label}
                  onChange={(e) => fmut.update.mutate({ id: o.id, label: e.target.value, value: slugify(e.target.value) })}
                  className="h-8 bg-background/60 border-border text-sm"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] text-muted-foreground">Ativo</Label>
                <Switch checked={o.active} onCheckedChange={(v) => fmut.update.mutate({ id: o.id, active: v })} />
              </div>
              <Button
                size="sm" variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => { if (confirm(`Remover "${o.label}"?`)) fmut.remove.mutate(o.id); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {groupOptions.length === 0 && (
            <p className="text-center py-6 text-muted-foreground text-xs font-body">
              Nenhuma opção neste grupo. Adicione a primeira acima.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
