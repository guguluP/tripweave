/**
 * Meta Cloud API. Business-initiated messages need an approved template.
 * Without TW_WHATSAPP_TOKEN and TW_WHATSAPP_PHONE_ID this returns false
 * and the caller uses email or the organiser's own WhatsApp link.
 */
export async function sendWhatsApp(toE164: string | null | undefined, body: string): Promise<boolean> {
  const token = process.env.TW_WHATSAPP_TOKEN?.trim();
  const phoneId = process.env.TW_WHATSAPP_PHONE_ID?.trim();
  const to = toE164?.replace(/\D/g, "");
  if (!token || !phoneId || !to || !body.trim()) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body: body.slice(0, 900) },
      }),
    });
    if (!res.ok) {
      console.error("[whatsapp]", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[whatsapp]", err instanceof Error ? err.message : "failed");
    return false;
  }
}
