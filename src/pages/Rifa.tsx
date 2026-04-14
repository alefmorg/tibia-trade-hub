import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import { useRaffle, useRaffleNumbers, useBuyRaffleNumbers, useRaffles } from "@/hooks/useRaffles";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Coins, Crown, Hash, Ticket, Trophy, Users } from "lucide-react";
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
        <div className="container py-8 max-w-4xl">
          <h1 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-warning" />
            Rifas Ativas
          </h1>
          <p className="text-xs text-muted-foreground mb-4">
            🎰 Sorteio baseado na Loteria Federal. Compre números com Rubini Coins!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(raffles || []).map((r) => (
              <Link key={r.id} to={`/rifa/${r.id}`} className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden hover:border-warning/30 transition-all group">
                {r.image_url ? (
                  <img src={r.image_url} alt={r.title} className="h-40 w-full object-cover group-hover:scale-[1.02] transition-transform" />
                ) : (
                  <div className="h-40 bg-gradient-to-br from-warning/5 to-warning/10 flex items-center justify-center">
                    <Ticket className="h-12 w-12 text-warning/30" />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-foreground">{r.title}</h3>
                  {r.description && <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Coins className="h-3 w-3 text-warning" />{r.price_per_number} coins/nº</span>
                    <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{r.total_numbers} números</span>
                  </div>
                  {r.draw_date && <p className="text-[10px] text-muted-foreground">Sorteio: {new Date(r.draw_date).toLocaleDateString("pt-BR")}</p>}
                </div>
              </Link>
            ))}
            {(!raffles || raffles.length === 0) && (
              <div className="col-span-2 text-center py-12 text-muted-foreground">Nenhuma rifa ativa no momento.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 max-w-4xl"><Skeleton className="h-96 rounded-2xl" /></div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Rifa não encontrada.</p>
          <Link to="/rifa" className="text-primary hover:underline text-sm mt-2 inline-block">Ver rifas</Link>
        </div>
      </div>
    );
  }

  const soldNumbers = numbers?.length || 0;
  const myNumbers = numbers?.filter(n => n.user_id === user?.id) || [];
  const totalCost = quantity * raffle.price_per_number;
  const availableCount = raffle.total_numbers - soldNumbers;

  const handleBuy = () => {
    buyNumbers.mutate(
      { raffleId: raffle.id, quantity },
      { onSuccess: () => setBuyDialogOpen(false) }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-6 max-w-4xl">
        <Link to="/rifa" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar às rifas
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
              {raffle.image_url ? (
                <img src={raffle.image_url} alt={raffle.title} className="w-full h-64 object-cover" />
              ) : (
                <div className="h-64 bg-gradient-to-br from-warning/5 to-warning/10 flex items-center justify-center">
                  <Trophy className="h-16 w-16 text-warning/20" />
                </div>
              )}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h1 className="text-xl font-bold text-foreground">{raffle.title}</h1>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${raffle.status === "active" ? "bg-primary/15 text-primary" : raffle.status === "completed" ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"}`}>
                    {raffle.status === "active" ? "Ativa" : raffle.status === "completed" ? "Finalizada" : "Cancelada"}
                  </span>
                </div>
                {raffle.description && <p className="text-sm text-muted-foreground">{raffle.description}</p>}
                
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Coins className="h-3.5 w-3.5 text-warning" />{raffle.price_per_number} coins por número</span>
                  <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />{raffle.total_numbers} números total</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{soldNumbers} vendidos</span>
                </div>

                {raffle.federal_lottery_ref && (
                  <div className="bg-warning/5 border border-warning/20 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">
                      🎰 <span className="font-semibold text-warning">Loteria Federal:</span> {raffle.federal_lottery_ref}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">O resultado é baseado na Loteria Federal para garantir transparência.</p>
                  </div>
                )}

                {raffle.draw_date && (
                  <p className="text-xs text-muted-foreground">📅 Sorteio: {new Date(raffle.draw_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                )}

                {raffle.winner_number != null && (
                  <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-center">
                    <Crown className="h-6 w-6 text-warning mx-auto mb-2" />
                    <p className="text-sm font-bold text-warning">Número vencedor: {raffle.winner_number}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Number Grid */}
            <div className="bg-card/80 border border-border/60 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Números</h3>
              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: raffle.total_numbers }, (_, i) => i + 1).map((num) => {
                  const sold = numbers?.find(n => n.number === num);
                  const isMine = sold?.user_id === user?.id;
                  return (
                    <div
                      key={num}
                      className={`aspect-square flex items-center justify-center rounded-lg text-[10px] font-bold border transition-all ${
                        isMine
                          ? "bg-primary/20 border-primary/40 text-primary"
                          : sold
                          ? "bg-destructive/10 border-destructive/20 text-destructive/60"
                          : "bg-secondary/50 border-border/40 text-muted-foreground hover:border-primary/30"
                      }`}
                      title={isMine ? "Seu número" : sold ? "Vendido" : "Disponível"}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary/50 border border-border/40" /> Disponível</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/20 border border-primary/40" /> Seu</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/10 border border-destructive/20" /> Vendido</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-card/80 border border-border/60 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comprar Números</h3>
              
              {user ? (
                <>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-warning/10 border border-warning/20">
                    <Coins className="h-3 w-3 text-warning" />
                    <span className="text-xs font-semibold text-warning">Saldo: {wallet?.balance || 0}</span>
                  </div>

                  {raffle.status === "active" && availableCount > 0 ? (
                    <Button onClick={() => setBuyDialogOpen(true)} className="w-full bg-warning text-warning-foreground hover:bg-warning/90">
                      <Ticket className="h-4 w-4 mr-1" />
                      Comprar Números
                    </Button>
                  ) : raffle.status !== "active" ? (
                    <p className="text-xs text-muted-foreground text-center py-2">Rifa encerrada</p>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">Todos os números vendidos!</p>
                  )}

                  {myNumbers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">Seus números ({myNumbers.length}):</p>
                      <div className="flex flex-wrap gap-1">
                        {myNumbers.map(n => (
                          <span key={n.id} className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold">{n.number}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground mb-2">Faça login para comprar números</p>
                  <Link to="/login"><Button size="sm" className="bg-primary text-primary-foreground">Entrar</Button></Link>
                </div>
              )}
            </div>

            <div className="bg-card/80 border border-border/60 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Progresso</h3>
              <div className="w-full bg-secondary rounded-full h-3 mb-2">
                <div className="bg-warning h-3 rounded-full transition-all" style={{ width: `${(soldNumbers / raffle.total_numbers) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{soldNumbers}/{raffle.total_numbers} vendidos ({Math.round((soldNumbers / raffle.total_numbers) * 100)}%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Ticket className="h-5 w-5 text-warning" />
              Comprar Números
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Números aleatórios serão sorteados para você.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Quantidade</label>
              <Input
                type="number"
                min={1}
                max={availableCount}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(availableCount, Number(e.target.value))))}
                className="bg-secondary border-border"
              />
              <p className="text-[10px] text-muted-foreground">{availableCount} disponíveis</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Custo total:</span>
              <span className="text-sm font-bold text-warning flex items-center gap-1"><Coins className="h-3.5 w-3.5" />{totalCost} coins</span>
            </div>
            {(wallet?.balance || 0) < totalCost && (
              <p className="text-xs text-destructive">Saldo insuficiente! Deposite mais coins.</p>
            )}
            <Button
              onClick={handleBuy}
              disabled={buyNumbers.isPending || (wallet?.balance || 0) < totalCost || quantity < 1}
              className="w-full bg-warning text-warning-foreground hover:bg-warning/90"
            >
              {buyNumbers.isPending ? "Comprando..." : `Comprar ${quantity} número${quantity > 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RifaPage;
