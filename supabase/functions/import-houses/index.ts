// Import Tibia houses from TibiaWiki via Firecrawl
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WIKI_URL = "https://www.tibiawiki.com.br/wiki/Todas_as_casas";
const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

interface HouseRow {
  name: string;
  city?: string | null;
  type?: string | null;
  beds?: number | null;
  size_sqm?: number | null;
  rent_gold?: number | null;
  wiki_url?: string | null;
}

function parseInt0(v: string | undefined | null): number | null {
  if (!v) return null;
  const n = parseInt(v.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

// Parse the markdown table(s) returned by Firecrawl into house rows.
function parseHouses(markdown: string): HouseRow[] {
  const rows: HouseRow[] = [];
  const lines = markdown.split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith("|") || !line.includes("|")) continue;
    // Skip header / separator rows
    if (/^\|\s*-+/.test(line) || /name|cidade|nome/i.test(line) === false && line.split("|").length < 5) continue;

    const cols = line.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cols.length < 2) continue;

    // Extract name + wiki link from first column: "[Name](url)" or plain
    const first = cols[0];
    const linkMatch = first.match(/\[([^\]]+)\]\(([^)]+)\)/);
    const name = (linkMatch ? linkMatch[1] : first).replace(/[*_`]/g, "").trim();
    const wiki_url = linkMatch ? linkMatch[2] : null;
    if (!name || /^(name|nome)$/i.test(name)) continue;

    // Heuristic mapping — TibiaWiki "Todas as casas" usually has columns:
    // Name | City | Beds | Size (sqm) | Rent
    const city = cols[1]?.replace(/[*_`]/g, "").trim() || null;
    const beds = parseInt0(cols[2]);
    const size_sqm = parseInt0(cols[3]);
    const rent_gold = parseInt0(cols[4]);

    rows.push({ name, city, beds, size_sqm, rent_gold, wiki_url, type: "house" });
  }
  return rows;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // Verify caller is admin
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Scrape via Firecrawl
    const fcRes = await fetch(`${FIRECRAWL_V2}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: WIKI_URL,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });
    const fcData = await fcRes.json();
    if (!fcRes.ok) {
      return new Response(JSON.stringify({ error: `Firecrawl falhou: ${fcRes.status}`, details: fcData }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const markdown: string = fcData?.data?.markdown || fcData?.markdown || "";
    const houses = parseHouses(markdown);

    if (houses.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma house encontrada no markdown", preview: markdown.slice(0, 500) }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert by (name, city)
    const { error: upsertErr, count } = await admin
      .from("houses")
      .upsert(houses, { onConflict: "name,city", count: "exact" });
    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ success: true, imported: houses.length, upserted: count ?? houses.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("import-houses error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
