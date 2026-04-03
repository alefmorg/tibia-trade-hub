import { Heart, Calendar, User } from "lucide-react";

interface TradeCardProps {
  title: string;
  type: "selling" | "buying";
  price: string;
  world: string;
  pvpType: string;
  username: string;
  date: string;
  imageUrl?: string;
  likes?: number;
  featured?: boolean;
}

const TradeCard = ({ title, type, price, world, pvpType, username, date, imageUrl, likes = 0, featured }: TradeCardProps) => (
  <div className={`card-gaming p-0 overflow-hidden hover:border-primary/30 transition-all group ${featured ? "border-warning/30" : ""}`}>
    {/* Top bar: badge + date */}
    <div className="flex items-center justify-between px-4 pt-3 pb-0">
      <span
        className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded ${
          type === "selling"
            ? "bg-destructive/20 text-destructive"
            : "bg-primary/20 text-primary"
        }`}
      >
        {type === "selling" ? "Vendendo" : "Comprando"}
      </span>
      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {date}
      </span>
    </div>

    {/* Item content */}
    <div className="px-4 py-4 text-center">
      <h3 className="font-semibold text-sm text-foreground mb-3 group-hover:text-primary transition-colors font-body">
        {title}
      </h3>

      {imageUrl && (
        <div className="flex justify-center mb-3">
          <img src={imageUrl} alt={title} className="h-16 w-16 object-contain" />
        </div>
      )}

      <p className={`font-pixel text-xs ${price === "Aceita ofertas" ? "text-warning" : "text-primary"}`}>
        {price === "Aceita ofertas" ? (
          <span className="flex items-center justify-center gap-1">
            Aceitando ofertas 🔥
          </span>
        ) : (
          <span>{price} 💰</span>
        )}
      </p>
    </div>

    {/* Footer */}
    <div className="px-4 pb-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="text-accent">●</span>
        <span className="text-foreground">{world}</span>
        <span className="text-muted-foreground">({pvpType})</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <User className="h-3 w-3 text-primary" />
          <span className="text-foreground">{username}</span>
        </span>
        <button className="flex items-center gap-1 hover:text-destructive transition-colors">
          <Heart className="h-3.5 w-3.5" />
          <span>{likes}</span>
        </button>
      </div>
    </div>
  </div>
);

export default TradeCard;
