import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRaffles, useRaffleMutations } from "@/hooks/useRaffles";
import {
  useRafflePrizes, useRaffleNumbersAdmin, useRafflesAdminMutations,
} from "@/hooks/useRafflesAdmin";
import { callAdminActionRaw } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Ticket, Trash2, Trophy, Gift, Eye, Pencil, Check, X, Sparkles, UserPlus, Undo2 } from "lucide-react";

interface Props {
  getProfileName: (userId: string) => string;
}

export default function RafflesAdminPanel({ getProfileName }: Props) {
  const { data: allRaffles } = useRaffles();
  const raffleMut = useRaffleMutations();
  const adminMut = useRafflesAdminMutations();

  const [form, setForm] = useState({
    title: "", description: "", image_url: "", price_per_number: "",
    total_numbers: "100", draw_date: "", federal_lottery_ref: "", progress_percent: "",
    sales_blocked: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [winnerInputs, setWinnerInputs] = useState<Record<string, string>>({});
  const [lotteryRefInputs, setLotteryRefInputs] = useState<Record<string, string>>({});
  const [detailRaffleId, setDetailRaffleId] = useState<string | null>(null);

  const resetForm = () =>
    setForm({ title: "", description: "", image_url: "", price_per_number: "",
              total_numbers: "100", draw_date: "", federal_lottery_ref: "", progress_percent: "", sales_blocked: false });

  const handleSubmit = () => {
    if (!form.title || !form.price_per_number) return;
    const data: any = {
      title: form.title,
      description: form.description || undefined,
      image_url: form.image_url || undefined,
      price_per_number: Number(form.price_per_number),
      total_numbers: Number(form.total_numbers) || 100,
      draw_date: form.draw_date ? new Date(form.draw_date).toISOString() : undefined,
      federal_lottery_ref: form.federal_lottery_ref || undefined,
      progress_percent: form.progress_percent === "" ? null : Math.max(0, Math.min(100, Number(form.progress_percent))),
      sales_blocked: form.sales_blocked,
    };
    if (editingId) {
      raffleMut.update.mutate({ id: editingId, ...data });
      setEditingId(null);
    } else {
      raffleMut.create.mutate(data);
    }
    resetForm();
  };

  const handleEdit = (r: any) => {
    setEditingId(r.id);
    setForm({
      title: r.title, description: r.description || "", image_url: r.image_url || "",
      price_per_number: String(r.price_per_number), total_numbers: String(r.total_numbers),
      draw_date: r.draw_date ? r.draw_date.slice(0, 10) : "",
      federal_lottery_ref: r.federal_lottery_ref || "",
      progress_percent: r.progress_percent != null ? String(r.progress_percent) : "",
      sales_blocked: !!r.sales_blocked,
    });
  };

  return (
    <div className="space-y-5">
      {/* FORM */}
      <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 bg-gradient-to-r from-warning/5 to-transparent flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center border border-warning/25">
            <Ticket className="h-4 w-4 text-warning" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground font-body">{editingId ? "Editar Rifa" : "Criar Nova Rifa"}</h3>
            <p className="text-[10px] text-muted-foreground">Configure detalhes, prêmios e sorteio</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Rifa Golden Armor" className="bg-secondary/80 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Preço por número (coins) *</Label>
              <Input type="number" value={form.price_per_number} onChange={(e) => setForm({ ...form, price_per_number: e.target.value })} placeholder="10" className="bg-secondary/80 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Total de números</Label>
              <Input type="number" value={form.total_numbers} onChange={(e) => setForm({ ...form, total_numbers: e.target.value })} placeholder="100" className="bg-secondary/80 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Data do sorteio</Label>
              <Input type="date" value={form.draw_date} onChange={(e) => setForm({ ...form, draw_date: e.target.value })} className="bg-secondary/80 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Ref. Loteria Federal</Label>
              <Input value={form.federal_lottery_ref} onChange={(e) => setForm({ ...form, federal_lottery_ref: e.target.value })} placeholder="Concurso 5XXX" className="bg-secondary/80 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">URL da imagem</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="bg-secondary/80 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body">Progresso manual (%)</Label>
              <Input type="number" min={0} max={100} value={form.progress_percent} onChange={(e) => setForm({ ...form, progress_percent: e.target.value })} placeholder="0-100 (vazio = automático)" className="bg-secondary/80 border-border" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-body">Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalhes, prêmio principal, regras..." className="bg-secondary/80 border-border min-h-[70px]" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!form.title || !form.price_per_number} className="bg-warning text-warning-foreground hover:bg-warning/90">
              <Ticket className="h-4 w-4 mr-1" /> {editingId ? "Salvar" : "Criar Rifa"}
            </Button>
            {editingId && <Button variant="outline" onClick={() => { setEditingId(null); resetForm(); }}>Cancelar</Button>}
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(allRaffles || []).map((r: any) => {
          const isFinished = r.status === "finished" || r.status === "completed";
          const winnerNum = winnerInputs[r.id] ?? "";
          const lotteryRef = lotteryRefInputs[r.id] ?? r.federal_lottery_ref ?? "";
          return (
            <div key={r.id} className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden hover:border-warning/30 transition-all">
              <div className="relative">
                {r.image_url ? (
                  <img src={r.image_url} alt={r.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-20 bg-gradient-to-r from-warning/10 to-primary/5 flex items-center justify-center">
                    <Ticket className="h-8 w-8 text-warning/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={r.status === "active" ? "default" : isFinished ? "secondary" : r.status === "paused" ? "outline" : "destructive"} className="text-[9px] uppercase">
                    {r.status === "active" ? "Ativa" : isFinished ? "Finalizada" : r.status === "paused" ? "Pausada" : "Cancelada"}
                  </Badge>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <h4 className="text-sm font-bold text-foreground">{r.title}</h4>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-warning/5 border border-warning/15 rounded-lg py-2">
                    <p className="font-pixel text-sm text-warning">{r.price_per_number}</p>
                    <p className="text-[9px] text-muted-foreground">coins/nº</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/15 rounded-lg py-2">
                    <p className="font-pixel text-sm text-primary">{r.total_numbers}</p>
                    <p className="text-[9px] text-muted-foreground">total</p>
                  </div>
                  <div className="bg-secondary/50 border border-border/40 rounded-lg py-2">
                    <p className="font-pixel text-sm text-foreground">
                      {r.draw_date ? new Date(r.draw_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}
                    </p>
                    <p className="text-[9px] text-muted-foreground">sorteio</p>
                  </div>
                </div>

                {isFinished && r.winner_number != null && (
                  <div className="bg-warning/10 border border-warning/25 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">🏆 Vencedor: nº {r.winner_number}</p>
                    {r.winner_user_id && (
                      <p className="text-xs font-semibold text-warning">{getProfileName(r.winner_user_id)}</p>
                    )}
                  </div>
                )}

                {!isFinished && (
                  <div className="space-y-2 bg-secondary/30 rounded-lg p-2.5">
                    <p className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                      <Trophy className="h-3 w-3" /> Definir vencedor (resultado loteria federal)
                    </p>
                    <Input
                      placeholder="Concurso/ref. loteria (opcional)"
                      value={lotteryRef}
                      onChange={(e) => setLotteryRefInputs((p) => ({ ...p, [r.id]: e.target.value }))}
                      className="bg-secondary/80 border-border h-8 text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number" min={1} max={r.total_numbers}
                        placeholder={`Nº (1-${r.total_numbers})`}
                        value={winnerNum}
                        onChange={(e) => setWinnerInputs((p) => ({ ...p, [r.id]: e.target.value }))}
                        className="bg-secondary/80 border-border h-8 text-xs flex-1"
                      />
                      <Button size="sm" className="h-8 bg-warning text-warning-foreground" disabled={!winnerNum}
                        onClick={() => {
                          const num = Number(winnerNum);
                          if (num >= 1 && num <= r.total_numbers) {
                            adminMut.drawWinner.mutate({
                              raffleId: r.id, winnerNumber: num,
                              lotteryRef: lotteryRef || undefined,
                            });
                            setWinnerInputs((p) => { const n = { ...p }; delete n[r.id]; return n; });
                          }
                        }}>
                        🏆 Sortear
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs min-w-[140px]" onClick={() => setDetailRaffleId(r.id)}>
                    <Sparkles className="h-3.5 w-3.5 mr-1" /> Prêmios & Detalhes
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleEdit(r)} title="Editar">
                    <Pencil className="h-3.5 w-3.5 text-primary" />
                  </Button>
                  {r.status === "active" ? (
                    <Button size="sm" variant="outline" className="h-8 px-2 text-[10px]" title="Pausar"
                      onClick={() => raffleMut.update.mutate({ id: r.id, status: "paused" })}>
                      ⏸ Pausar
                    </Button>
                  ) : r.status === "paused" ? (
                    <Button size="sm" variant="outline" className="h-8 px-2 text-[10px]" title="Reativar"
                      onClick={() => raffleMut.update.mutate({ id: r.id, status: "active" })}>
                      ▶ Reativar
                    </Button>
                  ) : null}
                  {!isFinished && (
                    <Button size="sm" variant="outline" className="h-8 px-2 text-[10px]" title="Encerrar (cancelar)"
                      onClick={() => { if (confirm(`Encerrar "${r.title}" sem sorteio?`)) raffleMut.update.mutate({ id: r.id, status: "cancelled" }); }}>
                      ⛔ Encerrar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:border-destructive/30"
                    onClick={() => { if (confirm(`Remover "${r.title}"?`)) raffleMut.remove.mutate(r.id); }}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(!allRaffles || allRaffles.length === 0) && (
        <div className="text-center py-12 bg-card/50 rounded-2xl border border-border/60">
          <Ticket className="h-8 w-8 text-warning/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-body">Nenhuma rifa criada</p>
        </div>
      )}

      {detailRaffleId && (
        <RaffleDetailDialog
          raffleId={detailRaffleId}
          raffle={allRaffles?.find((r: any) => r.id === detailRaffleId)}
          getProfileName={getProfileName}
          onClose={() => setDetailRaffleId(null)}
        />
      )}
    </div>
  );
}

function RaffleDetailDialog({
  raffleId, raffle, getProfileName, onClose,
}: { raffleId: string; raffle: any; getProfileName: (id: string) => string; onClose: () => void }) {
  const { data: prizes } = useRafflePrizes(raffleId);
  const { data: numbers } = useRaffleNumbersAdmin(raffleId);
  const { createPrize, deletePrize, markDelivered } = useRafflesAdminMutations();
  const qc = useQueryClient();

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-mini"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, username").order("username");
      return data || [];
    },
  });

  const [prizeForm, setPrizeForm] = useState({ prize_number: "", prize_name: "", prize_description: "" });
  const [grantForm, setGrantForm] = useState({ userId: "", quantity: "1", specific: "" });

  const grantMut = useMutation({
    mutationFn: (vars: { userId: string; quantity?: number; specificNumbers?: number[] }) =>
      callAdminActionRaw<{ numbers: number[] }>("grantRaffleNumbers", { raffleId, ...vars }),
    onSuccess: (data) => {
      toast.success(`Números doados: ${data?.numbers?.join(", ") || ""}`);
      qc.invalidateQueries({ queryKey: ["raffle-numbers-admin", raffleId] });
      setGrantForm({ userId: "", quantity: "1", specific: "" });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao doar números"),
  });

  const refundMut = useMutation({
    mutationFn: (userId: string) => callAdminActionRaw<{ numbers_removed: number; coins_refunded: number }>("refundRaffleUser", { raffleId, userId }),
    onSuccess: (data) => {
      toast.success(`Reembolso: ${data?.coins_refunded} coins (${data?.numbers_removed} nº)`);
      qc.invalidateQueries({ queryKey: ["raffle-numbers-admin", raffleId] });
    },
    onError: (e: any) => toast.error(e.message || "Erro no reembolso"),
  });

  const buyersByUser = (numbers || []).reduce((acc: Record<string, number[]>, n: any) => {
    (acc[n.user_id] ||= []).push(n.number);
    return acc;
  }, {});
  const totalSold = numbers?.length || 0;
  const pct = raffle ? Math.round((totalSold / raffle.total_numbers) * 100) : 0;
  const revenue = raffle ? totalSold * raffle.price_per_number : 0;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-warning" /> {raffle?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
              <p className="font-pixel text-lg text-primary">{totalSold}/{raffle?.total_numbers}</p>
              <p className="text-[10px] text-muted-foreground">vendidos ({pct}%)</p>
            </div>
            <div className="bg-warning/5 border border-warning/20 rounded-xl p-3 text-center">
              <p className="font-pixel text-lg text-warning">{revenue}</p>
              <p className="text-[10px] text-muted-foreground">coins arrecadados</p>
            </div>
            <div className="bg-secondary/40 border border-border rounded-xl p-3 text-center">
              <p className="font-pixel text-lg text-foreground">{Object.keys(buyersByUser).length}</p>
              <p className="text-[10px] text-muted-foreground">compradores únicos</p>
            </div>
          </div>

          {/* PRIZES */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Mini prêmios (instant win)</h3>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Quem comprar um número listado abaixo ganha o prêmio automaticamente. Você recebe notificação para entregar manualmente.
            </p>
            <div className="bg-secondary/30 border border-border rounded-xl p-3 space-y-2">
              <div className="grid grid-cols-12 gap-2">
                <Input
                  type="number" min={1} max={raffle?.total_numbers}
                  placeholder="Nº" value={prizeForm.prize_number}
                  onChange={(e) => setPrizeForm({ ...prizeForm, prize_number: e.target.value })}
                  className="col-span-2 bg-secondary border-border h-9 text-xs"
                />
                <Input
                  placeholder="Nome do prêmio (ex: Demon Helmet)"
                  value={prizeForm.prize_name}
                  onChange={(e) => setPrizeForm({ ...prizeForm, prize_name: e.target.value })}
                  className="col-span-5 bg-secondary border-border h-9 text-xs"
                />
                <Input
                  placeholder="Descrição (opcional)"
                  value={prizeForm.prize_description}
                  onChange={(e) => setPrizeForm({ ...prizeForm, prize_description: e.target.value })}
                  className="col-span-3 bg-secondary border-border h-9 text-xs"
                />
                <Button
                  size="sm" className="col-span-2 h-9 bg-primary text-primary-foreground"
                  disabled={!prizeForm.prize_number || !prizeForm.prize_name}
                  onClick={() => {
                    createPrize.mutate({
                      raffle_id: raffleId,
                      prize_number: Number(prizeForm.prize_number),
                      prize_name: prizeForm.prize_name,
                      prize_description: prizeForm.prize_description || undefined,
                    }, { onSuccess: () => setPrizeForm({ prize_number: "", prize_name: "", prize_description: "" }) });
                  }}
                >
                  + Adicionar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {(prizes || []).map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
                  <div className="w-12 h-12 rounded-lg bg-warning/10 border border-warning/30 flex items-center justify-center">
                    <span className="font-pixel text-sm text-warning">{p.prize_number}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{p.prize_name}</p>
                    {p.prize_description && <p className="text-[11px] text-muted-foreground">{p.prize_description}</p>}
                    {p.winner_user_id ? (
                      <p className="text-[11px] text-primary mt-1">
                        🏆 Ganhador: <strong>{getProfileName(p.winner_user_id)}</strong>
                        {p.delivered ? <span className="ml-2 text-success">✓ entregue</span> : <span className="ml-2 text-warning">aguardando entrega</span>}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground mt-1">Aguardando alguém comprar este número</p>
                    )}
                  </div>
                  {p.winner_user_id && (
                    <Button size="sm" variant={p.delivered ? "outline" : "default"} className="h-8 text-xs"
                      onClick={() => markDelivered.mutate({ id: p.id, delivered: !p.delivered })}>
                      {p.delivered ? <X className="h-3 w-3 mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                      {p.delivered ? "Desmarcar" : "Marcar entregue"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 hover:bg-destructive/10"
                    onClick={() => { if (confirm("Remover este prêmio?")) deletePrize.mutate(p.id); }}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
              {(!prizes || prizes.length === 0) && (
                <p className="text-center text-xs text-muted-foreground py-3">Nenhum mini prêmio cadastrado</p>
              )}
            </div>
          </div>

          {/* GRANT NUMBERS MANUALLY */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" /> Doar números (sem cobrar)
            </h3>
            <div className="bg-secondary/30 border border-border rounded-xl p-3 grid grid-cols-12 gap-2">
              <Select value={grantForm.userId} onValueChange={(v) => setGrantForm({ ...grantForm, userId: v })}>
                <SelectTrigger className="col-span-5 bg-secondary border-border h-9 text-xs"><SelectValue placeholder="Usuário..." /></SelectTrigger>
                <SelectContent>{(profiles || []).map((p: any) => <SelectItem key={p.user_id} value={p.user_id}>{p.username}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" min={1} max={100} placeholder="Qtd"
                value={grantForm.quantity} onChange={(e) => setGrantForm({ ...grantForm, quantity: e.target.value })}
                className="col-span-2 bg-secondary border-border h-9 text-xs" />
              <Input placeholder="Ou nºs específicos: 1,5,10"
                value={grantForm.specific} onChange={(e) => setGrantForm({ ...grantForm, specific: e.target.value })}
                className="col-span-3 bg-secondary border-border h-9 text-xs" />
              <Button size="sm" className="col-span-2 h-9 bg-primary text-primary-foreground"
                disabled={!grantForm.userId || grantMut.isPending}
                onClick={() => {
                  const specific = grantForm.specific.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));
                  if (specific.length > 0) {
                    grantMut.mutate({ userId: grantForm.userId, specificNumbers: specific });
                  } else {
                    grantMut.mutate({ userId: grantForm.userId, quantity: Number(grantForm.quantity) || 1 });
                  }
                }}>
                Doar
              </Button>
            </div>
          </div>

          {/* TOP BUYERS */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> Compradores ({Object.keys(buyersByUser).length})
            </h3>
            <div className="bg-secondary/30 border border-border rounded-xl max-h-60 overflow-y-auto divide-y divide-border/50">
              {Object.entries(buyersByUser)
                .sort(([, a], [, b]) => (b as number[]).length - (a as number[]).length)
                .map(([uid, nums]) => (
                  <div key={uid} className="flex items-center justify-between gap-2 p-2.5 text-xs">
                    <span className="font-semibold text-foreground shrink-0">{getProfileName(uid)}</span>
                    <span className="text-muted-foreground flex-1 truncate">
                      {(nums as number[]).length} nº — {(nums as number[]).slice(0, 8).join(", ")}{(nums as number[]).length > 8 ? "..." : ""}
                    </span>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] hover:bg-warning/10 hover:border-warning/30 shrink-0"
                      disabled={refundMut.isPending}
                      onClick={() => {
                        if (confirm(`Reembolsar ${getProfileName(uid)}? Vai apagar ${(nums as number[]).length} número(s) e devolver as coins.`)) {
                          refundMut.mutate(uid);
                        }
                      }}>
                      <Undo2 className="h-3 w-3 mr-1" /> Reembolsar
                    </Button>
                  </div>
                ))}
              {Object.keys(buyersByUser).length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-3">Nenhuma compra ainda</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
