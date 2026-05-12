import { useEffect, useMemo, useState } from "react";
import { usePartnerStreamers } from "@/hooks/usePartnerStreamers";
import { Twitch, Radio, ExternalLink } from "lucide-react";

const getLivePreviewUrl = (login: string) =>
  `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-320x180.jpg?t=${Date.now()}`;

const LiveStreamersWidget = () => {
  const { data } = usePartnerStreamers(true);
  const [liveLogins, setLiveLogins] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const streamers = data || [];
    if (streamers.length === 0) {
      setLiveLogins({});
      return;
    }

    let cancelled = false;

    const checkLiveStatus = async () => {
      const checks = streamers.map((s) =>
        new Promise<[string, boolean]>((resolve) => {
          const img = new Image();
          img.onload = () => resolve([s.twitch_login, true]);
          img.onerror = () => resolve([s.twitch_login, false]);
          img.src = getLivePreviewUrl(s.twitch_login);
        })
      );

      const result = await Promise.all(checks);
      if (cancelled) return;

      setLiveLogins(Object.fromEntries(result));
    };

    void checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [data]);

  const live = useMemo(() => {
    return (data || []).filter((s) => liveLogins[s.twitch_login]).slice(0, 5);
  }, [data, liveLogins]);

  if (live.length === 0) return null;

  return (
    <div className="shrink-0 flex flex-col gap-2 px-3 py-2 rounded-2xl border border-border/60 bg-card/60 backdrop-blur min-w-[260px]">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        <Radio className="h-3 w-3 text-destructive animate-pulse" />
        Parceiros ao vivo
      </div>
      <div className="space-y-2">
        {live.map((s) => (
          <a
            key={s.id}
            href={`https://twitch.tv/${s.twitch_login}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`${s.display_name} ao vivo`}
            className="group block rounded-xl overflow-hidden border border-destructive/50 bg-black/30 hover:border-destructive transition-colors"
          >
            <div className="relative aspect-video">
              <img
                src={getLivePreviewUrl(s.twitch_login)}
                alt={`Preview da live de ${s.display_name}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <span className="absolute top-2 left-2 text-[10px] font-bold uppercase bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full leading-none">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-border/80 shrink-0">
                {s.avatar_url ? (
                  <img src={s.avatar_url} alt={s.display_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-purple-600 flex items-center justify-center">
                    <Twitch className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-foreground truncate">{s.display_name}</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default LiveStreamersWidget;
