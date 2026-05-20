// Gera public/sitemap.xml com rotas estáticas + anúncios/rifas ativos.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://rubintrade.com";
const SUPABASE_URL = "https://ysfinsdtmqasbkapaeqe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZmluc2R0bXFhc2JrYXBhZXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNDY0NjMsImV4cCI6MjA5MDgyMjQ2M30.6_w216-xi7ga_dbzgS9wKUst80yFMlG2mWonPLlkluw";

interface Entry { path: string; lastmod?: string; changefreq?: string; priority?: string; }

const entries: Entry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/rifa", changefreq: "daily", priority: "0.8" },
  { path: "/suporte", changefreq: "monthly", priority: "0.4" },
  { path: "/privacidade", changefreq: "yearly", priority: "0.3" },
  { path: "/login", changefreq: "monthly", priority: "0.4" },
  { path: "/registro", changefreq: "monthly", priority: "0.5" },
];

async function fetchDynamic() {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
    const [{ data: ads }, { data: raffles }] = await Promise.all([
      sb.from("ads").select("id, updated_at").eq("status", "active").limit(1000),
      sb.from("raffles").select("id, updated_at").limit(100),
    ]);
    (ads || []).forEach((a: any) => entries.push({ path: `/anuncio/${a.id}`, lastmod: a.updated_at?.slice(0, 10), changefreq: "weekly", priority: "0.7" }));
    (raffles || []).forEach((r: any) => entries.push({ path: `/rifa/${r.id}`, lastmod: r.updated_at?.slice(0, 10), changefreq: "daily", priority: "0.6" }));
  } catch (e) {
    console.warn("sitemap: skip dynamic", e);
  }
}

function build(es: Entry[]) {
  const urls = es.map(e => `  <url>\n    <loc>${BASE_URL}${e.path}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}${e.changefreq ? `\n    <changefreq>${e.changefreq}</changefreq>` : ""}${e.priority ? `\n    <priority>${e.priority}</priority>` : ""}\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

await fetchDynamic();
writeFileSync(resolve("public/sitemap.xml"), build(entries));
console.log(`sitemap.xml: ${entries.length} URLs`);
