import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 一覧取得。管理画面用に ?all=1 で非公開記事も含めて返す。公開ページ用はデフォルトで公開記事のみ。
export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all");

  let query = supabaseAdmin.from("posts").select("*").order("created_at", { ascending: false });
  if (!all) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title) {
    return NextResponse.json({ error: "title は必須です" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert({
      title: body.title,
      content: body.content ?? "",
      cover_image_url: body.cover_image_url || null,
      is_published: body.is_published ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}
