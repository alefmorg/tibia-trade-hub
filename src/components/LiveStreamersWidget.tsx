import { usePartnerStreamers } from "@/hooks/usePartnerStreamers";
import { Twitch, Radio } from "lucide-react";

const LiveStreamersWidget = () => {
  const { data } = usePartnerStreamers(true);
  const live = (data || []).slice(0, 5);

  if (live.length === 0) return null;

  return (
    <div className="shrink-0 flex flex-col items-center gap-2 px-3 py-2 rounded-2xl border border-border/60 bg-card/60 backdrop-blur">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        <Radio className="h-3 w-3 text-destructive animate-pulse" />
        Parceiros ao vivo
      </div>
      <div className="flex items-center gap-2">
        {live.map((s) => (
          <a
            key={s.id}
            href={`https://twitch.tv/${s.twitch_login}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`${s.display_name} ao vivo`}
            className="group relative"
          >
            <div className="absolute inset-0 rounded-full bg-destructive/40 blur-md opacity-60 group-hover:opacity-100 animate-pulse pointer-events-none" />
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-destructive ring-2 ring-background transition-transform group-hover:scale-110">
              {s.avatar_url ? (
                <img src={s.avatar_url} alt={s.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-purple-600 flex items-center justify-center">
                  <Twitch className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full leading-none border border-background">
              LIVE
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default LiveStreamersWidget;
