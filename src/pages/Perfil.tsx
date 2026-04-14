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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWallet, useHighlightPlans, useHighlightAd, useWalletTransactions } from "@/hooks/useWallet";
import { useDepositConfig, useMyDeposits, useCreateDeposit } from "@/hooks/useDeposits";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
          <div className="card-gaming p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="h-20 w-20 border-2 border-primary/30">
                {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.username} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Nome de usuário</Label>
                      <Input value={editUsername} onChange={e => setEditUsername(e.target.value)} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Bio</Label>
                      <Textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Fale sobre você..." className="bg-secondary border-border min-h-[60px]" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveProfile} disabled={updateProfile.isPending} className="bg-primary text-primary-foreground">
                        <Save className="h-3.5 w-3.5 mr-1" />
                        {updateProfile.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="border-border">Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <h1 className="text-lg font-semibold text-foreground">{profile.username}</h1>
                      {isOwnProfile && wallet && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warning/10 border border-warning/20">
                          <Coins className="h-3 w-3 text-warning" />
                          <span className="text-xs font-semibold text-warning">{wallet.balance}</span>
                        </div>
                      )}
                    </div>
                    {profile.bio && <p className="text-sm text-muted-foreground mt-1 font-body">{profile.bio}</p>}
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground font-body">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Membro desde {memberSince}</span>
                      <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" />{totalAds} anúncio{totalAds !== 1 ? "s" : ""}</span>
                    </div>
                    {isOwnProfile && (
                      <Button size="sm" variant="outline" className="mt-3 border-border text-xs" onClick={() => setEditing(true)}>
                        Editar perfil
                      </Button>
                    )}
                  </>
                )}
              </div>
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
