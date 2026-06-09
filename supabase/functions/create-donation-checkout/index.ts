import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    let userId: string | undefined;
    let userEmail: string | undefined;
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      userId = data.user?.id;
      userEmail = data.user?.email ?? undefined;
    }

    const body = await req.json();
    const { amountInCents, message, returnUrl, environment } = body as {
      amountInCents: number;
      message?: string;
      returnUrl: string;
      environment: StripeEnv;
    };

    if (!amountInCents || amountInCents < 100) throw new Error("Valor mínimo: R$ 1,00");
    if (amountInCents > 1000000) throw new Error("Valor máximo: R$ 10.000,00");
    if (environment !== "sandbox" && environment !== "live") throw new Error("Invalid environment");

    const stripe = createStripeClient(environment);

    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: "brl",
          product_data: { name: "Doação RubinTrade", description: "Apoio ao site RubinTrade" },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      payment_method_types: ["card"],
      payment_intent_data: {
        description: "Doação RubinTrade",
        metadata: {
          kind: "donation",
          ...(userId && { userId }),
          ...(message && { message: message.slice(0, 200) }),
        },
      },
      ...(userEmail && { customer_email: userEmail }),
      metadata: {
        kind: "donation",
        ...(userId && { userId }),
      },
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-donation-checkout error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
