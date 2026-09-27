/** Captured-payment listing for ops reconcile. */
function getKeyId() {
  return process.env.RAZORPAY_KEY_ID?.trim() || process.env.VITE_RAZORPAY_KEY_ID?.trim() || "";
}
function getKeySecret() {
  return process.env.RAZORPAY_KEY_SECRET?.trim() || "";
}
function authHeader() {
  const id = getKeyId();
  const secret = getKeySecret();
  if (!id || !secret) throw new Error("Razorpay is not configured (missing KEY_ID or KEY_SECRET).");
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

export async function listRecentCapturedPayments(sinceUnix: number): Promise<
  Array<{ id: string; orderId: string | null; amountPaise: number; email: string | null; createdAt: number }>
> {
  const out: Array<{
    id: string;
    orderId: string | null;
    amountPaise: number;
    email: string | null;
    createdAt: number;
  }> = [];
  let skip = 0;
  for (let page = 0; page < 5; page += 1) {
    const url = new URL("https://api.razorpay.com/v1/payments");
    url.searchParams.set("from", String(sinceUnix));
    url.searchParams.set("count", "100");
    url.searchParams.set("skip", String(skip));
    const res = await fetch(url, { headers: { Authorization: authHeader() } });
    if (!res.ok) {
      console.error("[razorpay] list payments", res.status);
      break;
    }
    const json = (await res.json()) as {
      items?: Array<{
        id?: string;
        status?: string;
        amount?: number;
        order_id?: string;
        email?: string;
        created_at?: number;
      }>;
    };
    const items = json.items ?? [];
    if (!items.length) break;
    for (const item of items) {
      if (!item.id || item.status !== "captured" || !item.amount) continue;
      if (item.amount < 200) continue;
      out.push({
        id: item.id,
        orderId: item.order_id ?? null,
        amountPaise: item.amount,
        email: item.email ?? null,
        createdAt: item.created_at ?? sinceUnix,
      });
    }
    skip += items.length;
    if (items.length < 100) break;
  }
  return out;
}
