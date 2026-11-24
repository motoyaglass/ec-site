import { NextRequest, NextResponse } from "next/server";
import { query, Product } from "@/lib/db";

export const dynamic = "force-dynamic";

// 一覧取得。管理画面用に ?all=1 で非公開商品も含めて返す。公開ページ用はデフォルトで公開商品のみ。
export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all");

  try {
    // 型のサイズ(mold_*)は制作用の内部情報のため、公開側のAPIには含めない(?all=1 は管理者のみ)
    const publicColumns =
      "id, name, price, description, image_url, is_active, stock_quantity, available_at, category, " +
      "finished_height, finished_diameter, is_preorder, preorder_note, preorder_ship_date, created_at";
    const sql = all
      ? "select * from products order by created_at desc"
      : `select ${publicColumns} from products where is_active = true order by created_at desc`;
    const products = await query<Product>(sql);
    return NextResponse.json({ products });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to load products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name || typeof body.price !== "number") {
    return NextResponse.json({ error: "name と price は必須です" }, { status: 400 });
  }

  const availableAt =
    typeof body.available_at === "string" && body.available_at && !isNaN(Date.parse(body.available_at))
      ? new Date(body.available_at)
      : null;

  const category =
    typeof body.category === "string" && body.category.trim() ? body.category.trim() : null;

  // サイズ(cm)。空・不正値・0以下は null
  const cm = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 && n < 1000 ? Math.round(n * 10) / 10 : null;
  };

  const isPreorder = body.is_preorder === true;

  const preorderNote =
    typeof body.preorder_note === "string" && body.preorder_note.trim()
      ? body.preorder_note.trim()
      : null;

  const preorderShipDate =
    typeof body.preorder_ship_date === "string" &&
    body.preorder_ship_date &&
    !isNaN(Date.parse(body.preorder_ship_date))
      ? body.preorder_ship_date
      : null;

  try {
    const products = await query<Product>(
      `insert into products (name, price, description, image_url, is_active, stock_quantity, available_at, category, is_preorder, preorder_note, preorder_ship_date, finished_height, finished_diameter, mold_height, mold_diameter)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       returning *`,
      [
        body.name,
        Math.round(body.price),
        body.description ?? "",
        body.image_url || null,
        body.is_active ?? true,
        typeof body.stock_quantity === "number" ? Math.max(0, Math.floor(body.stock_quantity)) : 1,
        availableAt,
        category,
        isPreorder,
        preorderNote,
        preorderShipDate,
        cm(body.finished_height),
        cm(body.finished_diameter),
        cm(body.mold_height),
        cm(body.mold_diameter),
      ]
    );
    return NextResponse.json({ product: products[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
