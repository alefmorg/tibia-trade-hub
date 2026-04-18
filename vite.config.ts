import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// Load environment variables from Vercel share directory (for v0 preview environment)
const loadVercelEnv = () => {
  const envPath = '/vercel/share/.env.project';
  const env: Record<string, string> = {};
  
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) return;
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          env[key.trim()] = value;
        }
      });
    }
  } catch (e) {
    // Ignore errors, use process.env as fallback
  }
  
  return env;
};

const vercelEnv = loadVercelEnv();

// Get Supabase env vars from multiple sources (v0 preview, Vercel production, local .env)
const getSupabaseUrl = () => vercelEnv.SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const getSupabaseAnonKey = () => vercelEnv.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(getSupabaseUrl()),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(getSupabaseAnonKey()),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core", "framer-motion"],
  },
}));
