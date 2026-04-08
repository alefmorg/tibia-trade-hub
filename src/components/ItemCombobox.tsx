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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-secondary border-border h-10 text-sm font-normal"
        >
          {selectedItem ? (
            <span className="flex items-center gap-2 truncate">
              {selectedItem.image_url && (
                <img src={selectedItem.image_url} alt="" className="h-5 w-5 object-contain shrink-0" />
              )}
              <span className="truncate">{selectedItem.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Buscar item...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Digite o nome do item..." />
          <CommandList>
            <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === item.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex items-center gap-2">
                    {item.image_url && (
                      <img src={item.image_url} alt="" className="h-5 w-5 object-contain shrink-0" />
                    )}
                    <span>{item.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ItemCombobox;
