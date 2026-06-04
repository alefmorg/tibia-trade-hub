import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useRaffle, useRaffleNumbers, useBuyRaffleNumbers, useRaffles } from "@/hooks/useRaffles";
import { useRafflePageSettings } from "@/hooks/useRafflePageSettings";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Coins,
  Crown,
  Ticket,
  Trophy,
  Calendar,
  Clock,
  Sparkles,
  Flame,
  Gift,
  Shield,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";


const RAFFLE_AGE_GATE_KEY = "raffles-age-confirmed";

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

// ============================================================================
// CARD DA RIFA — Inspirado em sites de rifas reais (ex: gemeosbrasil) mantendo
// a identidade pixel/Tibia: prêmio em destaque, progresso, urgência e CTA forte
// ============================================================================
const RaffleCard = ({ r }: { r: any }) => {
  const isActive = r.status === "active";
  const isCompleted = r.status === "completed";
  const drawDate = r.draw_date ? new Date(r.draw_date) : null;
  const daysLeft = drawDate
    ? Math.max(0, Math.ceil((drawDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <Link
      to={`/rifa/${r.id}`}
      className="group relative block bg-card transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01]"
      style={goldenBox}
    >
      {/* Faixa superior tipo "campanha" */}
      <div
        className="absolute -top-2.5 left-3 z-20 px-2.5 py-1 bg-warning text-warning-foreground font-pixel text-[8px] uppercase tracking-wider flex items-center gap-1"
        style={{ borderRadius: 1, boxShadow: "0 0 0 2px hsl(var(--warning) / 0.4), 0 2px 0 hsl(var(--warning) / 0.6)" }}
      >
        <Flame className="h-2.5 w-2.5" />
        Campanha
      </div>

      {/* Status pin direito */}
      {isActive && r.sales_blocked ? (
        <div
          className="absolute -top-2.5 right-3 z-20 px-2.5 py-1 bg-destructive text-destructive-foreground font-pixel text-[8px] uppercase tracking-wider"
          style={{ borderRadius: 1, boxShadow: "0 0 0 2px hsl(var(--destructive) / 0.4)" }}
        >
          🔒 Vendas pausadas
        </div>
      ) : isActive && daysLeft !== null && daysLeft <= 3 && (
        <div
          className="absolute -top-2.5 right-3 z-20 px-2.5 py-1 bg-destructive text-destructive-foreground font-pixel text-[8px] uppercase tracking-wider animate-pulse"
          style={{ borderRadius: 1, boxShadow: "0 0 0 2px hsl(var(--destructive) / 0.4)" }}
        >
          ⏰ Acabando!
        </div>
      )}

      <div className="p-1.5">
        {/* Imagem do prêmio com overlay dramático */}
        <div
          className="relative h-48 overflow-hidden bg-secondary"
          style={{
            borderRadius: 1,
            boxShadow: "inset 0 0 0 1px hsl(var(--border)), inset 0 0 0 2px hsl(var(--background))",
          }}
        >
          {r.image_url ? (
            <img
              src={r.image_url}
              alt={r.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              style={{ imageRendering: "pixelated" as const }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-warning/20 via-primary/10 to-background">
              <Trophy className="h-16 w-16 text-warning/40" />
            </div>
          )}

          {/* Overlay gradiente para legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

          {/* Badge "PRÊMIO" sobre a imagem */}
          <div
            className="absolute top-2 left-2 px-2 py-0.5 bg-background/80 backdrop-blur font-pixel text-[8px] uppercase tracking-wider text-warning flex items-center gap-1"
            style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--warning) / 0.5)" }}
          >
            <Gift className="h-2.5 w-2.5" />
            Prêmio
          </div>

          {/* Status no canto */}
          <div className="absolute top-2 right-2">
            {isActive ? (
              <span
                className="px-2 py-0.5 bg-primary text-primary-foreground font-pixel text-[8px] uppercase tracking-wider flex items-center gap-1"
                style={{ borderRadius: 1 }}
              >
                <span className="w-1.5 h-1.5 bg-primary-foreground animate-pulse" />
                Ativa
              </span>
            ) : isCompleted ? (
              <span
                className="px-2 py-0.5 bg-warning text-warning-foreground font-pixel text-[8px] uppercase tracking-wider"
                style={{ borderRadius: 1 }}
              >
                ★ Sorteada
              </span>
            ) : (
              <span
                className="px-2 py-0.5 bg-destructive text-destructive-foreground font-pixel text-[8px] uppercase tracking-wider"
                style={{ borderRadius: 1 }}
              >
                ✕ Cancelada
              </span>
            )}
          </div>

          {/* Título grande sobre imagem */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-pixel text-[12px] text-foreground leading-tight line-clamp-2 drop-shadow-[0_2px_0_hsl(var(--background))]">
              {r.title}
            </h3>
          </div>
        </div>

        {/* Conteúdo inferior */}
        <div className="p-3 space-y-3">
          {/* Descrição curta */}
          {r.description && (
            <p className="text-[11px] text-muted-foreground font-body line-clamp-2 leading-relaxed">
              {r.description}
            </p>
          )}

          {/* Barra de progresso (manual via admin) */}
          {r.progress_percent != null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9px] font-pixel uppercase tracking-wider">
                <span className="text-muted-foreground">Progresso</span>
                <span className="text-warning">{r.progress_percent}%</span>
              </div>
              <div
                className="w-full h-2.5 bg-secondary overflow-hidden"
                style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--border))" }}
              >
                <div
                  className="h-full bg-warning transition-all duration-700"
                  style={{ width: `${Math.max(0, Math.min(100, r.progress_percent))}%`, boxShadow: "inset 0 -2px 0 hsl(var(--warning) / 0.5)" }}
                />
              </div>
            </div>
          )}

          {/* Linha: preço por bilhete + sorteio (Loteria Federal) */}
          <div
            className="bg-warning/10 px-3 py-2 flex items-center justify-between"
            style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--warning) / 0.4)" }}
          >
            <div>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-body">Por bilhete</p>
              <div className="flex items-center gap-1 text-warning mt-0.5">
                <Coins className="h-3 w-3" />
                <span className="font-pixel text-[12px]">{r.price_per_number}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-body">Sorteio</p>
              <div className="flex items-center gap-1 text-primary mt-0.5 justify-end">
                <Shield className="h-3 w-3" />
                <span className="font-pixel text-[9px]">Lot. Federal</span>
              </div>
            </div>
          </div>

          {/* Data do sorteio */}
          {drawDate && (
            <div
              className="flex items-center justify-between gap-2 text-[10px] bg-secondary/60 px-2.5 py-1.5 font-body"
              style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--border))" }}
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {drawDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
              {isActive && daysLeft !== null && (
                <span
                  className={cn(
                    "font-pixel text-[9px] uppercase",
                    daysLeft <= 3 ? "text-destructive" : "text-warning"
                  )}
                >
                  {daysLeft === 0 ? "Hoje!" : `${daysLeft}d`}
                </span>
              )}
            </div>
          )}

          {/* CTA */}
          <div
            className={cn(
              "w-full py-2.5 text-center font-pixel text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
              isActive
                ? "bg-warning text-warning-foreground group-hover:bg-warning/90"
                : "bg-secondary text-muted-foreground"
            )}
            style={{
              borderRadius: 1,
              boxShadow: isActive
                ? "0 0 0 2px hsl(var(--warning) / 0.4), 0 3px 0 hsl(var(--warning) / 0.6)"
                : "0 0 0 1px hsl(var(--border))",
            }}
          >
            {isActive ? (
              <>
                <Zap className="h-3 w-3" />
                Garantir meus bilhetes
              </>
            ) : isCompleted ? (
              <>
                <Crown className="h-3 w-3" />
                Ver resultado
              </>
            ) : (
              "Encerrada"
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

const RifaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: wallet } = useWallet();
  const [quantity, setQuantity] = useState(1);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
  const [ageGateChecked, setAgeGateChecked] = useState(false);

  const { data: raffle, isLoading } = useRaffle(id || "");
  const { data: numbers } = useRaffleNumbers(id || "");
  const buyNumbers = useBuyRaffleNumbers();

  const { data: raffles } = useRaffles(true);
  const { data: pageSettings } = useRafflePageSettings();

  useEffect(() => {
    const ageConfirmed = window.localStorage.getItem(RAFFLE_AGE_GATE_KEY) === "true";
    setIsAgeConfirmed(ageConfirmed);
    setAgeGateChecked(true);
  }, []);

  const handleAgeConfirm = () => {
    window.localStorage.setItem(RAFFLE_AGE_GATE_KEY, "true");
    setIsAgeConfirmed(true);
  };

  const handleAgeDecline = () => {
    window.localStorage.removeItem(RAFFLE_AGE_GATE_KEY);
    navigate("/");
  };

  if (!ageGateChecked) return null;

  if (!isAgeConfirmed) {
    return (
      <Dialog open>
        <DialogContent
          className="max-w-md"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-pixel text-sm">Confirmação de maioridade</DialogTitle>
            <DialogDescription className="font-body text-xs">
              Esta área de rifas é destinada apenas para maiores de 18 anos.
              Você confirma que tem 18 anos ou mais?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleAgeDecline}>Não</Button>
            <Button onClick={handleAgeConfirm}>Sim, sou maior de idade</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ===== LISTA =====
  if (!id) {
    const activeCount = raffles?.length || 0;

    // Coming soon mode
    if (pageSettings?.coming_soon) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container py-16 max-w-3xl">
            <div className="relative overflow-hidden bg-card p-10 text-center" style={goldenBox}>
              <div aria-hidden className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-warning/10 blur-3xl" />
              {pageSettings.coming_soon_image_url ? (
                <img
                  src={pageSettings.coming_soon_image_url}
                  alt="Em breve"
                  className="mx-auto mb-6 max-h-48 object-contain"
                  style={{ imageRendering: "pixelated" as const }}
                />
              ) : (
                <div
                  className="w-20 h-20 flex items-center justify-center mx-auto mb-6 bg-warning/15"
                  style={{ borderRadius: 2, boxShadow: "0 0 0 2px hsl(var(--warning) / 0.5), inset 0 0 0 2px hsl(var(--background))" }}
                >
                  <Clock className="h-10 w-10 text-warning" strokeWidth={2.5} />
                </div>
              )}
              <h1 className="font-pixel text-lg md:text-2xl text-warning mb-3 flex items-center gap-2 justify-center">
                <Sparkles className="h-5 w-5" />
                {pageSettings.coming_soon_title}
                <Sparkles className="h-5 w-5" />
              </h1>
              <p className="text-sm text-muted-foreground font-body max-w-xl mx-auto leading-relaxed whitespace-pre-wrap">
                {pageSettings.coming_soon_message}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 max-w-6xl">
          {/* Hero pixel */}
          <div className="relative overflow-hidden bg-card p-7 mb-8" style={goldenBox}>
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
                  {pageSettings?.page_title || "CAMPANHAS ATIVAS"}
                </h1>
                <p className="text-xs text-muted-foreground font-body max-w-md leading-relaxed">
                  {pageSettings?.page_subtitle || "Escolha sua sorte e garanta seus bilhetes! Sorteio oficial baseado na Loteria Federal — total transparência."}
                </p>
              </div>
              <div
                className="bg-background/60 px-5 py-3 text-center"
                style={{ borderRadius: 2, boxShadow: "inset 0 0 0 1px hsl(var(--warning) / 0.3)" }}
              >
                <p className="font-pixel text-xl text-warning">{activeCount}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Ativas</p>
              </div>
            </div>
          </div>

          {/* Raffle Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 pt-3">
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
              <p className="text-muted-foreground text-sm mb-1 font-body">Nenhuma campanha ativa no momento</p>
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
          <p className="text-muted-foreground mb-2 font-body">Campanha não encontrada.</p>
          <Link to="/rifa" className="text-primary hover:underline text-sm font-body">
            ← Ver todas as campanhas
          </Link>
        </div>
      </div>
    );
  }

  const soldNumbers = numbers?.length || 0;
  const myNumbers = numbers?.filter((n) => n.user_id === user?.id) || [];
  const totalCost = quantity * raffle.price_per_number;
  const availableCount = raffle.total_numbers - soldNumbers;
  const progressPct = Math.round((soldNumbers / raffle.total_numbers) * 100);
  const drawDate = raffle.draw_date ? new Date(raffle.draw_date) : null;

  // Largura do bilhete varia conforme tamanho da rifa (ex: 100000 = 6 dígitos)
  const ticketDigits = String(raffle.total_numbers).length;
  const formatTicket = (n: number) => String(n).padStart(ticketDigits, "0");

  const handleBuy = () => {
    buyNumbers.mutate(
      { raffleId: raffle.id, quantity },
      { onSuccess: () => setBuyDialogOpen(false) }
    );
  };

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
        <div className="relative overflow-hidden mb-6 bg-card" style={goldenBox}>
          <div className="p-1.5">
            <div
              className="relative h-56 md:h-80 overflow-hidden bg-secondary"
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
                <div className="flex items-center gap-2 mb-3 flex-wrap">
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
                  <span
                    className="font-pixel text-[9px] uppercase tracking-wider px-2.5 py-1 bg-warning/20 text-warning flex items-center gap-1"
                    style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--warning) / 0.4)" }}
                  >
                    <Shield className="h-2.5 w-2.5" />
                    Loteria Federal
                  </span>
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

        {/* Stats Cards pixel — apenas info pública (sem expor quantidade de bilhetes) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <div
            className="bg-card p-4 text-center"
            style={{
              borderRadius: 2,
              boxShadow: `0 0 0 2px hsl(var(--warning) / 0.3), 0 0 0 3px hsl(var(--background)), inset 0 0 0 1px hsl(var(--card))`,
            }}
          >
            <Coins className="h-4 w-4 mx-auto mb-2 text-warning" />
            <p className="font-pixel text-base text-warning">{raffle.price_per_number.toLocaleString("pt-BR")}</p>
            <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wider font-body">coins/bilhete</p>
          </div>

          <div
            className="bg-card p-4 text-center"
            style={{
              borderRadius: 2,
              boxShadow: `0 0 0 2px hsl(var(--primary) / 0.3), 0 0 0 3px hsl(var(--background)), inset 0 0 0 1px hsl(var(--card))`,
            }}
          >
            <Flame className="h-4 w-4 mx-auto mb-2 text-primary" />
            <p className="font-pixel text-base text-primary">{(raffle.progress_percent ?? progressPct)}%</p>
            <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wider font-body">vendidos</p>
          </div>

          <div
            className="bg-card p-4 text-center col-span-2 md:col-span-1"
            style={{
              borderRadius: 2,
              boxShadow: `0 0 0 2px hsl(var(--warning) / 0.3), 0 0 0 3px hsl(var(--background)), inset 0 0 0 1px hsl(var(--card))`,
            }}
          >
            <Calendar className="h-4 w-4 mx-auto mb-2 text-warning" />
            <p className="font-pixel text-[11px] text-warning">
              {drawDate
                ? drawDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })
                : "a definir"}
            </p>
            <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wider font-body">sorteio</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Winner Banner */}
            {raffle.winner_number != null && (
              <div className="bg-card p-6 text-center" style={goldenBox}>
                <div
                  className="w-14 h-14 flex items-center justify-center mx-auto mb-3 bg-warning/20"
                  style={{ borderRadius: 2, boxShadow: "0 0 0 2px hsl(var(--warning) / 0.4)" }}
                >
                  <Crown className="h-7 w-7 text-warning" />
                </div>
                <p className="font-pixel text-xs text-warning mb-2 uppercase tracking-wider">★ Bilhete Vencedor ★</p>
                <p className="font-pixel text-5xl text-warning tracking-widest">
                  {formatTicket(raffle.winner_number)}
                </p>
              </div>
            )}

            {/* My Tickets — destacados */}
            {myNumbers.length > 0 && (
              <div className="bg-card p-5" style={primaryBox}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-pixel text-xs text-primary uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Meus Bilhetes ({myNumbers.length})
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {myNumbers.map((n) => (
                    <div
                      key={n.id}
                      className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-3 text-center"
                      style={{
                        borderRadius: 2,
                        boxShadow:
                          "0 0 0 2px hsl(var(--primary) / 0.5), inset 0 0 0 1px hsl(var(--primary) / 0.2), 0 2px 0 hsl(var(--primary) / 0.6)",
                      }}
                    >
                      <p className="text-[8px] text-primary/70 font-pixel uppercase tracking-wider mb-1">
                        Bilhete
                      </p>
                      <p className="font-pixel text-sm text-primary tracking-widest">
                        {formatTicket(n.number)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 text-center font-body">
                  Boa sorte! 🍀 O sorteio é baseado nos resultados da Loteria Federal.
                </p>
              </div>
            )}

            {/* Loteria Federal — explicação completa */}
            <div className="bg-card p-6" style={pixelBox}>
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-14 h-14 flex items-center justify-center shrink-0 bg-warning/15"
                  style={{ borderRadius: 2, boxShadow: "0 0 0 2px hsl(var(--warning) / 0.4)" }}
                >
                  <Shield className="h-7 w-7 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-pixel text-sm text-warning uppercase tracking-wider mb-1">
                    Sorteio pela Loteria Federal
                  </h3>
                  <p className="text-xs text-muted-foreground font-body leading-relaxed">
                    Todo sorteio é baseado no resultado oficial da{" "}
                    <span className="text-foreground font-semibold">Loteria Federal do Brasil</span>, garantindo
                    transparência total e impossibilidade de manipulação.
                  </p>
                </div>
              </div>

              {raffle.federal_lottery_ref && (
                <div
                  className="bg-warning/5 px-4 py-3 mb-4"
                  style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--warning) / 0.3)" }}
                >
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-body">
                    Extração de referência
                  </p>
                  <p className="font-pixel text-sm text-warning mt-1">
                    Concurso #{raffle.federal_lottery_ref}
                  </p>
                </div>
              )}

              {/* Como o número é formado */}
              <div className="space-y-3">
                <p className="font-pixel text-[10px] text-foreground uppercase tracking-wider">
                  Como o bilhete vencedor é definido:
                </p>
                {[
                  {
                    icon: CheckCircle2,
                    text: "A Loteria Federal sorteia 5 prêmios (números de 5 dígitos cada).",
                  },
                  {
                    icon: CheckCircle2,
                    text: `Os últimos ${ticketDigits} dígitos do 1º prêmio formam o bilhete vencedor.`,
                  },
                  {
                    icon: CheckCircle2,
                    text: "Caso ninguém tenha o bilhete exato, segue para os prêmios seguintes.",
                  },
                  {
                    icon: CheckCircle2,
                    text: "Resultado público e auditável em loteriasonline.caixa.gov.br",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <item.icon className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground font-body leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
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
              <div className="flex justify-between items-center text-[10px] font-body">
                <span className="text-muted-foreground uppercase tracking-wider font-pixel text-[9px]">Campanha</span>
                <span className="text-warning font-pixel">
                  {(raffle.progress_percent ?? progressPct)}% concluída
                </span>
              </div>
              {drawDate && (
                <div
                  className="mt-3 pt-3 flex items-center gap-2 text-[10px] text-muted-foreground font-body"
                  style={{ borderTop: "1px dashed hsl(var(--border))" }}
                >
                  <Calendar className="h-3 w-3 text-warning" />
                  <span>
                    Sorteio:{" "}
                    <span className="text-foreground font-semibold">
                      {drawDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Comprar */}
            <div className="bg-card p-5 space-y-4" style={goldenBox}>
              <h3 className="font-pixel text-[10px] text-warning uppercase tracking-wider flex items-center gap-2">
                <Ticket className="h-3.5 w-3.5" />
                Garantir bilhetes
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

                  {raffle.sales_blocked && raffle.status === "active" ? (
                    <div
                      className="text-center py-4 bg-destructive/10 space-y-1"
                      style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--destructive) / 0.4)" }}
                    >
                      <Clock className="h-5 w-5 text-destructive mx-auto mb-1" />
                      <p className="font-pixel text-[10px] text-destructive uppercase tracking-wider">Vendas pausadas</p>
                      <p className="text-[10px] text-muted-foreground font-body px-3">As compras desta rifa estão temporariamente bloqueadas pelo administrador.</p>
                    </div>
                  ) : raffle.status === "active" && availableCount > 0 ? (
                    <Button
                      onClick={() => setBuyDialogOpen(true)}
                      className="w-full bg-warning text-warning-foreground hover:bg-warning/90 h-12 font-pixel text-[11px] uppercase tracking-wider"
                      style={{
                        borderRadius: 2,
                        boxShadow: "0 0 0 2px hsl(var(--warning) / 0.4), 0 4px 0 hsl(var(--warning) / 0.5)",
                      }}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Comprar bilhetes
                    </Button>
                  ) : raffle.status !== "active" ? (
                    <div
                      className="text-center py-4 bg-secondary/50"
                      style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--border))" }}
                    >
                      <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground font-body">Campanha encerrada</p>
                    </div>
                  ) : (
                    <div
                      className="text-center py-4 bg-warning/5"
                      style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--warning) / 0.4)" }}
                    >
                      <Sparkles className="h-5 w-5 text-warning mx-auto mb-1" />
                      <p className="font-pixel text-[10px] text-warning uppercase tracking-wider">Esgotada!</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <p className="text-xs text-muted-foreground font-body">Faça login para participar</p>
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
                  { n: "2", text: "Compre seus bilhetes da sorte" },
                  { n: "3", text: "Aguarde o sorteio da Loteria Federal" },
                  { n: "4", text: "Confira o resultado e receba seu prêmio!" },
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
              Comprar Bilhetes
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs font-body pt-1">
              Bilhetes aleatórios serão sorteados para você.
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
              <div className="flex gap-1 mt-2">
                {[5, 10, 25, 50].filter((v) => v <= availableCount).map((v) => (
                  <button
                    key={v}
                    onClick={() => setQuantity(v)}
                    className="flex-1 py-1 bg-secondary hover:bg-secondary/80 font-pixel text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                    style={{ borderRadius: 1, boxShadow: "inset 0 0 0 1px hsl(var(--border))" }}
                  >
                    +{v}
                  </button>
                ))}
              </div>
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
                  {totalCost.toLocaleString("pt-BR")}
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
                : `► Garantir ${quantity} bilhete${quantity > 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RifaPage;
