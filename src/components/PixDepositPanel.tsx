import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Check,
  Zap,
  ShieldCheck,
  CreditCard,
  Clock,
  TrendingUp,
  Wallet,
  Sparkles,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyDeposits } from "@/hooks/useDeposits";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { isPaymentsConfigured } from "@/lib/stripe";
import { toast } from "sonner";

interface Package {
  id: string;
  priceId: string;
  label: string;
  amount_brl_cents: number;
  amount_coins: number;
  popular?: boolean;
  bonus?: string;
}

// Pacotes (R$ 1,00 = 10 coins). Sincronizados com Stripe (lookup_keys).
const PACKAGES: Package[] = [
  { id: "p1", priceId: "coins_100_brl",  label: "Starter",  amount_brl_cents: 1000,  amount_coins: 100 },
  { id: "p2", priceId: "coins_250_brl",  label: "Bronze",   amount_brl_cents: 2500,  amount_coins: 250 },
  { id: "p3", priceId: "coins_500_brl",  label: "Prata",    amount_brl_cents: 5000,  amount_coins: 500, popular: true },
  { id: "p4", priceId: "coins_1000_brl", label: "Ouro",     amount_brl_cents: 10000, amount_coins: 1000 },
  { id: "p5", priceId: "coins_2000_brl", label: "Diamante", amount_brl_cents: 20000, amount_coins: 2000 },
];

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PixDepositPanel({ walletBalance }: { walletBalance: number }) {
  const [selectedId, setSelectedId] = useState<string>("p3");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);
  const { data: myDeposits } = useMyDeposits();
  const selected = PACKAGES.find((p) => p.id === selectedId)!;

  const handleBuy = () => {
    if (!isPaymentsConfigured()) {
      toast.error("Pagamentos ainda não configurados.");
      return;
    }
    setCheckoutPriceId(selected.priceId);
    setCheckoutOpen(true);
  };

  return (
    <>
      <PaymentTestModeBanner />
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* MAIN */}
        <div className="space-y-6">
          {/* HERO */}
          <div className="relative overflow-hidden rounded-2xl border border-warning/30 bg-gradient-to-br from-warning/[0.08] via-card/60 to-card/40 p-6">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-warning/10 blur-3xl pointer-events-none" />
            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-warning font-bold">
                  <CreditCard className="h-3 w-3" /> Depósito por Cartão
                </div>
                <h2 className="mt-2 text-2xl font-bold text-foreground">Recarregue seus Rubini Coins</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Pagamento por cartão de crédito/débito. Crédito automático.
                </p>
              </div>
              <div className="rounded-xl bg-card/80 border border-border/60 px-4 py-3 min-w-[140px]">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Wallet className="h-3 w-3" /> Saldo atual
                </div>
                <div className="text-xl font-bold text-warning mt-0.5">
                  {walletBalance.toLocaleString("pt-BR")} <span className="text-xs">RT</span>
                </div>
              </div>
            </div>

            <div className="relative grid grid-cols-3 gap-2 mt-5">
              <Feature icon={<Zap className="h-3.5 w-3.5" />} label="Crédito instantâneo" />
              <Feature icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Stripe seguro" />
              <Feature icon={<Clock className="h-3.5 w-3.5" />} label="24/7" />
            </div>
          </div>

          {/* PACKAGES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-warning" /> Escolha um pacote
              </h3>
              <span className="text-[10px] text-muted-foreground">R$ 1,00 = 10 RT</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PACKAGES.map((pkg) => {
                const isSel = pkg.id === selectedId;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedId(pkg.id)}
                    className={cn(
                      "relative rounded-xl border p-4 text-left transition-all group",
                      isSel
                        ? "border-warning bg-warning/[0.06] shadow-[0_0_0_1px_hsl(var(--warning)/0.4)]"
                        : "border-border/60 bg-card/40 hover:border-warning/50 hover:bg-card/60",
                    )}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 left-3 text-[9px] font-bold uppercase tracking-wider bg-warning text-warning-foreground px-2 py-0.5 rounded-full">
                        Mais popular
                      </span>
                    )}
                    {isSel && (
                      <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-warning text-warning-foreground flex items-center justify-center">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {pkg.label}
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-xl font-bold text-foreground">{pkg.amount_coins.toLocaleString("pt-BR")}</span>
                      <span className="text-xs text-warning font-bold">RT</span>
                    </div>
                    {pkg.bonus && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-success">
                        <TrendingUp className="h-2.5 w-2.5" /> Bônus {pkg.bonus}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-border/40">
                      <div className="text-[10px] text-muted-foreground">Pague</div>
                      <div className="text-sm font-semibold text-foreground">{formatBRL(pkg.amount_brl_cents)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CHECKOUT SUMMARY */}
          <div className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Resumo do pagamento</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-secondary/40 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pacote</div>
                <div className="text-sm font-bold text-foreground mt-1">{selected.label}</div>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Você paga</div>
                <div className="text-sm font-bold text-foreground mt-1">{formatBRL(selected.amount_brl_cents)}</div>
              </div>
              <div className="rounded-lg bg-warning/10 border border-warning/30 p-3">
                <div className="text-[10px] uppercase tracking-wider text-warning">Você recebe</div>
                <div className="text-sm font-bold text-warning mt-1">{selected.amount_coins.toLocaleString("pt-BR")} RT</div>
              </div>
            </div>

            <Button
              onClick={handleBuy}
              className="w-full bg-warning text-warning-foreground hover:bg-warning/90 h-11 font-semibold"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Pagar com Cartão
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              Pagamento processado pela Stripe. Crédito automático na carteira após confirmação.
            </p>
          </div>
        </div>

        {/* SIDEBAR — HISTORY */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-3 w-3" /> Seus depósitos
              </h4>
            </div>
            {myDeposits && myDeposits.length > 0 ? (
              <div className="divide-y divide-border/50 max-h-[420px] overflow-y-auto">
                {myDeposits.map((dep) => (
                  <div key={dep.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="h-9 w-9 rounded-lg bg-warning/10 border border-warning/30 flex items-center justify-center shrink-0">
                      <CreditCard className="h-4 w-4 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        +{dep.amount_coins} RT
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(dep.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                        dep.status === "pending"
                          ? "bg-warning/15 text-warning"
                          : dep.status === "approved" || dep.status === "paid"
                            ? "bg-primary/15 text-primary"
                            : "bg-destructive/15 text-destructive",
                      )}
                    >
                      {dep.status === "pending"
                        ? "Pendente"
                        : dep.status === "approved" || dep.status === "paid"
                          ? "Pago"
                          : "Falhou"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center">
                <CreditCard className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-xs text-muted-foreground">Nenhum depósito ainda.</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">Seu histórico aparece aqui.</p>
              </div>
            )}
          </div>

          {/* INFO CARD */}
          <div className="rounded-2xl border border-border/70 bg-card/40 p-5 space-y-3">
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Como funciona</h4>
            <Step n={1} text="Escolha um pacote acima" />
            <Step n={2} text="Pague com cartão pelo checkout seguro Stripe" />
            <Step n={3} text="Receba os RT automaticamente na sua carteira" />
          </div>
        </div>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar pagamento</DialogTitle>
          </DialogHeader>
          {checkoutPriceId && (
            <StripeEmbeddedCheckout key={checkoutPriceId} priceId={checkoutPriceId} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

const Feature = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center justify-center gap-1.5 rounded-lg bg-card/60 border border-border/40 px-2 py-2">
    <span className="text-warning">{icon}</span>
    <span className="text-[11px] font-semibold text-foreground">{label}</span>
  </div>
);

const Step = ({ n, text }: { n: number; text: string }) => (
  <div className="flex items-start gap-3">
    <div className="h-5 w-5 rounded-full bg-warning/15 border border-warning/40 text-warning text-[10px] font-bold flex items-center justify-center shrink-0">
      {n}
    </div>
    <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
  </div>
);
