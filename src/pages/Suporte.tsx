import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useMyTickets, useCreateTicket, useTicketMessages, useReplyTicket, useUpdateTicketStatus, type SupportTicket } from "@/hooks/useSupport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LifeBuoy, Plus, Send, ArrowLeft, MessageSquare, CheckCircle2, Clock } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  open: { label: "Aberto", cls: "bg-primary/15 text-primary border-primary/30" },
  in_progress: { label: "Em atendimento", cls: "bg-warning/15 text-warning border-warning/30" },
  resolved: { label: "Resolvido", cls: "bg-success/15 text-success border-success/30" },
  closed: { label: "Encerrado", cls: "bg-muted text-muted-foreground border-border" },
};

const Suporte = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: tickets } = useMyTickets();
  const createTicket = useCreateTicket();
  const closeTicket = useUpdateTicketStatus();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "general", priority: "normal", message: "" });
  const [reply, setReply] = useState("");
  const { data: messages } = useTicketMessages(selectedTicket?.id);
  const sendReply = useReplyTicket(false);

  useEffect(() => { if (!loading && !user) navigate("/login"); }, [loading, user, navigate]);

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    const ticket = await createTicket.mutateAsync(form);
    setShowForm(false);
    setForm({ subject: "", category: "general", priority: "normal", message: "" });
    setSelectedTicket(ticket);
  };

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    await sendReply.mutateAsync({ ticketId: selectedTicket.id, content: reply });
    setReply("");
  };

  if (!user) return null;

  // Detalhe de ticket
  if (selectedTicket) {
    const st = STATUS_LABEL[selectedTicket.status] || STATUS_LABEL.open;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-3xl py-6">
          <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>

          <div className="bg-card border border-border/60 rounded-xl p-5 mb-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h1 className="text-lg font-bold text-foreground">{selectedTicket.subject}</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Aberto em {new Date(selectedTicket.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <Badge variant="outline" className={st.cls}>{st.label}</Badge>
            </div>
            {selectedTicket.status !== "closed" && (
              <Button size="sm" variant="outline" onClick={() => closeTicket.mutate({ ticketId: selectedTicket.id, status: "closed" })}>
                Encerrar ticket
              </Button>
            )}
          </div>

          <div className="space-y-3 mb-4">
            {(messages || []).map((m) => (
              <div key={m.id} className={`flex ${m.is_admin ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.is_admin ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"
                }`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={`text-[10px] mt-1 ${m.is_admin ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                    {m.is_admin ? "Suporte" : "Você"} · {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedTicket.status !== "closed" && (
            <div className="bg-card border border-border/60 rounded-xl p-3 flex gap-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Escreva uma resposta..."
                rows={2}
                className="resize-none"
              />
              <Button onClick={handleReply} disabled={!reply.trim() || sendReply.isPending} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Lista
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <LifeBuoy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Suporte</h1>
              <p className="text-xs text-muted-foreground">Abra um ticket e respondemos por aqui</p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Novo ticket</Button>
          )}
        </div>

        {showForm && (
          <div className="bg-card border border-border/60 rounded-xl p-5 mb-5 space-y-3">
            <div>
              <Label>Assunto</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ex: Problema com depósito" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="deposit">Depósito / Coins</SelectItem>
                    <SelectItem value="ad">Anúncio</SelectItem>
                    <SelectItem value="account">Conta</SelectItem>
                    <SelectItem value="report">Denúncia</SelectItem>
                    <SelectItem value="bug">Bug / Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descreva o problema</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} placeholder="Detalhes, prints, ids relacionados..." />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={createTicket.isPending || !form.subject.trim() || !form.message.trim()}>
                Abrir ticket
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {(tickets || []).length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Você ainda não abriu nenhum ticket.</p>
            </div>
          ) : (
            (tickets || []).map((t) => {
              const st = STATUS_LABEL[t.status] || STATUS_LABEL.open;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="w-full text-left bg-card border border-border/60 rounded-xl p-4 hover:border-primary/40 transition-colors flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    {t.status === "resolved" ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                    <p className="text-[11px] text-muted-foreground">Atualizado em {new Date(t.updated_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <Badge variant="outline" className={st.cls}>{st.label}</Badge>
                </button>
              );
            })
          )}
        </div>

        <p className="text-[11px] text-muted-foreground/70 text-center mt-6">
          Veja também nossa <Link to="/privacidade" className="underline hover:text-foreground">Política de Privacidade</Link>.
        </p>
      </main>
    </div>
  );
};

export default Suporte;
