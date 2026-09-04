import { NextRequest, NextResponse } from "next/server";
import { query, Partner } from "@/lib/db";

export const dynamic = "force-dynamic";

// 一覧取得。管理画面用に ?all=1 で非公開の取引先も含めて返す。公開ページ用はデフォルトで公開中のみ。
export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all");

  try {
    const sql = all
      ? "select * from partners order by name asc"
      : "select * from partners where is_active = true order by name asc";
    const partners = await query<Partner>(sql);
    return NextResponse.json({ partners });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to load partners";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "店舗名は必須です" }, { status: 400 });
  }

  try {
    const partners = await query<Partner>(
      `insert into partners (name, address, is_active)
       values ($1, $2, $3)
       returning *`,
      [body.name.trim(), typeof body.address === "string" ? body.address.trim() || null : null, body.is_active ?? true]
    );
    return NextResponse.json({ partner: partners[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to create partner";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
