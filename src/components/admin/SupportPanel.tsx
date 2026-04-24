import { useState } from "react";
import { useAllTickets, useTicketMessages, useReplyTicket, useUpdateTicketStatus, type SupportTicket } from "@/hooks/useSupport";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, LifeBuoy, MessageSquare } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  open: { label: "Aberto", cls: "bg-primary/15 text-primary border-primary/30" },
  in_progress: { label: "Em atendimento", cls: "bg-warning/15 text-warning border-warning/30" },
  resolved: { label: "Resolvido", cls: "bg-success/15 text-success border-success/30" },
  closed: { label: "Encerrado", cls: "bg-muted text-muted-foreground border-border" },
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Baixa", normal: "Normal", high: "Alta", urgent: "Urgente",
};

const SupportPanel = ({ getProfileName }: { getProfileName: (id: string) => string }) => {
  const { data: tickets } = useAllTickets();
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [reply, setReply] = useState("");
  const { data: messages } = useTicketMessages(selected?.id);
  const sendReply = useReplyTicket(true);
  const updateStatus = useUpdateTicketStatus();

  const filteredTickets = (tickets || []).filter((t) => filter === "all" || t.status === filter);

  if (selected) {
    const st = STATUS_LABEL[selected.status] || STATUS_LABEL.open;
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar para lista
        </button>

        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-base font-bold text-foreground">{selected.subject}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {getProfileName(selected.user_id)} · {selected.category} · prioridade: {PRIORITY_LABEL[selected.priority] || selected.priority}
              </p>
            </div>
            <Badge variant="outline" className={st.cls}>{st.label}</Badge>
          </div>
          <div className="flex gap-2">
            <Select value={selected.status} onValueChange={(v) => updateStatus.mutate({ ticketId: selected.id, status: v })}>
              <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="in_progress">Em atendimento</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="closed">Encerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto p-1">
          {(messages || []).map((m) => (
            <div key={m.id} className={`flex ${m.is_admin ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                m.is_admin ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              }`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                <p className={`text-[10px] mt-1 ${m.is_admin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {m.is_admin ? "Suporte" : "Usuário"} · {new Date(m.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Resposta da equipe..." rows={2} className="resize-none" />
          <Button onClick={async () => { if (!reply.trim()) return; await sendReply.mutateAsync({ ticketId: selected.id, content: reply }); setReply(""); }} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Abertos</SelectItem>
            <SelectItem value="in_progress">Em atendimento</SelectItem>
            <SelectItem value="resolved">Resolvidos</SelectItem>
            <SelectItem value="closed">Encerrados</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filteredTickets.length} ticket(s)</span>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum ticket encontrado.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredTickets.map((t) => {
            const st = STATUS_LABEL[t.status] || STATUS_LABEL.open;
            return (
              <button key={t.id} onClick={() => setSelected(t)} className="w-full text-left bg-card border border-border/60 rounded-lg p-3 hover:border-primary/40 transition-colors flex items-center gap-3">
                <LifeBuoy className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {getProfileName(t.user_id)} · {new Date(t.updated_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <Badge variant="outline" className="text-[9px] uppercase">{PRIORITY_LABEL[t.priority] || t.priority}</Badge>
                <Badge variant="outline" className={st.cls}>{st.label}</Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupportPanel;
