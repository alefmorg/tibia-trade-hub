import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// Load environment variables from Vercel share directory (for v0 preview environment)
const loadVercelShareEnv = (): Record<string, string> => {
  const envPath = '/vercel/share/.env.project';
  const env: Record<string, string> = {};
  
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) return;
        const equalIndex = trimmedLine.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmedLine.substring(0, equalIndex).trim();
          const value = trimmedLine.substring(equalIndex + 1).trim().replace(/^["']|["']$/g, '');
          env[key] = value;
        }
      });
    }
  } catch {
    // Ignore errors
  }
  
  return env;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env from .env files
  const env = loadEnv(mode, process.cwd(), '');
  
  // Load env from v0 share directory (for preview environment)
  const vercelShareEnv = loadVercelShareEnv();
  
  // Get Supabase URL from multiple sources
  const supabaseUrl = 
    vercelShareEnv.SUPABASE_URL || 
    env.SUPABASE_URL || 
    env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';
  
  // Get Supabase Anon Key from multiple sources
  const supabaseAnonKey = 
    vercelShareEnv.SUPABASE_ANON_KEY || 
    env.SUPABASE_ANON_KEY || 
    env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core", "framer-motion"],
    },
  };
});
