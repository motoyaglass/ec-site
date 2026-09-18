import { NextRequest, NextResponse } from "next/server";
import { query, InstagramPost } from "@/lib/db";

export const dynamic = "force-dynamic";

// 一覧取得。トップページ表示用はデフォルトで公開中のみ、管理画面用は ?all=1 で全件返す。
export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all");

  try {
    const sql = all
      ? "select * from instagram_posts order by sort_order asc, created_at desc"
      : "select * from instagram_posts where is_active = true order by sort_order asc, created_at desc";
    const posts = await query<InstagramPost>(sql);
    return NextResponse.json({ posts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to load instagram posts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.url || typeof body.url !== "string" || !body.url.trim()) {
    return NextResponse.json({ error: "投稿URLは必須です" }, { status: 400 });
  }
  if (!/^https:\/\/(www\.)?instagram\.com\//.test(body.url.trim())) {
    return NextResponse.json(
      { error: "instagram.com の投稿URLを入力してください" },
      { status: 400 }
    );
  }

  try {
    const posts = await query<InstagramPost>(
      `insert into instagram_posts (url, sort_order, is_active)
       values ($1, $2, $3)
       returning *`,
      [
        body.url.trim(),
        typeof body.sort_order === "number" ? Math.floor(body.sort_order) : 0,
        body.is_active ?? true,
      ]
    );
    return NextResponse.json({ post: posts[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to create instagram post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
