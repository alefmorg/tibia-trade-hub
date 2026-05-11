import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame, LogOut, User, Plus, Shield, MessageCircle, Bell, LifeBuoy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useMessages";
import WalletActionsMenu from "@/components/WalletActionsMenu";
import { useNotifications, useUnreadNotificationCount, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { useState, useRef, useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";
import { LOCALE_META, AppLocale } from "@/lib/i18n";

const Header = () => {
  const { user, signOut, isAdmin, profile } = useAuth();
  const { locale, setLocale, t, formatDate } = useLocale();
  const navigate = useNavigate();
  const { data: unreadCount } = useUnreadCount();
  const { data: unreadNotifs } = useUnreadNotificationCount();
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showLocales, setShowLocales] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const localeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (localeRef.current && !localeRef.current.contains(e.target as Node)) setShowLocales(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 group hover-scale shrink-0 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
            <Flame className="h-4 w-4 text-primary" />
          </div>
          <span className="font-pixel text-xs sm:text-sm text-foreground truncate">
            Rubin <span className="text-primary">TRADE</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <div className="relative" ref={localeRef}>
            <button
              type="button"
              onClick={() => setShowLocales((v) => !v)}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card/70 px-2 py-1.5 text-sm hover:bg-secondary transition-colors"
              title={t("common.language")}
              aria-label={t("common.language")}
            >
              <span>{LOCALE_META[locale].flag}</span>
            </button>

            {showLocales && (
              <div className="absolute right-0 top-full mt-2 z-50 rounded-xl border border-border bg-card shadow-xl p-1 flex flex-col">
                {(Object.keys(LOCALE_META) as AppLocale[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setLocale(code);
                      setShowLocales(false);
                    }}
                    className={`inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-sm transition-colors ${locale === code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                    aria-label={LOCALE_META[code].label}
                  >
                    <span>{LOCALE_META[code].flag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <>
              {isAdmin && (
                <Button variant="ghost" size="sm" className="text-warning hover:bg-warning/10 rounded-xl px-2 sm:px-3" onClick={() => navigate("/admin")} title={t("common.admin")}>
                  <Shield className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">{t("common.admin")}</span>
                </Button>
              )}
              <div className="hidden sm:block">
                <WalletActionsMenu />
              </div>
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-xl px-2 sm:px-3" onClick={() => navigate("/criar-anuncio")} title={t("common.createAd")}>
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("header.createAd")}</span>
              </Button>

              <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifs(!showNotifs)} className="relative text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-secondary" title={t("common.notifications")}>
                  <Bell className="h-5 w-5" />
                  {(unreadNotifs ?? 0) > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{t("common.notifications")}</span>
                      {(unreadNotifs ?? 0) > 0 && (
                        <button onClick={() => markAllRead.mutate()} className="text-[10px] text-primary hover:underline">
                          {t("header.markAllRead")}
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications && notifications.length > 0 ? (
                        notifications.slice(0, 20).map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-border/40 hover:bg-secondary/30 transition-colors cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}
                            onClick={() => { if (!n.read) markRead.mutate(n.id); }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground">{n.title}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                <p className="text-[9px] text-muted-foreground/60 mt-1">{formatDate(n.created_at, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                              {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-xs text-muted-foreground">{t("header.noNotifications")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => navigate("/suporte")} title={t("common.support")} className="hidden sm:inline-flex text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-secondary">
                <LifeBuoy className="h-5 w-5" />
              </button>
              <button onClick={() => navigate("/mensagens")} className="relative text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-secondary" title={t("common.messages")}>
                <MessageCircle className="h-5 w-5" />
                {(unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button onClick={() => navigate("/perfil")} className="flex items-center gap-2 border border-border rounded-xl px-2 sm:px-3 py-1.5 hover:border-primary/30 hover:bg-secondary/50 transition-all max-w-[140px]" title={t("common.profile")}>
                <User className="h-4 w-4 text-primary shrink-0" />
                <span className="hidden sm:inline text-xs font-medium text-foreground truncate">{profile?.username || user.email?.split("@")[0]}</span>
              </button>
              <button onClick={signOut} className="hidden sm:inline-flex text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-secondary transition-all" title={t("common.logout")}>
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-xl" onClick={() => navigate("/login")}>
              <User className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t("common.login")}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
