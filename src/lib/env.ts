// Envs do Supabase são injetadas automaticamente pelo Lovable.
// Mantemos apenas um export simples; sem checks que possam quebrar o build.
export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined,
};
