import { Hono } from "hono";
import { supabase } from "../lib/supabase";

const APP_ASSETS_BUCKET = "app-assets";

const appAssetsRouter = new Hono();

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Max icon size: 10MB */
const MAX_ICON_BYTES = 10 * 1024 * 1024;

/**
 * Upload an app icon via base64 (avoids FormData issues on some clients).
 * POST /api/app-assets/upload-base64
 * Body: { file: string (base64), filename?: string, mimeType?: string }
 */
appAssetsRouter.post("/upload-base64", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { file: b64, filename = "icon.jpg", mimeType = "image/jpeg" } = body as {
    file?: string;
    filename?: string;
    mimeType?: string;
  };

  if (!b64 || typeof b64 !== "string") {
    return c.json({ error: "No file provided (expected base64)" }, 400);
  }

  const contentType = mimeType || "image/jpeg";
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    return c.json({ error: "Only image files (JPEG, PNG, WebP, GIF) are allowed" }, 400);
  }

  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : contentType === "image/gif" ? "gif" : "jpg";
  const path = `icons/${Date.now()}-${String(filename).replace(/[^a-zA-Z0-9._-]/g, "_")}.${ext}`;

  let buffer: Uint8Array;
  try {
    const binary = atob(b64);
    buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  } catch {
    return c.json({ error: "Invalid base64. File may be corrupted or not an image." }, 400);
  }

  if (buffer.length > MAX_ICON_BYTES) {
    return c.json({ error: `Icon too large. Maximum size is ${MAX_ICON_BYTES / 1024 / 1024}MB.` }, 413);
  }

  try {
    const { data, error } = await supabase.storage.from(APP_ASSETS_BUCKET).upload(path, buffer, {
      contentType,
      upsert: false,
    });

    if (error) {
      console.error("Supabase app-assets upload error:", error);
      return c.json({ error: "Storage upload failed. Please try again later." }, 500);
    }

    return c.json({ data: { path: data.path, fullPath: data.fullPath } }, 201);
  } catch (err) {
    console.error("App-assets upload error:", err);
    return c.json({ error: "Upload failed. The server or storage may be temporarily unavailable." }, 500);
  }
});

/**
 * Upload an app icon (or other app image) to Supabase Storage.
 * POST /api/app-assets/upload
 * Body: multipart/form-data with "file" field
 */
appAssetsRouter.post("/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  const contentType = file.type || "image/jpeg";
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    return c.json({ error: "Only image files (JPEG, PNG, WebP, GIF) are allowed" }, 400);
  }

  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : contentType === "image/gif" ? "gif" : "jpg";
  const path = `icons/${Date.now()}-${(file.name || "icon").replace(/[^a-zA-Z0-9._-]/g, "_")}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { data, error } = await supabase.storage.from(APP_ASSETS_BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    console.error("Supabase app-assets upload error:", error);
    return c.json(
      {
        error: "Upload failed",
        details: error.message,
      },
      500
    );
  }

  return c.json(
    {
      data: {
        path: data.path,
        fullPath: data.fullPath,
      },
    },
    201
  );
});

/**
 * Get a public or signed URL for an app asset (e.g. icon).
 * POST /api/app-assets/url
 * Body: { path: string }
 * If the bucket is public, we return the public URL; otherwise signed.
 */
appAssetsRouter.post("/url", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { path } = body as { path?: string };

  if (!path || typeof path !== "string") {
    return c.json({ error: "path is required" }, 400);
  }

  const { data, error } = await supabase.storage
    .from(APP_ASSETS_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year for icons

  if (error) {
    return c.json({ error: "Failed to get URL", details: error.message }, 500);
  }

  return c.json({ data: { url: data.signedUrl } });
});

export { appAssetsRouter };
