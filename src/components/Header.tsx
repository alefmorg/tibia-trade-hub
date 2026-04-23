import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame, LogOut, User, Plus, Shield, MessageCircle, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useMessages";
import WalletActionsMenu from "@/components/WalletActionsMenu";
import { useNotifications, useUnreadNotificationCount, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { useState, useRef, useEffect } from "react";

const Header = () => {
  const { user, signOut, isAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const { data: unreadCount } = useUnreadCount();
  
  const { data: unreadNotifs } = useUnreadNotificationCount();
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Flame className="h-4 w-4 text-primary" />
          </div>
          <span className="font-pixel text-sm text-foreground">
            Rubin <span className="text-primary">TRADE</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && (
                <Button variant="ghost" size="sm" className="text-warning hover:bg-warning/10 rounded-xl" onClick={() => navigate("/admin")}>
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
                </Button>
              )}
              <WalletActionsMenu />
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-xl" onClick={() => navigate("/criar-anuncio")}>
                <Plus className="h-4 w-4 mr-1" />
                Anúncio
              </Button>

              {/* Notifications bell */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifs(!showNotifs)} className="relative text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-secondary">
                  <Bell className="h-5 w-5" />
                  {(unreadNotifs ?? 0) > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">Notificações</span>
                      {(unreadNotifs ?? 0) > 0 && (
                        <button onClick={() => markAllRead.mutate()} className="text-[10px] text-primary hover:underline">
                          Marcar todas como lidas
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
                                <p className="text-[9px] text-muted-foreground/60 mt-1">{new Date(n.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                              {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-xs text-muted-foreground">Nenhuma notificação</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => navigate("/mensagens")} className="relative text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-secondary">
                <MessageCircle className="h-5 w-5" />
                {(unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button onClick={() => navigate("/perfil")} className="flex items-center gap-2 border border-border rounded-xl px-3 py-1.5 hover:border-primary/30 hover:bg-secondary/50 transition-all">
                <User className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-foreground">{profile?.username || user.email?.split("@")[0]}</span>
              </button>
              <button onClick={signOut} className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-secondary transition-all">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-xl" onClick={() => navigate("/login")}>
              <User className="h-4 w-4 mr-1" />
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
