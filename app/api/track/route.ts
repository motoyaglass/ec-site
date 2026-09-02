import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// サイト訪問者のブラウザから匿名で叩かれる記録用エンドポイント。
// 個人を特定する情報(IPアドレスなど)は保存しません。
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawPath = typeof body?.path === "string" ? body.path : "/";
  const path = rawPath.slice(0, 255) || "/";

  try {
    await query("insert into page_views (path) values ($1)", [path]);
  } catch {
    // 集計に失敗してもサイト表示自体には影響させない
  }

  return NextResponse.json({ ok: true });
}
