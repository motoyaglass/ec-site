import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// User-Agentから大まかな端末種別を判定する(マーケティング集計用の簡易分類)。
function detectDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobile|iphone|android/.test(ua)) return "mobile";
  if (!ua) return "不明";
  return "pc";
}

// サイト訪問者のブラウザから匿名で叩かれる記録用エンドポイント。
// 個人を特定する情報(IPアドレスなど)は保存しません。
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawPath = typeof body?.path === "string" ? body.path : "/";
  const path = rawPath.slice(0, 255) || "/";
  const referrer = typeof body?.referrer === "string" ? body.referrer.slice(0, 500) : "";
  const device = detectDevice(req.headers.get("user-agent") || "");

  try {
    await query("insert into page_views (path, referrer, device) values ($1, $2, $3)", [
      path,
      referrer || null,
      device,
    ]);
  } catch {
    // 集計に失敗してもサイト表示自体には影響させない
  }

  return NextResponse.json({ ok: true });
}
