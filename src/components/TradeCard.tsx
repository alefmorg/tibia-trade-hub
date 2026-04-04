import { Heart, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useToggleFavorite, useUserFavorites } from "@/hooks/useAds";

interface TradeCardProps {
  id?: string;
  title: string;
  type: "selling" | "buying";
  price: string | null;
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

const TradeCard = ({ id, title, type, price, world, pvpType, username, userId, date, imageUrl, likes = 0, featured, profiles }: TradeCardProps) => {
  const toggleFavorite = useToggleFavorite();
  const { data: userFavorites } = useUserFavorites();
  const isFavorited = id ? userFavorites?.includes(id) : false;
  const displayName = profiles?.username || username || "Anônimo";
  const displayDate = new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const displayPrice = price || "Aceita ofertas";

  return (
    <div className={`card-gaming p-0 overflow-hidden hover:border-primary/30 transition-all group ${featured ? "border-warning/30" : ""}`}>
      <div className="flex items-center justify-between px-4 pt-3">
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded ${
          type === "selling" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
        }`}>
          {type === "selling" ? "Vendendo" : "Comprando"}
        </span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {displayDate}
        </span>
      </div>

      <div className="px-4 py-4 text-center">
        <h3 className="font-semibold text-sm text-foreground mb-3 group-hover:text-primary transition-colors font-body">
          {title}
        </h3>

        {imageUrl && (
          <div className="flex justify-center mb-3">
            <img src={imageUrl} alt={title} className="h-16 w-16 object-contain" />
          </div>
        )}

        <p className={`font-pixel text-xs ${displayPrice === "Aceita ofertas" ? "text-warning" : "text-primary"}`}>
          {displayPrice === "Aceita ofertas" ? (
            <span>Aceitando ofertas 🔥</span>
          ) : (
            <span>{displayPrice} 💰</span>
          )}
        </p>
      </div>

      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-accent">●</span>
          <span className="text-foreground">{world}</span>
          <span className="text-muted-foreground">({pvpType})</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <Link to={userId ? `/perfil/${userId}` : "#"} className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <User className="h-3 w-3 text-primary" />
            <span className="text-foreground">{displayName}</span>
          </Link>
          <button
            onClick={() => id && toggleFavorite.mutate(id)}
            className={`flex items-center gap-1 transition-colors ${isFavorited ? "text-destructive" : "hover:text-destructive"}`}
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorited ? "fill-destructive" : ""}`} />
            <span>{likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeCard;
