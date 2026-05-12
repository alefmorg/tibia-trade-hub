import { useEffect, useMemo, useState } from "react";
import { usePartnerStreamers } from "@/hooks/usePartnerStreamers";
import { Twitch, Radio, ExternalLink } from "lucide-react";

const getLivePreviewUrl = (login: string, withCacheBuster = false) => {
  const base = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-320x180.jpg`;
  return withCacheBuster ? `${base}?t=${Date.now()}` : base;
};

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
      const checks = streamers.map(
        (s) =>
          new Promise<[string, boolean]>((resolve) => {
            const img = new Image();
            img.onload = () => resolve([s.twitch_login, true]);
            img.onerror = () => resolve([s.twitch_login, false]);
            img.src = getLivePreviewUrl(s.twitch_login, true);
          })
      );

      const result = await Promise.all(checks);
      if (!cancelled) {
        setLiveLogins(Object.fromEntries(result));
      }
    };

    void checkLiveStatus();
    const interval = setInterval(() => void checkLiveStatus(), 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [data]);

  const liveStreamers = useMemo(
    () => (data || []).filter((s) => liveLogins[s.twitch_login]).slice(0, 5),
    [data, liveLogins]
  );

  if (liveStreamers.length === 0) return null;

  return (
    <div className="shrink-0 flex flex-col gap-2 px-2 py-2 rounded-2xl border border-border/60 bg-card/60 backdrop-blur w-full max-w-[300px]">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        <Radio className="h-3 w-3 text-destructive animate-pulse" />
        Parceiros ao vivo
      </div>

      <div className="space-y-2">
        {liveStreamers.map((s) => (
          <a
            key={s.id}
            href={`https://twitch.tv/${s.twitch_login}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`${s.display_name} ao vivo`}
            className="group block rounded-lg overflow-hidden border border-destructive/50 bg-black/30 hover:border-destructive transition-colors"
          >
            <div className="flex items-center gap-2 p-1.5">
              <img
                src={getLivePreviewUrl(s.twitch_login)}
                alt={`Preview da live de ${s.display_name}`}
                className="w-20 h-12 object-cover rounded"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <span className="inline-block text-[10px] font-bold uppercase bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full leading-none">
                  LIVE
                </span>
                <p className="text-xs font-semibold text-foreground truncate mt-1">{s.display_name}</p>
                <p className="text-[11px] text-muted-foreground truncate inline-flex items-center gap-1">
                  <Twitch className="h-3 w-3" /> @{s.twitch_login}
                </p>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default LiveStreamersWidget;