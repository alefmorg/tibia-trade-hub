import { useState, useMemo } from "react";
import { Coins, ChevronDown, Handshake, Heart, Crown, CreditCard, ShoppingCart, Tag, Repeat, Shield, Sparkles, MessageCircle, Phone, Instagram, Gamepad2, Info, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/useWallet";
import { useCreateIntermediation, useDonate } from "@/hooks/useUserActions";
import { useVipSettings, usePurchaseVip, useMyVipStatus } from "@/hooks/useVip";
import { FEATURES } from "@/lib/feature-flags";
import StripeDonationDialog from "@/components/StripeDonationDialog";
import { cn } from "@/lib/utils";

const WalletActionsMenu = () => {
  const { data: wallet } = useWallet();
  const [interOpen, setInterOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [stripeDonateOpen, setStripeDonateOpen] = useState(false);
  const [vipOpen, setVipOpen] = useState(false);
  const { data: vipSettings } = useVipSettings();
  const { data: myVip } = useMyVipStatus();
  const purchaseVip = usePurchaseVip();

  // Intermédio
  const [type, setType] = useState<"buy" | "sell" | "trade">("buy");
  const [itemDesc, setItemDesc] = useState("");
  const [estValue, setEstValue] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const createInter = useCreateIntermediation();

  // Doação
  const [donateAmount, setDonateAmount] = useState(50);
  const [donateMsg, setDonateMsg] = useState("");
  const donate = useDonate();

  const submitInter = () => {
    if (!itemDesc.trim() || !contact.trim()) return;
    createInter.mutate(
      { type, item_description: itemDesc.trim(), estimated_value: estValue.trim() || undefined, contact_info: contact.trim(), notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          setInterOpen(false);
          setItemDesc(""); setEstValue(""); setContact(""); setNotes("");
        },
      }
    );
  };

  const submitDonate = () => {
    if (donateAmount <= 0) return;
    donate.mutate({ amount: donateAmount, message: donateMsg.trim() || undefined }, {
      onSuccess: () => { setDonateOpen(false); setDonateMsg(""); },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warning/10 border border-warning/20 hover:bg-warning/15 transition-colors">
            <Coins className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-semibold text-warning">{wallet?.balance || 0}</span>
            <ChevronDown className="h-3 w-3 text-warning/70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Carteira & Serviços</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setInterOpen(true)} className="cursor-pointer">
            <Handshake className="h-4 w-4 mr-2 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold">Intermédio de trade</span>
              <span className="text-[10px] text-muted-foreground">Compre/venda com segurança</span>
            </div>
          </DropdownMenuItem>
          {FEATURES.VIP_ENABLED && (
            <DropdownMenuItem onClick={() => setVipOpen(true)} className="cursor-pointer">
              <Crown className="h-4 w-4 mr-2 text-warning" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold">{myVip?.isVip ? "Renovar VIP" : "Tornar-se VIP"}</span>
                <span className="text-[10px] text-muted-foreground">
                  {myVip?.isVip
                    ? `Ativo até ${myVip.vipUntil!.toLocaleDateString("pt-BR")}`
                    : `${vipSettings?.vip_price_coins ?? "—"} coins / ${vipSettings?.vip_duration_days ?? "—"} dias`}
                </span>
              </div>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Apoiar o site</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setStripeDonateOpen(true)} className="cursor-pointer">
            <CreditCard className="h-4 w-4 mr-2 text-destructive" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold">Doar com cartão / PIX</span>
              <span className="text-[10px] text-muted-foreground">Pagamento seguro via Stripe</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDonateOpen(true)} className="cursor-pointer">
            <Heart className="h-4 w-4 mr-2 text-warning" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold">Doar RT Coins</span>
              <span className="text-[10px] text-muted-foreground">Doe coins do seu saldo</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <StripeDonationDialog open={stripeDonateOpen} onOpenChange={setStripeDonateOpen} />

      {/* VIP Dialog */}
      <Dialog open={vipOpen} onOpenChange={setVipOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-pixel text-sm uppercase">
              <Crown className="h-4 w-4 text-warning" />
              {myVip?.isVip ? "Renovar VIP" : "Tornar-se VIP"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Vantagens VIP — mais dias de duração nos anúncios, limite maior, selo exclusivo e destaques bônus.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Preço</span>
                <span className="font-pixel text-warning flex items-center gap-1"><Coins className="h-3.5 w-3.5" />{vipSettings?.vip_price_coins ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Duração</span>
                <span className="font-semibold">{vipSettings?.vip_duration_days ?? "—"} dias</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">+ dias de anúncio</span>
                <span className="font-semibold">+{vipSettings?.vip_extra_ad_days ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Limite de anúncios</span>
                <span className="font-semibold">{vipSettings?.vip_max_active_ads ?? "—"} (vs {vipSettings?.normal_max_active_ads ?? "—"})</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Destaques bônus</span>
                <span className="font-semibold">{vipSettings?.vip_free_highlights ?? 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/40 border border-border/40">
              <span className="text-xs text-muted-foreground">Seu saldo:</span>
              <div className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-warning" />
                <span className="font-pixel text-xs text-warning">{wallet?.balance || 0}</span>
              </div>
            </div>
            {myVip?.isVip && (
              <p className="text-[10px] text-center text-muted-foreground">
                Você já é VIP até <span className="text-warning font-semibold">{myVip.vipUntil!.toLocaleString("pt-BR")}</span>. Renovar adiciona mais {vipSettings?.vip_duration_days ?? "—"} dias.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setVipOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => purchaseVip.mutate(undefined, { onSuccess: () => setVipOpen(false) })}
              disabled={purchaseVip.isPending || !vipSettings || (wallet?.balance || 0) < (vipSettings?.vip_price_coins || Infinity)}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              <Crown className="h-3.5 w-3.5 mr-1.5" />
              {myVip?.isVip ? "Renovar" : "Ativar VIP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Intermédio Dialog */}
      <Dialog open={interOpen} onOpenChange={setInterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-pixel text-sm uppercase">
              <Handshake className="h-4 w-4 text-primary" />
              Solicitar Intermédio
            </DialogTitle>
            <DialogDescription className="text-xs">
              Um admin do RubinTrade fará o intermédio da sua transação com segurança. Uma <span className="text-warning font-semibold">taxa</span> será combinada conforme o valor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Tipo de operação</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Comprar item</SelectItem>
                  <SelectItem value="sell">Vender item</SelectItem>
                  <SelectItem value="trade">Trocar / Trade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Descrição do item *</Label>
              <Input value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="Ex: Magic Plate Armor T5" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Valor estimado (opcional)</Label>
              <Input value={estValue} onChange={(e) => setEstValue(e.target.value)} placeholder="Ex: 150kk" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Contato (Discord/IG/char) *</Label>
              <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="@seu_discord" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes adicionais..." className="mt-1 min-h-[60px]" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setInterOpen(false)}>Cancelar</Button>
            <Button onClick={submitInter} disabled={createInter.isPending || !itemDesc.trim() || !contact.trim()} className="bg-primary text-primary-foreground">
              Enviar solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Doação Dialog */}
      <Dialog open={donateOpen} onOpenChange={setDonateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-pixel text-sm uppercase">
              <Heart className="h-4 w-4 text-destructive fill-destructive" />
              Apoiar o RubinTrade
            </DialogTitle>
            <DialogDescription className="text-xs">
              Doe coins do seu saldo para ajudar a manter o site no ar. Toda contribuição conta! 💛
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-warning/10 border border-warning/20">
              <span className="text-xs text-muted-foreground">Seu saldo:</span>
              <div className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-warning" />
                <span className="font-pixel text-xs text-warning">{wallet?.balance || 0}</span>
              </div>
            </div>
            <div>
              <Label className="text-xs">Quantidade a doar</Label>
              <Input type="number" min={1} max={wallet?.balance || 0} value={donateAmount} onChange={(e) => setDonateAmount(Math.max(1, Number(e.target.value)))} className="mt-1" />
              <div className="flex gap-1 mt-2">
                {[10, 50, 100, 500].map((v) => (
                  <button key={v} onClick={() => setDonateAmount(v)} disabled={(wallet?.balance || 0) < v} className="flex-1 py-1 text-[10px] rounded-md bg-secondary hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed font-semibold">
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Mensagem (opcional)</Label>
              <Input value={donateMsg} onChange={(e) => setDonateMsg(e.target.value)} placeholder="Continuem o ótimo trabalho!" className="mt-1" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDonateOpen(false)}>Cancelar</Button>
            <Button onClick={submitDonate} disabled={donate.isPending || donateAmount <= 0 || donateAmount > (wallet?.balance || 0)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Heart className="h-3.5 w-3.5 mr-1.5" />
              Doar {donateAmount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletActionsMenu;
