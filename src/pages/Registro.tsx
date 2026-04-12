import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Mail, Lock, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const Registro = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, username);
      toast.info("Verifique seu email para confirmar a conta!");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -right-32 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/3 -left-32 w-64 h-64 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
              <Flame className="h-6 w-6 text-primary" />
            </div>
            <span className="font-pixel text-base text-foreground">
              Rubin <span className="text-primary">TRADE</span>
            </span>
          </Link>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl p-8 shadow-2xl shadow-black/20">
          <div className="text-center mb-6">
            <h1 className="text-lg text-foreground mb-1">Criar Conta</h1>
            <p className="text-muted-foreground text-sm font-body">Registre-se para começar a anunciar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs text-muted-foreground font-body">Nome de usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="seu_nick"
                  required
                  className="pl-10 bg-secondary/80 border-border h-11 rounded-xl focus:border-primary/40 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-muted-foreground font-body">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="pl-10 bg-secondary/80 border-border h-11 rounded-xl focus:border-primary/40 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-muted-foreground font-body">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="pl-10 bg-secondary/80 border-border h-11 rounded-xl focus:border-primary/40 transition-all"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/60 font-body">Mínimo de 6 caracteres</p>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-xl font-semibold transition-all duration-200 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
            >
              {loading ? (
                "Criando..."
              ) : (
                <span className="flex items-center gap-2">
                  Criar Conta
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/60 text-center">
            <p className="text-sm text-muted-foreground font-body">
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
