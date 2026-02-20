import { Hono } from "hono";
import { createHmac, timingSafeEqual } from "crypto";
import { supabase } from "../lib/supabase";

const webhooksRouter = new Hono();

function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const parts = signature.split(",").reduce(
    (acc, part) => {
      const [k, v] = part.split("=");
      if (k && v) acc[k] = v;
      return acc;
    },
    {} as Record<string, string>
  );
  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");

  if (expected.length !== v1.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"));
  } catch {
    return false;
  }
}

/**
 * Stripe webhook for subscription lifecycle.
 * Handles customer.subscription.updated and customer.subscription.deleted
 * to keep developer_subscriptions in sync.
 *
 * Configure in Stripe Dashboard: Developers → Webhooks → Add endpoint
 * URL: https://your-backend.com/api/webhooks/stripe
 * Events: customer.subscription.updated, customer.subscription.deleted
 *
 * Set STRIPE_WEBHOOK_SECRET (whsec_xxx) in .env
 */
webhooksRouter.post("/stripe", async (c) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    return c.json({ error: "Webhook not configured" }, 500);
  }

  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.json({ error: "Missing stripe-signature" }, 400);
  }

  const rawBody = await c.req.text();
  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return c.json({ error: "Invalid signature" }, 400);
  }

  let event: { type: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const sub = event.data?.object as {
    id?: string;
    customer?: string;
    status?: string;
    current_period_end?: number;
  } | undefined;

  if (!sub?.customer) {
    return c.json({ received: true });
  }

  const customerId = String(sub.customer);
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;

  if (event.type === "customer.subscription.updated") {
    if (sub.status === "active" && periodEnd) {
      const { error } = await supabase
        .from("developer_subscriptions")
        .update({
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);

      if (error) {
        console.error("Webhook update error:", error);
        return c.json({ error: "Update failed" }, 500);
      }
    }
  } else if (event.type === "customer.subscription.deleted") {
    if (periodEnd) {
      await supabase
        .from("developer_subscriptions")
        .update({
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);
    }
  }

  return c.json({ received: true });
});

export { webhooksRouter };
