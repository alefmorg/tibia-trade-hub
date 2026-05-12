import { useEffect, useMemo, useState } from "react";
import { usePartnerStreamers } from "@/hooks/usePartnerStreamers";
import { Twitch, Radio, ExternalLink } from "lucide-react";

const getLivePreviewUrl = (login: string) =>
  `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-320x180.jpg`;

const isStreamerLive = async (login: string): Promise<boolean> => {
  try {
    const response = await fetch(`https://decapi.me/twitch/uptime/${login}`);
    const text = (await response.text()).toLowerCase();
    return !text.includes("is offline") && !text.includes("channel not found");
  } catch {
    return false;
  }
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
      const checks = await Promise.all(streamers.map(async (s) => [s.twitch_login, await isStreamerLive(s.twitch_login)] as const));
      if (cancelled) return;
      setLiveLogins(Object.fromEntries(checks));
    };

    void checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [data]);

  const live = useMemo(() => (data || []).filter((s) => liveLogins[s.twitch_login]).slice(0, 5), [data, liveLogins]);

  if (live.length === 0) return null;

  return (
    <div className="shrink-0 flex flex-col gap-2 px-2 py-2 rounded-2xl border border-border/60 bg-card/60 backdrop-blur w-full max-w-[280px] sm:max-w-[320px]">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        <Radio className="h-3 w-3 text-destructive animate-pulse" />
        Parceiros ao vivo
      </div>

      <div className="grid grid-cols-1 gap-2">
        {live.map((s) => (
          <a
            key={s.id}
            href={`https://twitch.tv/${s.twitch_login}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg overflow-hidden border border-destructive/50 bg-black/30 hover:border-destructive transition-colors"
          >
            <div className="flex items-center gap-2 p-1.5">
              <img
                src={getLivePreviewUrl(s.twitch_login)}
                alt={`Preview da live de ${s.display_name}`}
                className="w-20 h-12 sm:w-24 sm:h-14 object-cover rounded"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold uppercase bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full leading-none">LIVE</span>
                </div>
                <p className="text-xs font-semibold text-foreground truncate mt-1">{s.display_name}</p>
                <div className="text-[11px] text-muted-foreground truncate inline-flex items-center gap-1">
                  <Twitch className="h-3 w-3" /> @{s.twitch_login}
                </div>
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
