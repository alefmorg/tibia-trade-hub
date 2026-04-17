import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const requireEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

const ensureNoError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const deleteInChunks = async (table: string, column: string, ids: string[], adminClient: any) => {
  if (!ids.length) return;
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const { error } = await adminClient.from(table).delete().in(column, chunk);
    ensureNoError(error);
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const anonKey = requireEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) return jsonResponse({ error: "Não autenticado" }, 401);

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    ensureNoError(userError);
    if (!user) return jsonResponse({ error: "Não autenticado" }, 401);

    const { data: isAdminRow, error: roleError } = await adminClient
      .from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    ensureNoError(roleError);
    if (!isAdminRow) return jsonResponse({ error: "Sem permissão" }, 403);

    const { action, payload } = await req.json();

    switch (action) {
      case "updateAdStatus": {
        const { id, status } = payload ?? {};
        if (!id || !status) throw new Error("Dados inválidos");
        const { error } = await adminClient.from("ads").update({ status }).eq("id", id);
        ensureNoError(error);
        return jsonResponse({ success: true });
      }

      case "toggleAdFeatured": {
        const { id, featured } = payload ?? {};
        if (!id || typeof featured !== "boolean") throw new Error("Dados inválidos");
        const { error } = await adminClient.from("ads").update({ featured }).eq("id", id);
        ensureNoError(error);
        return jsonResponse({ success: true });
      }

      case "updateUserRole": {
        const { userId, role } = payload ?? {};
        if (!userId || !role) throw new Error("Dados inválidos");
        const { error: deleteError } = await adminClient.from("user_roles").delete().eq("user_id", userId);
        ensureNoError(deleteError);
        if (role !== "user") {
          const { error: insertError } = await adminClient.from("user_roles").insert({ user_id: userId, role });
          ensureNoError(insertError);
        }
        return jsonResponse({ success: true });
      }

      case "banUser": {
        const { userId, banned } = payload ?? {};
        if (!userId || typeof banned !== "boolean") throw new Error("Dados inválidos");
        const { error } = await adminClient.from("profiles").update({ banned }).eq("user_id", userId);
        ensureNoError(error);
        return jsonResponse({ success: true });
      }

      case "updateTradeSettings": {
        const { days, deposit_char_name, gold_to_coins_rate } = payload ?? {};
        const { data: existing, error: selectError } = await adminClient.from("trade_settings").select("id").limit(1).maybeSingle();
        ensureNoError(selectError);
        const updateData: Record<string, unknown> = {};
        if (typeof days === "number" && !Number.isNaN(days)) updateData.ad_duration_days = days;
        if (typeof deposit_char_name === "string") updateData.deposit_char_name = deposit_char_name;
        if (typeof gold_to_coins_rate === "number") updateData.gold_to_coins_rate = gold_to_coins_rate;
        if (Object.keys(updateData).length === 0) throw new Error("Nenhum dado para atualizar");
        if (existing?.id) {
          const { error } = await adminClient.from("trade_settings").update(updateData).eq("id", existing.id);
          ensureNoError(error);
        } else {
          const { error } = await adminClient.from("trade_settings").insert(updateData);
          ensureNoError(error);
        }
        return jsonResponse({ success: true });
      }

      case "updateOfferStatus": {
        const { offerId, status } = payload ?? {};
        if (!offerId || !status) throw new Error("Dados inválidos");
        const { error } = await adminClient.from("offers").update({ status }).eq("id", offerId);
        ensureNoError(error);
        return jsonResponse({ success: true });
      }

      case "deleteOffer": {
        const { offerId } = payload ?? {};
        if (!offerId) throw new Error("Oferta inválida");
        const { error } = await adminClient.from("offers").delete().eq("id", offerId);
        ensureNoError(error);
        return jsonResponse({ success: true });
      }

      case "deleteConversation": {
        const { conversationId } = payload ?? {};
        if (!conversationId) throw new Error("Conversa inválida");
        const { error: msgErr } = await adminClient.from("messages").delete().eq("conversation_id", conversationId);
        ensureNoError(msgErr);
        const { error: convErr } = await adminClient.from("conversations").delete().eq("id", conversationId);
        ensureNoError(convErr);
        return jsonResponse({ success: true });
      }

      case "getConversationMessages": {
        const { conversationId } = payload ?? {};
        if (!conversationId) throw new Error("Conversa inválida");
        const { data, error } = await adminClient
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });
        ensureNoError(error);
        return jsonResponse({ success: true, data });
      }

      case "createAd": {
        const { title, item_id, type, price, currency, world, pvp_type, category, description, image_url, tier, user_id } = payload ?? {};
        if (!title || !type || !world) throw new Error("Dados inválidos para criar anúncio");
        const adData: Record<string, unknown> = {
          title, type, world, category: category || "item",
          pvp_type: pvp_type || "Optional PvP",
          currency: currency || "kk",
          user_id: user_id || user.id,
        };
        if (item_id) adData.item_id = item_id;
        if (price) adData.price = price;
        if (description) adData.description = description;
        if (image_url) adData.image_url = image_url;
        if (tier !== undefined && tier !== null) adData.tier = tier;
        const { data, error } = await adminClient.from("ads").insert(adData).select().single();
        ensureNoError(error);
        return jsonResponse({ success: true, data });
      }

      case "deleteUser": {
        const { userId } = payload ?? {};
        if (!userId) throw new Error("Usuário inválido");
        const [{ data: ownedAds, error: adsError }, { data: directConversations, error: directConversationsError }] = await Promise.all([
          adminClient.from("ads").select("id").eq("user_id", userId),
          adminClient.from("conversations").select("id").or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
        ]);
        ensureNoError(adsError);
        ensureNoError(directConversationsError);
        const adIds = (ownedAds || []).map((ad: any) => ad.id);
        const conversationIds = new Set((directConversations || []).map((c: any) => c.id));
        if (adIds.length) {
          const { data: adConversations, error: adConvErr } = await adminClient.from("conversations").select("id").in("ad_id", adIds);
          ensureNoError(adConvErr);
          (adConversations || []).forEach((c: any) => conversationIds.add(c.id));
        }
        const allConversationIds = Array.from(conversationIds);
        await deleteInChunks("messages", "conversation_id", allConversationIds, adminClient);
        await deleteInChunks("conversations", "id", allConversationIds, adminClient);
        await deleteInChunks("offers", "ad_id", adIds, adminClient);
        await deleteInChunks("favorites", "ad_id", adIds, adminClient);
        await deleteInChunks("ads", "id", adIds, adminClient);
        const { error: offersBySenderError } = await adminClient.from("offers").delete().eq("sender_id", userId);
        ensureNoError(offersBySenderError);
        const { error: favoritesByUserError } = await adminClient.from("favorites").delete().eq("user_id", userId);
        ensureNoError(favoritesByUserError);
        const { error: rolesError } = await adminClient.from("user_roles").delete().eq("user_id", userId);
        ensureNoError(rolesError);
        const { error: profileError } = await adminClient.from("profiles").delete().eq("user_id", userId);
        ensureNoError(profileError);
        const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);
        ensureNoError(authDeleteError);
        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "Ação administrativa inválida" }, 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno no painel admin";
    return jsonResponse({ error: message }, 500);
  }
});
