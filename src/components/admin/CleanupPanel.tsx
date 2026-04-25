import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, MessageCircle, Bell, Coins, Wallet, Package, LifeBuoy, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { useAdminData } from "@/hooks/useAdmin";

const TARGETS = [
  { key: "messages", label: "Mensagens", icon: MessageCircle, desc: "Mensagens individuais antigas (mantém conversa)", color: "text-primary", bg: "from-primary/5 to-primary/10", border: "border-primary/20" },
  { key: "conversations", label: "Conversas", icon: ArrowRightLeft, desc: "Conversas inativas (sem update no período)", color: "text-primary", bg: "from-primary/5 to-primary/10", border: "border-primary/20" },
  { key: "offers", label: "Ofertas", icon: Coins, desc: "Ofertas antigas (qualquer status)", color: "text-warning", bg: "from-warning/5 to-warning/10", border: "border-warning/20" },
  { key: "expired_ads", label: "Anúncios expirados", icon: Package, desc: "Anúncios cuja data de expiração passou", color: "text-destructive", bg: "from-destructive/5 to-destructive/10", border: "border-destructive/20" },
  { key: "notifications", label: "Notificações", icon: Bell, desc: "Notificações antigas de todos os usuários", color: "text-foreground", bg: "from-secondary/40 to-secondary/80", border: "border-border/60" },
  { key: "wallet_transactions", label: "Transações", icon: Wallet, desc: "Histórico de transações da carteira", color: "text-warning", bg: "from-warning/5 to-warning/10", border: "border-warning/20" },
  { key: "deposits_old", label: "Depósitos finalizados", icon: Wallet, desc: "Depósitos aprovados/recusados antigos", color: "text-primary", bg: "from-primary/5 to-primary/10", border: "border-primary/20" },
  { key: "support_closed", label: "Tickets fechados", icon: LifeBuoy, desc: "Tickets de suporte já encerrados", color: "text-foreground", bg: "from-secondary/40 to-secondary/80", border: "border-border/60" },
];

export default function CleanupPanel({ isAdmin }: { isAdmin: boolean }) {
  const { bulkDelete } = useAdminData(isAdmin);
  const [days, setDays] = useState<Record<string, string>>({});

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-destructive/5 via-card to-card border border-destructive/20 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/30">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground font-body">Limpeza de Históricos</h3>
            <p className="text-xs text-muted-foreground font-body">
              Apague registros antigos em massa. Use com cuidado — a operação é irreversível.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TARGETS.map((t) => {
          const dayValue = days[t.key] ?? "30";
          const Icon = t.icon;
          return (
            <div key={t.key} className={`bg-gradient-to-br ${t.bg} border ${t.border} rounded-2xl p-4 space-y-3`}>
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 ${t.color} mt-0.5`} />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-foreground font-body">{t.label}</h4>
                  <p className="text-[11px] text-muted-foreground font-body">{t.desc}</p>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] text-muted-foreground font-body">Apagar com mais de (dias)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={dayValue}
                    onChange={(e) => setDays((p) => ({ ...p, [t.key]: e.target.value }))}
                    className="bg-secondary/80 border-border h-9"
                  />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="h-9">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Limpar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar limpeza de {t.label}</AlertDialogTitle>
                      <AlertDialogDescription>
                        Vai apagar {t.label.toLowerCase()} com mais de <strong>{dayValue || 0}</strong> dias.
                        Use <strong>0</strong> para apagar TUDO. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          bulkDelete.mutate({
                            target: t.key,
                            olderThanDays: Number(dayValue) || 0,
                          })
                        }
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sim, apagar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
