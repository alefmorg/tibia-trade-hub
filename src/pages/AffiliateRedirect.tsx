import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { registerAffiliateClick } from "@/hooks/useAffiliateLinks";
import { ExternalLink, AlertCircle } from "lucide-react";

const AffiliateRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Link inválido.");
      return;
    }
    let cancelled = false;
    registerAffiliateClick(slug)
      .then((url) => {
        if (cancelled) return;
        if (!url) {
          setError("Esse link não está mais disponível.");
          return;
        }
        // Pequena pausa pro usuário ver a tela
        setTimeout(() => { window.location.href = url; }, 600);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e.message || "Erro ao processar link.");
      });
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-sm w-full bg-card/80 border border-border/60 rounded-2xl p-8 text-center">
        {error ? (
          <>
            <div className="w-14 h-14 mx-auto rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center mb-4">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="text-base font-bold text-foreground mb-2">Link indisponível</h1>
            <p className="text-xs text-muted-foreground">{error}</p>
            <a href="/" className="inline-block mt-4 text-xs text-primary hover:underline">Voltar ao início</a>
          </>
        ) : (
          <>
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-4">
              <ExternalLink className="h-7 w-7 text-primary animate-pulse" />
            </div>
            <h1 className="text-base font-bold text-foreground mb-2">Redirecionando...</h1>
            <p className="text-xs text-muted-foreground">Você será levado ao destino em instantes.</p>
            <div className="mt-4 h-1 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-pulse" style={{ width: "60%" }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AffiliateRedirect;
