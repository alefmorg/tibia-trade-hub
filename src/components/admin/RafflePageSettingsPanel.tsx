import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Construction, History, Save, Ticket } from "lucide-react";
import { useRafflePageSettings, useUpdateRafflePageSettings, useRaffleHistory } from "@/hooks/useRafflePageSettings";
import { useRaffles } from "@/hooks/useRaffles";

export default function RafflePageSettingsPanel() {
  const { data: settings } = useRafflePageSettings();
  const update = useUpdateRafflePageSettings();
  const { data: raffles } = useRaffles();

  const [form, setForm] = useState<any>(null);
  const current = form || settings;

  if (!settings) return null;
  const value = current || settings;

  const set = (patch: any) => setForm({ ...value, ...patch });
  const save = () => update.mutate({ ...value, id: settings.id }, { onSuccess: () => setForm(null) });

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-card/80 border-border/60">
        <div className="flex items-center gap-2 mb-3">
          <Construction className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold font-body">Configuração da página de rifas</h3>
          {value.coming_soon && <Badge className="ml-2 bg-warning text-warning-foreground">Modo Em Breve ATIVO</Badge>}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40">
            <div>
              <Label className="text-sm">Modo "Em breve / aguarde"</Label>
              <p className="text-[11px] text-muted-foreground">Quando ativo, esconde todas as rifas e mostra a mensagem abaixo.</p>
            </div>
            <Switch checked={value.coming_soon} onCheckedChange={(v) => set({ coming_soon: v })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Título "em breve"</Label>
              <Input value={value.coming_soon_title} onChange={(e) => set({ coming_soon_title: e.target.value })} className="bg-secondary/80 border-border" />
            </div>
            <div>
              <Label className="text-xs">URL da imagem (opcional)</Label>
              <Input value={value.coming_soon_image_url || ""} onChange={(e) => set({ coming_soon_image_url: e.target.value })} className="bg-secondary/80 border-border" placeholder="https://..." />
            </div>
          </div>
          <div>
            <Label className="text-xs">Mensagem "em breve"</Label>
            <Textarea value={value.coming_soon_message} onChange={(e) => set({ coming_soon_message: e.target.value })} className="bg-secondary/80 border-border min-h-[70px]" />
          </div>

          <div className="border-t border-border/40 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Título da página (modo normal)</Label>
              <Input value={value.page_title} onChange={(e) => set({ page_title: e.target.value })} className="bg-secondary/80 border-border" />
            </div>
            <div>
              <Label className="text-xs">Subtítulo</Label>
              <Input value={value.page_subtitle} onChange={(e) => set({ page_subtitle: e.target.value })} className="bg-secondary/80 border-border" />
            </div>
            <div>
              <Label className="text-xs">Texto do botão CTA</Label>
              <Input value={value.cta_text} onChange={(e) => set({ cta_text: e.target.value })} className="bg-secondary/80 border-border" />
            </div>
            <div>
              <Label className="text-xs">Cor de destaque (token)</Label>
              <Input value={value.accent_color} onChange={(e) => set({ accent_color: e.target.value })} className="bg-secondary/80 border-border" placeholder="warning, primary, destructive..." />
            </div>
          </div>

          <Button onClick={save} disabled={!form || update.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-4 w-4 mr-1" /> Salvar configurações
          </Button>
        </div>
      </Card>

      {/* HISTÓRICO POR RIFA */}
      <Card className="p-5 bg-card/80 border-border/60">
        <div className="flex items-center gap-2 mb-3">
          <History className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold font-body">Histórico de operações por rifa</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {(raffles || []).map((r) => <HistoryButton key={r.id} raffle={r} />)}
          {(!raffles || raffles.length === 0) && (
            <p className="text-xs text-muted-foreground">Nenhuma rifa criada.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function HistoryButton({ raffle }: { raffle: any }) {
  const [open, setOpen] = useState(false);
  const { data: events, isLoading } = useRaffleHistory(open ? raffle.id : undefined);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="justify-start h-auto py-2 text-left">
          <Ticket className="h-3.5 w-3.5 mr-2 text-warning shrink-0" />
          <span className="truncate">{raffle.title}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Histórico — {raffle.title}</DialogTitle></DialogHeader>
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <div className="space-y-1.5">
            {(events || []).map((e: any) => (
              <div key={e.id} className="text-xs p-2 rounded-lg bg-secondary/40 border border-border/40">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px]">{e.action}</Badge>
                  <span className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</span>
                </div>
                {e.actor_name && <div className="text-[11px] text-muted-foreground mt-1">por {e.actor_name}</div>}
                {e.details && Object.keys(e.details).length > 0 && (
                  <pre className="text-[10px] text-muted-foreground mt-1 overflow-x-auto">{JSON.stringify(e.details, null, 0)}</pre>
                )}
              </div>
            ))}
            {(!events || events.length === 0) && <p className="text-xs text-muted-foreground">Sem eventos ainda.</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
