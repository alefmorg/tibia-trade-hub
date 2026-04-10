import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Item } from "@/hooks/useItems";

interface ItemComboboxProps {
  items: Item[];
  value: string;
  onSelect: (itemId: string) => void;
}

const ItemCombobox = ({ items, value, onSelect }: ItemComboboxProps) => {
  const [open, setOpen] = useState(false);

  const selectedItem = items.find((i) => i.id === value);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    for (const item of items) {
      const cat = item.category || "Geral";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-secondary border-border h-12 text-sm font-normal rounded-xl hover:bg-secondary/80 transition-colors"
        >
          {selectedItem ? (
            <span className="flex items-center gap-2.5 truncate">
              {selectedItem.image_url && (
                <img src={selectedItem.image_url} alt="" className="h-6 w-6 object-contain shrink-0 rounded" />
              )}
              <span className="truncate font-medium">{selectedItem.name}</span>
              {selectedItem.tier != null && (
                <span className="shrink-0 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-bold">
                  T{selectedItem.tier}
                </span>
              )}
              <span className="shrink-0 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {selectedItem.category}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar item...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Digite o nome do item..." className="h-11" />
          <CommandList>
            <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
            {groupedItems.map(([category, categoryItems]) => (
              <CommandGroup key={category} heading={category} className="[&_[cmdk-group-heading]]:text-primary [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                {categoryItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.name} ${category}`}
                    onSelect={() => {
                      onSelect(item.id);
                      setOpen(false);
                    }}
                    className="py-2.5 px-3 cursor-pointer"
                  >
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === item.id ? "opacity-100 text-primary" : "opacity-0")} />
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.image_url && (
                        <img src={item.image_url} alt="" className="h-7 w-7 object-contain shrink-0 rounded" />
                      )}
                      <span className="truncate font-medium">{item.name}</span>
                      {item.tier != null && (
                        <span className="shrink-0 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-bold">
                          T{item.tier}
                        </span>
                      )}
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

export default ItemCombobox;
