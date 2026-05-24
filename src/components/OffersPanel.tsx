import { useReceivedOffers, useRespondOffer } from "@/hooks/useOffers";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { formatDisplayPrice } from "@/lib/price-utils";

const OffersPanel = () => {
  const { data: offers, isLoading } = useReceivedOffers();
  const respond = useRespondOffer();

  if (isLoading) return null;
  if (!offers || offers.length === 0) return null;

  return (
    <div className="card-gaming p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        📩 Ofertas recebidas
        <span className="bg-warning/20 text-warning text-xs px-2 py-0.5 rounded-full font-bold">{offers.length}</span>
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {offers.map((offer) => (
          <div key={offer.id} className="flex items-center justify-between gap-3 bg-secondary/50 rounded-lg p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">
                {formatDisplayPrice(offer.amount, offer.currency)} <span className="text-warning">{offer.currency}</span>
              </p>
              {offer.message && (
                <p className="text-xs text-muted-foreground truncate">{offer.message}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => respond.mutate({ offerId: offer.id, status: "accepted" })}
                disabled={respond.isPending}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => respond.mutate({ offerId: offer.id, status: "rejected" })}
                disabled={respond.isPending}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OffersPanel;
