import { NextRequest, NextResponse } from "next/server";
import { query, Post } from "@/lib/db";
import { verifyBlogAccessCookie } from "@/lib/blogAccess";

export const dynamic = "force-dynamic";

// 一覧取得。管理画面用に ?all=1 で非公開記事も含めて返す。公開ページ用はデフォルトで公開記事のみ。
// 日誌は有料記事(is_free=false)がサイト購入者限定のため、閲覧用Cookieが無ければ無料記事のみ返す。
export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all");

  if (all) {
    try {
      const posts = await query<Post>("select * from posts order by created_at desc");
      return NextResponse.json({ posts });
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed to load posts";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const verified = verifyBlogAccessCookie(req.cookies.get("blog_access")?.value);

  try {
    const sql = verified
      ? "select * from posts where is_published = true order by created_at desc"
      : "select * from posts where is_published = true and is_free = true order by created_at desc";
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
      `insert into posts (title, content, cover_image_url, is_published, is_free)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [
        body.title,
        body.content ?? "",
        body.cover_image_url || null,
        body.is_published ?? true,
        body.is_free ?? false,
      ]
    );
    return NextResponse.json({ post: posts[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to create post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
