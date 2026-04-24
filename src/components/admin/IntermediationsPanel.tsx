import { useState } from "react";
import { ArrowRightLeft, Check, X, Trash2, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAllIntermediations, useUpdateIntermediation, useDeleteIntermediation } from "@/hooks/useUserActions";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendente", cls: "bg-warning/15 text-warning border-warning/30" },
  in_progress: { label: "Em andamento", cls: "bg-primary/15 text-primary border-primary/30" },
  completed: { label: "Concluído", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  rejected: { label: "Rejeitado", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  cancelled: { label: "Cancelado", cls: "bg-muted text-muted-foreground border-border" },
};

const TYPE_LABELS: Record<string, string> = { buy: "Compra", sell: "Venda", trade: "Troca" };

export default function IntermediationsPanel({ getProfileName }: { getProfileName: (id: string) => string }) {
  const { data: requests, isLoading } = useAllIntermediations(true);
  const update = useUpdateIntermediation();
  const remove = useDeleteIntermediation();
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const counts = {
    pending: requests?.filter((r) => r.status === "pending").length || 0,
    in_progress: requests?.filter((r) => r.status === "in_progress").length || 0,
    completed: requests?.filter((r) => r.status === "completed").length || 0,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card/80 border border-warning/30 rounded-xl p-4 text-center">
          <p className="font-pixel text-xl text-warning">{counts.pending}</p>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Pendentes</p>
        </div>
        <div className="bg-card/80 border border-primary/30 rounded-xl p-4 text-center">
          <p className="font-pixel text-xl text-primary">{counts.in_progress}</p>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Em andamento</p>
        </div>
        <div className="bg-card/80 border border-emerald-500/30 rounded-xl p-4 text-center">
          <p className="font-pixel text-xl text-emerald-400">{counts.completed}</p>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Concluídos</p>
        </div>
      </div>

      <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 bg-secondary/30 flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground font-body">Solicitações de Intermediação</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
        ) : !requests || requests.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowRightLeft className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma solicitação ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {requests.map((r) => {
              const status = STATUS_LABELS[r.status] || STATUS_LABELS.pending;
              return (
                <div key={r.id} className="p-4 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.cls}`}>
                          {status.label}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-full">
                          {TYPE_LABELS[r.type] || r.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(r.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {getProfileName(r.user_id)}
                      </p>
                      <p className="text-sm text-foreground/90 mt-1">{r.item_description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs">
                        {r.estimated_value && (
                          <p className="text-muted-foreground">Valor estimado: <span className="text-foreground">{r.estimated_value}</span></p>
                        )}
                        <p className="text-muted-foreground">Contato: <span className="text-primary">{r.contact_info}</span></p>
                      </div>
                      {r.notes && <p className="text-xs text-muted-foreground mt-1 italic">Obs: {r.notes}</p>}
                      {r.admin_notes && (
                        <div className="mt-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs text-foreground">
                          <span className="font-bold text-primary">Nota admin:</span> {r.admin_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => update.mutate({ id: r.id, status: "in_progress" })}>
                          Aceitar
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => update.mutate({ id: r.id, status: "rejected" })}>
                          <X className="h-3.5 w-3.5 mr-1" /> Rejeitar
                        </Button>
                      </>
                    )}
                    {r.status === "in_progress" && (
                      <Button size="sm" variant="outline" className="text-emerald-400" onClick={() => update.mutate({ id: r.id, status: "completed" })}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Marcar concluído
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { setNoteFor(noteFor === r.id ? null : r.id); setNoteText(r.admin_notes || ""); }}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Nota
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive ml-auto" onClick={() => { if (confirm("Remover solicitação?")) remove.mutate(r.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {noteFor === r.id && (
                    <div className="mt-3 space-y-2">
                      <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Nota visível ao usuário..." className="bg-secondary/80 border-border min-h-[60px] text-xs" />
                      <Button size="sm" onClick={() => { update.mutate({ id: r.id, admin_notes: noteText }); setNoteFor(null); }}>
                        Salvar nota
                      </Button>
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
