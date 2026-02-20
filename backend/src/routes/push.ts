import { Hono } from "hono";
import { z } from "zod";
import { supabase } from "../lib/supabase";

const registerSchema = z.object({
  token: z.string().min(1, "Token is required"),
  enabled: z.boolean(),
});

const pushRouter = new Hono();

/**
 * Register or update push token.
 * POST /api/push/register
 * Body: { token: string, enabled: boolean }
 */
pushRouter.post("/register", async (c) => {
  const raw = await c.req.json().catch(() => ({}));
  const result = registerSchema.safeParse(raw);
  if (!result.success) {
    return c.json({ error: "Invalid request" }, 400);
  }
  const { token, enabled } = result.data;

  const { error } = await supabase.from("push_tokens").upsert(
    { token, enabled, updated_at: new Date().toISOString() },
    { onConflict: "token" }
  );

  if (error) {
    console.error("Push register error:", error);
    return c.json({ error: "Failed to register" }, 500);
  }

  return c.json({ ok: true });
});

export { pushRouter };
