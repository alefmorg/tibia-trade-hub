import { useAdminStats } from "@/hooks/useRafflesAdmin";
import {
  Users, Package, MessageCircle, Coins, Wallet, Ticket, Activity,
  Star, LifeBuoy, TrendingUp, Heart, Ban,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  onNavigate?: (tab: string) => void;
}

const KpiCard = ({
  label, value, sub, icon: Icon, color, bg, border, onClick,
}: {
  label: string; value: number | string; sub?: string;
  icon: any; color: string; bg: string; border: string; onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`text-left bg-gradient-to-br ${bg} border ${border} rounded-2xl p-4 transition-all duration-200 ${onClick ? "hover:shadow-md hover:scale-[1.02] cursor-pointer" : "cursor-default"}`}
  >
    <div className="flex items-center justify-between mb-3">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" title="Tempo real" />
    </div>
    <p className={`font-pixel text-2xl ${color}`}>{value}</p>
    <p className="text-xs text-foreground font-medium font-body mt-1">{label}</p>
    {sub && <p className="text-[10px] text-muted-foreground font-body">{sub}</p>}
  </button>
);

export default function RealtimeDashboard({ onNavigate }: Props) {
  const { data: stats, isLoading } = useAdminStats(true);

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Usuários", value: stats.users_total, sub: `+${stats.users_today} hoje · ${stats.users_week} 7d`, icon: Users, color: "text-primary", bg: "from-primary/5 to-primary/10", border: "border-primary/20", tab: "users" },
    { label: "Banidos", value: stats.users_banned, sub: "contas bloqueadas", icon: Ban, color: "text-destructive", bg: "from-destructive/5 to-destructive/10", border: "border-destructive/20", tab: "users" },
    { label: "Anúncios", value: stats.ads_total, sub: `${stats.ads_active} ativos · +${stats.ads_today} hoje`, icon: Package, color: "text-primary", bg: "from-primary/5 to-primary/10", border: "border-primary/20", tab: "ads" },
    { label: "Destaques", value: stats.ads_featured, sub: "promovidos", icon: Star, color: "text-warning", bg: "from-warning/5 to-warning/10", border: "border-warning/20", tab: "ads" },
    { label: "Ofertas", value: stats.offers_total, sub: `${stats.offers_pending} pendentes`, icon: TrendingUp, color: "text-primary", bg: "from-primary/5 to-primary/10", border: "border-primary/20" },
    { label: "Conversas", value: stats.conversations_total, sub: `${stats.messages_today} msgs hoje`, icon: MessageCircle, color: "text-foreground", bg: "from-secondary/40 to-secondary/80", border: "border-border/60", tab: "conversations" },
    { label: "Coins circulando", value: stats.coins_in_circulation, sub: "saldo total das wallets", icon: Coins, color: "text-warning", bg: "from-warning/5 to-warning/10", border: "border-warning/20", tab: "wallet" },
    { label: "Coins depositados", value: stats.deposits_approved_total, sub: "histórico aprovado", icon: Wallet, color: "text-primary", bg: "from-primary/5 to-primary/10", border: "border-primary/20", tab: "deposits" },
    { label: "Doações", value: stats.coins_donated, sub: "coins doados", icon: Heart, color: "text-destructive", bg: "from-destructive/5 to-destructive/10", border: "border-destructive/20", tab: "financial" },
    { label: "Depósitos pendentes", value: stats.deposits_pending, sub: "aguardando aprovação", icon: Wallet, color: "text-warning", bg: "from-warning/5 to-warning/10", border: "border-warning/20", tab: "deposits" },
    { label: "Tickets abertos", value: stats.tickets_open, sub: "suporte ativo", icon: LifeBuoy, color: "text-warning", bg: "from-warning/5 to-warning/10", border: "border-warning/20", tab: "support" },
    { label: "Rifas ativas", value: stats.raffles_active, sub: "em andamento", icon: Ticket, color: "text-primary", bg: "from-primary/5 to-primary/10", border: "border-primary/20", tab: "raffles" },
  ];

  const signupChart = (stats.signup_chart as any[]) || [];
  const adsChart = (stats.ads_chart as any[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs text-muted-foreground font-body">
            Métricas em tempo real · atualiza a cada 15s
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {cards.map((c) => (
          <KpiCard key={c.label} {...c} onClick={c.tab && onNavigate ? () => onNavigate(c.tab) : undefined} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card/80 border border-border/60 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 font-body flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Cadastros (últimos 14 dias)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupChart}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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

        <div className="bg-card/80 border border-border/60 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 font-body flex items-center gap-2">
            <Package className="h-4 w-4 text-warning" /> Anúncios criados (últimos 14 dias)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                <Bar dataKey="count" fill="hsl(var(--warning))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
