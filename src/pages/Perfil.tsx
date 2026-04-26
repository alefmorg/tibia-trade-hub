import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import TradeCard from "@/components/TradeCard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Save, Package, Heart, Calendar, Star, Coins, Sparkles,
  ArrowUpRight, ArrowDownLeft, History, Upload, Wallet, Pencil, Check, X
} from "lucide-react";
import UserBadges from "@/components/UserBadges";
import { useUserBadges } from "@/hooks/useUserBadges";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/hooks/useAuth";
import { useWallet, useHighlightPlans, useHighlightAd, useWalletTransactions } from "@/hooks/useWallet";
import { useDepositConfig, useMyDeposits, useCreateDeposit } from "@/hooks/useDeposits";
import { DepositScreenshot } from "@/components/DepositScreenshot";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ---------- subcomponents ---------- */

const StatChip = ({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: "warning" | "primary" }) => (
  <div className={cn(
    "flex flex-col gap-0.5 rounded-xl border bg-card/60 backdrop-blur-sm px-3.5 py-2.5 min-w-[96px]",
    accent === "warning" ? "border-warning/30" : accent === "primary" ? "border-primary/30" : "border-border/60",
  )}>
    <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
      <span className={accent === "warning" ? "text-warning" : accent === "primary" ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      {label}
    </span>
    <span className={cn(
      "text-base font-bold tabular-nums leading-tight",
      accent === "warning" ? "text-warning" : accent === "primary" ? "text-primary" : "text-foreground"
    )}>
      {value}
    </span>
  </div>
);

const TabButton = ({
  active, onClick, icon, children, tone = "default",
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode;
  tone?: "default" | "warning";
}) => (
  <button
    onClick={onClick}
    className={cn(
      "relative inline-flex items-center gap-1.5 px-3.5 h-9 text-xs font-medium transition-colors",
      "border-b-2 -mb-px",
      active
        ? tone === "warning"
          ? "text-warning border-warning"
          : "text-foreground border-primary"
        : "text-muted-foreground border-transparent hover:text-foreground"
    )}
  >
    {icon}
    {children}
  </button>
);

const SectionTitle = ({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) => (
  <div className="flex items-end justify-between mb-4">
    <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">{children}</h2>
    {hint}
  </div>
);

/* ---------- page ---------- */

const Perfil = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwnProfile = !userId || userId === user?.id;
  const profileUserId = isOwnProfile ? user?.id : userId;

  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [activeTab, setActiveTab] = useState<"ads" | "favorites" | "transactions" | "deposit">("ads");
  const [highlightDialogOpen, setHighlightDialogOpen] = useState(false);
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const [depositGold, setDepositGold] = useState("");
  const [depositScreenshot, setDepositScreenshot] = useState<File | null>(null);

  const { data: wallet } = useWallet();
  const { data: plans } = useHighlightPlans();
  const highlightAd = useHighlightAd();
  const { data: transactions } = useWalletTransactions();
  const activePlans = (plans || []).filter(p => p.active);

  const { data: depositConfig } = useDepositConfig();
  const { data: myDeposits } = useMyDeposits();
  const createDeposit = useCreateDeposit();
  const rate = depositConfig?.gold_to_coins_rate || 1;

  const { data: badges = [] } = useUserBadges(profileUserId);

  const { data: userRole } = useQuery({
    queryKey: ["user-role", profileUserId],
    enabled: !!profileUserId,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", profileUserId!).maybeSingle();
      return (data?.role as string) || "user";
    },
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", profileUserId],
    enabled: !!profileUserId,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", profileUserId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: userAds, isLoading: adsLoading } = useQuery({
    queryKey: ["user-ads", profileUserId],
    enabled: !!profileUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*, profiles!ads_user_id_fkey(username, avatar_url), items!ads_item_id_fkey(tier)")
        .eq("user_id", profileUserId!)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: favoriteAds, isLoading: favsLoading } = useQuery({
    queryKey: ["favorite-ads", profileUserId],
    enabled: !!profileUserId && isOwnProfile,
    queryFn: async () => {
      const { data: favs, error: favError } = await supabase.from("favorites").select("ad_id").eq("user_id", profileUserId!);
      if (favError) throw favError;
      if (!favs || favs.length === 0) return [];
      const adIds = favs.map((f: any) => f.ad_id);
      const { data: adsData, error: adsError } = await supabase
        .from("ads")
        .select("*, profiles!ads_user_id_fkey(username, avatar_url), items!ads_item_id_fkey(tier)")
        .in("id", adIds)
        .eq("status", "active");
      if (adsError) throw adsError;
      return adsData || [];
    },
  });

  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username);
      setEditBio(profile.bio || "");
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (updates: { username?: string; bio?: string }) => {
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil atualizado!");
      setEditing(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSaveProfile = () => {
    updateProfile.mutate({ username: editUsername.trim(), bio: editBio.trim() });
  };

  const handleHighlight = (planId: string) => {
    if (!selectedAdId) return;
    highlightAd.mutate(
      { adId: selectedAdId, planId },
      {
        onSuccess: () => {
          setHighlightDialogOpen(false);
          setSelectedAdId(null);
          queryClient.invalidateQueries({ queryKey: ["user-ads"] });
        },
      }
    );
  };

  const memberSince = profile ? new Date(profile.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) : "";
  const totalAds = userAds?.length || 0;
  const isPremium = badges.some((b) => b.badge_type === "premium_verified");

  if (!profileUserId) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Faça login para ver seu perfil.</p>
          <Link to="/login" className="text-primary hover:underline text-sm mt-2 inline-block">Entrar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container py-10 max-w-6xl">
        {profileLoading ? (
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
        ) : profile ? (
          <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
            {/* ===== Identidade ===== */}
            <section className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-6 sm:p-8">
              <div className="flex items-start gap-5 sm:gap-6">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border border-border">
                    {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.username} /> : null}
                    <AvatarFallback className="bg-secondary text-foreground text-2xl font-pixel">
                      {profile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isPremium && (
                    <span
                      title="Premium Verificado"
                      className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center bg-primary text-primary-foreground"
                      style={{
                        borderRadius: 2,
                        boxShadow: "0 0 0 2px hsl(var(--card)), 0 0 0 3px hsl(0 0% 0% / 0.55)",
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                        <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </span>
                  )}
                </div>

                {/* Nome + ações */}
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <div className="space-y-3 max-w-md">
                      <div>
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome</Label>
                        <Input
                          value={editUsername}
                          onChange={e => setEditUsername(e.target.value)}
                          className="bg-secondary/50 border-border h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Bio</Label>
                        <Textarea
                          value={editBio}
                          onChange={e => setEditBio(e.target.value)}
                          placeholder="Fale sobre você..."
                          className="bg-secondary/50 border-border min-h-[72px] mt-1 resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveProfile} disabled={updateProfile.isPending} className="h-8 bg-primary text-primary-foreground">
                          <Check className="h-3.5 w-3.5 mr-1" />
                          {updateProfile.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-8">
                          <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <h1 className="text-xl sm:text-2xl font-pixel text-foreground leading-tight truncate">
                            {profile.username}
                          </h1>
                          <p className="text-[11px] text-muted-foreground mt-1 capitalize">
                            membro desde {memberSince}
                          </p>
                        </div>
                        {isOwnProfile && (
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => setEditing(true)}
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                          </Button>
                        )}
                      </div>

                      {badges.length > 0 || userRole === "admin" || userRole === "moderator" ? (
                        <div className="mt-3">
                          <UserBadges badges={badges} role={userRole} size="sm" />
                        </div>
                      ) : null}

                      {profile.bio && (
                        <p className="mt-4 text-sm text-foreground/80 leading-relaxed max-w-prose">
                          {profile.bio}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* ===== Painel lateral ===== */}
            <aside className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-5">
              <SectionTitle>Resumo</SectionTitle>
              <div className="divide-y divide-border/50">
                <StatRow icon={<Package className="h-3.5 w-3.5" />} label="Anúncios ativos" value={totalAds} />
                <StatRow icon={<Star className="h-3.5 w-3.5" />} label="Selos" value={badges.length} />
                <StatRow icon={<Calendar className="h-3.5 w-3.5" />} label="Desde" value={<span className="capitalize">{memberSince}</span>} />
                {isOwnProfile && (
                  <StatRow
                    icon={<Coins className="h-3.5 w-3.5" />}
                    label="Saldo"
                    accent="warning"
                    value={`${wallet?.balance ?? 0} RC`}
                  />
                )}
              </div>

              {isOwnProfile && (
                <div className="mt-5 pt-5 border-t border-border/50 grid grid-cols-2 gap-2">
                  <Button
                    size="sm" variant="outline"
                    className="h-8 text-xs border-border"
                    onClick={() => setActiveTab("deposit")}
                  >
                    <Wallet className="h-3.5 w-3.5 mr-1" /> Depositar
                  </Button>
                  <Link to="/criar-anuncio">
                    <Button size="sm" className="h-8 text-xs w-full bg-primary text-primary-foreground">
                      <Sparkles className="h-3.5 w-3.5 mr-1" /> Anunciar
                    </Button>
                  </Link>
                </div>
              )}
            </aside>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Perfil não encontrado.</p>
          </div>
        )}

        {/* ===== Tabs ===== */}
        <div className="mt-10">
          <div className="border-b border-border/70 flex flex-wrap items-center gap-1">
            <TabButton active={activeTab === "ads"} onClick={() => setActiveTab("ads")} icon={<Package className="h-3.5 w-3.5" />}>
              Anúncios {!isOwnProfile && profile?.username ? `de ${profile.username}` : ""}
            </TabButton>
            {isOwnProfile && (
              <>
                <TabButton active={activeTab === "favorites"} onClick={() => setActiveTab("favorites")} icon={<Heart className="h-3.5 w-3.5" />}>
                  Favoritos
                </TabButton>
                <TabButton active={activeTab === "transactions"} onClick={() => setActiveTab("transactions")} icon={<History className="h-3.5 w-3.5" />}>
                  Histórico
                </TabButton>
                <TabButton active={activeTab === "deposit"} onClick={() => setActiveTab("deposit")} icon={<Wallet className="h-3.5 w-3.5" />} tone="warning">
                  Depositar
                </TabButton>
              </>
            )}
          </div>

          <div className="pt-6">
            {activeTab === "ads" && (
              <>
                {adsLoading ? (
                  <div className="trade-card-list">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 rounded-lg" />)}
                  </div>
                ) : userAds && userAds.length > 0 ? (
                  <div className="space-y-4">
                    {isOwnProfile && activePlans.length > 0 && (
                      <div className="rounded-xl border border-warning/25 bg-warning/[0.04] px-4 py-2.5 flex items-center gap-2.5">
                        <Sparkles className="h-3.5 w-3.5 text-warning shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Passe o mouse em um anúncio e clique em <Star className="inline h-3 w-3 text-warning" /> para destacá-lo.
                        </p>
                      </div>
                    )}
                    <div className="trade-card-list">
                      {userAds.map((ad: any) => (
                        <div key={ad.id} className="relative group">
                          <TradeCard
                            id={ad.id} title={ad.title} type={ad.type} price={ad.price}
                            world={ad.world} pvpType={ad.pvp_type} date={ad.created_at}
                            imageUrl={ad.image_url} likes={ad.likes_count} featured={ad.featured}
                            tier={(ad as any).tier} profiles={ad.profiles} userId={ad.user_id}
                          />
                          {isOwnProfile && !ad.featured && activePlans.length > 0 && (
                            <button
                              onClick={() => { setSelectedAdId(ad.id); setHighlightDialogOpen(true); }}
                              className="absolute top-2 right-2 z-10 bg-warning/90 hover:bg-warning text-warning-foreground p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                              title="Destacar anúncio"
                            >
                              <Star className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {ad.featured && (
                            <div className="absolute top-2 right-2 z-10 bg-warning/20 border border-warning/30 text-warning text-[9px] font-bold px-2 py-0.5 rounded-full">
                              ⭐ Destacado
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
                    <Package className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum anúncio ativo.</p>
                    {isOwnProfile && (
                      <Link to="/criar-anuncio">
                        <Button size="sm" className="mt-4 bg-primary text-primary-foreground">Criar anúncio</Button>
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === "favorites" && isOwnProfile && (
              <>
                {favsLoading ? (
                  <div className="trade-card-list">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 rounded-lg" />)}
                  </div>
                ) : favoriteAds && favoriteAds.length > 0 ? (
                  <div className="trade-card-list">
                    {favoriteAds.map((ad: any) => (
                      <TradeCard
                        key={ad.id} id={ad.id} title={ad.title} type={ad.type} price={ad.price}
                        world={ad.world} pvpType={ad.pvp_type} date={ad.created_at}
                        imageUrl={ad.image_url} likes={ad.likes_count} featured={ad.featured}
                        tier={(ad as any).tier} profiles={ad.profiles} userId={ad.user_id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
                    <Heart className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum favorito ainda.</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "transactions" && isOwnProfile && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-card/60 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="h-4 w-4 text-warning" />
                    <span className="text-muted-foreground">Saldo atual</span>
                  </div>
                  <span className="text-warning font-bold tabular-nums">{wallet?.balance || 0} RC</span>
                </div>
                {transactions && transactions.length > 0 ? (
                  <div className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden divide-y divide-border/50">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/20 transition-colors">
                        <div className={cn("p-1.5 rounded-md", tx.amount >= 0 ? "bg-primary/10" : "bg-destructive/10")}>
                          {tx.amount >= 0 ? <ArrowDownLeft className="h-4 w-4 text-primary" /> : <ArrowUpRight className="h-4 w-4 text-destructive" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{tx.reason || (tx.amount >= 0 ? "Crédito" : "Débito")}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className={cn("text-sm font-bold tabular-nums", tx.amount >= 0 ? "text-primary" : "text-destructive")}>
                          {tx.amount >= 0 ? "+" : ""}{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
                    <History className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma transação ainda.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "deposit" && isOwnProfile && (
              <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
                <div className="rounded-2xl border border-border/70 bg-card/60 p-6 space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-warning" /> Depositar Rubini Coins
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Troque gold do jogo por créditos no site.</p>
                  </div>

                  {depositConfig?.deposit_char_name ? (
                    <ol className="rounded-xl border border-warning/25 bg-warning/[0.04] p-4 text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                      <li>Envie gold para: <span className="text-warning font-bold">{depositConfig.deposit_char_name}</span></li>
                      <li>Tire um print da transferência</li>
                      <li>Anexe abaixo e aguarde aprovação</li>
                    </ol>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sistema de depósito ainda não configurado.</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Gold enviado</Label>
                      <Input type="number" value={depositGold} onChange={(e) => setDepositGold(e.target.value)} placeholder="10000" className="bg-secondary/50 border-border h-9" />
                      {depositGold && rate > 0 && (
                        <p className="text-[10px] text-warning font-semibold">= {Math.floor(Number(depositGold) / rate)} RC</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Print do envio</Label>
                      <input
                        type="file" accept="image/*"
                        onChange={(e) => setDepositScreenshot(e.target.files?.[0] || null)}
                        className="text-xs text-muted-foreground file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-secondary file:text-foreground file:text-xs file:cursor-pointer"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (!depositGold || !depositScreenshot || rate <= 0) return;
                      const coins = Math.floor(Number(depositGold) / rate);
                      if (coins < 1) { toast.error("Quantidade muito baixa"); return; }
                      createDeposit.mutate({ amountGold: Number(depositGold), amountCoins: coins, screenshotFile: depositScreenshot }, {
                        onSuccess: () => { setDepositGold(""); setDepositScreenshot(null); }
                      });
                    }}
                    disabled={createDeposit.isPending || !depositGold || !depositScreenshot}
                    className="bg-warning text-warning-foreground hover:bg-warning/90"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {createDeposit.isPending ? "Enviando..." : "Enviar solicitação"}
                  </Button>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden">
                  <div className="px-5 py-3 border-b border-border/50">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Seus depósitos</h4>
                  </div>
                  {myDeposits && myDeposits.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {myDeposits.map((dep) => (
                        <div key={dep.id} className="flex items-center gap-3 px-5 py-3">
                          <DepositScreenshot value={dep.screenshot_url} alt="" className="h-10 w-10 object-cover rounded border border-border" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{dep.amount_gold.toLocaleString("pt-BR")}g → {dep.amount_coins} RC</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(dep.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                            dep.status === "pending" ? "bg-warning/15 text-warning" :
                            dep.status === "approved" ? "bg-primary/15 text-primary" :
                            "bg-destructive/15 text-destructive"
                          )}>
                            {dep.status === "pending" ? "Pendente" : dep.status === "approved" ? "Aprovado" : "Rejeitado"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-5 py-8 text-center text-xs text-muted-foreground">Nenhum depósito ainda.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Highlight Dialog */}
      <Dialog open={highlightDialogOpen} onOpenChange={setHighlightDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Star className="h-5 w-5 text-warning" />
              Destacar Anúncio
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Escolha um plano para destacar seu anúncio. Seu saldo: <span className="text-warning font-semibold">{wallet?.balance || 0} coins</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {activePlans.map((plan) => {
              const canAfford = (wallet?.balance || 0) >= plan.price_coins;
              return (
                <button
                  key={plan.id}
                  onClick={() => canAfford && handleHighlight(plan.id)}
                  disabled={!canAfford || highlightAd.isPending}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    canAfford
                      ? "border-warning/30 bg-warning/5 hover:border-warning/60 hover:bg-warning/10 cursor-pointer"
                      : "border-border bg-secondary/30 opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.duration_days} dias de destaque</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-warning/15 px-3 py-1.5 rounded-lg">
                      <Coins className="h-3.5 w-3.5 text-warning" />
                      <span className="text-sm font-bold text-warning">{plan.price_coins}</span>
                    </div>
                  </div>
                  {!canAfford && (
                    <p className="text-[10px] text-destructive mt-1">Saldo insuficiente</p>
                  )}
                </button>
              );
            })}
            {activePlans.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">Nenhum plano disponível no momento.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Perfil;
