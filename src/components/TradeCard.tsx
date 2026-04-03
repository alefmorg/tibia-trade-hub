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
}

const TradeCard = ({ title, type, price, world, pvpType, username, date, imageUrl, likes = 0 }: TradeCardProps) => (
  <div className="card-gaming p-4 hover:border-primary/30 transition-all group">
    <div className="flex justify-between items-start mb-3">
      <span className={type === "selling" ? "badge-selling" : "badge-buying"}>
        {type === "selling" ? "Vendendo" : "Comprando"}
      </span>
      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {date}
      </span>
    </div>

    <h3 className="font-semibold text-sm text-foreground mb-2 group-hover:text-primary transition-colors">
      {title}
    </h3>

    {imageUrl && (
      <div className="flex justify-center my-3">
        <img src={imageUrl} alt={title} className="h-16 w-16 object-contain" />
      </div>
    )}

    <p className="text-primary font-pixel text-xs mb-3">
      {price === "Aceita ofertas" ? price : `${price} gp`}
    </p>

    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
      <div className="flex items-center gap-2">
        <span className="text-accent">●</span>
        <span>{world}</span>
        <span className="text-muted-foreground/50">({pvpType})</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {username}
        </span>
        <button className="flex items-center gap-1 hover:text-destructive transition-colors">
          <Heart className="h-3 w-3" />
          {likes}
        </button>
      </div>
    </div>
  </div>
);

export default TradeCard;
