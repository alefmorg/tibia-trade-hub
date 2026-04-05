import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-gaming p-8 w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-primary" />
            <span className="font-pixel text-sm">Rubin <span className="text-accent">TRADE</span></span>
          </Link>
          <h1 className="text-lg">Entrar</h1>
          <p className="text-muted-foreground text-sm mt-1 font-body">Acesse sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-foreground">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="bg-secondary border-border" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link to="/registro" className="text-primary hover:underline">Criar conta</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
