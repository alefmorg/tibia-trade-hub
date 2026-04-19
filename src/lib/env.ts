// Aviso leve no console se as envs não estiverem definidas.
// Não bloqueia o runtime — o preview do Lovable injeta as chaves de outra forma,
// e em produção você define VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY
// no painel da hospedagem (Vercel/Netlify/Cloudflare/Firebase).
const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"] as const;
const missing = required.filter((k) => !import.meta.env[k]);

if (missing.length > 0 && import.meta.env.PROD) {
  // Só avisa no console; não derruba a tela.
  console.warn(
    `[env] Variáveis ausentes em produção: ${missing.join(", ")}. ` +
    `Configure no painel da sua hospedagem.`
  );
}

export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined,
};
