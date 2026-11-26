import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cartSchema, priceCart, stripeCartLine, isVerifiedPayment } from "@/lib/checkout-model";
import { requireOrderUser } from "@/lib/order-access";

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ items: cartSchema, attempt: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const userId = requireOrderUser(context.userId);
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) throw new Error("Payments are temporarily unavailable.");
    const { data: auth, error: authError } = await context.supabase.auth.getUser();
    if (authError || !auth.user?.email) throw new Error("Please sign in again to checkout.");
    const { data: products, error } = await context.supabase.from("products").select("id,name,price_cents").eq("active", true).in("id", data.items.map((item) => item.id));
    if (error) throw new Error("Could not verify the menu prices. Please try again.");
    const priced = priceCart(data.items, products);
    // The owner can read this row through RLS. Trusted checkout alone can insert it.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
    const { data: existing, error: readError } = await supabaseAdmin.from("orders").select("id,user_id,stripe_session_id,total_cents,items,status").eq("id", data.attempt).maybeSingle();
    if (readError) throw new Error("Could not prepare your order.");
    if (existing) {
      const storedItems = z.array(z.object({ id: z.string(), name: z.string(), quantity: z.number(), unit_price_cents: z.number() })).safeParse(existing.items);
      const sameItems = storedItems.success && storedItems.data.length === priced.items.length && priced.items.every((item) => storedItems.data.some((stored) => stored.id === item.id && stored.quantity === item.quantity && stored.unit_price_cents === item.unit_price_cents));
      if (existing.user_id !== userId || existing.total_cents !== priced.total || !sameItems) throw new Error("Your cart changed. Please start checkout again.");
      if (existing.stripe_session_id) {
        const session = await stripe.checkout.sessions.retrieve(existing.stripe_session_id);
        if (session.status === "open" && session.url) return { url: session.url, orderId: existing.id, test: !session.livemode };
        throw new Error("This checkout has ended. Please start a new checkout.");
      }
    } else {
      const { error: insertError } = await supabaseAdmin.from("orders").insert({ id: data.attempt, user_id: userId, total_cents: priced.total, items: priced.items });
      if (insertError) throw new Error("Could not save your order. Please try again.");
    }
    const request = getRequest();
    const requestOrigin = new URL(request.url).origin;
    const originHeader = request.headers.get("origin");
    const allowed = new Set([requestOrigin, "http://localhost:8080", "https://id-preview--9989ff2e-b223-4cf5-a2bd-10f176e12e1a.lovable.app", "https://project--9989ff2e-b223-4cf5-a2bd-10f176e12e1a.lovable.app", "https://project--9989ff2e-b223-4cf5-a2bd-10f176e12e1a-dev.lovable.app"]);
    const origin = originHeader && allowed.has(originHeader) ? originHeader : requestOrigin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: userId, customer_email: auth.user.email,
      line_items: [stripeCartLine(priced.total)],
      metadata: { order_id: data.attempt },
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
    }, { idempotencyKey: `sushi-checkout-${userId}-${data.attempt}` });
    const { error: saveError } = await supabaseAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", data.attempt).eq("user_id", userId);
    if (saveError || !session.url) throw new Error("Checkout could not be completed. Please retry.");
    return { url: session.url, orderId: data.attempt, test: !session.livemode };
  });

export const verifyCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ sessionId: z.string().regex(/^cs_[a-zA-Z0-9_]+$/).max(300) }))
  .handler(async ({ data, context }) => {
    const userId = requireOrderUser(context.userId);
    const { data: order, error } = await context.supabase.from("orders").select("id,user_id,status,total_cents,currency,stripe_session_id,items,created_at").eq("stripe_session_id", data.sessionId).eq("user_id", userId).single();
    if (error || !order) throw new Error("This order is not available for your account.");
    if (order.status === "paid") return order;
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) throw new Error("Payment verification is temporarily unavailable.");
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
    const session = await stripe.checkout.sessions.retrieve(data.sessionId);
    if (session.metadata?.["order_id"] !== order.id) throw new Error("Could not verify this payment.");
    const status = isVerifiedPayment(session, order) ? "paid" : session.status === "expired" ? "expired" : "pending";
    if (status !== order.status) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: updateError } = await supabaseAdmin.from("orders").update({ status, ...(status === "paid" ? { paid_at: new Date().toISOString(), stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null } : {}) }).eq("id", order.id).eq("user_id", userId).neq("status", "paid");
      if (updateError) throw new Error("Could not save payment confirmation. Please retry.");
    }
    return { ...order, status };
  });