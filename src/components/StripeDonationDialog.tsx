import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const PRESETS = [5, 10, 25, 50, 100];

export default function StripeDonationDialog({ open, onOpenChange }: Props) {
  const [amount, setAmount] = useState<number>(10);
  const [message, setMessage] = useState("");
  const [checkout, setCheckout] = useState(false);

  const close = () => {
    setCheckout(false);
    setMessage("");
    setAmount(10);
    onOpenChange(false);
  };

  const fetchClientSecret = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-donation-checkout", {
      body: {
        amountInCents: Math.round(amount * 100),
        message: message || undefined,
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/?donation=success&session_id={CHECKOUT_SESSION_ID}`,
      },
    });
    if (error || !data?.clientSecret) {
      const msg = (error as any)?.message || data?.error || "Falha ao iniciar checkout";
      toast.error(msg);
      throw new Error(msg);
    }
    return data.clientSecret as string;
  };

  const proceed = () => {
    if (!isPaymentsConfigured()) {
      toast.error("Pagamentos não configurados neste ambiente.");
      return;
    }
    if (amount < 1) { toast.error("Valor mínimo: R$ 1,00"); return; }
    setCheckout(true);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-pixel text-sm uppercase">
            <Heart className="h-4 w-4 text-destructive fill-destructive" />
            Apoiar o RubinTrade
          </DialogTitle>
          <DialogDescription className="text-xs">
            Sua doação ajuda a manter o servidor, melhorias e novos recursos. Pague com cartão ou PIX via Stripe. 💛
          </DialogDescription>
        </DialogHeader>

        {!checkout ? (
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs mb-2 block">Escolha um valor (R$)</Label>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {PRESETS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className={`py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                      amount === v
                        ? "bg-destructive text-destructive-foreground border-destructive shadow-md scale-105"
                        : "bg-secondary/40 border-border hover:border-destructive/50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                max={10000}
                step={1}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 0))}
                placeholder="Valor personalizado"
              />
            </div>
            <div>
              <Label className="text-xs">Mensagem (opcional)</Label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Continuem o ótimo trabalho!"
                maxLength={200}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={close}>Cancelar</Button>
              <Button
                onClick={proceed}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <Heart className="h-3.5 w-3.5 mr-1.5" />
                Doar R$ {amount.toFixed(2).replace(".", ",")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="min-h-[500px]">
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
            <div className="flex justify-center mt-3">
              <Button variant="ghost" size="sm" onClick={() => setCheckout(false)}>
                <Loader2 className="h-3 w-3 mr-1.5" /> Alterar valor
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
