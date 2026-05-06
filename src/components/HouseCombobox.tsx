import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { House } from "@/hooks/useHouses";

interface Props {
  houses: House[];
  value: string;
  onSelect: (houseId: string) => void;
}

const HouseCombobox = ({ houses, value, onSelect }: Props) => {
  const [open, setOpen] = useState(false);
  const selected = houses.find((h) => h.id === value);

  const grouped = useMemo(() => {
    const g: Record<string, House[]> = {};
    for (const h of houses) {
      const c = h.city || "Sem cidade";
      (g[c] = g[c] || []).push(h);
    }
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
  }, [houses]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-secondary border-border h-12 text-sm font-normal rounded-xl hover:bg-secondary/80 transition-colors"
        >
          {selected ? (
            <span className="flex items-center gap-2.5 truncate">
              <Home className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate font-medium">{selected.name}</span>
              {selected.city && (
                <span className="shrink-0 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {selected.city}
                </span>
              )}
              {selected.beds != null && (
                <span className="shrink-0 text-[10px] text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                  {selected.beds}🛏
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar house...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por nome ou cidade..." className="h-11" />
          <CommandList>
            <CommandEmpty>Nenhuma house encontrada.</CommandEmpty>
            {grouped.map(([city, list]) => (
              <CommandGroup
                key={city}
                heading={city}
                className="[&_[cmdk-group-heading]]:text-primary [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
              >
                {list.map((h) => (
                  <CommandItem
                    key={h.id}
                    value={`${h.name} ${city}`}
                    onSelect={() => {
                      onSelect(h.id);
                      setOpen(false);
                    }}
                    className="py-2.5 px-3 cursor-pointer"
                  >
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === h.id ? "opacity-100 text-primary" : "opacity-0")} />
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">{h.name}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                        {h.beds ?? "?"}🛏 · {h.size_sqm ?? "?"}sqm
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default HouseCombobox;
