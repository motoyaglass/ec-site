import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// 書類作成・確定申告用のデータAPI。/api/bookkeeping/* は middleware で管理者ログイン必須。
// resource: profile | vendors | documents | expenses(商品はECの /api/products を共通で使う)

const PROFILE_KEYS = [
  "s-name", "s-addr", "s-tel", "s-mail", "s-business", "s-invoiceno",
  "b-bank", "b-branch", "b-type", "b-number", "b-holder",
];

function str(v: unknown, max = 500): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}
function int(v: unknown): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : 0;
}
function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest, { params }: { params: { resource: string } }) {
  try {
    switch (params.resource) {
      case "profile": {
        const rows = await query<{ key: string; value: string }>("select key, value from bk_settings");
        const profile: Record<string, string> = {};
        rows.forEach((r) => (profile[r.key] = r.value));
        return NextResponse.json({ profile });
      }
      case "vendors":
        return NextResponse.json({
          vendors: await query("select id, name, contact from bk_vendors order by created_at"),
        });
      case "documents": {
        const type = req.nextUrl.searchParams.get("type");
        if (type !== "invoice" && type !== "delivery") return bad("type が不正です");
        const documents = await query(
          `select id, type, doc_no as "no", to_name as "to", doc_date as "date", due_date as "due",
                  note, items, sub, tax, total
           from bk_documents where type = $1 order by created_at desc limit 500`,
          [type]
        );
        return NextResponse.json({ documents });
      }
      case "expenses":
        return NextResponse.json({
          expenses: await query(
            `select id, expense_date as "date", category, vendor, memo, amount
             from bk_expenses order by expense_date desc, created_at desc limit 2000`
          ),
        });
      default:
        return bad("not found", 404);
    }
  } catch (err) {
    return bad(err instanceof Error ? err.message : "failed", 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: { resource: string } }) {
  const body = await req.json().catch(() => null);
  if (!body) return bad("invalid body");

  try {
    switch (params.resource) {
      case "profile": {
        // 発行者情報は許可したキーだけを upsert する
        for (const key of PROFILE_KEYS) {
          if (typeof body[key] !== "string") continue;
          await query(
            "insert into bk_settings (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value",
            [key, str(body[key])]
          );
        }
        return NextResponse.json({ ok: true });
      }
      case "vendors": {
        const name = str(body.name, 200).trim();
        if (!name) return bad("業者名を入力してください");
        await query("insert into bk_vendors (name, contact) values ($1, $2)", [name, str(body.contact, 500)]);
        return NextResponse.json({ ok: true });
      }
      case "documents": {
        const type = body.type;
        if (type !== "invoice" && type !== "delivery") return bad("type が不正です");
        const items = Array.isArray(body.items)
          ? body.items.slice(0, 100).map((i: { name?: unknown; size?: unknown; qty?: unknown; price?: unknown }) => ({
              name: str(i?.name, 200),
              size: str(i?.size, 200),
              qty: Math.max(0, int(i?.qty)),
              price: Math.max(0, int(i?.price)),
            }))
          : [];
        // 金額はクライアントの値を信用せずサーバーで再計算する。単価はECと同じ税込価格で、
        // 合計(税込)=Σ単価×数量、消費税は内税(10%)の内訳として切り捨て計算、税抜=合計-消費税
        const total = items.reduce((s: number, i: { qty: number; price: number }) => s + i.qty * i.price, 0);
        const tax = Math.floor((total * 10) / 110);
        const sub = total - tax;
        await query(
          `insert into bk_documents (type, doc_no, to_name, doc_date, due_date, note, items, sub, tax, total)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [type, str(body.no, 100), str(body.to, 200), str(body.date, 10), str(body.due, 10),
           str(body.note, 2000), JSON.stringify(items), sub, tax, total]
        );
        return NextResponse.json({ ok: true });
      }
      case "expenses": {
        const date = str(body.date, 10);
        const category = str(body.category, 100);
        const amount = int(body.amount);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad("日付が不正です");
        if (!category) return bad("費目を選択してください");
        if (amount <= 0) return bad("金額を入力してください");
        await query(
          "insert into bk_expenses (expense_date, category, vendor, memo, amount) values ($1, $2, $3, $4, $5)",
          [date, category, str(body.vendor, 200), str(body.memo, 500), amount]
        );
        return NextResponse.json({ ok: true });
      }
      default:
        return bad("not found", 404);
    }
  } catch (err) {
    return bad(err instanceof Error ? err.message : "failed", 500);
  }
}
