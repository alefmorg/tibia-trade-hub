import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import { useRaffle, useRaffleNumbers, useBuyRaffleNumbers, useRaffles } from "@/hooks/useRaffles";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Coins, Crown, Hash, Ticket, Trophy, Users, Calendar, Sparkles, TrendingUp, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const RifaPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: wallet } = useWallet();
  const [quantity, setQuantity] = useState(1);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);

  const { data: raffle, isLoading } = useRaffle(id || "");
  const { data: numbers } = useRaffleNumbers(id || "");
  const buyNumbers = useBuyRaffleNumbers();

  const { data: raffles } = useRaffles(true);

  // If no id, show list of active raffles
  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 max-w-5xl">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-warning/10 via-warning/5 to-primary/5 border border-warning/20 p-8 mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-warning/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-warning/15 flex items-center justify-center border border-warning/30 shadow-lg shadow-warning/10">
                <Ticket className="h-10 w-10 text-warning" />
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2 justify-center md:justify-start">
                  <Sparkles className="h-5 w-5 text-warning" />
                  Rifas Ativas
                </h1>
                <p className="text-sm text-muted-foreground max-w-md">
                  Participe das rifas e concorra a prêmios incríveis! Sorteio baseado na <span className="text-warning font-semibold">Loteria Federal</span> para total transparência.
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-card/80 border border-border/60 rounded-xl px-4 py-3 text-center">
                  <p className="font-pixel text-lg text-warning">{raffles?.length || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Rifas ativas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Raffle Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(raffles || []).map((r) => {
              return (
                <Link key={r.id} to={`/rifa/${r.id}`} className="group relative bg-card/80 border border-border/60 rounded-2xl overflow-hidden hover:border-warning/40 hover:shadow-[0_0_30px_hsl(var(--warning)/0.1)] transition-all duration-300">
                  {/* Image */}
                  <div className="relative">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.title} className="h-44 w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                    ) : (
                      <div className="h-44 bg-gradient-to-br from-warning/10 via-primary/5 to-background flex items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center border border-warning/20">
                          <Trophy className="h-8 w-8 text-warning/40" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-warning/90 text-warning-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Rifa
                    </div>
                    {r.status === "active" && (
                      <div className="absolute bottom-3 left-3 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">
                        ● Ativa
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-foreground text-base group-hover:text-warning transition-colors">{r.title}</h3>
                    {r.description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{r.description}</p>}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-warning/5 border border-warning/15 rounded-xl px-3 py-2 flex items-center gap-2">
                        <Coins className="h-3.5 w-3.5 text-warning" />
                        <div>
                          <p className="text-xs font-bold text-warning">{r.price_per_number}</p>
                          <p className="text-[9px] text-muted-foreground">coins/nº</p>
                        </div>
                      </div>
                      <div className="bg-primary/5 border border-primary/15 rounded-xl px-3 py-2 flex items-center gap-2">
                        <Hash className="h-3.5 w-3.5 text-primary" />
                        <div>
                          <p className="text-xs font-bold text-primary">{r.total_numbers}</p>
                          <p className="text-[9px] text-muted-foreground">números</p>
                        </div>
                      </div>
                    </div>

                    {r.draw_date && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Sorteio: {new Date(r.draw_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      </div>
                    )}

                    <Button className="w-full bg-warning text-warning-foreground hover:bg-warning/90 rounded-xl font-semibold group-hover:shadow-lg group-hover:shadow-warning/20 transition-all">
                      <Ticket className="h-4 w-4 mr-2" />
                      Participar
                    </Button>
                  </div>
                </Link>
              );
            })}
          </div>

          {(!raffles || raffles.length === 0) && (
            <div className="text-center py-20 bg-card/50 rounded-2xl border border-border/60">
              <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-4 border border-warning/20">
                <Ticket className="h-8 w-8 text-warning/30" />
              </div>
              <p className="text-muted-foreground text-sm mb-1">Nenhuma rifa ativa no momento</p>
              <p className="text-muted-foreground/60 text-xs">Volte em breve para novas oportunidades!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 max-w-5xl space-y-4">
          <Skeleton className="h-8 w-40 rounded-xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-4 border border-warning/20">
            <Ticket className="h-8 w-8 text-warning/30" />
          </div>
          <p className="text-muted-foreground mb-2">Rifa não encontrada.</p>
          <Link to="/rifa" className="text-primary hover:underline text-sm">← Ver todas as rifas</Link>
        </div>
      </div>
    );
  }

  const soldNumbers = numbers?.length || 0;
  const myNumbers = numbers?.filter(n => n.user_id === user?.id) || [];
  const totalCost = quantity * raffle.price_per_number;
  const availableCount = raffle.total_numbers - soldNumbers;
  const progressPct = Math.round((soldNumbers / raffle.total_numbers) * 100);

  const handleBuy = () => {
    buyNumbers.mutate(
      { raffleId: raffle.id, quantity },
      { onSuccess: () => setBuyDialogOpen(false) }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-6 max-w-5xl">
        <Link to="/rifa" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Voltar às rifas
        </Link>

        {/* Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden mb-6">
          {raffle.image_url ? (
            <img src={raffle.image_url} alt={raffle.title} className="w-full h-56 md:h-72 object-cover" />
          ) : (
            <div className="h-56 md:h-72 bg-gradient-to-br from-warning/15 via-primary/5 to-background flex items-center justify-center">
              <div className="w-24 h-24 rounded-3xl bg-warning/10 flex items-center justify-center border border-warning/20">
                <Trophy className="h-12 w-12 text-warning/30" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full mb-3 inline-block ${raffle.status === "active" ? "bg-primary/20 text-primary border border-primary/30" : raffle.status === "completed" ? "bg-warning/20 text-warning border border-warning/30" : "bg-destructive/20 text-destructive border border-destructive/30"}`}>
                  {raffle.status === "active" ? "🟢 Ativa" : raffle.status === "completed" ? "🏆 Finalizada" : "❌ Cancelada"}
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-2">{raffle.title}</h1>
                {raffle.description && <p className="text-sm text-muted-foreground mt-2 max-w-xl">{raffle.description}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-card/80 border border-warning/20 rounded-2xl p-4 text-center hover:border-warning/40 transition-colors">
            <Coins className="h-5 w-5 text-warning mx-auto mb-2" />
            <p className="font-pixel text-xl text-warning">{raffle.price_per_number}</p>
            <p className="text-[10px] text-muted-foreground mt-1">coins por número</p>
          </div>
          <div className="bg-card/80 border border-primary/20 rounded-2xl p-4 text-center hover:border-primary/40 transition-colors">
            <Hash className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="font-pixel text-xl text-primary">{raffle.total_numbers}</p>
            <p className="text-[10px] text-muted-foreground mt-1">números total</p>
          </div>
          <div className="bg-card/80 border border-border/60 rounded-2xl p-4 text-center hover:border-primary/40 transition-colors">
            <Users className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="font-pixel text-xl text-foreground">{soldNumbers}</p>
            <p className="text-[10px] text-muted-foreground mt-1">vendidos</p>
          </div>
          <div className="bg-card/80 border border-border/60 rounded-2xl p-4 text-center hover:border-primary/40 transition-colors">
            <TrendingUp className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="font-pixel text-xl text-foreground">{availableCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">disponíveis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Federal Lottery Info */}
            {raffle.federal_lottery_ref && (
              <div className="bg-gradient-to-r from-warning/5 to-warning/10 border border-warning/25 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/15 flex items-center justify-center shrink-0 border border-warning/25">
                  <span className="text-xl">🎰</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-warning mb-1">Loteria Federal</p>
                  <p className="text-xs text-muted-foreground">Referência: <span className="text-foreground font-medium">{raffle.federal_lottery_ref}</span></p>
                  <p className="text-[10px] text-muted-foreground mt-1">O resultado é baseado na Loteria Federal para garantir total transparência no sorteio.</p>
                </div>
              </div>
            )}

            {raffle.draw_date && (
              <div className="bg-card/80 border border-border/60 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data do sorteio</p>
                  <p className="text-sm font-semibold text-foreground">{new Date(raffle.draw_date).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
                </div>
              </div>
            )}

            {/* Winner */}
            {raffle.winner_number != null && (
              <div className="bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/30 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-warning/20 flex items-center justify-center mx-auto mb-3 border border-warning/30">
                  <Crown className="h-8 w-8 text-warning" />
                </div>
                <p className="text-lg font-bold text-warning mb-1">🎉 Número vencedor</p>
                <p className="font-pixel text-4xl text-warning">{raffle.winner_number}</p>
              </div>
            )}

            {/* My Numbers */}
            {myNumbers.length > 0 && (
              <div className="bg-card/80 border border-primary/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Seus Números ({myNumbers.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {myNumbers.map(n => (
                    <div key={n.id} className="bg-primary/15 border border-primary/30 text-primary px-3 py-1.5 rounded-xl text-sm font-bold shadow-[0_0_8px_hsl(var(--primary)/0.1)]">
                      #{n.number}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Info - no grid showing individual numbers */}
            <div className="bg-card/80 border border-border/60 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  Resumo dos Números
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/60 border border-border/40 rounded-xl p-4 text-center">
                  <p className="font-pixel text-2xl text-foreground">{raffle.total_numbers}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Total</p>
                </div>
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
                  <p className="font-pixel text-2xl text-destructive">{soldNumbers}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Vendidos</p>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                  <p className="font-pixel text-2xl text-primary">{availableCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Disponíveis</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 text-center">
                Os números são atribuídos aleatoriamente ao comprar. O sorteio é pela <span className="text-warning font-semibold">Loteria Federal</span>.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Progress Card */}
            <div className="bg-card/80 border border-border/60 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Progresso
              </h3>
              <div className="relative">
                <div className="w-full bg-secondary/80 rounded-full h-4 border border-border/40">
                  <div
                    className="bg-gradient-to-r from-warning to-warning/80 h-4 rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(progressPct, 8)}%` }}
                  >
                    {progressPct > 15 && <span className="text-[9px] font-bold text-warning-foreground">{progressPct}%</span>}
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{soldNumbers} vendidos</span>
                <span>{availableCount} restantes</span>
              </div>
            </div>

            {/* Buy Card */}
            <div className="bg-card/80 border border-warning/20 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-warning uppercase tracking-wider flex items-center gap-2">
                <Ticket className="h-3.5 w-3.5" />
                Comprar Números
              </h3>

              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-warning/10 border border-warning/20">
                    <Coins className="h-4 w-4 text-warning" />
                    <div>
                      <p className="text-xs font-bold text-warning">{wallet?.balance || 0} coins</p>
                      <p className="text-[9px] text-muted-foreground">Seu saldo</p>
                    </div>
                  </div>

                  {raffle.status === "active" && availableCount > 0 ? (
                    <Button onClick={() => setBuyDialogOpen(true)} className="w-full bg-warning text-warning-foreground hover:bg-warning/90 rounded-xl font-semibold h-12 text-sm shadow-lg shadow-warning/20 hover:shadow-warning/30 transition-all">
                      <Ticket className="h-5 w-5 mr-2" />
                      Comprar Números
                    </Button>
                  ) : raffle.status !== "active" ? (
                    <div className="text-center py-4 bg-secondary/30 rounded-xl">
                      <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Rifa encerrada</p>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-warning/5 rounded-xl border border-warning/20">
                      <Sparkles className="h-5 w-5 text-warning mx-auto mb-1" />
                      <p className="text-xs text-warning font-semibold">Esgotado!</p>
                      <p className="text-[10px] text-muted-foreground">Todos os números vendidos</p>
                    </div>
                  )}

                  {myNumbers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-primary" />
                        Seus números ({myNumbers.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {myNumbers.map(n => (
                          <span key={n.id} className="text-[10px] bg-primary/20 text-primary px-2.5 py-1 rounded-lg font-bold border border-primary/30">{n.number}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                    <Users className="h-6 w-6 text-primary/40" />
                  </div>
                  <p className="text-xs text-muted-foreground">Faça login para comprar números</p>
                  <Link to="/login">
                    <Button size="sm" className="bg-primary text-primary-foreground rounded-xl">Entrar</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="bg-card/80 border border-border/60 rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Como funciona</h3>
              <div className="space-y-3">
                {[
                  { icon: "💰", text: "Tenha Rubini Coins na sua carteira" },
                  { icon: "🎟️", text: "Compre números aleatórios" },
                  { icon: "🎰", text: "Aguarde o sorteio pela Loteria Federal" },
                  { icon: "🏆", text: "Se seu número for sorteado, você ganha!" },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-base shrink-0 mt-0.5">{step.icon}</span>
                    <div>
                      <p className="text-xs text-foreground">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center border border-warning/25">
                <Ticket className="h-4 w-4 text-warning" />
              </div>
              Comprar Números
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Números aleatórios serão sorteados para você.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Quantidade</label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-10 w-10 p-0" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</Button>
                <Input
                  type="number"
                  min={1}
                  max={availableCount}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(availableCount, Number(e.target.value))))}
                  className="bg-secondary border-border text-center h-10 font-bold"
                />
                <Button variant="outline" size="sm" className="h-10 w-10 p-0" onClick={() => setQuantity(Math.min(availableCount, quantity + 1))} disabled={quantity >= availableCount}>+</Button>
              </div>
              <p className="text-[10px] text-muted-foreground">{availableCount} números disponíveis</p>
            </div>

            <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Preço unitário:</span>
                <span className="text-sm text-muted-foreground">{raffle.price_per_number} coins</span>
              </div>
              <div className="flex items-center justify-between border-t border-warning/15 pt-2">
                <span className="text-sm font-semibold text-foreground">Custo total:</span>
                <span className="text-base font-bold text-warning flex items-center gap-1"><Coins className="h-4 w-4" />{totalCost} coins</span>
              </div>
            </div>

            {(wallet?.balance || 0) < totalCost && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex items-center gap-2">
                <span className="text-destructive text-lg">⚠️</span>
                <div>
                  <p className="text-xs text-destructive font-semibold">Saldo insuficiente!</p>
                  <p className="text-[10px] text-muted-foreground">Deposite mais coins na sua carteira.</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleBuy}
              disabled={buyNumbers.isPending || (wallet?.balance || 0) < totalCost || quantity < 1}
              className="w-full bg-warning text-warning-foreground hover:bg-warning/90 h-12 rounded-xl font-semibold text-sm"
            >
              {buyNumbers.isPending ? "Comprando..." : `🎟️ Comprar ${quantity} número${quantity > 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RifaPage;
