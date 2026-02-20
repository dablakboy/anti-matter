import { Hono } from "hono";
import { supabase } from "../lib/supabase";

const IPA_BUCKET = "ipa-files";

/** Max IPA file size: 2GB */
const MAX_IPA_BYTES = 2 * 1024 * 1024 * 1024;

const ipaStorageRouter = new Hono();

/**
 * Upload an IPA file via base64 (avoids FormData issues on some clients).
 * POST /api/ipa-storage/upload-base64
 * Body: { file: string (base64), filename: string }
 * Max file size: 2GB. Ensure server/reverse proxy body limit is ~2.7GB for base64 overhead.
 */
ipaStorageRouter.post("/upload-base64", async (c) => {
  let body: { file?: string; filename?: string };
  try {
    body = (await c.req.json()) as { file?: string; filename?: string };
  } catch {
    return c.json({ error: "Invalid JSON body. Check network connection and try again." }, 400);
  }

  const { file: b64, filename } = body;

  if (!b64 || typeof b64 !== "string") {
    return c.json({ error: "No file provided (expected base64)" }, 400);
  }

  const name = (filename || "app.ipa").replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!name.toLowerCase().endsWith(".ipa")) {
    return c.json({ error: "Only .ipa files are allowed" }, 400);
  }

  const estimatedBytes = Math.ceil((b64.length * 3) / 4);
  if (estimatedBytes > MAX_IPA_BYTES) {
    return c.json({
      error: `File too large. Maximum size is 2GB (your file is ~${(estimatedBytes / 1024 / 1024 / 1024).toFixed(2)}GB).`,
    }, 413);
  }

  const path = `${Date.now()}-${name}`;

  let buffer: Uint8Array;
  try {
    const binary = atob(b64);
    buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  } catch {
    return c.json({ error: "Invalid base64 file. The file may be corrupted." }, 400);
  }

  try {
    const { data, error } = await supabase.storage.from(IPA_BUCKET).upload(path, buffer, {
      contentType: "application/octet-stream",
      upsert: false,
    });

    if (error) {
      console.error("Supabase upload error:", error);
      return c.json({
        error: "Storage upload failed. The server or storage service may be temporarily unavailable.",
        details: error.message,
      }, 500);
    }

    const { data: urlData } = await supabase.storage.from(IPA_BUCKET).createSignedUrl(data.path, 60 * 60 * 24 * 7);

    return c.json({
      data: {
        path: data.path,
        fullPath: data.fullPath,
        signedUrl: urlData?.signedUrl,
        expiresIn: "7 days",
      },
    }, 201);
  } catch (err) {
    console.error("IPA upload error:", err);
    return c.json({
      error: "Upload failed. The server may be overloaded or the storage service is down. Please try again later.",
    }, 500);
  }
});

/**
 * Upload an IPA file to Supabase Storage.
 * POST /api/ipa-storage/upload
 * Body: multipart/form-data with "file" field
 */
ipaStorageRouter.post("/upload", async (c) => {
  const contentType = c.req.header("content-type") || "";
  if (contentType.includes("application/json")) {
    return c.json({ error: "Use /upload-base64 for JSON body" }, 400);
  }

  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  const filename = file.name;
  if (!filename.toLowerCase().endsWith(".ipa")) {
    return c.json({ error: "Only .ipa files are allowed" }, 400);
  }

  // Path: ipa-files/{timestamp}-{original-filename}
  const path = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { data, error } = await supabase.storage.from(IPA_BUCKET).upload(path, buffer, {
    contentType: "application/octet-stream",
    upsert: false,
  });

  if (error) {
    console.error("Supabase upload error:", error);
    return c.json(
      {
        error: "Upload failed",
        details: error.message,
      },
      500
    );
  }

  // Get a signed URL for download (valid 7 days)
  const {
    data: urlData,
    error: urlError,
  } = await supabase.storage.from(IPA_BUCKET).createSignedUrl(data.path, 60 * 60 * 24 * 7);

  if (urlError) {
    return c.json(
      {
        data: {
          path: data.path,
          fullPath: data.fullPath,
          message: "File uploaded. Signed URL generation failed - use /download to get a link.",
        },
      },
      201
    );
  }

  return c.json(
    {
      data: {
        path: data.path,
        fullPath: data.fullPath,
        signedUrl: urlData?.signedUrl,
        expiresIn: "7 days",
      },
    },
    201
  );
});

/**
 * Get a signed download URL for an IPA file.
 * POST /api/ipa-storage/download
 * Body: { path: string }
 */
ipaStorageRouter.post("/download", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { path } = body as { path?: string };

  if (!path || typeof path !== "string") {
    return c.json({ error: "path is required" }, 400);
  }

  const { data, error } = await supabase.storage
    .from(IPA_BUCKET)
    .createSignedUrl(path, 60 * 60); // 1 hour

  if (error) {
    return c.json({ error: "Failed to create download link", details: error.message }, 500);
  }

  return c.json({ data: { signedUrl: data.signedUrl, expiresIn: "1 hour" } });
});

export { ipaStorageRouter };
