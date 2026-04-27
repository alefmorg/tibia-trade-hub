import { useState, useMemo, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useItems, useCreateItem, useUpdateItem, useDeleteItem, useReorderItems, type Item, type ItemSource } from "@/hooks/useItems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem as SItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, ImagePlus, Plus, Search, Trash2, Upload, Image as ImageIcon, Check, X, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Mode = "single" | "bulk";

const SortableItemCard = ({
  item,
  onDelete,
  onEdit,
}: {
  item: Item;
  onDelete: (id: string) => void;
  onEdit: (item: Item) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-card/80 border border-border/60 rounded-xl p-2.5 hover:border-primary/40 hover:shadow-[0_0_15px_hsl(var(--primary)/0.1)] transition-all"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 p-1 rounded bg-secondary/80 opacity-0 group-hover:opacity-100 hover:bg-primary/20 cursor-grab active:cursor-grabbing transition-opacity"
        title="Arrastar para reordenar"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </button>

      {/* Actions */}
      <div className="absolute top-1 right-1 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(item)}
          className="p-1 rounded bg-secondary/80 hover:bg-primary/20 text-primary"
          title="Editar"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={() => {
            if (confirm(`Remover "${item.name}"?`)) onDelete(item.id);
          }}
          className="p-1 rounded bg-secondary/80 hover:bg-destructive/20 text-destructive"
          title="Remover"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Image */}
      <div className="aspect-square bg-secondary/40 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-2" />
        ) : (
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground truncate font-body" title={item.name}>
          {item.name}
        </p>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold truncate max-w-full">
            {item.category || "Geral"}
          </span>
          {item.tier != null && item.tier > 0 && (
            <span className="text-[9px] bg-warning/15 text-warning px-1.5 py-0.5 rounded font-bold">
              T{item.tier}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ItemsAdminPanel = () => {
  const { data: items } = useItems();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const reorderItems = useReorderItems();

  const [activeSource, setActiveSource] = useState<ItemSource>("tibia");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("__all");
  const [mode, setMode] = useState<Mode>("single");

  // Single add form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Geral");
  const [newCategoryInput, setNewCategoryInput] = useState("");
  // tier removido do form de criação — só configurável no edit
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Bulk
  const [bulkNames, setBulkNames] = useState("");
  const [bulkCategory, setBulkCategory] = useState("Geral");
  const [bulkNewCategoryInput, setBulkNewCategoryInput] = useState("");
  const [bulkImages, setBulkImages] = useState<Record<number, File>>({});
  const bulkFileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Edit dialog state (inline)
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTier, setEditTier] = useState<string>("none");
  const [editSource, setEditSource] = useState<ItemSource>("tibia");

  // Local order overlay (for instant feedback during drag)
  const [localOrder, setLocalOrder] = useState<Record<string, string[]>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const sourceItems = useMemo(
    () => (items || []).filter((i) => i.source === activeSource),
    [items, activeSource],
  );

  const allCategories = useMemo(
    () => [...new Set(sourceItems.map((i) => i.category || "Geral"))].sort(),
    [sourceItems],
  );

  const filteredItems = useMemo(() => {
    let list = sourceItems;
    if (filterCategory !== "__all") list = list.filter((i) => (i.category || "Geral") === filterCategory);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(s));
    }
    // Apply local optimistic order if exists
    const groupKey = `${activeSource}-${filterCategory}`;
    const localIds = localOrder[groupKey];
    if (localIds && !search.trim()) {
      const map = new Map(list.map((i) => [i.id, i]));
      const ordered = localIds.map((id) => map.get(id)).filter(Boolean) as Item[];
      const newOnes = list.filter((i) => !localIds.includes(i.id));
      return [...ordered, ...newOnes];
    }
    return list;
  }, [sourceItems, filterCategory, search, localOrder, activeSource]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    const finalCat = category === "__new" ? newCategoryInput.trim() || "Geral" : category;
    await createItem.mutateAsync({
      name: name.trim(),
      imageFile: imageFile || undefined,
      category: finalCat,
      source: activeSource,
      tier: null,
    });
    setName("");
    setImageFile(null);
    setImagePreview(null);
    setCategory("Geral");
    setNewCategoryInput("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleBulkAdd = async () => {
    const names = bulkNames.split("\n").map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    const finalCat = bulkCategory === "__new" ? bulkNewCategoryInput.trim() || "Geral" : bulkCategory;
    for (let i = 0; i < names.length; i++) {
      await createItem.mutateAsync({
        name: names[i],
        imageFile: bulkImages[i] || undefined,
        category: finalCat,
        source: activeSource,
      });
    }
    setBulkNames("");
    setBulkImages({});
    setBulkCategory("Geral");
    setBulkNewCategoryInput("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredItems.findIndex((i) => i.id === active.id);
    const newIndex = filteredItems.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const newOrder = arrayMove(filteredItems, oldIndex, newIndex);
    const ids = newOrder.map((i) => i.id);

    // Optimistic local order
    const groupKey = `${activeSource}-${filterCategory}`;
    setLocalOrder((prev) => ({ ...prev, [groupKey]: ids }));

    // Persist sort_order
    const updates = ids.map((id, idx) => ({ id, sort_order: idx }));
    reorderItems.mutate(updates);
  };

  const startEdit = (item: Item) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category || "Geral");
    setEditTier(item.tier ? String(item.tier) : "none");
    setEditSource((item.source as ItemSource) || "tibia");
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    await updateItem.mutateAsync({
      id: editingItem.id,
      name: editName.trim(),
      category: editCategory,
      tier: editTier !== "none" ? Number(editTier) : null,
      source: editSource,
    } as any);
    setEditingItem(null);
  };

  const counts = useMemo(
    () => ({
      tibia: (items || []).filter((i) => i.source === "tibia").length,
      custom: (items || []).filter((i) => i.source === "custom").length,
    }),
    [items],
  );

  return (
    <div className="space-y-4">
      {/* Source tabs */}
      <div className="flex items-center gap-2 bg-card/60 border border-border/60 rounded-xl p-1.5">
        {(["tibia", "custom"] as ItemSource[]).map((src) => (
          <button
            key={src}
            onClick={() => {
              setActiveSource(src);
              setFilterCategory("__all");
            }}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeSource === src
                ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.15)]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <span className="capitalize">{src === "tibia" ? "Tibia" : "Custom"}</span>
            <Badge variant="secondary" className="text-[10px]">
              {counts[src]}
            </Badge>
          </button>
        ))}
      </div>

      {/* Add form */}
      <div className="bg-card/80 border border-border/60 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 font-body">
            <Plus className="h-4 w-4 text-primary" /> Adicionar Itens em <span className="text-primary capitalize">{activeSource}</span>
          </h3>
          <div className="flex gap-1">
            <Button size="sm" variant={mode === "single" ? "default" : "outline"} onClick={() => setMode("single")} className="text-xs h-7">
              Individual
            </Button>
            <Button size="sm" variant={mode === "bulk" ? "default" : "outline"} onClick={() => setMode("bulk")} className="text-xs h-7">
              Em Massa
            </Button>
          </div>
        </div>

        {mode === "single" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-body">Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Golden Armor" className="bg-secondary/80 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-body">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-secondary/80 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((c) => (
                    <SItem key={c} value={c}>
                      {c}
                    </SItem>
                  ))}
                  <SItem value="Geral">Geral</SItem>
                  <SItem value="__new">+ Nova categoria...</SItem>
                </SelectContent>
              </Select>
              {category === "__new" && (
                <Input
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder="Nova categoria"
                  className="bg-secondary/80 border-border mt-1"
                  autoFocus
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-body">Imagem</Label>
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <Button type="button" variant="outline" size="sm" className="border-border" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1" /> {imageFile ? "Trocar" : "Upload"}
                </Button>
                {imagePreview && <img src={imagePreview} alt="" className="h-8 w-8 object-contain rounded border border-border" />}
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd} disabled={createItem.isPending || !name.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                {createItem.isPending ? "Salvando..." : "Adicionar"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-body">Categoria (para todos)</Label>
                <Select value={bulkCategory} onValueChange={setBulkCategory}>
                  <SelectTrigger className="bg-secondary/80 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SItem value="Geral">Geral</SItem>
                    {allCategories.map((c) => (
                      <SItem key={c} value={c}>
                        {c}
                      </SItem>
                    ))}
                    <SItem value="__new">+ Nova categoria...</SItem>
                  </SelectContent>
                </Select>
                {bulkCategory === "__new" && (
                  <Input
                    value={bulkNewCategoryInput}
                    onChange={(e) => setBulkNewCategoryInput(e.target.value)}
                    placeholder="Nova categoria"
                    className="bg-secondary/80 border-border mt-1"
                    autoFocus
                  />
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-body">Nomes (um por linha)</Label>
              <Textarea
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                placeholder={"Golden Armor\nDemon Helmet"}
                className="bg-secondary/80 border-border min-h-[100px] font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                {bulkNames.split("\n").filter((n) => n.trim()).length} itens
              </p>
            </div>
            {bulkNames.split("\n").filter((n) => n.trim()).length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Imagens (opcional)</Label>
                {bulkNames
                  .split("\n")
                  .filter((n) => n.trim())
                  .map((n, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-6 text-right">{idx + 1}.</span>
                      <span className="text-foreground truncate flex-1">{n.trim()}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={(el) => {
                          bulkFileRefs.current[idx] = el;
                        }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setBulkImages((p) => ({ ...p, [idx]: f }));
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => bulkFileRefs.current[idx]?.click()}>
                        <ImagePlus className="h-3 w-3 mr-1" />
                        {bulkImages[idx] ? "Trocar" : "Img"}
                      </Button>
                      {bulkImages[idx] && <img src={URL.createObjectURL(bulkImages[idx])} alt="" className="h-7 w-7 object-contain rounded border border-border" />}
                    </div>
                  ))}
              </div>
            )}
            <Button onClick={handleBulkAdd} disabled={createItem.isPending || !bulkNames.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {createItem.isPending ? "Adicionando..." : `Adicionar ${bulkNames.split("\n").filter((n) => n.trim()).length} itens`}
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap bg-card/60 border border-border/60 rounded-xl p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar item..." className="pl-9 bg-secondary/80 border-border h-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="bg-secondary/80 border-border h-9 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SItem value="__all">Todas categorias</SItem>
            {allCategories.map((c) => (
              <SItem key={c} value={c}>
                {c}
              </SItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground ml-auto">
          {filteredItems.length} item(ns) — arraste para reordenar
        </p>
      </div>

      {/* Edit inline panel */}
      {editingItem && (
        <div className="bg-primary/5 border border-primary/30 rounded-xl p-4 flex items-end gap-3 flex-wrap">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="text-xs">Nome</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-secondary/80 border-border" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[180px]">
            <Label className="text-xs">Categoria</Label>
            <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="bg-secondary/80 border-border" />
          </div>
          <div className="space-y-1.5 w-32">
            <Label className="text-xs">Tier</Label>
            <Select value={editTier} onValueChange={setEditTier}>
              <SelectTrigger className="bg-secondary/80 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SItem value="none">Sem tier</SItem>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => (
                  <SItem key={t} value={String(t)}>
                    T{t}
                  </SItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={saveEdit} disabled={updateItem.isPending} className="bg-primary text-primary-foreground">
            <Check className="h-3.5 w-3.5 mr-1" /> Salvar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
            <X className="h-3.5 w-3.5 mr-1" /> Cancelar
          </Button>
        </div>
      )}

      {/* Grid + DnD */}
      <div className="bg-card/40 border border-border/60 rounded-xl p-4">
        {filteredItems.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">Nenhum item encontrado</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredItems.map((i) => i.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {filteredItems.map((item) => (
                  <SortableItemCard key={item.id} item={item} onDelete={(id) => deleteItem.mutate(id)} onEdit={startEdit} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default ItemsAdminPanel;
