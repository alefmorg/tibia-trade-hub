import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Flame, Eye, EyeOff, Check, X, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const hash = window.location.hash;
      const isRecovery = hash.includes("type=recovery") || !!data.session;
      setValidSession(isRecovery);
    };
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValidSession(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    match: password.length > 0 && password === confirm,
  };
  const allValid = rules.length && rules.upper && rules.number && rules.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) {
      toast.error("Verifique os requisitos da senha");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada! Faça login novamente.");
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar senha");
    } finally {
      setLoading(false);
    }
  };

  const Rule = ({ ok, label }: { ok: boolean; label: string }) => (
    <li className="flex items-center gap-1.5 text-xs">
      {ok ? <Check className="h-3 w-3 text-primary" /> : <X className="h-3 w-3 text-muted-foreground/60" />}
      <span className={ok ? "text-primary" : "text-muted-foreground/70"}>{label}</span>
    </li>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 transition-colors group-hover:bg-primary/15">
              <Flame className="h-5 w-5 text-primary" strokeWidth={2.25} />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              Rubin<span className="text-primary">Trade</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-7 shadow-lg">
          <div className="mb-6 flex items-start gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Nova senha</h1>
              <p className="text-sm text-muted-foreground mt-1">Defina uma senha forte e segura</p>
            </div>
          </div>

          {validSession === false ? (
            <div className="text-center py-4 space-y-4">
              <p className="text-sm text-destructive">Link inválido ou expirado.</p>
              <Link to="/esqueci-senha">
                <Button className="h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  Solicitar novo link
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className="pl-10 pr-10 bg-secondary/40 border-border h-11 rounded-lg focus:border-primary"
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

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className="pl-10 bg-secondary/40 border-border h-11 rounded-lg focus:border-primary"
                  />
                </div>
              </div>

              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 px-1">
                <Rule ok={rules.length} label="8+ caracteres" />
                <Rule ok={rules.upper} label="Maiúscula" />
                <Rule ok={rules.number} label="Número" />
                <Rule ok={rules.match} label="Senhas iguais" />
              </ul>

              <Button
                type="submit"
                disabled={loading || !allValid}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Atualizar senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
