import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight, Sword, Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "sonner";

const Registro = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const usernameOk = /^[a-zA-Z0-9_]{3,20}$/.test(username);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const allValid = usernameOk && emailOk && rules.length && rules.upper && rules.number;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, username.trim());
      // Auto-confirm está ativo, então tenta entrar direto.
      try {
        await signIn(email.trim(), password);
        navigate("/");
      } catch {
        navigate("/login");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const Rule = ({ ok, label }: { ok: boolean; label: string }) => (
    <li className="flex items-center gap-1.5 text-[10px] font-body">
      {ok ? <Check className="h-3 w-3 text-primary" /> : <X className="h-3 w-3 text-muted-foreground/60" />}
      <span className={ok ? "text-primary" : "text-muted-foreground/70"}>{label}</span>
    </li>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background py-8">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute top-1/3 -right-32 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -left-32 w-72 h-72 rounded-full bg-warning/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
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

        <div
          className="bg-card/95 backdrop-blur-xl p-7"
          style={{
            borderRadius: 4,
            boxShadow:
              "0 0 0 2px hsl(var(--border)), 0 0 0 4px hsl(var(--background)), 0 0 0 5px hsl(var(--primary) / 0.3), 0 20px 60px -10px hsl(0 0% 0% / 0.5)",
          }}
        >
          <div className="text-center mb-6">
            <h1 className="font-pixel text-sm text-foreground mb-2">CRIAR CONTA</h1>
            <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <p className="text-muted-foreground text-xs font-body mt-3">Junte-se à comunidade RubinOT</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[10px] text-muted-foreground font-pixel uppercase tracking-wider">
                Nick
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="seu_nick"
                  required
                  maxLength={20}
                  className="pl-10 bg-secondary/60 border-border h-11 focus:border-primary"
                  style={{ borderRadius: 2 }}
                />
              </div>
              {username && !usernameOk && (
                <p className="text-[10px] text-destructive font-body">3-20 caracteres, letras/números/_</p>
              )}
            </div>

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
                  className="pl-10 bg-secondary/60 border-border h-11 focus:border-primary"
                  style={{ borderRadius: 2 }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] text-muted-foreground font-pixel uppercase tracking-wider">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10 bg-secondary/60 border-border h-11 focus:border-primary"
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
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 px-1">
                <Rule ok={rules.length} label="8+ caracteres" />
                <Rule ok={rules.upper} label="Maiúscula" />
                <Rule ok={rules.number} label="Número" />
                <Rule ok={rules.special} label="Especial (op.)" />
              </ul>
            </div>

            <Button
              type="submit"
              disabled={loading || !allValid}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-pixel text-[11px] uppercase tracking-wider transition-all duration-200 disabled:opacity-50"
              style={{
                borderRadius: 2,
                boxShadow: "0 0 0 2px hsl(var(--primary) / 0.4), 0 4px 0 hsl(var(--primary) / 0.5)",
              }}
            >
              {loading ? (
                "Criando..."
              ) : (
                <span className="flex items-center gap-2">
                  Criar Conta
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/60 text-center">
            <p className="text-xs text-muted-foreground font-body">
              Já tem conta?{" "}
              <Link to="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;
