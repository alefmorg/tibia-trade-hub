import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const requireEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

const ensureNoError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const deleteInChunks = async (table: string, column: string, ids: string[], adminClient: ReturnType<typeof createClient>) => {
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
    const publishableKey = requireEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse({ error: "Não autenticado" }, 401);
    }

    const authClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    ensureNoError(userError);

    if (!user) {
      return jsonResponse({ error: "Não autenticado" }, 401);
    }

    const { data: isAdminRow, error: roleError } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    ensureNoError(roleError);

    if (!isAdminRow) {
      return jsonResponse({ error: "Sem permissão" }, 403);
    }

    const { action, payload } = await req.json();

    switch (action) {
      case "updateAdStatus": {
        const { id, status } = payload ?? {};
        if (!id || !status) throw new Error("Dados inválidos para atualizar anúncio");

        const { error } = await adminClient.from("ads").update({ status }).eq("id", id);
        ensureNoError(error);
        return jsonResponse({ success: true });
      }

      case "toggleAdFeatured": {
        const { id, featured } = payload ?? {};
        if (!id || typeof featured !== "boolean") throw new Error("Dados inválidos para destacar anúncio");

        const { error } = await adminClient.from("ads").update({ featured }).eq("id", id);
        ensureNoError(error);
        return jsonResponse({ success: true });
      }

      case "updateUserRole": {
        const { userId, role } = payload ?? {};
        if (!userId || !role) throw new Error("Dados inválidos para atualizar cargo");

        const { error: deleteError } = await adminClient.from("user_roles").delete().eq("user_id", userId);
        ensureNoError(deleteError);

        if (role !== "user") {
          const { error: insertError } = await adminClient.from("user_roles").insert({ user_id: userId, role });
          ensureNoError(insertError);
        }

        return jsonResponse({ success: true });
      }

      case "updateTradeSettings": {
        const { days } = payload ?? {};
        if (typeof days !== "number" || Number.isNaN(days)) throw new Error("Valor inválido para duração dos anúncios");

        const { data: existing, error: selectError } = await adminClient.from("trade_settings").select("id").limit(1).maybeSingle();
        ensureNoError(selectError);

        if (existing?.id) {
          const { error } = await adminClient.from("trade_settings").update({ ad_duration_days: days }).eq("id", existing.id);
          ensureNoError(error);
        } else {
          const { error } = await adminClient.from("trade_settings").insert({ ad_duration_days: days });
          ensureNoError(error);
        }

        return jsonResponse({ success: true });
      }

      case "updateOfferStatus": {
        const { offerId, status } = payload ?? {};
        if (!offerId || !status) throw new Error("Dados inválidos para atualizar oferta");

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

        const { error: deleteMessagesError } = await adminClient.from("messages").delete().eq("conversation_id", conversationId);
        ensureNoError(deleteMessagesError);

        const { error: deleteConversationError } = await adminClient.from("conversations").delete().eq("id", conversationId);
        ensureNoError(deleteConversationError);

        return jsonResponse({ success: true });
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

        const adIds = (ownedAds || []).map((ad) => ad.id);
        const conversationIds = new Set((directConversations || []).map((conversation) => conversation.id));

        if (adIds.length) {
          const { data: adConversations, error: adConversationsError } = await adminClient
            .from("conversations")
            .select("id")
            .in("ad_id", adIds);
          ensureNoError(adConversationsError);
          (adConversations || []).forEach((conversation) => conversationIds.add(conversation.id));
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
