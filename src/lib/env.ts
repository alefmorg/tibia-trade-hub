// Fallbacks garantem que o build publicado não quebre caso as envs VITE_* não entrem no bundle.
// As chaves públicas (anon) podem ficar no client com segurança — RLS protege os dados.
const FALLBACK_SUPABASE_URL = "https://ysfinsdtmqasbkapaeqe.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZmluc2R0bXFhc2JrYXBhZXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNDY0NjMsImV4cCI6MjA5MDgyMjQ2M30.6_w216-xi7ga_dbzgS9wKUst80yFMlG2mWonPLlkluw";

const FALLBACK_SITE_URL = "https://rubintrade.com";

export const env = {
  SUPABASE_URL:
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY:
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    FALLBACK_SUPABASE_PUBLISHABLE_KEY,
  SITE_URL: (import.meta.env.VITE_SITE_URL as string | undefined) || FALLBACK_SITE_URL,
};
