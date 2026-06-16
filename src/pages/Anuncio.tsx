import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Flame, Globe, Heart, MessageCircle, Shield, ShieldCheck, Star, Swords, Tag, User } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSiteAssets } from "@/hooks/useSiteAssets";
import { formatDisplayPrice } from "@/lib/price-utils";

const Anuncio = () => {
  const { getCurrencyIcon, getPvpIcon } = useSiteAssets();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [_offerOpen, _setOfferOpen] = useState(false);

  const { data: ad, isLoading } = useQuery({
    queryKey: ["ad", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*, profiles!ads_user_id_fkey(username, avatar_url), items!ads_item_id_fkey(tier, image_url)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: isFavorited } = useQuery({
    queryKey: ["is-fav", id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("id").eq("ad_id", id!).eq("user_id", user!.id).maybeSingle();
      return !!data;
    },
  });

  const toggleFav = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        await supabase.from("favorites").delete().eq("ad_id", id!).eq("user_id", user!.id);
      } else {
        await supabase.from("favorites").insert({ ad_id: id!, user_id: user!.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-fav", id] });
      queryClient.invalidateQueries({ queryKey: ["ad", id] });
    },
  });

  const startConversation = useMutation({
    mutationFn: async () => {
      if (!ad || !user) throw new Error("Dados inválidos");
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("ad_id", ad.id)
        .eq("buyer_id", user.id)
        .maybeSingle();
      if (existing) return existing.id;
      const { data, error } = await supabase
        .from("conversations")
        .insert({ ad_id: ad.id, buyer_id: user.id, seller_id: ad.user_id })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      toast.success("Conversa iniciada! Vá para Mensagens.");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 max-w-3xl">
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Anúncio não encontrado.</p>
          <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">Voltar</Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === ad.user_id;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-6 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
              {/* Image */}
              <div className={`relative ${ad.category === "house" ? "aspect-square" : "h-64"} bg-secondary/50 flex items-center justify-center`}>
                {ad.image_url ? (
                  <img src={ad.image_url} alt={ad.title} className={ad.category === "house" ? "h-full w-full object-cover" : "h-full w-full object-contain p-4"} />
                ) : (
                  <Flame className="h-16 w-16 text-muted-foreground/20" />
                )}
                {ad.featured && (
                  <div className="absolute top-3 left-3 bg-warning/90 text-warning-foreground text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3" /> Destaque
                  </div>
                )}
                <span className={`absolute top-3 right-3 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${ad.type === "selling" ? "bg-destructive/90 text-destructive-foreground" : "bg-primary/90 text-primary-foreground"}`}>
                  {ad.type === "selling" ? "Venda" : "Compra"}
                </span>
              </div>

              {/* Info */}
              <div className="p-5 space-y-4">
                {ad && (
                  <Helmet>
                    <title>{`${ad.title} — RubinTrade`}</title>
                    <meta name="description" content={(ad.description || `${ad.title} no marketplace RubinTrade.`).slice(0, 155)} />
                    <link rel="canonical" href={`https://rubintrade.com/anuncio/${ad.id}`} />
                    <meta property="og:title" content={`${ad.title} — RubinTrade`} />
                    <meta property="og:description" content={(ad.description || ad.title).slice(0, 155)} />
                    <meta property="og:url" content={`https://rubintrade.com/anuncio/${ad.id}`} />
                    <meta property="og:type" content="product" />
                    {ad.items?.image_url && <meta property="og:image" content={ad.items.image_url} />}
                    <script type="application/ld+json">{JSON.stringify({
                      "@context": "https://schema.org",
                      "@type": "Product",
                      name: ad.title,
                      description: ad.description || ad.title,
                      image: ad.items?.image_url || undefined,
                      offers: ad.price ? { "@type": "Offer", price: ad.price, priceCurrency: "BRL" } : undefined,
                    })}</script>
                  </Helmet>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{ad.title}</h1>
                    {ad.tier != null && (
                      <span className="text-xs text-muted-foreground">Tier {ad.tier}</span>
                    )}
                  </div>
                  {ad.price && (
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5">
                        <img src={getCurrencyIcon(ad.currency || "kk")} alt="" className="w-5 h-5 object-contain" />
                        <span className="text-lg font-bold text-primary">{formatDisplayPrice(ad.price, ad.currency)}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{ad.currency}</span>
                    </div>
                  )}
                </div>

                {ad.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{ad.description}</p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{ad.world}</span>
                  <span className={`flex items-center gap-1 ${ad.pvp_type === "Open PvP" ? "text-destructive" : "text-primary"}`}>
                    <img src={getPvpIcon(ad.pvp_type)} alt="" className="w-4 h-4 object-contain" />
                    {ad.pvp_type}
                  </span>
                  <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{ad.category}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(ad.created_at).toLocaleDateString("pt-BR")}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{ad.likes_count}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Seller */}
            <div className="bg-card/80 border border-border/60 rounded-2xl p-4 space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Anunciante</h2>
              <Link to={`/perfil/${ad.user_id}`} className="flex items-center gap-3 hover:bg-secondary/40 p-2 rounded-xl transition-colors">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {(ad.profiles as any)?.avatar_url ? (
                    <img src={(ad.profiles as any).avatar_url} alt="" className="h-10 w-10 object-cover rounded-full" />
                  ) : (
                    <User className="h-5 w-5 text-primary/60" />
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">{(ad.profiles as any)?.username || "Anônimo"}</span>
              </Link>

              {user && !isOwner && (
                <div className="space-y-2">
                  <Button onClick={() => startConversation.mutate()} disabled={startConversation.isPending} className="w-full bg-primary text-primary-foreground" size="sm">
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                    Enviar mensagem
                  </Button>
                  <Button onClick={() => toggleFav.mutate()} variant="ghost" className={`w-full ${isFavorited ? "text-destructive" : "text-muted-foreground"}`} size="sm">
                    <Heart className={`h-3.5 w-3.5 mr-1 ${isFavorited ? "fill-current" : ""}`} />
                    {isFavorited ? "Remover favorito" : "Favoritar"}
                  </Button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Anuncio;
