import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Flame, Send, CheckCircle2 } from "lucide-react";
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
          {sent ? (
            <div className="text-center space-y-5 py-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground mb-2">Email enviado</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enviamos instruções para <span className="text-foreground font-medium">{email}</span>. Verifique sua caixa de entrada e o spam.
                </p>
              </div>
              <Link to="/login">
                <Button className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  Voltar ao login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-foreground">Recuperar senha</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enviaremos um link para redefinir sua senha
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-muted-foreground">
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
                      className="pl-10 bg-secondary/40 border-border h-11 rounded-lg focus:border-primary"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {loading ? "Enviando..." : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Enviar link
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-border/60 text-center">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />
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
