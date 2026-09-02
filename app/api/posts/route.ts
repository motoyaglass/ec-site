import { NextRequest, NextResponse } from "next/server";
import { query, Post } from "@/lib/db";

export const dynamic = "force-dynamic";

// 一覧取得。管理画面用に ?all=1 で非公開記事も含めて返す。公開ページ用はデフォルトで公開記事のみ。
export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all");

  try {
    const sql = all
      ? "select * from posts order by created_at desc"
      : "select * from posts where is_published = true order by created_at desc";
    const posts = await query<Post>(sql);
    return NextResponse.json({ posts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to load posts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title) {
    return NextResponse.json({ error: "title は必須です" }, { status: 400 });
  }

  try {
    const posts = await query<Post>(
      `insert into posts (title, content, cover_image_url, is_published)
       values ($1, $2, $3, $4)
       returning *`,
      [body.title, body.content ?? "", body.cover_image_url || null, body.is_published ?? true]
    );
    return NextResponse.json({ post: posts[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to create post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
