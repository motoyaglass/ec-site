import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 一覧取得。管理画面用に ?all=1 で非公開商品も含めて返す。公開ページ用はデフォルトで公開商品のみ。
export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all");

  let query = supabaseAdmin.from("products").select("*").order("created_at", { ascending: false });
  if (!all) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name || typeof body.price !== "number") {
    return NextResponse.json({ error: "name と price は必須です" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .insert({
      name: body.name,
      price: Math.round(body.price),
      description: body.description ?? "",
      image_url: body.image_url || null,
      is_active: body.is_active ?? true,
      stock_quantity:
        typeof body.stock_quantity === "number" ? Math.max(0, Math.floor(body.stock_quantity)) : 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}
