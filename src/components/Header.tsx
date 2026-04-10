import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame, LogOut, User, Plus, Shield, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useMessages";

const Header = () => {
  const { user, signOut, isAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const { data: unreadCount } = useUnreadCount();

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
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-xl" onClick={() => navigate("/criar-anuncio")}>
                <Plus className="h-4 w-4 mr-1" />
                Anúncio
              </Button>
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
