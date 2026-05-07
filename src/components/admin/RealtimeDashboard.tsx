import { useEffect, useMemo, useState } from "react";
import { useAdminStats } from "@/hooks/useRafflesAdmin";
import {
  Users, Package, MessageCircle, Coins, Wallet, Ticket, Activity,
  Star, LifeBuoy, TrendingUp, Heart, Ban, GripVertical, Eye, EyeOff,
  RotateCcw, Settings2, ArrowUpRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragOverlay, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, useSortable, rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface Props {
  onNavigate?: (tab: string) => void;
}

type CardDef = {
  id: string;
  label: string;
  value: number | string;
  sub?: string;
  icon: any;
  tone: "primary" | "warning" | "destructive" | "success" | "neutral";
  tab?: string;
};

const TONES: Record<CardDef["tone"], { text: string; ring: string; chip: string; glow: string; bar: string }> = {
  primary: {
    text: "text-primary",
    ring: "ring-primary/30",
    chip: "bg-primary/15 text-primary border-primary/30",
    glow: "from-primary/20 via-primary/5 to-transparent",
    bar: "bg-primary",
  },
  warning: {
    text: "text-warning",
    ring: "ring-warning/30",
    chip: "bg-warning/15 text-warning border-warning/30",
    glow: "from-warning/20 via-warning/5 to-transparent",
    bar: "bg-warning",
  },
  destructive: {
    text: "text-destructive",
    ring: "ring-destructive/30",
    chip: "bg-destructive/15 text-destructive border-destructive/30",
    glow: "from-destructive/20 via-destructive/5 to-transparent",
    bar: "bg-destructive",
  },
  success: {
    text: "text-emerald-400",
    ring: "ring-emerald-500/30",
    chip: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    glow: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    bar: "bg-emerald-500",
  },
  neutral: {
    text: "text-foreground",
    ring: "ring-border",
    chip: "bg-secondary text-foreground border-border",
    glow: "from-secondary/40 via-secondary/10 to-transparent",
    bar: "bg-foreground/60",
  },
};

const STORAGE_KEY = "admin.dashboard.layout.v2";

function loadLayout(defaults: string[]): { order: string[]; hidden: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { order: defaults, hidden: [] };
    const parsed = JSON.parse(raw);
    const order = Array.isArray(parsed.order) ? parsed.order.filter((id: string) => defaults.includes(id)) : defaults;
    const missing = defaults.filter(id => !order.includes(id));
    return {
      order: [...order, ...missing],
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
    };
  } catch {
    return { order: defaults, hidden: [] };
  }
}

function saveLayout(order: string[], hidden: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ order, hidden })); } catch {}
}

const SortableKpi = ({ card, onNavigate, editing }: { card: CardDef; onNavigate?: (t: string) => void; editing: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id, disabled: !editing });
  const tone = TONES[card.tone];
  const Icon = card.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <button
        onClick={() => !editing && card.tab && onNavigate?.(card.tab)}
        disabled={editing || !card.tab}
        className={`relative w-full text-left overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 transition-all duration-200 ${
          editing ? "cursor-grab" : card.tab ? "hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.4)] cursor-pointer" : "cursor-default"
        }`}
      >
        {/* Glow background */}
        <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${tone.glow} blur-2xl pointer-events-none`} />
        {/* Top stripe */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${tone.bar} opacity-70`} />

        <div className="relative flex items-start justify-between mb-3">
          <div className={`h-9 w-9 rounded-xl border ${tone.chip} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${tone.text}`} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" title="Tempo real" />
            {card.tab && !editing && <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />}
          </div>
        </div>

        <p className={`relative font-pixel text-2xl leading-none ${tone.text}`}>{card.value}</p>
        <p className="relative text-[12px] text-foreground font-semibold font-body mt-1.5">{card.label}</p>
        {card.sub && <p className="relative text-[10px] text-muted-foreground font-body mt-0.5 truncate">{card.sub}</p>}
      </button>

      {editing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-10 h-7 w-7 rounded-lg bg-background/80 border border-border flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm"
          title="Arraste para reordenar"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default function RealtimeDashboard({ onNavigate }: Props) {
  const { data: stats, isLoading } = useAdminStats(true);
  const [editing, setEditing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const allCards: CardDef[] = useMemo(() => {
    if (!stats) return [];
    return [
      { id: "users", label: "Usuários", value: stats.users_total, sub: `+${stats.users_today} hoje · ${stats.users_week} 7d`, icon: Users, tone: "primary", tab: "users" },
      { id: "banned", label: "Banidos", value: stats.users_banned, sub: "contas bloqueadas", icon: Ban, tone: "destructive", tab: "users" },
      { id: "ads", label: "Anúncios", value: stats.ads_total, sub: `${stats.ads_active} ativos · +${stats.ads_today} hoje`, icon: Package, tone: "primary", tab: "ads" },
      { id: "featured", label: "Destaques", value: stats.ads_featured, sub: "promovidos", icon: Star, tone: "warning", tab: "ads" },
      { id: "offers", label: "Ofertas", value: stats.offers_total, sub: `${stats.offers_pending} pendentes`, icon: TrendingUp, tone: "success" },
      { id: "convs", label: "Conversas", value: stats.conversations_total, sub: `${stats.messages_today} msgs hoje`, icon: MessageCircle, tone: "neutral", tab: "conversations" },
      { id: "coins", label: "Coins circulando", value: stats.coins_in_circulation, sub: "saldo total das wallets", icon: Coins, tone: "warning", tab: "wallet" },
      { id: "deposited", label: "Coins depositados", value: stats.deposits_approved_total, sub: "histórico aprovado", icon: Wallet, tone: "primary", tab: "deposits" },
      { id: "donations", label: "Doações", value: stats.coins_donated, sub: "coins doados", icon: Heart, tone: "destructive", tab: "financial" },
      { id: "depPending", label: "Depósitos pendentes", value: stats.deposits_pending, sub: "aguardando aprovação", icon: Wallet, tone: "warning", tab: "deposits" },
      { id: "tickets", label: "Tickets abertos", value: stats.tickets_open, sub: "suporte ativo", icon: LifeBuoy, tone: "warning", tab: "support" },
      { id: "raffles", label: "Rifas ativas", value: stats.raffles_active, sub: "em andamento", icon: Ticket, tone: "primary", tab: "raffles" },
    ];
  }, [stats]);

  const defaults = useMemo(() => allCards.map(c => c.id), [allCards]);
  const [order, setOrder] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    if (defaults.length === 0) return;
    const layout = loadLayout(defaults);
    setOrder(layout.order);
    setHidden(layout.hidden);
  }, [defaults.join("|")]);

  useEffect(() => {
    if (order.length > 0) saveLayout(order, hidden);
  }, [order, hidden]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const visibleCards = order
    .filter(id => !hidden.includes(id))
    .map(id => allCards.find(c => c.id === id))
    .filter(Boolean) as CardDef[];

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setOrder(arrayMove(order, oldIndex, newIndex));
  };

  const resetLayout = () => {
    setOrder(defaults);
    setHidden([]);
  };

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  const signupChart = (stats.signup_chart as any[]) || [];
  const adsChart = (stats.ads_chart as any[]) || [];
  const activeCard = activeId ? allCards.find(c => c.id === activeId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-5">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "8px 8px" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-pixel text-base text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              Dashboard em tempo real
            </h2>
            <p className="text-[11px] text-muted-foreground font-body mt-1">
              Métricas atualizadas a cada 15s · arraste para reorganizar · oculte cards que não usa
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> Cards visíveis
                  <span className="ml-2 text-[10px] text-muted-foreground">{visibleCards.length}/{allCards.length}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 bg-popover">
                <DropdownMenuLabel className="text-xs">Mostrar cards</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allCards.map(c => (
                  <DropdownMenuCheckboxItem
                    key={c.id}
                    checked={!hidden.includes(c.id)}
                    onCheckedChange={(checked) => {
                      setHidden(prev => checked ? prev.filter(id => id !== c.id) : [...prev, c.id]);
                    }}
                    className="text-xs"
                  >
                    <c.icon className={`h-3.5 w-3.5 mr-2 ${TONES[c.tone].text}`} />
                    {c.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={editing ? "default" : "outline"}
              size="sm"
              onClick={() => setEditing(v => !v)}
              className="h-8 text-xs"
            >
              <Settings2 className="h-3.5 w-3.5 mr-1.5" />
              {editing ? "Concluir" : "Organizar"}
            </Button>

            <Button variant="ghost" size="sm" onClick={resetLayout} className="h-8 text-xs" title="Resetar layout">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={visibleCards.map(c => c.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {visibleCards.map(card => (
              <SortableKpi key={card.id} card={card} onNavigate={onNavigate} editing={editing} />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeCard ? (
            <div className="opacity-90 rotate-1 scale-105">
              <SortableKpi card={activeCard} editing={false} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="relative overflow-hidden bg-card/80 border border-border/60 rounded-2xl p-5">
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground font-body flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Cadastros (14 dias)
            </h3>
            <span className="text-[10px] text-muted-foreground font-body px-2 py-0.5 rounded-full bg-secondary/60 border border-border/40">
              {signupChart.reduce((a: number, b: any) => a + (b.count || 0), 0)} no período
            </span>
          </div>
          <div className="h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupChart}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative overflow-hidden bg-card/80 border border-border/60 rounded-2xl p-5">
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-warning/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground font-body flex items-center gap-2">
              <Package className="h-4 w-4 text-warning" /> Anúncios (14 dias)
            </h3>
            <span className="text-[10px] text-muted-foreground font-body px-2 py-0.5 rounded-full bg-secondary/60 border border-border/40">
              {adsChart.reduce((a: number, b: any) => a + (b.count || 0), 0)} no período
            </span>
          </div>
          <div className="h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adsChart}>
                <defs>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="url(#g2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
