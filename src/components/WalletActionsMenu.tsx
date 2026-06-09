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
  const [step, setStep] = useState(1);
  const [type, setType] = useState<"buy" | "sell" | "trade">("buy");
  const [itemDesc, setItemDesc] = useState("");
  const [estValue, setEstValue] = useState("");
  const [contactPlatform, setContactPlatform] = useState<"discord" | "whatsapp" | "instagram" | "char">("discord");
  const [contactHandle, setContactHandle] = useState("");
  const [notes, setNotes] = useState("");
  const [agree, setAgree] = useState(false);
  const createInter = useCreateIntermediation();

  const contactInfo = useMemo(() => {
    const prefix: Record<string, string> = { discord: "Discord: ", whatsapp: "WhatsApp: ", instagram: "@", char: "Char: " };
    return contactHandle.trim() ? `${prefix[contactPlatform]}${contactHandle.trim().replace(/^@/, "")}` : "";
  }, [contactPlatform, contactHandle]);

  const feeEstimate = useMemo(() => {
    const v = estValue.toLowerCase().replace(/[^0-9.kk]/g, "");
    const num = parseFloat(v) * (v.includes("kk") ? 1000 : v.includes("k") ? 1 : 0.001);
    if (!num || isNaN(num)) return null;
    const pct = num < 50 ? 5 : num < 200 ? 4 : num < 1000 ? 3 : 2;
    return { pct, fee: Math.round(num * pct) / 100 };
  }, [estValue]);

  const resetInter = () => {
    setStep(1); setType("buy"); setItemDesc(""); setEstValue("");
    setContactPlatform("discord"); setContactHandle(""); setNotes(""); setAgree(false);
  };

  // Doação
  const [donateAmount, setDonateAmount] = useState(50);
  const [donateMsg, setDonateMsg] = useState("");
  const donate = useDonate();

  const submitInter = () => {
    if (!itemDesc.trim() || !contactInfo) return;
    createInter.mutate(
      { type, item_description: itemDesc.trim(), estimated_value: estValue.trim() || undefined, contact_info: contactInfo, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          setInterOpen(false);
          resetInter();
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
      <Dialog open={interOpen} onOpenChange={(o) => { setInterOpen(o); if (!o) resetInter(); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {/* HERO HEADER */}
          <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-b border-border/60">
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "16px 16px" }} />
            <div className="relative flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] shrink-0">
                <Handshake className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="font-pixel text-base uppercase tracking-wide flex items-center gap-2">
                  Intermédio Seguro
                  <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                    <Shield className="h-2.5 w-2.5" /> Verificado
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs mt-1 leading-relaxed">
                  Um admin do RubinTrade fará o intermédio com segurança. Você paga uma <span className="text-warning font-semibold">taxa</span> proporcional ao valor.
                </DialogDescription>
              </div>
            </div>
            {/* Stepper */}
            <div className="relative mt-4 flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 flex items-center gap-2">
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all shrink-0",
                    step === s ? "bg-primary text-primary-foreground border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]" :
                    step > s ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" :
                    "bg-card text-muted-foreground border-border"
                  )}>
                    {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                  </div>
                  {s < 3 && <div className={cn("flex-1 h-0.5 rounded-full", step > s ? "bg-emerald-500/40" : "bg-border")} />}
                </div>
              ))}
            </div>
            <div className="relative flex justify-between mt-1.5 text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
              <span className={cn(step >= 1 && "text-foreground")}>Operação</span>
              <span className={cn(step >= 2 && "text-foreground")}>Detalhes</span>
              <span className={cn(step >= 3 && "text-foreground")}>Contato</span>
            </div>
          </div>

          {/* BODY */}
          <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
            {/* STEP 1 — Type */}
            {step === 1 && (
              <div className="space-y-3 animate-in fade-in-50">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">O que você quer fazer?</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "buy", label: "Comprar", icon: ShoppingCart, desc: "Garante o item", cls: "emerald-500", grad: "from-emerald-500/20 to-emerald-500/5" },
                    { id: "sell", label: "Vender", icon: Tag, desc: "Receba pagamento", cls: "blue-500", grad: "from-blue-500/20 to-blue-500/5" },
                    { id: "trade", label: "Trocar", icon: Repeat, desc: "Troca + diff", cls: "violet-500", grad: "from-violet-500/20 to-violet-500/5" },
                  ].map((opt) => {
                    const active = type === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setType(opt.id as any)}
                        className={cn(
                          "relative p-3 rounded-xl border-2 transition-all text-left bg-gradient-to-br",
                          opt.grad,
                          active ? `border-${opt.cls} shadow-[0_8px_24px_-8px] scale-[1.02]` : "border-border/60 hover:border-border opacity-70 hover:opacity-100"
                        )}
                      >
                        <Icon className={cn("h-5 w-5 mb-1.5", active ? `text-${opt.cls}` : "text-muted-foreground")} />
                        <p className="text-xs font-bold text-foreground">{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                        {active && <CheckCircle2 className={cn("absolute top-1.5 right-1.5 h-3.5 w-3.5", `text-${opt.cls}`)} />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 px-3 py-2.5 rounded-xl bg-primary/[0.06] border border-primary/20 flex gap-2.5">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-[11px] text-foreground/80 leading-relaxed">
                    <span className="font-bold text-primary">Como funciona:</span> você descreve o trade, um admin entra em contato, mantém o item/coins em escrow e libera após confirmação das duas partes.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — Item & value */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in-50">
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Item ou pacote *</Label>
                  <Input
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    placeholder="Ex: Magic Plate Armor, Falcon Set T3, 500 Crystal Coins"
                    className="mt-1.5 h-11"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Seja específico — tier, encantos, quantidade.</p>
                </div>

                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Valor estimado</Label>
                  <div className="relative mt-1.5">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warning" />
                    <Input
                      value={estValue}
                      onChange={(e) => setEstValue(e.target.value)}
                      placeholder="Ex: 150kk"
                      className="pl-9 h-11"
                    />
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {["10kk", "50kk", "100kk", "500kk", "1kkk"].map((v) => (
                      <button key={v} type="button" onClick={() => setEstValue(v)} className="px-2.5 py-1 text-[10px] rounded-md bg-secondary hover:bg-secondary/70 border border-border/60 font-semibold transition-colors">
                        {v}
                      </button>
                    ))}
                  </div>
                  {feeEstimate && (
                    <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-warning/15 to-warning/5 border border-warning/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-warning/80 font-bold">Taxa estimada</p>
                          <p className="text-base font-pixel text-warning mt-0.5">~{feeEstimate.pct}%</p>
                        </div>
                        <Sparkles className="h-6 w-6 text-warning/60" />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Valor final combinado com o admin no contato.</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Observações</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="World, char do trade, prazo desejado, condições especiais..."
                    className="mt-1.5 min-h-[80px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">{notes.length}/500</p>
                </div>
              </div>
            )}

            {/* STEP 3 — Contact */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in-50">
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Plataforma de contato *</Label>
                  <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                    {[
                      { id: "discord", label: "Discord", icon: MessageCircle, color: "text-indigo-400" },
                      { id: "whatsapp", label: "WhatsApp", icon: Phone, color: "text-emerald-400" },
                      { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-400" },
                      { id: "char", label: "Char Tibia", icon: Gamepad2, color: "text-amber-400" },
                    ].map((p) => {
                      const active = contactPlatform === p.id;
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setContactPlatform(p.id as any)}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all",
                            active ? "border-primary bg-primary/10" : "border-border/60 hover:border-border bg-card/40"
                          )}
                        >
                          <Icon className={cn("h-4 w-4", active ? p.color : "text-muted-foreground")} />
                          <span className={cn("text-[10px] font-semibold", active ? "text-foreground" : "text-muted-foreground")}>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    {contactPlatform === "discord" ? "Usuário Discord" : contactPlatform === "whatsapp" ? "Número WhatsApp" : contactPlatform === "instagram" ? "Usuário Instagram" : "Nome do char + World"} *
                  </Label>
                  <Input
                    value={contactHandle}
                    onChange={(e) => setContactHandle(e.target.value)}
                    placeholder={contactPlatform === "discord" ? "seu_user#0000" : contactPlatform === "whatsapp" ? "+55 11 99999-9999" : contactPlatform === "instagram" ? "seu_user" : "Knight Galo (Antica)"}
                    className="mt-1.5 h-11"
                  />
                </div>

                {/* Summary */}
                <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Resumo</p>
                  <Row label="Operação" value={type === "buy" ? "Comprar" : type === "sell" ? "Vender" : "Trocar"} />
                  <Row label="Item" value={itemDesc || "—"} />
                  <Row label="Valor" value={estValue || "A combinar"} />
                  {feeEstimate && <Row label="Taxa" value={`~${feeEstimate.pct}%`} accent />}
                  <Row label="Contato" value={contactInfo || "—"} />
                </div>

                <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-card/60 border border-border/60 cursor-pointer hover:bg-card/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-[11px] text-foreground/80 leading-snug">
                    Confirmo que as informações estão corretas e concordo com a <span className="text-primary font-semibold">taxa do intermédio</span> a ser combinada com o admin.
                  </span>
                </label>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border/60 bg-card/40 flex sm:justify-between gap-2">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setInterOpen(false)}>Cancelar</Button>
            )}
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 2 && !itemDesc.trim()}
                className="bg-primary text-primary-foreground gap-1.5"
              >
                Continuar <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                onClick={submitInter}
                disabled={createInter.isPending || !itemDesc.trim() || !contactHandle.trim() || !agree}
                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground gap-1.5 shadow-[0_4px_18px_-4px_hsl(var(--primary)/0.55)]"
              >
                <Shield className="h-3.5 w-3.5" /> Enviar solicitação
              </Button>
            )}
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

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold truncate max-w-[60%] text-right", accent ? "text-warning" : "text-foreground")}>{value}</span>
    </div>
  );
}

export default WalletActionsMenu;
