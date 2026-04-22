import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight, Sword, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Preencha email e senha");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate("/");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      {/* Pixel grid background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute top-1/4 -left-32 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-warning/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo pixel */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div
              className="w-12 h-12 flex items-center justify-center bg-primary/10"
              style={{
                borderRadius: 2,
                boxShadow: "0 0 0 2px hsl(var(--primary) / 0.4), inset 0 0 0 2px hsl(var(--background))",
              }}
            >
              <Sword className="h-5 w-5 text-primary" strokeWidth={2.5} />
            </div>
            <span className="font-pixel text-[11px] text-foreground leading-none">
              Rubin <span className="text-primary">TRADE</span>
            </span>
          </Link>
        </div>

        {/* Card pixel */}
        <div
          className="bg-card/95 backdrop-blur-xl p-7"
          style={{
            borderRadius: 4,
            boxShadow:
              "0 0 0 2px hsl(var(--border)), 0 0 0 4px hsl(var(--background)), 0 0 0 5px hsl(var(--primary) / 0.3), 0 20px 60px -10px hsl(0 0% 0% / 0.5)",
          }}
        >
          <div className="text-center mb-6">
            <h1 className="font-pixel text-sm text-foreground mb-2">ENTRAR</h1>
            <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <p className="text-muted-foreground text-xs font-body mt-3">Bem-vindo de volta, aventureiro</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] text-muted-foreground font-pixel uppercase tracking-wider">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="pl-10 bg-secondary/60 border-border h-11 focus:border-primary transition-all"
                  style={{ borderRadius: 2 }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[10px] text-muted-foreground font-pixel uppercase tracking-wider">
                  Senha
                </Label>
                <Link to="/esqueci-senha" className="text-[10px] text-primary hover:text-primary/80 transition-colors font-body">
                  Esqueci a senha
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10 bg-secondary/60 border-border h-11 focus:border-primary transition-all"
                  style={{ borderRadius: 2 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-pixel text-[11px] uppercase tracking-wider transition-all duration-200 disabled:opacity-60"
              style={{
                borderRadius: 2,
                boxShadow: "0 0 0 2px hsl(var(--primary) / 0.4), 0 4px 0 hsl(var(--primary) / 0.5)",
              }}
            >
              {loading ? (
                "Entrando..."
              ) : (
                <span className="flex items-center gap-2">
                  Entrar
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/60 text-center">
            <p className="text-xs text-muted-foreground font-body">
              Não tem conta?{" "}
              <Link to="/registro" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
