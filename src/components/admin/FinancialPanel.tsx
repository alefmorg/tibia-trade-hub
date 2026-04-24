import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useAllWallets } from "@/hooks/useWallet";
import { useAllDeposits } from "@/hooks/useDeposits";
import { Coins, TrendingUp, TrendingDown, Wallet, Gift, Star, Ticket } from "lucide-react";

const db = supabase as any;

const useAllTransactions = () =>
  useQuery({
    queryKey: ["admin-all-transactions"],
    queryFn: async () => {
      const { data, error } = await db
        .from("wallet_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as { id: string; user_id: string; amount: number; type: string; reason: string | null; created_at: string }[];
    },
  });

const useAllDonations = () =>
  useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const { data, error } = await db.from("donations").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as { id: string; user_id: string; amount_coins: number; message: string | null; created_at: string }[];
    },
  });

const StatCard = ({ icon: Icon, label, value, sub, tone = "primary" }: any) => (
  <div className="bg-card border border-border/60 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${tone}/15 border border-${tone}/30`}>
        <Icon className={`h-4 w-4 text-${tone}`} />
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
  </div>
);

const FinancialPanel = ({ getProfileName }: { getProfileName: (id: string) => string }) => {
  const { data: wallets } = useAllWallets();
  const { data: deposits } = useAllDeposits();
  const { data: txs } = useAllTransactions();
  const { data: donations } = useAllDonations();

  const stats = useMemo(() => {
    const totalCoinsCirc = (wallets || []).reduce((s, w) => s + (w.balance || 0), 0);
    const approvedDeposits = (deposits || []).filter(d => d.status === "approved");
    const totalGoldDeposited = approvedDeposits.reduce((s, d) => s + (d.amount_gold || 0), 0);
    const totalCoinsDeposited = approvedDeposits.reduce((s, d) => s + (d.amount_coins || 0), 0);
    const totalDonated = (donations || []).reduce((s, d) => s + (d.amount_coins || 0), 0);
    const highlightSpend = (txs || []).filter(t => (t.reason || "").toLowerCase().startsWith("destaque")).reduce((s, t) => s + Math.abs(t.amount), 0);
    const raffleSpend = (txs || []).filter(t => (t.reason || "").toLowerCase().startsWith("rifa")).reduce((s, t) => s + Math.abs(t.amount), 0);
    return { totalCoinsCirc, totalGoldDeposited, totalCoinsDeposited, totalDonated, highlightSpend, raffleSpend, pendingDeposits: (deposits || []).filter(d => d.status === "pending").length };
  }, [wallets, deposits, txs, donations]);

  const topWallets = useMemo(() => (wallets || []).slice(0, 10), [wallets]);

  return (
    <div className="space-y-5">
      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Coins} label="Coins em circulação" value={stats.totalCoinsCirc.toLocaleString("pt-BR")} sub={`${(wallets || []).length} carteiras`} tone="primary" />
        <StatCard icon={TrendingUp} label="Gold depositado" value={stats.totalGoldDeposited.toLocaleString("pt-BR")} sub={`${stats.totalCoinsDeposited.toLocaleString("pt-BR")} coins emitidos`} tone="success" />
        <StatCard icon={Star} label="Gasto em destaques" value={stats.highlightSpend.toLocaleString("pt-BR")} tone="warning" />
        <StatCard icon={Ticket} label="Gasto em rifas" value={stats.raffleSpend.toLocaleString("pt-BR")} tone="primary" />
        <StatCard icon={Gift} label="Doações recebidas" value={stats.totalDonated.toLocaleString("pt-BR")} sub={`${(donations || []).length} doações`} tone="success" />
        <StatCard icon={Wallet} label="Depósitos pendentes" value={stats.pendingDeposits} tone="warning" />
        <StatCard icon={TrendingDown} label="Saídas (rifas+destaques)" value={(stats.highlightSpend + stats.raffleSpend).toLocaleString("pt-BR")} tone="warning" />
        <StatCard icon={TrendingUp} label="Saldo líquido" value={(stats.totalCoinsDeposited - stats.totalDonated - stats.highlightSpend - stats.raffleSpend).toLocaleString("pt-BR")} tone="primary" />
      </div>

      {/* Top carteiras */}
      <div className="bg-card border border-border/60 rounded-xl p-4">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" /> Top 10 carteiras
        </h3>
        <div className="space-y-1.5">
          {topWallets.map((w, i) => (
            <div key={w.id} className="flex items-center gap-3 text-sm py-1.5 px-2 rounded hover:bg-secondary/50">
              <span className="w-6 text-xs text-muted-foreground font-bold">#{i + 1}</span>
              <span className="flex-1 truncate text-foreground">{getProfileName(w.user_id)}</span>
              <span className="font-bold text-primary">{w.balance.toLocaleString("pt-BR")} coins</span>
            </div>
          ))}
          {topWallets.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma carteira ainda.</p>}
        </div>
      </div>

      {/* Últimas transações */}
      <div className="bg-card border border-border/60 rounded-xl p-4">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Últimas movimentações
        </h3>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {(txs || []).slice(0, 50).map((t) => (
            <div key={t.id} className="flex items-center gap-3 text-xs py-1.5 px-2 rounded hover:bg-secondary/40 border-b border-border/30">
              <span className="w-32 truncate text-muted-foreground">{getProfileName(t.user_id)}</span>
              <span className="flex-1 truncate text-foreground/80">{t.reason || t.type}</span>
              <span className={`font-bold ${t.amount >= 0 ? "text-success" : "text-destructive"}`}>
                {t.amount >= 0 ? "+" : ""}{t.amount.toLocaleString("pt-BR")}
              </span>
              <span className="w-20 text-right text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          ))}
          {(txs || []).length === 0 && <p className="text-xs text-muted-foreground">Sem movimentações.</p>}
        </div>
      </div>
    </div>
  );
};

export default FinancialPanel;
