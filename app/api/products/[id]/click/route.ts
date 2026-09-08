import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// 「買物籠に入れる」ボタンが押されたことを匿名で記録する。
// 管理画面でどの商品が一番クリックされているかを見るための集計用。
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await query("insert into product_clicks (product_id) values ($1)", [params.id]);
  } catch {
    // 存在しない商品IDなどで失敗しても、閲覧側の体験には影響させない
  }
  return NextResponse.json({ ok: true });
}
