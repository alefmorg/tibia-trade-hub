import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Coins, MessageCircle, Heart, ShieldAlert } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { callAdminActionRaw } from "@/hooks/useAdmin";

type ResetKey = "wallets" | "conversations" | "favorites";

const ACTIONS: Record<ResetKey, {
  title: string; desc: string; icon: any; color: string;
  action: string; warning: string;
}> = {
  wallets: {
    title: "Zerar todas as carteiras",
    desc: "Coloca o saldo de TODOS os usuários em 0, registra a transação no histórico e notifica cada um.",
    icon: Coins, color: "warning",
    action: "resetAllWallets",
    warning: "Todos os saldos de Rubini Coins serão perdidos. As transações ficam no histórico.",
  },
  conversations: {
    title: "Encerrar todas as conversas",
    desc: "Apaga TODAS as conversas e mensagens entre usuários. Tickets de suporte ficam intactos.",
    icon: MessageCircle, color: "primary",
    action: "resetAllConversations",
    warning: "Todo o histórico de mensagens entre usuários será apagado para sempre.",
  },
  favorites: {
    title: "Resetar curtidas e favoritos",
    desc: "Apaga TODOS os favoritos e zera o contador de curtidas de todos os anúncios.",
    icon: Heart, color: "destructive",
    action: "resetAllFavorites",
    warning: "Os usuários perderão todos os anúncios favoritados.",
  },
};

export default function ResetsPanel() {
  const qc = useQueryClient();
  const [confirmTexts, setConfirmTexts] = useState<Record<ResetKey, string>>({ wallets: "", conversations: "", favorites: "" });

  const resetMut = useMutation({
    mutationFn: (action: string) => callAdminActionRaw<any>(action),
    onSuccess: (data, action) => {
      qc.invalidateQueries();
      const summary = data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" • ") : "";
      toast.success(`Reset concluído. ${summary}`);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao executar reset"),
  });

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-destructive/10 via-card to-card border-2 border-destructive/30 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-destructive/15 flex items-center justify-center border border-destructive/40">
            <ShieldAlert className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground font-body">Zona de perigo — Resets manuais</h3>
            <p className="text-xs text-muted-foreground font-body">
              Ações destrutivas em massa. Cada uma exige digitar <strong className="text-destructive">RESETAR</strong> para confirmar.
              Tudo é registrado no log de auditoria.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(ACTIONS) as ResetKey[]).map((key) => {
          const cfg = ACTIONS[key];
          const Icon = cfg.icon;
          const text = confirmTexts[key];
          const canConfirm = text === "RESETAR";
          return (
            <div key={key} className="bg-card/80 border border-destructive/20 rounded-2xl p-5 space-y-3 hover:border-destructive/40 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${cfg.color}/10 border border-${cfg.color}/30 flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 text-${cfg.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-foreground font-body">{cfg.title}</h4>
                  <p className="text-[11px] text-muted-foreground font-body mt-0.5">{cfg.desc}</p>
                </div>
              </div>

              <AlertDialog onOpenChange={(o) => { if (!o) setConfirmTexts((p) => ({ ...p, [key]: "" })); }}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Executar reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" /> {cfg.title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <span className="block text-destructive font-semibold">{cfg.warning}</span>
                      <span className="block">Esta ação <strong>não pode ser desfeita</strong>. Para confirmar, digite a palavra <code className="bg-secondary px-1.5 py-0.5 rounded text-destructive font-mono">RESETAR</code> abaixo:</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Confirmação</Label>
                    <Input
                      value={text}
                      onChange={(e) => setConfirmTexts((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder="Digite RESETAR"
                      className="bg-secondary border-destructive/30"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={!canConfirm || resetMut.isPending}
                      onClick={() => resetMut.mutate(cfg.action)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
                    >
                      Confirmar reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        })}
      </div>
    </div>
  );
}
