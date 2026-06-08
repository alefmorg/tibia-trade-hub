import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

async function creditCoins(session: any) {
  const meta = session.metadata || {};
  const userId = meta.userId as string | undefined;
  const coinsRaw = meta.coins as string | undefined;
  const priceId = meta.priceId as string | undefined;
  const sessionId = session.id as string;

  if (!userId || !coinsRaw) {
    console.error("Missing userId/coins on session metadata", sessionId);
    return;
  }
  const coins = parseInt(coinsRaw, 10);
  if (!Number.isFinite(coins) || coins <= 0) {
    console.error("Invalid coin amount", coinsRaw);
    return;
  }

  const sb = getSupabase();

  // Idempotência: se já existe transação com este sessionId no reason, ignora.
  const reasonTag = `stripe:${sessionId}`;
  const { data: existing } = await sb
    .from("wallet_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", reasonTag)
    .maybeSingle();

  if (existing) {
    console.log("Already credited", sessionId);
    return;
  }

  const { error } = await sb.rpc("add_balance", {
    p_user_id: userId,
    p_amount: coins,
    p_reason: reasonTag,
  });
  if (error) {
    console.error("add_balance failed", error);
    throw error;
  }
  console.log(`Credited ${coins} coins to ${userId} (price=${priceId})`);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;

  try {
    const event = await verifyWebhook(req, env);

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        if (session.payment_status === "paid") {
          await creditCoins(session);
        }
        break;
      }
      default:
        console.log("Unhandled event:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
