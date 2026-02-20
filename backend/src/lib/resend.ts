/**
 * Send admin notification email via Resend API.
 * Requires RESEND_API_KEY. If not set, no email is sent.
 */
export async function sendAdminAppNotification(options: {
  appId: string;
  appName: string;
  developerName: string;
  version: string;
  category: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const from = process.env.RESEND_FROM ?? "Anti-Matter <onboarding@resend.dev>";

  const body = {
    from,
    to: ["contact@digiwall.io"],
    subject: `[Anti-Matter] New app pending review: ${options.appName}`,
    html: `
      <h2>New app submitted for review</h2>
      <p><strong>App:</strong> ${escapeHtml(options.appName)}</p>
      <p><strong>Developer:</strong> ${escapeHtml(options.developerName)}</p>
      <p><strong>Version:</strong> ${escapeHtml(options.version)}</p>
      <p><strong>Category:</strong> ${escapeHtml(options.category)}</p>
      <p><strong>App ID:</strong> ${escapeHtml(options.appId)}</p>
      <p>Please review and approve in Supabase.</p>
    `,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend email error:", res.status, text);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
