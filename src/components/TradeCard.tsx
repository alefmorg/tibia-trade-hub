import { Heart, Calendar, User, MessageCircle, Trash2, HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useToggleFavorite, useUserFavorites, useDeleteAd } from "@/hooks/useAds";
import { useStartConversation } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import OfferDialog from "@/components/OfferDialog";

interface TradeCardProps {
  id?: string;
  title: string;
  type: "selling" | "buying";
  price: string | null;
  currency?: string;
  world: string;
  pvpType: string;
  username?: string;
  userId?: string;
  date: string;
  imageUrl?: string | null;
  likes?: number;
  featured?: boolean;
  profiles?: { username: string; avatar_url: string | null };
}

const TradeCard = ({
  id,
  title,
  type,
  price,
  currency = "kk",
  world,
  pvpType,
  username,
  userId,
  date,
  imageUrl,
  likes = 0,
  featured,
  profiles
}: TradeCardProps) => {
  const toggleFavorite = useToggleFavorite();
  const { data: userFavorites } = useUserFavorites();
  const startConversation = useStartConversation();
  const deleteAd = useDeleteAd();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isFavorited = id ? userFavorites?.includes(id) : false;
  const displayName = profiles?.username || username || "Anônimo";

  const displayDate = new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const isAcceptingOffers = !price || price === "Aceita ofertas";
  const isOwnAd = user && userId === user.id;

  const handleMessage = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!id || !userId || isOwnAd) return;

    const convId = await startConversation.mutateAsync({
      adId: id,
      sellerId: userId
    });

    navigate(`/mensagens?conv=${convId}`);
  };

  const handleDelete = () => {
    if (!id || !isOwnAd) return;
    if (!confirm("Tem certeza que deseja remover este anúncio?")) return;
    deleteAd.mutate(id);
  };

  return (
    <article
      className={cn(
        "trade-card trade-card-grid group flex flex-col overflow-hidden",
        featured && "trade-card-featured"
      )}
    >
      <div className="flex items-start justify-between gap-3 px-3 pt-3">
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md",
            type === "selling"
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground"
          )}
        >
          {type === "selling" ? "Vendendo" : "Comprando"}
        </span>

        <span className="text-[10px] text-foreground/80 flex items-center gap-1 whitespace-nowrap">
          <Calendar className="h-3 w-3 shrink-0" />
          {displayDate}
        </span>
      </div>

      <div className="px-4 pt-8 pb-4 text-center flex flex-col items-center justify-center min-h-[188px]">
        <h3 className="font-semibold text-[15px] leading-snug text-foreground mb-4 group-hover:text-primary transition-colors font-body max-w-[180px] min-h-[44px] flex items-center justify-center">
          {title}
        </h3>

        {imageUrl && (
          <div className="flex justify-center items-center mb-4 h-16">
            <img
              src={imageUrl}
              alt={title}
              className="h-16 w-16 object-contain pixelated drop-shadow-[0_8px_18px_hsl(var(--background)/0.45)]"
              loading="lazy"
            />
          </div>
        )}

        <p className="font-body font-bold text-foreground">
          {isAcceptingOffers ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1.5 text-sm font-bold text-warning">
              <HandCoins className="h-4 w-4 shrink-0" />
              Aceitando ofertas
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-bold text-foreground">
              <img
                src={`/icons/${currency}.png`}
                alt={currency}
                className="w-6 h-6 sm:w-7 sm:h-7"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/icons/default.png";
                }}
              />
              <span className="leading-none">{price}</span>
            </span>
          )}
        </p>
      </div>

      <div className="px-3 pb-0 mt-auto space-y-2">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="trade-card-world-badge">
            <span className="text-warning">🛡️</span>
            <span className="text-foreground">{world}</span>
            <span className="text-warning/90">({pvpType})</span>
          </span>
        </div>

        <div className="flex items-end justify-between gap-2 text-[11px] text-muted-foreground">
          <Link
            to={userId ? `/perfil/${userId}` : "#"}
            className="trade-card-user-link min-w-0"
          >
            <User className="h-3 w-3 text-destructive shrink-0" />
            <span className="text-foreground truncate">{displayName}</span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            {isOwnAd && (
              <button
                onClick={handleDelete}
                className="hover:text-destructive transition-colors"
                title="Remover anúncio"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            {!isOwnAd && isAcceptingOffers && id && (
              <OfferDialog adId={id} adTitle={title} />
            )}

            {!isOwnAd && (
              <button
                onClick={handleMessage}
                className="hover:text-primary transition-colors"
                title="Enviar mensagem"
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              onClick={() => id && toggleFavorite.mutate(id)}
              className={cn(
                "trade-card-like-badge transition-colors",
                isFavorited ? "text-destructive" : "hover:text-destructive"
              )}
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5",
                  isFavorited && "fill-destructive"
                )}
              />
              <span>{likes}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default TradeCard;
