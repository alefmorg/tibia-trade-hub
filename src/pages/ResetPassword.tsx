import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Sword, Eye, EyeOff, Check, X, ShieldCheck } from "lucide-react";
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
    // Detecta sessão de recovery vinda pelo hash do link de email.
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
    <li className="flex items-center gap-1.5 text-[10px] font-body">
      {ok ? <Check className="h-3 w-3 text-primary" /> : <X className="h-3 w-3 text-muted-foreground/60" />}
      <span className={ok ? "text-primary" : "text-muted-foreground/70"}>{label}</span>
    </li>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

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
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-primary/15" style={{ borderRadius: 2, boxShadow: "0 0 0 2px hsl(var(--primary) / 0.4)" }}>
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-pixel text-sm text-foreground mb-2">NOVA SENHA</h1>
            <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <p className="text-muted-foreground text-xs font-body mt-3">Defina uma senha forte e segura</p>
          </div>

          {validSession === false ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-xs text-destructive font-body">Link inválido ou expirado.</p>
              <Link to="/esqueci-senha">
                <Button className="bg-primary text-primary-foreground" style={{ borderRadius: 2 }}>
                  Solicitar novo link
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground font-pixel uppercase tracking-wider">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className="pl-10 pr-10 bg-secondary/60 border-border h-11"
                    style={{ borderRadius: 2 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground font-pixel uppercase tracking-wider">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className="pl-10 bg-secondary/60 border-border h-11"
                    style={{ borderRadius: 2 }}
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
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-pixel text-[11px] uppercase tracking-wider disabled:opacity-50"
                style={{
                  borderRadius: 2,
                  boxShadow: "0 0 0 2px hsl(var(--primary) / 0.4), 0 4px 0 hsl(var(--primary) / 0.5)",
                }}
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
