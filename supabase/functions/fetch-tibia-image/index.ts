// Edge function: busca imagem oficial de um item no Tibia Fandom (MediaWiki API)
// GET ?name=Golden+Armor  →  { url: "https://...", title: "Golden Armor" } | { url: null }
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const WIKI = "https://tibia.fandom.com/api.php";

async function queryFandom(params: Record<string, string>): Promise<any> {
  const url = `${WIKI}?${new URLSearchParams({ format: "json", origin: "*", ...params }).toString()}`;
  const res = await fetch(url, { headers: { "User-Agent": "RubinTrade/1.0 (item-image-fetch)" } });
  if (!res.ok) throw new Error(`Fandom ${res.status}`);
  return await res.json();
}

async function findImageForName(rawName: string): Promise<{ url: string | null; title: string | null }> {
  const name = rawName.trim();
  if (!name) return { url: null, title: null };

  // 1) Tenta página com mesmo nome → pageimages (segue redirects)
  try {
    const data = await queryFandom({
      action: "query",
      titles: name,
      prop: "pageimages",
      pithumbsize: "256",
      redirects: "1",
    });
    const pages = data?.query?.pages || {};
    for (const k of Object.keys(pages)) {
      const p = pages[k];
      if (p?.thumbnail?.source) {
        // Mantém a URL completa do thumbnail (com /revision/.../?cb=...) — o CDN
        // do Fandom retorna 404 se o sufixo for removido.
        return { url: p.thumbnail.source, title: p.title || name };
      }
    }
  } catch (_) {}

  // 2) Fallback: tenta arquivo direto File:Name.gif / .png
  for (const ext of ["gif", "png", "jpg"]) {
    try {
      const fname = `File:${name.replace(/\s+/g, "_")}.${ext}`;
      const data = await queryFandom({
        action: "query",
        titles: fname,
        prop: "imageinfo",
        iiprop: "url",
      });
      const pages = data?.query?.pages || {};
      for (const k of Object.keys(pages)) {
        const p = pages[k];
        const u = p?.imageinfo?.[0]?.url;
        if (u) return { url: u, title: name };
      }
    } catch (_) {}
  }

  // 3) Último fallback: busca por título aproximado
  try {
    const data = await queryFandom({
      action: "query",
      list: "search",
      srsearch: name,
      srlimit: "1",
    });
    const first = data?.query?.search?.[0]?.title;
    if (first && first.toLowerCase() !== name.toLowerCase()) {
      return await findImageForName(first);
    }
  } catch (_) {}

  return { url: null, title: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let names: string[] = [];
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (Array.isArray(body?.names)) names = body.names;
      else if (typeof body?.name === "string") names = [body.name];
    } else {
      const single = url.searchParams.get("name");
      if (single) names = [single];
    }
    if (names.length === 0) {
      return new Response(JSON.stringify({ error: "name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.all(names.map((n) => findImageForName(n)));
    const payload = names.length === 1
      ? results[0]
      : { results: names.map((n, i) => ({ name: n, ...results[i] })) };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
