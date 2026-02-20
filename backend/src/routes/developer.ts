import { Hono } from "hono";
import { z } from "zod";
import { supabase } from "../lib/supabase";

const FREE_UPLOAD_LIMIT = 5;

const developerRouter = new Hono();

/**
 * Get upload usage for a device.
 * GET /api/developer/usage?deviceId=xxx
 */
developerRouter.get("/usage", async (c) => {
  const deviceId = c.req.query("deviceId");
  if (!deviceId) {
    return c.json({ error: "deviceId required" }, 400);
  }

  const { data: usage } = await supabase
    .from("developer_device_usage")
    .select("upload_count")
    .eq("device_id", deviceId)
    .single();

  const uploadCount = usage?.upload_count ?? 0;

  // Check subscription
  const { data: sub } = await supabase
    .from("developer_subscriptions")
    .select("current_period_end")
    .eq("device_id", deviceId)
    .single();

  const isSubscribed =
    sub?.current_period_end &&
    new Date(sub.current_period_end as string).getTime() > Date.now();

  return c.json({
    data: {
      uploadCount,
      isSubscribed: !!isSubscribed,
      freeLimit: FREE_UPLOAD_LIMIT,
      canUpload: isSubscribed || uploadCount < FREE_UPLOAD_LIMIT,
    },
  });
});

/**
 * Verify subscription by email (after user pays via Stripe).
 * POST /api/developer/verify-subscription
 * Body: { deviceId, email }
 */
developerRouter.post("/verify-subscription", async (c) => {
  const raw = await c.req.json().catch(() => ({}));
  const result = z
    .object({
      deviceId: z.string().min(1),
      email: z.string().email(),
    })
    .safeParse(raw);

  if (!result.success) {
    return c.json({ error: "deviceId and email required" }, 400);
  }

  const { deviceId, email } = result.data;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return c.json(
      { error: "Subscription verification is not configured" },
      503
    );
  }

  try {
    // List customers by email
    const customersRes = await fetch("https://api.stripe.com/v1/customers?email=" + encodeURIComponent(email), {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const customersData = await customersRes.json();
    const customers = customersData.data ?? [];
    if (customers.length === 0) {
      return c.json({ error: "No subscription found for this email" }, 404);
    }

    const customerId = customers[0].id;

    // List active subscriptions for this customer
    const subsRes = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active&limit=1`,
      { headers: { Authorization: `Bearer ${stripeKey}` } }
    );
    const subsData = await subsRes.json();
    const subs = subsData.data ?? [];
    if (subs.length === 0) {
      return c.json({ error: "No active subscription found for this email" }, 404);
    }

    const periodEnd = subs[0].current_period_end;
    const currentPeriodEnd = new Date(periodEnd * 1000).toISOString();

    await supabase.from("developer_subscriptions").upsert(
      {
        device_id: deviceId,
        stripe_customer_id: customerId,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "device_id" }
    );

    return c.json({
      data: {
        success: true,
        currentPeriodEnd,
        canUpload: true,
      },
    });
  } catch (err) {
    console.error("Verify subscription error:", err);
    return c.json({ error: "Failed to verify subscription" }, 500);
  }
});

export { developerRouter };
