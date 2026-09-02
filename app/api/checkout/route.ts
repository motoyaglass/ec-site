import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type CheckoutItem = { productId: string; quantity: number };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawItems = Array.isArray(body?.items) ? body.items : null;

  if (!rawItems || rawItems.length === 0) {
    return NextResponse.json({ error: "items is required" }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY が設定されていません" },
      { status: 500 }
    );
  }

  const normalized: CheckoutItem[] = rawItems
    .map((i: { productId?: unknown; quantity?: unknown }) => ({
      productId: String(i.productId ?? ""),
      quantity: Math.floor(Number(i.quantity)),
    }))
    .filter((i: CheckoutItem) => i.productId && Number.isFinite(i.quantity) && i.quantity > 0);

  if (normalized.length === 0) {
    return NextResponse.json({ error: "有効な商品がありません" }, { status: 400 });
  }

  const ids = normalized.map((i) => i.productId);
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .in("id", ids)
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const item of normalized) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 });
    }
    if (product.stock_quantity < item.quantity) {
      return NextResponse.json(
        { error: `「${product.name}」の在庫が足りません(残り${product.stock_quantity}点)` },
        { status: 400 }
      );
    }
    lineItems.push({
      price_data: {
        currency: "jpy",
        product_data: {
          name: product.name,
          images: product.image_url ? [product.image_url] : undefined,
        },
        unit_amount: product.price, // JPYはゼロdecimal通貨のためそのまま円の値
      },
      quantity: item.quantity,
    });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ["JP"] },
      // Webhookで在庫を減算する際に使う商品ID・数量の一覧(小規模ショップ向けの簡易実装)
      metadata: {
        items: JSON.stringify(normalized),
      },
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Stripeでエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
