import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import { useRaffle, useRaffleNumbers, useBuyRaffleNumbers, useRaffles } from "@/hooks/useRaffles";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Coins, Crown, Hash, Ticket, Trophy, Calendar, Clock, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ----- Estilos pixel reutilizáveis -----
const pixelBox = {
  borderRadius: 2,
  boxShadow:
    "0 0 0 2px hsl(var(--border)), 0 0 0 4px hsl(var(--background)), inset 0 0 0 1px hsl(var(--card))",
};
const goldenBox = {
  borderRadius: 2,
  boxShadow:
    "0 0 0 2px hsl(var(--warning)), 0 0 0 4px hsl(var(--background)), 0 0 0 5px hsl(var(--warning) / 0.3), inset 0 0 0 1px hsl(var(--card))",
};
const primaryBox = {
  borderRadius: 2,
  boxShadow:
    "0 0 0 2px hsl(var(--primary)), 0 0 0 4px hsl(var(--background)), 0 0 0 5px hsl(var(--primary) / 0.3), inset 0 0 0 1px hsl(var(--card))",
};

// Raffle card visual (lista)
const RaffleCard = ({ r }: { r: any }) => {
  const sold = 0; // visual; valor real vem da página individual
  return (
    <Link
      to={`/rifa/${r.id}`}
      className="group relative block bg-card transition-transform duration-200 hover:-translate-y-1"
      style={goldenBox}
    >
      {/* Pixel ribbon */}
      <div
        className="absolute -top-2 left-3 z-10 px-2 py-0.5 bg-warning text-warning-foreground font-pixel text-[8px] uppercase tracking-wider"
        style={{ borderRadius: 1, boxShadow: "0 0 0 2px hsl(var(--warning) / 0.4)" }}
      >
        ★ Rifa
      </div>

      <div className="p-1.5">
        {/* Imagem com moldura interna */}
        <div
          className="relative h-40 overflow-hidden bg-secondary"
          style={{
            borderRadius: 1,
            boxShadow: "inset 0 0 0 1px hsl(var(--border)), inset 0 0 0 2px hsl(var(--background))",
          }}
        >
          {r.image_url ? (
            <img
              src={r.image_url}
              alt={r.title}
              className="w-full h-full object-cover pixelated group-hover:scale-105 transition-transform duration-500"
              style={{ imageRendering: "pixelated" as const }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-warning/15 via-primary/5 to-background">
              <Trophy className="h-12 w-12 text-warning/40" />
            </div>
          )}
          {/* Status pin */}
          {r.status === "active" && (
            <div
              className="absolute bottom-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground font-pixel text-[8px] uppercase tracking-wider flex items-center gap-1"
              style={{ borderRadius: 1 }}
            >
              <span className="w-1.5 h-1.5 bg-primary-foreground animate-pulse" />
              Ativa
            </div>
          )}
        </div>

        <div className="p-3 space-y-3">
          <h3 className="font-pixel text-[11px] text-foreground leading-snug line-clamp-2 min-h-[28px]">
            {r.title}
          </h3>

          {/* Stats em "tabletes" pixel */}
          <div className="grid grid-cols-2 gap-1.5">
            <div
              className="bg-warning/10 px-2 py-2 text-center"
              style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--warning) / 0.4)" }}
            >
              <div className="flex items-center justify-center gap-1 text-warning">
                <Coins className="h-3 w-3" />
                <span className="font-pixel text-[10px]">{r.price_per_number}</span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5 font-body">por nº</p>
            </div>
            <div
              className="bg-primary/10 px-2 py-2 text-center"
              style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--primary) / 0.4)" }}
            >
              <div className="flex items-center justify-center gap-1 text-primary">
                <Hash className="h-3 w-3" />
                <span className="font-pixel text-[10px]">{r.total_numbers}</span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5 font-body">números</p>
            </div>
          </div>

          {r.draw_date && (
            <div
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-secondary/60 px-2 py-1.5 font-body"
              style={{ borderRadius: 1 }}
            >
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(r.draw_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </span>
            </div>
          )}

          <div
            className="w-full bg-warning text-warning-foreground py-2 text-center font-pixel text-[10px] uppercase tracking-wider group-hover:bg-warning/90 transition-colors"
            style={{
              borderRadius: 1,
              boxShadow: "0 0 0 2px hsl(var(--warning) / 0.4), 0 3px 0 hsl(var(--warning) / 0.5)",
            }}
          >
            ► Participar
          </div>
        </div>
      </div>
    </Link>
  );
};

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

  // ===== LISTA =====
  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 max-w-6xl">
          {/* Hero pixel */}
          <div
            className="relative overflow-hidden bg-card p-7 mb-8"
            style={goldenBox}
          >
            {/* Pixel grid bg */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(hsl(var(--warning)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--warning)) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <div aria-hidden className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-warning/10 blur-3xl" />

            <div className="relative flex flex-col md:flex-row items-center gap-6">
              <div
                className="w-20 h-20 flex items-center justify-center bg-warning/15"
                style={{
                  borderRadius: 2,
                  boxShadow: "0 0 0 2px hsl(var(--warning) / 0.5), inset 0 0 0 2px hsl(var(--background))",
                }}
              >
                <Ticket className="h-10 w-10 text-warning" strokeWidth={2.5} />
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="font-pixel text-base md:text-lg text-foreground mb-2 flex items-center gap-2 justify-center md:justify-start">
                  <Sparkles className="h-4 w-4 text-warning" />
                  RIFAS ATIVAS
                </h1>
                <p className="text-xs text-muted-foreground font-body max-w-md leading-relaxed">
                  Participe das rifas e concorra a prêmios incríveis! Sorteio baseado na{" "}
                  <span className="text-warning font-semibold">Loteria Federal</span> para total transparência.
                </p>
              </div>
              <div
                className="bg-background/60 px-5 py-3 text-center"
                style={{ borderRadius: 2, boxShadow: "inset 0 0 0 1px hsl(var(--warning) / 0.3)" }}
              >
                <p className="font-pixel text-xl text-warning">{raffles?.length || 0}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Rifas ativas</p>
              </div>
            </div>
          </div>

          {/* Raffle Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(raffles || []).map((r) => (
              <RaffleCard key={r.id} r={r} />
            ))}
          </div>

          {(!raffles || raffles.length === 0) && (
            <div className="text-center py-20 bg-card" style={pixelBox}>
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-warning/10"
                style={{ borderRadius: 2, boxShadow: "0 0 0 2px hsl(var(--warning) / 0.3)" }}
              >
                <Ticket className="h-8 w-8 text-warning/40" />
              </div>
              <p className="text-muted-foreground text-sm mb-1 font-body">Nenhuma rifa ativa no momento</p>
              <p className="text-muted-foreground/60 text-xs font-body">Volte em breve!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== LOADING =====
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 max-w-6xl space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-80" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  // ===== NOT FOUND =====
  if (!raffle) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <p className="text-muted-foreground mb-2 font-body">Rifa não encontrada.</p>
          <Link to="/rifa" className="text-primary hover:underline text-sm font-body">
            ← Ver todas as rifas
          </Link>
        </div>
      </div>
    );
  }

  const soldNumbers = numbers?.length || 0;
  const myNumbers = numbers?.filter((n) => n.user_id === user?.id) || [];
  const soldNumberSet = new Set(numbers?.map((n) => n.number) || []);
  const myNumberSet = new Set(myNumbers.map((n) => n.number));
  const totalCost = quantity * raffle.price_per_number;
  const availableCount = raffle.total_numbers - soldNumbers;
  const progressPct = Math.round((soldNumbers / raffle.total_numbers) * 100);

  const handleBuy = () => {
    buyNumbers.mutate(
      { raffleId: raffle.id, quantity },
      { onSuccess: () => setBuyDialogOpen(false) }
    );
  };

  // Limita a grade visual para 100 números (raffles maiores apenas mostram amostragem)
  const gridSize = Math.min(raffle.total_numbers, 100);
  const showFullGrid = raffle.total_numbers <= 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-6 max-w-6xl">
        <Link
          to="/rifa"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors group font-pixel uppercase tracking-wider"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Voltar
        </Link>

        {/* Hero Banner pixel */}
        <div
          className="relative overflow-hidden mb-6 bg-card"
          style={goldenBox}
        >
          <div className="p-1.5">
            <div
              className="relative h-56 md:h-72 overflow-hidden bg-secondary"
              style={{
                borderRadius: 1,
                boxShadow: "inset 0 0 0 1px hsl(var(--border))",
              }}
            >
              {raffle.image_url ? (
                <img
                  src={raffle.image_url}
                  alt={raffle.title}
                  className="w-full h-full object-cover"
                  style={{ imageRendering: "pixelated" as const }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-warning/15 via-primary/5 to-background">
                  <Trophy className="h-20 w-20 text-warning/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={cn(
                      "font-pixel text-[9px] uppercase tracking-wider px-2.5 py-1",
                      raffle.status === "active"
                        ? "bg-primary text-primary-foreground"
                        : raffle.status === "completed"
                        ? "bg-warning text-warning-foreground"
                        : "bg-destructive text-destructive-foreground"
                    )}
                    style={{ borderRadius: 1 }}
                  >
                    {raffle.status === "active" ? "● Ativa" : raffle.status === "completed" ? "★ Finalizada" : "✕ Cancelada"}
                  </span>
                  {raffle.federal_lottery_ref && (
                    <span
                      className="font-pixel text-[9px] uppercase tracking-wider px-2.5 py-1 bg-warning/20 text-warning"
                      style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--warning) / 0.4)" }}
                    >
                      🎰 Loteria Federal
                    </span>
                  )}
                </div>
                <h1 className="font-pixel text-base md:text-xl text-foreground leading-tight">{raffle.title}</h1>
                {raffle.description && (
                  <p className="text-xs text-muted-foreground mt-2 max-w-xl font-body leading-relaxed">
                    {raffle.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards pixel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Coins, label: "coins/número", value: raffle.price_per_number, color: "warning" },
            { icon: Hash, label: "total", value: raffle.total_numbers, color: "primary" },
            { icon: Ticket, label: "vendidos", value: soldNumbers, color: "destructive" },
            { icon: Sparkles, label: "disponíveis", value: availableCount, color: "primary" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-card p-4 text-center"
              style={{
                borderRadius: 2,
                boxShadow: `0 0 0 2px hsl(var(--${stat.color}) / 0.3), 0 0 0 3px hsl(var(--background)), inset 0 0 0 1px hsl(var(--card))`,
              }}
            >
              <stat.icon className={`h-4 w-4 mx-auto mb-2 text-${stat.color}`} />
              <p className={`font-pixel text-base text-${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wider font-body">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Winner Banner */}
            {raffle.winner_number != null && (
              <div
                className="bg-card p-6 text-center"
                style={goldenBox}
              >
                <div
                  className="w-14 h-14 flex items-center justify-center mx-auto mb-3 bg-warning/20"
                  style={{ borderRadius: 2, boxShadow: "0 0 0 2px hsl(var(--warning) / 0.4)" }}
                >
                  <Crown className="h-7 w-7 text-warning" />
                </div>
                <p className="font-pixel text-xs text-warning mb-2 uppercase tracking-wider">★ Número Vencedor ★</p>
                <p className="font-pixel text-5xl text-warning">{raffle.winner_number}</p>
              </div>
            )}

            {/* My Numbers */}
            {myNumbers.length > 0 && (
              <div className="bg-card p-5" style={primaryBox}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-pixel text-xs text-primary uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Seus Números ({myNumbers.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {myNumbers.map((n) => (
                    <div
                      key={n.id}
                      className="bg-primary text-primary-foreground px-3 py-2 font-pixel text-xs"
                      style={{
                        borderRadius: 1,
                        boxShadow: "0 0 0 1px hsl(var(--primary) / 0.5), 0 2px 0 hsl(var(--primary) / 0.6)",
                      }}
                    >
                      #{String(n.number).padStart(2, "0")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grade de números pixel */}
            <div className="bg-card p-5" style={pixelBox}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-pixel text-xs text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-primary" />
                  {showFullGrid ? "Cartela de Números" : `Primeiros ${gridSize} números`}
                </h3>
                <div className="flex items-center gap-3 text-[9px] font-body">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-secondary" style={{ boxShadow: "inset 0 0 0 1px hsl(var(--border))" }} />
                    <span className="text-muted-foreground">Livre</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-destructive/50" />
                    <span className="text-muted-foreground">Vendido</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary" />
                    <span className="text-muted-foreground">Seu</span>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: gridSize }, (_, i) => i + 1).map((num) => {
                  const isMine = myNumberSet.has(num);
                  const isSold = soldNumberSet.has(num);
                  return (
                    <div
                      key={num}
                      className={cn(
                        "aspect-square flex items-center justify-center font-pixel text-[9px] transition-all",
                        isMine
                          ? "bg-primary text-primary-foreground"
                          : isSold
                          ? "bg-destructive/40 text-destructive-foreground/70 line-through"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      )}
                      style={{
                        borderRadius: 1,
                        boxShadow: isMine
                          ? "inset 0 0 0 1px hsl(var(--primary) / 0.7), 0 1px 0 hsl(var(--primary) / 0.6)"
                          : isSold
                          ? "inset 0 0 0 1px hsl(var(--destructive) / 0.4)"
                          : "inset 0 0 0 1px hsl(var(--border))",
                      }}
                      title={isMine ? "Seu número" : isSold ? "Vendido" : "Disponível"}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
              {!showFullGrid && (
                <p className="text-[10px] text-muted-foreground/70 mt-3 text-center font-body">
                  Mostrando os primeiros {gridSize} de {raffle.total_numbers} números (visualização)
                </p>
              )}
            </div>

            {/* Loteria info */}
            {raffle.federal_lottery_ref && (
              <div className="bg-card p-5 flex items-start gap-4" style={{ ...pixelBox, boxShadow: "0 0 0 2px hsl(var(--warning) / 0.4), 0 0 0 3px hsl(var(--background)), inset 0 0 0 1px hsl(var(--card))" }}>
                <div
                  className="w-12 h-12 flex items-center justify-center shrink-0 bg-warning/15"
                  style={{ borderRadius: 2, boxShadow: "inset 0 0 0 1px hsl(var(--warning) / 0.4)" }}
                >
                  <span className="text-2xl">🎰</span>
                </div>
                <div className="flex-1">
                  <p className="font-pixel text-xs text-warning mb-1 uppercase tracking-wider">Loteria Federal</p>
                  <p className="text-xs text-muted-foreground font-body">
                    Referência: <span className="text-foreground font-semibold">{raffle.federal_lottery_ref}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 mt-1 font-body leading-relaxed">
                    O resultado é baseado na Loteria Federal para garantir total transparência no sorteio.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Progress pixel */}
            <div className="bg-card p-5" style={pixelBox}>
              <h3 className="font-pixel text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Progresso</h3>
              <div
                className="w-full bg-secondary h-5 mb-2 overflow-hidden relative"
                style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--border))" }}
              >
                <div
                  className="bg-warning h-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                  style={{
                    width: `${Math.max(progressPct, 4)}%`,
                    boxShadow: "inset 0 -2px 0 hsl(var(--warning) / 0.5)",
                  }}
                >
                  {progressPct > 18 && (
                    <span className="font-pixel text-[8px] text-warning-foreground">{progressPct}%</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-body">
                <span>{soldNumbers} vendidos</span>
                <span>{availableCount} restantes</span>
              </div>
            </div>

            {/* Comprar */}
            <div className="bg-card p-5 space-y-4" style={goldenBox}>
              <h3 className="font-pixel text-[10px] text-warning uppercase tracking-wider flex items-center gap-2">
                <Ticket className="h-3.5 w-3.5" />
                Comprar Números
              </h3>

              {user ? (
                <>
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 bg-warning/10"
                    style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--warning) / 0.4)" }}
                  >
                    <Coins className="h-4 w-4 text-warning shrink-0" />
                    <div>
                      <p className="font-pixel text-xs text-warning">{wallet?.balance || 0}</p>
                      <p className="text-[9px] text-muted-foreground font-body">Seu saldo</p>
                    </div>
                  </div>

                  {raffle.status === "active" && availableCount > 0 ? (
                    <Button
                      onClick={() => setBuyDialogOpen(true)}
                      className="w-full bg-warning text-warning-foreground hover:bg-warning/90 h-12 font-pixel text-[11px] uppercase tracking-wider"
                      style={{
                        borderRadius: 2,
                        boxShadow: "0 0 0 2px hsl(var(--warning) / 0.4), 0 4px 0 hsl(var(--warning) / 0.5)",
                      }}
                    >
                      <Ticket className="h-4 w-4 mr-2" />
                      Comprar
                    </Button>
                  ) : raffle.status !== "active" ? (
                    <div
                      className="text-center py-4 bg-secondary/50"
                      style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--border))" }}
                    >
                      <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground font-body">Rifa encerrada</p>
                    </div>
                  ) : (
                    <div
                      className="text-center py-4 bg-warning/5"
                      style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--warning) / 0.4)" }}
                    >
                      <Sparkles className="h-5 w-5 text-warning mx-auto mb-1" />
                      <p className="font-pixel text-[10px] text-warning uppercase tracking-wider">Esgotado!</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <p className="text-xs text-muted-foreground font-body">Faça login para comprar</p>
                  <Link to="/login">
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground font-pixel text-[10px] uppercase tracking-wider"
                      style={{ borderRadius: 2 }}
                    >
                      Entrar
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Como funciona */}
            <div className="bg-card p-5" style={pixelBox}>
              <h3 className="font-pixel text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
                Como funciona
              </h3>
              <ol className="space-y-2.5">
                {[
                  { n: "1", text: "Tenha Rubini Coins na carteira" },
                  { n: "2", text: "Compre números aleatórios" },
                  { n: "3", text: "Aguarde o sorteio (Loteria Federal)" },
                  { n: "4", text: "Se seu número sair, você ganha!" },
                ].map((step) => (
                  <li key={step.n} className="flex items-start gap-2.5">
                    <span
                      className="shrink-0 w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground font-pixel text-[9px]"
                      style={{ borderRadius: 1 }}
                    >
                      {step.n}
                    </span>
                    <span className="text-[11px] text-foreground font-body leading-snug">{step.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Dialog pixel */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="bg-card border-0 max-w-sm p-7" style={goldenBox}>
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2 font-pixel text-xs uppercase tracking-wider">
              <div
                className="w-7 h-7 flex items-center justify-center bg-warning/20"
                style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--warning) / 0.5)" }}
              >
                <Ticket className="h-3.5 w-3.5 text-warning" />
              </div>
              Comprar Números
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs font-body pt-1">
              Números aleatórios serão sorteados para você.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="font-pixel text-[10px] text-muted-foreground uppercase tracking-wider">
                Quantidade
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 font-pixel"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  style={{ borderRadius: 1 }}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={availableCount}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Math.min(availableCount, Number(e.target.value))))
                  }
                  className="bg-secondary border-border text-center h-10 font-pixel"
                  style={{ borderRadius: 1 }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 font-pixel"
                  onClick={() => setQuantity(Math.min(availableCount, quantity + 1))}
                  disabled={quantity >= availableCount}
                  style={{ borderRadius: 1 }}
                >
                  +
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground font-body">
                {availableCount} disponíveis
              </p>
            </div>

            <div
              className="bg-warning/5 p-4 space-y-2"
              style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--warning) / 0.3)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-body">Preço unitário:</span>
                <span className="text-xs text-muted-foreground font-pixel">
                  {raffle.price_per_number}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-warning/15 pt-2">
                <span className="font-pixel text-[10px] text-foreground uppercase tracking-wider">
                  Total:
                </span>
                <span className="font-pixel text-base text-warning flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  {totalCost}
                </span>
              </div>
            </div>

            {(wallet?.balance || 0) < totalCost && (
              <div
                className="bg-destructive/10 p-3 flex items-center gap-2"
                style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--destructive) / 0.4)" }}
              >
                <span className="text-destructive text-base">⚠</span>
                <p className="text-[11px] text-destructive font-body">Saldo insuficiente!</p>
              </div>
            )}

            <Button
              onClick={handleBuy}
              disabled={
                buyNumbers.isPending || (wallet?.balance || 0) < totalCost || quantity < 1
              }
              className="w-full bg-warning text-warning-foreground hover:bg-warning/90 h-12 font-pixel text-[11px] uppercase tracking-wider disabled:opacity-50"
              style={{
                borderRadius: 2,
                boxShadow:
                  "0 0 0 2px hsl(var(--warning) / 0.4), 0 4px 0 hsl(var(--warning) / 0.5)",
              }}
            >
              {buyNumbers.isPending
                ? "Comprando..."
                : `► Comprar ${quantity} número${quantity > 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RifaPage;
