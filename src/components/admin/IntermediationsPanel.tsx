import { useMemo, useState } from "react";
import { ArrowRightLeft, Check, X, Trash2, Clock, MessageSquare, ShoppingCart, Tag, Repeat, User, Phone, FileText, Loader2, CheckCircle2, Copy, Search, ArrowUpDown, Flame, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAllIntermediations, useUpdateIntermediation, useDeleteIntermediation } from "@/hooks/useUserActions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_META: Record<string, { label: string; chip: string; dot: string; ring: string }> = {
  pending:     { label: "Pendente",     chip: "bg-warning/10 text-warning border-warning/30",                  dot: "bg-warning",       ring: "ring-warning/30" },
  in_progress: { label: "Em andamento", chip: "bg-primary/10 text-primary border-primary/30",                  dot: "bg-primary animate-pulse", ring: "ring-primary/30" },
  completed:   { label: "Concluído",    chip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",      dot: "bg-emerald-400",   ring: "ring-emerald-500/30" },
  rejected:    { label: "Rejeitado",    chip: "bg-destructive/10 text-destructive border-destructive/30",      dot: "bg-destructive",   ring: "ring-destructive/30" },
  cancelled:   { label: "Cancelado",    chip: "bg-muted text-muted-foreground border-border",                  dot: "bg-muted-foreground", ring: "ring-border" },
};

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  buy:   { label: "Compra", icon: <ShoppingCart className="h-3 w-3" />, cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  sell:  { label: "Venda",  icon: <Tag className="h-3 w-3" />,          cls: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  trade: { label: "Troca",  icon: <Repeat className="h-3 w-3" />,       cls: "bg-violet-500/10 text-violet-400 border-violet-500/30" },
};

type FilterKey = "all" | "pending" | "in_progress" | "completed" | "rejected";

export default function IntermediationsPanel({ getProfileName }: { getProfileName: (id: string) => string }) {
  const { data: requests, isLoading } = useAllIntermediations(true);
  const update = useUpdateIntermediation();
  const remove = useDeleteIntermediation();
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  const counts = {
    all: requests?.length || 0,
    pending: requests?.filter((r) => r.status === "pending").length || 0,
    in_progress: requests?.filter((r) => r.status === "in_progress").length || 0,
    completed: requests?.filter((r) => r.status === "completed").length || 0,
    rejected: requests?.filter((r) => r.status === "rejected").length || 0,
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (requests || [])
      .filter((r) => filter === "all" || r.status === filter)
      .filter((r) => {
        if (!q) return true;
        const name = getProfileName(r.user_id).toLowerCase();
        return (
          name.includes(q) ||
          r.item_description?.toLowerCase().includes(q) ||
          r.contact_info?.toLowerCase().includes(q) ||
          r.estimated_value?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const da = new Date(a.created_at).getTime();
        const db = new Date(b.created_at).getTime();
        return sortDesc ? db - da : da - db;
      });
    return list;
  }, [requests, filter, search, sortDesc, getProfileName]);

  const copy = async (text: string, label = "Copiado") => {
    try { await navigator.clipboard.writeText(text); toast.success(label); }
    catch { toast.error("Falha ao copiar"); }
  };

  const ageDays = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

  const contactLink = (raw: string): string | null => {
    const v = raw.trim();
    if (/^https?:\/\//i.test(v)) return v;
    if (/^\d{10,15}$/.test(v.replace(/\D/g, "")) && v.replace(/\D/g, "").length >= 10) {
      return `https://wa.me/${v.replace(/\D/g, "")}`;
    }
    if (/^@?[\w.]+$/.test(v) && v.includes(".")) return `https://instagram.com/${v.replace("@", "")}`;
    return null;
  };

  return (
    <div className="space-y-5">
      {/* HERO STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Pendentes"
          value={counts.pending}
          tone="warning"
          active={filter === "pending"}
          onClick={() => setFilter(filter === "pending" ? "all" : "pending")}
        />
        <StatCard
          icon={<Loader2 className="h-4 w-4" />}
          label="Em andamento"
          value={counts.in_progress}
          tone="primary"
          active={filter === "in_progress"}
          onClick={() => setFilter(filter === "in_progress" ? "all" : "in_progress")}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Concluídos"
          value={counts.completed}
          tone="emerald"
          active={filter === "completed"}
          onClick={() => setFilter(filter === "completed" ? "all" : "completed")}
        />
        <StatCard
          icon={<X className="h-4 w-4" />}
          label="Rejeitados"
          value={counts.rejected}
          tone="destructive"
          active={filter === "rejected"}
          onClick={() => setFilter(filter === "rejected" ? "all" : "rejected")}
        />
      </div>

      {/* LIST */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 to-card/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-primary/[0.06] to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Intermediações</h3>
              <p className="text-[11px] text-muted-foreground">
                {filter === "all" && !search ? `${counts.all} solicitações` : `${filtered.length} resultados`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar item, user, contato..."
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 shrink-0" onClick={() => setSortDesc(!sortDesc)} title="Ordenar por data">
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortDesc ? "Recentes" : "Antigos"}
            </Button>
            {(filter !== "all" || search) && (
              <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => { setFilter("all"); setSearch(""); }}>
                Limpar
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-center mx-auto mb-3">
              <ArrowRightLeft className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-foreground text-sm font-medium">Nenhuma solicitação</p>
            <p className="text-muted-foreground text-xs mt-1">
              {filter === "all" ? "Aguardando novas intermediações." : "Tente outro filtro."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((r) => {
              const status = STATUS_META[r.status] || STATUS_META.pending;
              const type = TYPE_META[r.type] || TYPE_META.trade;
              const days = ageDays(r.created_at);
              const isUrgent = (r.status === "pending" || r.status === "in_progress") && days >= 2;
              const link = contactLink(r.contact_info);
              return (
                <div key={r.id} className={cn("p-5 hover:bg-secondary/10 transition-colors relative", isUrgent && "bg-warning/[0.03]")}>
                  <div className={cn("absolute left-0 top-0 bottom-0 w-1", status.dot)} />

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border", status.chip)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                        {status.label}
                      </span>
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border", type.cls)}>
                        {type.icon} {type.label}
                      </span>
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-orange-500/10 text-orange-400 border-orange-500/30 animate-pulse">
                          <Flame className="h-3 w-3" /> {days}d sem resposta
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {new Date(r.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{getProfileName(r.user_id)}</p>
                        <button onClick={() => copy(r.user_id, "ID copiado")} className="text-[10px] text-muted-foreground hover:text-primary" title="Copiar user id">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm text-foreground/90 mt-0.5 leading-snug">{r.item_description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {r.estimated_value && (
                      <InfoRow icon={<Tag className="h-3 w-3" />} label="Valor" value={r.estimated_value} onCopy={() => copy(r.estimated_value!)} />
                    )}
                    <InfoRow
                      icon={<Phone className="h-3 w-3" />}
                      label="Contato"
                      value={r.contact_info}
                      accent
                      onCopy={() => copy(r.contact_info)}
                      openHref={link || undefined}
                    />
                  </div>

                  {r.notes && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-secondary/40 border border-border/60 text-xs text-foreground/80 flex gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="italic"><span className="font-semibold not-italic text-muted-foreground">Obs do usuário:</span> {r.notes}</span>
                    </div>
                  )}
                  {r.admin_notes && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-primary/[0.06] border border-primary/30 text-xs text-foreground flex gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span><span className="font-bold text-primary">Nota admin:</span> {r.admin_notes}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90" onClick={() => update.mutate({ id: r.id, status: "in_progress" })}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Aceitar
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => update.mutate({ id: r.id, status: "rejected" })}>
                          <X className="h-3.5 w-3.5 mr-1" /> Rejeitar
                        </Button>
                      </>
                    )}
                    {r.status === "in_progress" && (
                      <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-600/90 text-white" onClick={() => update.mutate({ id: r.id, status: "completed" })}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Marcar concluído
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setNoteFor(noteFor === r.id ? null : r.id); setNoteText(r.admin_notes || ""); }}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> {noteFor === r.id ? "Cancelar" : "Nota"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive hover:bg-destructive/10 ml-auto" onClick={() => { if (confirm("Remover solicitação?")) remove.mutate(r.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {noteFor === r.id && (
                    <div className="mt-3 space-y-2 p-3 rounded-lg bg-secondary/30 border border-border/60">
                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Nota visível ao usuário..."
                        className="bg-card/80 border-border min-h-[70px] text-xs"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setNoteFor(null)}>Cancelar</Button>
                        <Button size="sm" className="h-7 text-xs" onClick={() => { update.mutate({ id: r.id, admin_notes: noteText }); setNoteFor(null); }}>
                          Salvar nota
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const TONE_CLS: Record<string, { bg: string; text: string; border: string; ring: string; glow: string }> = {
  warning:     { bg: "bg-warning/10",        text: "text-warning",       border: "border-warning/30",       ring: "ring-warning",       glow: "shadow-[0_8px_24px_-12px_hsl(var(--warning)/0.6)]" },
  primary:     { bg: "bg-primary/10",        text: "text-primary",       border: "border-primary/30",       ring: "ring-primary",       glow: "shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.6)]" },
  emerald:     { bg: "bg-emerald-500/10",    text: "text-emerald-400",   border: "border-emerald-500/30",   ring: "ring-emerald-500",   glow: "shadow-[0_8px_24px_-12px_rgb(16_185_129_/_0.5)]" },
  destructive: { bg: "bg-destructive/10",    text: "text-destructive",   border: "border-destructive/30",   ring: "ring-destructive",   glow: "shadow-[0_8px_24px_-12px_hsl(var(--destructive)/0.5)]" },
};

function StatCard({ icon, label, value, tone, active, onClick }: { icon: React.ReactNode; label: string; value: number; tone: keyof typeof TONE_CLS; active: boolean; onClick: () => void }) {
  const t = TONE_CLS[tone];
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative text-left rounded-2xl border p-4 transition-all overflow-hidden",
        t.bg, t.border,
        active ? cn("ring-2 ring-offset-2 ring-offset-background", t.ring, t.glow) : "hover:scale-[1.02] hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg border", t.border, "bg-background/40", t.text)}>
          {icon}
        </span>
        {active && <span className={cn("h-2 w-2 rounded-full", t.text.replace("text-", "bg-"))} />}
      </div>
      <p className={cn("text-2xl font-bold leading-none", t.text)}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5 font-semibold">{label}</p>
    </button>
  );
}

function InfoRow({ icon, label, value, accent, onCopy, openHref }: { icon: React.ReactNode; label: string; value: string; accent?: boolean; onCopy?: () => void; openHref?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border/40 group">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">{label}:</span>
      <span className={cn("text-xs font-medium truncate flex-1", accent ? "text-primary" : "text-foreground")}>{value}</span>
      {openHref && (
        <a href={openHref} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity" title="Abrir">
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
      {onCopy && (
        <button onClick={onCopy} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity" title="Copiar">
          <Copy className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

