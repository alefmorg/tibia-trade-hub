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
import { Save, Package, Heart, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  const [activeTab, setActiveTab] = useState<"ads" | "favorites">("ads");

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", profileUserId],
    enabled: !!profileUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", profileUserId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's ads
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

  // Fetch favorited ads (own profile only)
  const { data: favoriteAds, isLoading: favsLoading } = useQuery({
    queryKey: ["favorite-ads", profileUserId],
    enabled: !!profileUserId && isOwnProfile,
    queryFn: async () => {
      const { data: favs, error: favError } = await supabase
        .from("favorites")
        .select("ad_id")
        .eq("user_id", profileUserId!);
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

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (updates: { username?: string; bio?: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user!.id);
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
              {/* Avatar */}
              <Avatar className="h-20 w-20 border-2 border-primary/30">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.username} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
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
                    <h1 className="text-lg font-semibold text-foreground">{profile.username}</h1>
                    {profile.bio && <p className="text-sm text-muted-foreground mt-1 font-body">{profile.bio}</p>}
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground font-body">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Membro desde {memberSince}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        {totalAds} anúncio{totalAds !== 1 ? "s" : ""}
                      </span>
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
            <Button
              size="sm"
              variant={activeTab === "ads" ? "default" : "outline"}
              onClick={() => setActiveTab("ads")}
              className={activeTab === "ads" ? "bg-primary text-primary-foreground" : "border-border"}
            >
              <Package className="h-3.5 w-3.5 mr-1" />
              Anúncios {isOwnProfile ? "seus" : `de ${profile?.username || ""}`}
            </Button>
            {isOwnProfile && (
              <Button
                size="sm"
                variant={activeTab === "favorites" ? "default" : "outline"}
                onClick={() => setActiveTab("favorites")}
                className={activeTab === "favorites" ? "bg-primary text-primary-foreground" : "border-border"}
              >
                <Heart className="h-3.5 w-3.5 mr-1" />
                Favoritos
              </Button>
            )}
          </div>

          {activeTab === "ads" && (
            <>
              {adsLoading ? (
                <div className="trade-card-list">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 rounded-lg" />)}
                </div>
              ) : userAds && userAds.length > 0 ? (
                <div className="trade-card-list">
                  {userAds.map((ad: any) => (
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
                      tier={ad.items?.tier}
                      profiles={ad.profiles}
                      userId={ad.user_id}
                    />
                  ))}
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
                      tier={ad.items?.tier}
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
        </div>
      </div>
    </div>
  );
};

export default Perfil;
