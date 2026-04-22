import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Sword, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

const EsqueciSenha = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Email enviado! Verifique sua caixa de entrada.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar email");
    } finally {
      setLoading(false);
    }
  };

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
      <div className="absolute top-1/4 -left-32 w-72 h-72 rounded-full bg-warning/10 blur-3xl pointer-events-none" />

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
              "0 0 0 2px hsl(var(--border)), 0 0 0 4px hsl(var(--background)), 0 0 0 5px hsl(var(--warning) / 0.3), 0 20px 60px -10px hsl(0 0% 0% / 0.5)",
          }}
        >
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div
                className="w-16 h-16 mx-auto flex items-center justify-center bg-primary/15"
                style={{
                  borderRadius: 2,
                  boxShadow: "0 0 0 2px hsl(var(--primary) / 0.4)",
                }}
              >
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="font-pixel text-sm text-foreground mb-2">EMAIL ENVIADO</h1>
                <p className="text-xs text-muted-foreground font-body leading-relaxed">
                  Enviamos instruções para <span className="text-foreground font-semibold">{email}</span>. Verifique sua caixa de entrada e o spam.
                </p>
              </div>
              <Link to="/login">
                <Button
                  className="w-full bg-secondary text-foreground hover:bg-secondary/80 h-11 font-pixel text-[11px] uppercase tracking-wider"
                  style={{ borderRadius: 2 }}
                >
                  Voltar ao login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="font-pixel text-sm text-foreground mb-2">RECUPERAR</h1>
                <div className="h-px bg-gradient-to-r from-transparent via-warning/40 to-transparent" />
                <p className="text-muted-foreground text-xs font-body mt-3">Enviaremos um link para redefinir sua senha</p>
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
                      className="pl-10 bg-secondary/60 border-border h-11 focus:border-primary"
                      style={{ borderRadius: 2 }}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-warning text-warning-foreground hover:bg-warning/90 h-11 font-pixel text-[11px] uppercase tracking-wider"
                  style={{
                    borderRadius: 2,
                    boxShadow: "0 0 0 2px hsl(var(--warning) / 0.4), 0 4px 0 hsl(var(--warning) / 0.5)",
                  }}
                >
                  {loading ? "Enviando..." : (
                    <span className="flex items-center gap-2">
                      <Send className="h-3.5 w-3.5" />
                      Enviar link
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-border/60 text-center">
                <Link to="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-body">
                  <ArrowLeft className="h-3 w-3" />
                  Voltar ao login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EsqueciSenha;
