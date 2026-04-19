// Validação de variáveis de ambiente — falha cedo com mensagem clara.
const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"] as const;

const missing = required.filter((k) => !import.meta.env[k]);

if (missing.length > 0) {
  const msg = `Configuração ausente: ${missing.join(", ")}. Defina essas variáveis no seu provedor de hospedagem (Vercel/Netlify/Cloudflare/Firebase) ou em um arquivo .env local.`;
  // Mostra um erro amigável na tela em vez de uma página em branco.
  if (typeof document !== "undefined") {
    document.body.innerHTML = `<div style="font-family:system-ui,sans-serif;padding:2rem;max-width:600px;margin:4rem auto;background:#1a1a1a;color:#fff;border-radius:12px;border:1px solid #ef4444"><h1 style="color:#ef4444;margin:0 0 1rem">Configuração inválida</h1><p style="line-height:1.6">${msg}</p></div>`;
  }
  throw new Error(msg);
}

export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
};
