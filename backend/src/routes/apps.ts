import { Hono } from "hono";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { sendExpoPush } from "../lib/push";
import { sendAdminAppNotification } from "../lib/resend";

const VALID_CATEGORIES = [
  "games",
  "entertainment",
  "health",
  "weather",
  "finance",
  "home",
  "music",
  "sports",
  "education",
  "travel",
  "utilities",
  "social",
] as const;

const submitAppSchema = z.object({
  name: z.string().min(1, "App name is required").max(200),
  description: z.string().max(5000).optional().default(""),
  developerName: z.string().min(1, "Developer name is required").max(200),
  version: z.string().min(1, "Version is required").max(50),
  category: z.enum(VALID_CATEGORIES),
  ipaPath: z.string().min(1, "IPA path is required"),
  device: z.enum(["iphone", "ipad", "both"]).optional().default("both"),
  iconPath: z.string().max(500).optional(),
  socialTwitter: z.string().max(200).optional(),
  socialWebsite: z.string().url().optional().or(z.literal("")),
  appStoreLink: z.string().url().optional().or(z.literal("")),
  deviceId: z.string().optional(),
});

const FREE_UPLOAD_LIMIT = 5;

const appsRouter = new Hono();

/**
 * Submit a new app from the developer portal.
 * POST /api/apps
 * Body: { name, description, developerName, version, category, ipaPath, iconPath?, socialTwitter?, socialWebsite?, appStoreLink? }
 */
appsRouter.post("/", async (c) => {
  const raw = await c.req.json().catch(() => ({}));
  const result = submitAppSchema.safeParse(raw);
  if (!result.success) {
    const msg = result.error.flatten().formErrors[0] || "Invalid request";
    return c.json({ error: msg }, 400);
  }
  const body = result.data;

  const deviceId = body.deviceId;
  if (deviceId) {
    const { data: sub } = await supabase
      .from("developer_subscriptions")
      .select("current_period_end")
      .eq("device_id", deviceId)
      .single();
    const isSubscribed =
      sub?.current_period_end &&
      new Date(sub.current_period_end as string).getTime() > Date.now();

    if (!isSubscribed) {
      const { data: usage } = await supabase
        .from("developer_device_usage")
        .select("upload_count")
        .eq("device_id", deviceId)
        .single();
      const uploadCount = usage?.upload_count ?? 0;
      if (uploadCount >= FREE_UPLOAD_LIMIT) {
        return c.json(
          {
            error: "Subscription required",
            code: "SUBSCRIPTION_REQUIRED",
            message: "You've used your 5 free uploads. Subscribe for $10/month for unlimited uploads.",
          },
          402
        );
      }
    }
  }

    const { data, error } = await supabase
      .from("apps")
      .insert({
        name: body.name,
        description: body.description ?? "",
        developer_name: body.developerName,
        version: body.version,
        category: body.category,
        ipa_path: body.ipaPath,
        device: body.device ?? "both",
        icon_path: body.iconPath || null,
        social_twitter: body.socialTwitter || null,
        social_website: body.socialWebsite || null,
        app_store_link: body.appStoreLink || null,
        status: "pending",
        uploaded_by_device_id: deviceId || null,
      })
      .select("id, name, status, created_at")
      .single();

    if (error) {
      console.error("Supabase apps insert error:", error);
      return c.json(
        {
          error: "Failed to submit app",
          details: error.message,
        },
        500
      );
    }

    // Send push notification to users with notifications enabled
    try {
      const { data: tokensData } = await supabase
        .from("push_tokens")
        .select("token")
        .eq("enabled", true);
      const tokens = (tokensData ?? []).map((r) => r.token).filter(Boolean);
      if (tokens.length > 0) {
        await sendExpoPush(
          tokens,
          "New App Added",
          `${body.name} by ${body.developerName} is now available`,
          { appId: data.id, appName: body.name }
        );
      }
    } catch (pushErr) {
      console.error("Push notification error:", pushErr);
    }

    // Send email to admin for review
    try {
      await sendAdminAppNotification({
        appId: data.id,
        appName: body.name,
        developerName: body.developerName,
        version: body.version,
        category: body.category,
      });
    } catch (emailErr) {
      console.error("Admin email error:", emailErr);
    }

  if (deviceId) {
    try {
      const { data: existing } = await supabase
        .from("developer_device_usage")
        .select("upload_count")
        .eq("device_id", deviceId)
        .single();
      const count = (existing?.upload_count ?? 0) + 1;
      await supabase
        .from("developer_device_usage")
        .upsert(
          {
            device_id: deviceId,
            upload_count: count,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "device_id" }
        );
    } catch (usageErr) {
      console.error("Usage tracking error:", usageErr);
    }
  }

  return c.json({ data }, 201);
});

/** Transform Supabase row to IPAApp format for mobile */
async function toIPAApp(row: Record<string, unknown>): Promise<Record<string, unknown>> {
  const iconPath = row.icon_path as string | null;
  let iconUrl = "";
  if (iconPath) {
    const { data } = await supabase.storage.from("app-assets").createSignedUrl(iconPath, 60 * 60 * 24);
    iconUrl = data?.signedUrl ?? "";
  }
  return {
    id: row.id,
    name: row.name,
    developerName: row.developer_name,
    icon: iconUrl,
    description: row.description ?? "",
    version: row.version,
    size: "—",
    category: row.category,
    downloads: 0,
    rating: 0,
    ipaUrl: "",
    ipaPath: row.ipa_path ?? undefined,
    device: row.device ?? "both",
    screenshots: [],
    iosVersionRequired: "14.0",
    lastUpdated: row.created_at ?? "",
    status: (row.status as string) ?? "pending",
    createdAt: (row.created_at as string) ?? "",
    socialLinks:
      (row.social_twitter || row.social_website)
        ? {
            twitter: (row.social_twitter as string) ?? undefined,
            website: (row.social_website as string) ?? undefined,
          }
        : undefined,
    appStoreLink: (row.app_store_link as string) ?? undefined,
  };
}

/**
 * List apps for the store, or apps uploaded by a device.
 * GET /api/apps
 * Query: status (default "approved"), limit (default 50), deviceId (optional - when set, returns only apps uploaded by this device)
 */
appsRouter.get("/", async (c) => {
  const statusParam = c.req.query("status");
  const deviceId = c.req.query("deviceId");
  const limit = Math.min(Number(c.req.query("limit")) || 50, 100);

  let query = supabase
    .from("apps")
    .select("id, name, description, developer_name, version, category, ipa_path, device, icon_path, social_twitter, social_website, app_store_link, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (deviceId) {
    query = query.eq("uploaded_by_device_id", deviceId);
  } else {
    const statuses = statusParam ? [statusParam] : ["approved", "pending"];
    query = query.in("status", statuses);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error("Supabase apps list error:", error);
    return c.json({ error: "Failed to list apps", details: error.message }, 500);
  }

  const data = await Promise.all((rows ?? []).map(toIPAApp));
  return c.json({ data });
});

/**
 * Get a single app by ID.
 * GET /api/apps/:id
 * Query: deviceId (optional) - when provided and matches uploader, includes canDelete: true
 */
appsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const deviceId = c.req.query("deviceId");

  const { data: row, error } = await supabase
    .from("apps")
    .select("id, name, description, developer_name, version, category, ipa_path, device, icon_path, social_twitter, social_website, app_store_link, status, created_at, uploaded_by_device_id")
    .eq("id", id)
    .single();

  if (error || !row) {
    return c.json({ error: "App not found" }, 404);
  }

  const app = await toIPAApp(row);
  const canDelete =
    Boolean(deviceId) &&
    (row.uploaded_by_device_id as string | null) === deviceId;

  return c.json({ data: { ...app, canDelete } });
});

/**
 * Delete an app (developer who uploaded it only).
 * DELETE /api/apps/:id
 * Body: { deviceId }
 */
appsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const raw = await c.req.json().catch(() => ({}));
  const deviceId = raw?.deviceId;

  if (!deviceId) {
    return c.json({ error: "deviceId required" }, 400);
  }

  const { data: row, error: fetchErr } = await supabase
    .from("apps")
    .select("uploaded_by_device_id")
    .eq("id", id)
    .single();

  if (fetchErr || !row) {
    return c.json({ error: "App not found" }, 404);
  }

  if ((row.uploaded_by_device_id as string | null) !== deviceId) {
    return c.json({ error: "Only the developer who uploaded this app can delete it" }, 403);
  }

  const { error: deleteErr } = await supabase.from("apps").delete().eq("id", id);

  if (deleteErr) {
    console.error("App delete error:", deleteErr);
    return c.json({ error: "Failed to delete app" }, 500);
  }

  return c.json({ data: { deleted: true } });
});

export { appsRouter };
