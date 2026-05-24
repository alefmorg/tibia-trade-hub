import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSendOffer } from "@/hooks/useOffers";
import { HandCoins } from "lucide-react";
import { formatPriceInput } from "@/lib/price-utils";

interface OfferDialogProps {
  adId: string;
  adTitle: string;
  children?: React.ReactNode;
}

const OfferDialog = ({ adId, adTitle, children }: OfferDialogProps) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("kk");
  const [message, setMessage] = useState("");
  const sendOffer = useSendOffer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    await sendOffer.mutateAsync({
      ad_id: adId,
      amount,
      currency,
      message: message || undefined,
    });
    setOpen(false);
    setAmount("");
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <button className="hover:text-warning transition-colors" title="Fazer oferta">
            <HandCoins className="h-3.5 w-3.5" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Fazer oferta — {adTitle}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Valor da oferta</Label>
            <div className="flex gap-2">
              <Input
                value={amount}
                onChange={(e) => setAmount(formatPriceInput(e.target.value, currency))}
                placeholder={currency === "brl" ? "Ex: 300,00" : "Ex: 15"}
                className="bg-secondary border-border flex-1"
                required
              />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-24 bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kk">kk</SelectItem>
                  <SelectItem value="coins">coins</SelectItem>
                  <SelectItem value="brl">R$ (PIX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Mensagem (opcional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
              placeholder="Alguma observação..."
              className="bg-secondary border-border min-h-[60px]"
              maxLength={2000}
            />
          </div>
          <Button
            type="submit"
            disabled={sendOffer.isPending || !amount}
            className="w-full bg-warning text-warning-foreground hover:bg-warning/90"
          >
            {sendOffer.isPending ? "Enviando..." : "Enviar oferta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OfferDialog;
