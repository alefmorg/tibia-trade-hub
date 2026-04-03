import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame, LogOut, User, Plus, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const { user, signOut, isAdmin, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <span className="font-pixel text-sm text-foreground">
            Rubin <span className="text-accent">TRADE</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <Button variant="outline" size="sm" className="border-warning/30 text-warning hover:bg-warning/10" onClick={() => navigate("/admin")}>
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
                </Button>
              )}
              <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => navigate("/criar-anuncio")}>
                <Plus className="h-4 w-4 mr-1" />
                Criar Anúncio
              </Button>
              <div className="flex items-center gap-2 border border-border rounded-md px-3 py-1.5">
                <User className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-foreground">{profile?.username || user.email?.split("@")[0]}</span>
              </div>
              <button onClick={signOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium" onClick={() => navigate("/login")}>
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
