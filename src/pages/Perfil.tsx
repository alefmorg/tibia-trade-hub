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
import { Save, Package, Heart, Calendar, Star, Coins, Sparkles, ArrowUpRight, ArrowDownLeft, History, Upload, Wallet } from "lucide-react";
import UserBadges from "@/components/UserBadges";
import { useUserBadges } from "@/hooks/useUserBadges";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWallet, useHighlightPlans, useHighlightAd, useWalletTransactions } from "@/hooks/useWallet";
import { useDepositConfig, useMyDeposits, useCreateDeposit } from "@/hooks/useDeposits";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: "default" | "warning";
  capitalize?: boolean;
}

const StatTile = ({ icon, label, value, accent = "default", capitalize = false }: StatTileProps) => {
  const isWarn = accent === "warning";
  return (
    <div
      className={`group/stat relative overflow-hidden rounded-xl border px-3.5 py-3 transition-colors ${
        isWarn
          ? "border-warning/30 bg-warning/[0.04] hover:border-warning/50"
          : "border-border/70 bg-secondary/30 hover:border-primary/30"
      }`}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 group-hover/stat:opacity-100 transition-opacity"
        style={{
          background: isWarn
            ? "radial-gradient(80% 100% at 0% 0%, hsl(var(--warning) / 0.08), transparent 60%)"
            : "radial-gradient(80% 100% at 0% 0%, hsl(var(--primary) / 0.08), transparent 60%)",
        }}
      />
      <div className="relative">
        <p className={`text-[10px] uppercase tracking-wider flex items-center gap-1.5 ${isWarn ? "text-warning/80" : "text-muted-foreground"}`}>
          <span className={isWarn ? "text-warning" : "text-primary/70"}>{icon}</span>
          {label}
        </p>
        <p className={`mt-1 text-base font-bold ${isWarn ? "text-warning" : "text-foreground"} ${capitalize ? "capitalize truncate" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

const Perfil = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, profile: myProfile } = useAuth();
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

  const memberSince = profile ? new Date(profile.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "";
  const totalAds = userAds?.length || 0;

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
      <div className="container py-8 max-w-4xl">
        {profileLoading ? (
          <div className="card-gaming p-8 flex items-center gap-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
        ) : profile ? (
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-secondary/30 shadow-[0_20px_60px_-20px_hsl(0_0%_0%/0.6)]">
            {/* Banner artístico */}
            <div className="relative h-36 sm:h-44 overflow-hidden">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(60% 120% at 15% 0%, hsl(var(--primary) / 0.35), transparent 60%), radial-gradient(50% 120% at 85% 10%, hsl(var(--primary) / 0.18), transparent 60%), linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--card)) 100%)",
                }}
              />
              {/* Grid pattern */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                  maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
                }}
              />
              {/* Glow orb */}
              <div
                aria-hidden
                className="absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl"
                style={{ background: "hsl(var(--primary) / 0.25)" }}
              />
              {/* Edit btn float */}
              {isOwnProfile && !editing && (
                <div className="absolute top-4 right-4 z-20">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(true)}
                    className="h-8 bg-background/60 backdrop-blur-md border-border/80 text-xs hover:bg-background/80"
                  >
                    Editar perfil
                  </Button>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            <div className="relative px-6 sm:px-8 pb-7">
              {/* Avatar suspenso */}
              <div className="relative -mt-14 sm:-mt-16 flex flex-col sm:flex-row sm:items-end sm:gap-5">
                <div className="relative shrink-0">
                  <div
                    className="absolute -inset-1 rounded-full opacity-70 blur-md"
                    aria-hidden
                    style={{ background: "conic-gradient(from 180deg, hsl(var(--primary) / 0.6), transparent, hsl(var(--primary) / 0.4))" }}
                  />
                  <Avatar className="relative h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-card border-2 border-primary/50 shadow-[0_12px_30px_hsl(0_0%_0%/0.5)]">
                    {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.username} /> : null}
                    <AvatarFallback className="bg-gradient-to-br from-primary/25 to-primary/5 text-primary text-3xl font-pixel">
                      {profile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {badges.some((b) => b.badge_type === "premium_verified") && (
                    <span
                      title="Premium Verificado"
                      className="absolute bottom-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground border-[3px] border-card shadow-[0_4px_14px_hsl(var(--primary)/0.5)]"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    </span>
                  )}
                </div>

                <div className="mt-4 sm:mt-0 sm:pb-2 flex-1 min-w-0">
                  {!editing && (
                    <>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h1 className="text-2xl sm:text-3xl font-pixel text-foreground tracking-tight leading-none">
                          {profile.username}
                        </h1>
                      </div>
                      <div className="mt-2.5">
                        <UserBadges badges={badges} role={userRole} size="md" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bio + edit form */}
              <div className="mt-5">
                {editing ? (
                  <div className="space-y-3 max-w-xl">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nome de usuário</Label>
                      <Input value={editUsername} onChange={e => setEditUsername(e.target.value)} className="bg-secondary/60 border-border h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Bio</Label>
                      <Textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Fale sobre você..." className="bg-secondary/60 border-border min-h-[80px]" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={handleSaveProfile} disabled={updateProfile.isPending} className="bg-primary text-primary-foreground">
                        <Save className="h-3.5 w-3.5 mr-1" />
                        {updateProfile.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="border-border">Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  profile.bio && (
                    <p className="text-sm text-foreground/80 font-body max-w-prose leading-relaxed">
                      {profile.bio}
                    </p>
                  )
                )}
              </div>

              {/* Stats premium */}
              {!editing && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatTile icon={<Package className="h-3.5 w-3.5" />} label="Anúncios" value={totalAds} />
                  <StatTile icon={<Calendar className="h-3.5 w-3.5" />} label="Membro desde" value={memberSince} capitalize />
                  {isOwnProfile ? (
                    <StatTile icon={<Coins className="h-3.5 w-3.5" />} label="Saldo" value={wallet?.balance ?? 0} accent="warning" />
                  ) : (
                    <StatTile icon={<Star className="h-3.5 w-3.5" />} label="Selos" value={badges.length} />
                  )}
                  {isOwnProfile && (
                    <StatTile icon={<Star className="h-3.5 w-3.5" />} label="Selos" value={badges.length} />
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card-gaming p-8 text-center">
            <p className="text-muted-foreground">Perfil não encontrado.</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-8">
          <div className="flex gap-2 mb-4">
            <Button size="sm" variant={activeTab === "ads" ? "default" : "outline"} onClick={() => setActiveTab("ads")}
              className={activeTab === "ads" ? "bg-primary text-primary-foreground" : "border-border"}>
              <Package className="h-3.5 w-3.5 mr-1" />
              Anúncios {isOwnProfile ? "seus" : `de ${profile?.username || ""}`}
            </Button>
            {isOwnProfile && (
              <>
                <Button size="sm" variant={activeTab === "favorites" ? "default" : "outline"} onClick={() => setActiveTab("favorites")}
                  className={activeTab === "favorites" ? "bg-primary text-primary-foreground" : "border-border"}>
                  <Heart className="h-3.5 w-3.5 mr-1" />
                  Favoritos
                </Button>
                <Button size="sm" variant={activeTab === "transactions" ? "default" : "outline"} onClick={() => setActiveTab("transactions")}
                  className={activeTab === "transactions" ? "bg-primary text-primary-foreground" : "border-border"}>
                  <History className="h-3.5 w-3.5 mr-1" />
                  Histórico
                </Button>
                <Button size="sm" variant={activeTab === "deposit" ? "default" : "outline"} onClick={() => setActiveTab("deposit")}
                  className={activeTab === "deposit" ? "bg-warning text-warning-foreground" : "border-border"}>
                  <Wallet className="h-3.5 w-3.5 mr-1" />
                  Depositar
                </Button>
              </>
            )}
          </div>

          {activeTab === "ads" && (
            <>
              {adsLoading ? (
                <div className="trade-card-list">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 rounded-lg" />)}
                </div>
              ) : userAds && userAds.length > 0 ? (
                <div className="space-y-1">
                  {isOwnProfile && activePlans.length > 0 && (
                    <div className="bg-warning/5 border border-warning/20 rounded-xl p-3 mb-4 flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-warning shrink-0" />
                      <p className="text-xs text-muted-foreground font-body">
                        Clique em <Star className="inline h-3 w-3 text-warning" /> no seu anúncio para destacá-lo usando Rubini Coins!
                      </p>
                    </div>
                  )}
                  <div className="trade-card-list">
                    {userAds.map((ad: any) => (
                      <div key={ad.id} className="relative group">
                        <TradeCard
                          id={ad.id}
                          title={ad.title}
                          type={ad.type}
                          price={ad.price}
                          world={ad.world}
                          pvpType={ad.pvp_type}
                          date={ad.created_at}
                          imageUrl={ad.image_url}
                          likes={ad.likes_count}
                          featured={ad.featured}
                          tier={(ad as any).tier}
                          profiles={ad.profiles}
                          userId={ad.user_id}
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
                <div className="card-gaming p-8 text-center">
                  <p className="text-muted-foreground text-sm">Nenhum anúncio ativo.</p>
                  {isOwnProfile && (
                    <Link to="/criar-anuncio">
                      <Button size="sm" className="mt-3 bg-primary text-primary-foreground">Criar anúncio</Button>
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
                      key={ad.id}
                      id={ad.id}
                      title={ad.title}
                      type={ad.type}
                      price={ad.price}
                      world={ad.world}
                      pvpType={ad.pvp_type}
                      date={ad.created_at}
                      imageUrl={ad.image_url}
                      likes={ad.likes_count}
                      featured={ad.featured}
                      tier={(ad as any).tier}
                      profiles={ad.profiles}
                      userId={ad.user_id}
                    />
                  ))}
                </div>
              ) : (
                <div className="card-gaming p-8 text-center">
                  <p className="text-muted-foreground text-sm">Nenhum favorito ainda.</p>
                </div>
              )}
            </>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && isOwnProfile && (
            <div className="space-y-2">
              <div className="card-gaming p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-warning" />
                  <span className="text-sm font-semibold text-foreground">Saldo atual:</span>
                  <span className="text-warning font-bold">{wallet?.balance || 0} Rubini Coins</span>
                </div>
              </div>
              {transactions && transactions.length > 0 ? (
                <div className="card-gaming overflow-hidden">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors">
                      <div className={`p-1.5 rounded-lg ${tx.amount >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
                        {tx.amount >= 0 ? <ArrowDownLeft className="h-4 w-4 text-primary" /> : <ArrowUpRight className="h-4 w-4 text-destructive" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{tx.reason || (tx.amount >= 0 ? "Crédito" : "Débito")}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <span className={`text-sm font-bold ${tx.amount >= 0 ? "text-primary" : "text-destructive"}`}>
                        {tx.amount >= 0 ? "+" : ""}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card-gaming p-8 text-center">
                  <p className="text-muted-foreground text-sm">Nenhuma transação ainda.</p>
                </div>
              )}
            </div>
          )}

          {/* Deposit Tab */}
          {activeTab === "deposit" && isOwnProfile && (
            <div className="space-y-4">
              <div className="card-gaming p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-warning" /> Depositar Rubini Coins
                </h3>
                {depositConfig?.deposit_char_name ? (
                  <div className="bg-warning/5 border border-warning/20 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
                    <p>1. Envie gold para o personagem: <span className="text-warning font-bold">{depositConfig.deposit_char_name}</span></p>
                    <p>3. Tire um print da transferência e envie abaixo</p>
                    <p>4. Aguarde a aprovação do admin</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sistema de depósito ainda não configurado.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Quantidade de Gold enviado</Label>
                    <Input type="number" value={depositGold} onChange={(e) => setDepositGold(e.target.value)} placeholder="10000" className="bg-secondary border-border" />
                    {depositGold && rate > 0 && (
                      <p className="text-[10px] text-warning font-semibold">= {Math.floor(Number(depositGold) / rate)} Rubini Coins</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Print do envio</Label>
                    <input type="file" accept="image/*" onChange={(e) => setDepositScreenshot(e.target.files?.[0] || null)} className="text-xs text-muted-foreground file:mr-2 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-secondary file:text-foreground file:text-xs file:cursor-pointer" />
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
                  {createDeposit.isPending ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              </div>

              {myDeposits && myDeposits.length > 0 && (
                <div className="card-gaming overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/40">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">Seus Depósitos</h4>
                  </div>
                  {myDeposits.map((dep) => (
                    <div key={dep.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0">
                      <img src={dep.screenshot_url} alt="" className="h-10 w-10 object-cover rounded border border-border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{dep.amount_gold.toLocaleString("pt-BR")} gold → {dep.amount_coins} coins</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(dep.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${dep.status === "pending" ? "bg-warning/15 text-warning" : dep.status === "approved" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                        {dep.status === "pending" ? "Pendente" : dep.status === "approved" ? "Aprovado" : "Rejeitado"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    canAfford
                      ? "border-warning/30 bg-warning/5 hover:border-warning/60 hover:bg-warning/10 cursor-pointer"
                      : "border-border bg-secondary/30 opacity-50 cursor-not-allowed"
                  }`}
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
