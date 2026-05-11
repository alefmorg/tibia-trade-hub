import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { Crown, Check, Calendar, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAdminSetVip, useVipSettings } from "@/hooks/useVip";
import { callAdminActionRaw } from "@/hooks/useAdmin";
import { toast } from "sonner";

const db = supabase as any;

const useVipUsers = () =>
  useQuery({
    queryKey: ["admin-vip-users"],
    queryFn: async () => {
      const { data, error } = await db.rpc("admin_list_vip_users");
      if (error) throw error;
      return (data || []) as { user_id: string; username: string; vip_until: string }[];
    },
  });

const VipAdminPanel = () => {
  const { data: settings, refetch } = useVipSettings();
  const { data: vipUsers } = useVipUsers();
  const setVip = useAdminSetVip();

  const [price, setPrice] = useState("500");
  const [duration, setDuration] = useState("30");
  const [extraDays, setExtraDays] = useState("14");
  const [vipMax, setVipMax] = useState("30");
  const [normalMax, setNormalMax] = useState("10");
  const [freeHl, setFreeHl] = useState("2");

  const [targetUserId, setTargetUserId] = useState("");
  const [targetDate, setTargetDate] = useState("");

  useEffect(() => {
    if (settings) {
      setPrice(String(settings.vip_price_coins));
      setDuration(String(settings.vip_duration_days));
      setExtraDays(String(settings.vip_extra_ad_days));
      setVipMax(String(settings.vip_max_active_ads));
      setNormalMax(String(settings.normal_max_active_ads));
      setFreeHl(String(settings.vip_free_highlights));
    }
  }, [settings]);

  const save = async () => {
    try {
      await callAdminActionRaw("updateTradeSettings", {
        vip_price_coins: Number(price),
        vip_duration_days: Number(duration),
        vip_extra_ad_days: Number(extraDays),
        vip_max_active_ads: Number(vipMax),
        normal_max_active_ads: Number(normalMax),
        vip_free_highlights: Number(freeHl),
      });
      toast.success("Configurações VIP salvas!");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="bg-card/80 border border-warning/30 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60 bg-warning/5 flex items-center gap-2">
        <Crown className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground font-body">Sistema VIP</h3>
      </div>
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Preço (coins)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-secondary/80 mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Duração (dias)</Label>
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-secondary/80 mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">+ dias por anúncio</Label>
            <Input type="number" value={extraDays} onChange={(e) => setExtraDays(e.target.value)} className="bg-secondary/80 mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Limite anúncios — VIP</Label>
            <Input type="number" value={vipMax} onChange={(e) => setVipMax(e.target.value)} className="bg-secondary/80 mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Limite anúncios — Normal</Label>
            <Input type="number" value={normalMax} onChange={(e) => setNormalMax(e.target.value)} className="bg-secondary/80 mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Destaques bônus VIP</Label>
            <Input type="number" value={freeHl} onChange={(e) => setFreeHl(e.target.value)} className="bg-secondary/80 mt-1" />
          </div>
        </div>
        <Button onClick={save} className="bg-warning text-warning-foreground hover:bg-warning/90">
          <Check className="h-4 w-4 mr-1" /> Salvar configurações VIP
        </Button>

        <div className="border-t border-border/60 pt-4 space-y-3">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-warning" /> Conceder VIP manualmente
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="user_id" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} className="bg-secondary/80" />
            <Input type="datetime-local" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="bg-secondary/80" />
            <Button
              onClick={() => {
                if (!targetUserId || !targetDate) return;
                setVip.mutate({ userId: targetUserId, until: new Date(targetDate).toISOString() });
              }}
              disabled={setVip.isPending || !targetUserId || !targetDate}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              <Crown className="h-4 w-4 mr-1" /> Conceder
            </Button>
          </div>
        </div>

        <div className="border-t border-border/60 pt-4">
          <h4 className="text-xs font-semibold text-foreground mb-2">Usuários VIP ativos</h4>
          <div className="max-h-64 overflow-auto space-y-1">
            {(vipUsers || []).filter((u) => new Date(u.vip_until).getTime() > Date.now()).length === 0 && (
              <p className="text-[11px] text-muted-foreground">Nenhum usuário VIP ativo no momento.</p>
            )}
            {(vipUsers || [])
              .filter((u) => new Date(u.vip_until).getTime() > Date.now())
              .map((u) => (
                <div key={u.user_id} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md bg-secondary/40 border border-border/40">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{u.username}</p>
                    <p className="text-[10px] text-muted-foreground">até {new Date(u.vip_until).toLocaleString("pt-BR")}</p>
                  </div>
                  <button
                    onClick={() => setVip.mutate({ userId: u.user_id, until: null })}
                    title="Remover VIP"
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VipAdminPanel;
