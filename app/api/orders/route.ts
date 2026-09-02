import { NextResponse } from "next/server";
import { query, Order } from "@/lib/db";

export const dynamic = "force-dynamic";

// このエンドポイントは注文者の個人情報(メール・住所)を含むため、
// middleware.ts で GET も含めて管理者ログイン必須にしている。
export async function GET() {
  try {
    const orders = await query<Order>(
      "select * from orders order by created_at desc limit 200"
    );
    return NextResponse.json({ orders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to load orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
