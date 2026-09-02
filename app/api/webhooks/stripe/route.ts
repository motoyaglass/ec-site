import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { pool, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!secret || !stripeKey) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("missing stripe-signature header");
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await recordOrderAndDecrementStock(stripe, session);
    } catch (err) {
      // ここで500を返すとStripeが再送を繰り返すため、ログに残した上で200を返す
      console.error("Failed to record order from webhook:", err);
    }
  }

  return NextResponse.json({ received: true });
}

async function recordOrderAndDecrementStock(stripe: Stripe, session: Stripe.Checkout.Session) {
  // 冪等性: Stripeはイベントを複数回送信することがあるため、同じセッションIDの注文が
  // 既に保存されていれば何もしない(在庫の二重減算を防ぐ)
  const existingOrder = await queryOne<{ id: string }>(
    "select id from orders where stripe_session_id = $1",
    [session.id]
  );
  if (existingOrder) return;

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

  let metaItems: { productId: string; quantity: number }[] = [];
  try {
    metaItems = JSON.parse(session.metadata?.items ?? "[]");
  } catch {
    metaItems = [];
  }

  // Stripeの正式なline_items(名前・実際に請求された価格)に、チェックアウト作成時に
  // metadataへ保存しておいた商品IDを順番に対応付ける
  const items = lineItems.data.map((li, i) => ({
    id: metaItems[i]?.productId ?? "",
    name: li.description ?? "",
    price: li.price?.unit_amount ?? 0,
    quantity: li.quantity ?? 0,
  }));

  // Stripeのバージョンによって shipping_details / shipping のどちらかに配送先が入る
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shipping = (session as any).shipping_details ?? (session as any).shipping ?? null;

  await pool.query(
    `insert into orders (stripe_session_id, customer_email, shipping_name, shipping_address, items, amount_total)
     values ($1, $2, $3, $4, $5, $6)`,
    [
      session.id,
      session.customer_details?.email ?? null,
      shipping?.name ?? session.customer_details?.name ?? null,
      shipping?.address ? JSON.stringify(shipping.address) : null,
      JSON.stringify(items),
      session.amount_total ?? 0,
    ]
  );

  for (const m of metaItems) {
    if (!m.productId || !m.quantity) continue;
    await pool.query("select decrement_stock($1, $2)", [m.productId, m.quantity]);
  }
}
