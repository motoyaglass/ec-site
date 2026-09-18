import { NextRequest, NextResponse } from "next/server";
import { query, Order } from "@/lib/db";

export const dynamic = "force-dynamic";

// 購入者がご自身の注文状況を確認するための公開エンドポイント。
// ご購入時に使用したメールアドレスと一致する注文のみを返す(日誌の閲覧制限と同じ照合方法)。
// /api/orders (管理画面専用) とは別パスにすることで middleware の管理者ログイン必須ガードの対象外にしている。
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email) {
    return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  }

  try {
    const orders = await query<Order>(
      "select * from orders where lower(customer_email) = lower($1) order by created_at desc limit 50",
      [email]
    );
    return NextResponse.json({ orders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to look up orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
