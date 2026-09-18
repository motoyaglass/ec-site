import { NextRequest, NextResponse } from "next/server";
import { query, Order } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["処理中", "発送済み"];

// 注文状況(処理中/発送済み)の更新。GETも含め /api/orders/* は middleware で管理者ログイン必須。
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.status !== "string" || !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "status は 処理中 か 発送済み を指定してください" }, { status: 400 });
  }

  try {
    const orders = await query<Order>(
      "update orders set status = $1 where id = $2 returning *",
      [body.status, params.id]
    );
    if (orders.length === 0) {
      return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ order: orders[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to update order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
