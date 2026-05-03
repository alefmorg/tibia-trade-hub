import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Search } from "lucide-react";
import { callAdminActionRaw } from "@/hooks/useAdmin";

interface Props { getProfileName: (id: string) => string; }

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  reset_all_wallets: { label: "Reset carteiras", color: "destructive" },
  reset_all_conversations: { label: "Reset conversas", color: "destructive" },
  reset_all_favorites: { label: "Reset favoritos", color: "destructive" },
  set_user_balance: { label: "Definir saldo", color: "warning" },
  grant_raffle_numbers: { label: "Doar nº rifa", color: "primary" },
  refund_raffle_user: { label: "Reembolso rifa", color: "warning" },
};

export default function AuditLogPanel({ getProfileName }: Props) {
  const [actionFilter, setActionFilter] = useState<string>("__all");
  const [search, setSearch] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-log", actionFilter],
    queryFn: () => callAdminActionRaw<any[]>("getAuditLog", {
      limit: 500,
      action: actionFilter === "__all" ? undefined : actionFilter,
    }),
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    if (!search) return logs || [];
    const s = search.toLowerCase();
    return (logs || []).filter((l) =>
      JSON.stringify(l).toLowerCase().includes(s) ||
      getProfileName(l.admin_id).toLowerCase().includes(s)
    );
  }, [logs, search, getProfileName]);

  return (
    <div className="space-y-4">
      <div className="bg-card/80 border border-border/60 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/25">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground font-body">Logs de auditoria</h3>
            <p className="text-[11px] text-muted-foreground">Registro de todas as ações sensíveis dos administradores</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar por admin, alvo ou conteúdo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/80 border-border" />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="bg-secondary/80 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas as ações</SelectItem>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden">
        <ScrollArea className="max-h-[70vh]">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 bg-secondary/30 sticky top-0">
                <TableHead className="text-xs">Quando</TableHead>
                <TableHead className="text-xs">Admin</TableHead>
                <TableHead className="text-xs">Ação</TableHead>
                <TableHead className="text-xs">Alvo</TableHead>
                <TableHead className="text-xs">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">Carregando...</TableCell></TableRow>}
              {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">Nenhum registro</TableCell></TableRow>}
              {filtered.map((log) => {
                const meta = ACTION_LABELS[log.action] || { label: log.action, color: "secondary" };
                return (
                  <TableRow key={log.id} className="border-border/40">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-body">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-sm font-body">{getProfileName(log.admin_id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] border-${meta.color}/30 text-${meta.color} bg-${meta.color}/5`}>
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-body">
                      {log.target_type ? `${log.target_type}${log.target_id ? `: ${log.target_id.slice(0, 8)}` : ""}` : "—"}
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground font-mono max-w-md">
                      <pre className="whitespace-pre-wrap break-all">{JSON.stringify(log.details, null, 0)}</pre>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
