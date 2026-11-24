import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// 商品マスタ(名前・価格・サイズの台帳)。ECの出品(products)や請求書・納品書の品目のもとになる。
// 型のサイズなど内部情報を含むため、/api/masters/* は middleware で管理者ログイン必須(GETも含む)。

const COLUMNS = "id, name, price, finished_height, finished_diameter, mold_height, mold_diameter";

function cm(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n < 1000 ? Math.round(n * 10) / 10 : null;
}

export async function GET() {
  try {
    const masters = await query(`select ${COLUMNS} from product_masters order by price, name`);
    return NextResponse.json({ masters });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  try {
    // まとめて登録: lines = "商品名,価格" を1行ずつ(カンマ・タブ・空白区切り、末尾が価格)
    if (typeof body.lines === "string") {
      let added = 0;
      for (const raw of body.lines.split(/\r?\n/).slice(0, 500)) {
        const m = raw.trim().match(/^(.+?)[,\t\s]+[¥￥]?([\d,]+)円?$/);
        if (!m) continue;
        const price = Number(m[2].replace(/,/g, ""));
        await query("insert into product_masters (name, price) values ($1, $2)", [m[1].trim().slice(0, 200), price]);
        added++;
      }
      return NextResponse.json({ ok: true, added });
    }

    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
    if (!name) return NextResponse.json({ error: "商品名を入力してください" }, { status: 400 });
    const price = Math.max(0, Math.round(Number(body.price) || 0));
    await query(
      `insert into product_masters (name, price, finished_height, finished_diameter, mold_height, mold_diameter)
       values ($1, $2, $3, $4, $5, $6)`,
      [name, price, cm(body.finished_height), cm(body.finished_diameter), cm(body.mold_height), cm(body.mold_diameter)]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status: 500 });
  }
}
