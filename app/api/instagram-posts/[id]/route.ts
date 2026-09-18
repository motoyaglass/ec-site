import { NextRequest, NextResponse } from "next/server";
import { query, InstagramPost } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (typeof body.url === "string") {
    if (!body.url.trim() || !/^https:\/\/(www\.)?instagram\.com\//.test(body.url.trim())) {
      return NextResponse.json(
        { error: "instagram.com の投稿URLを入力してください" },
        { status: 400 }
      );
    }
    fields.push(`url = $${i++}`);
    values.push(body.url.trim());
  }
  if (typeof body.sort_order === "number") {
    fields.push(`sort_order = $${i++}`);
    values.push(Math.floor(body.sort_order));
  }
  if (typeof body.is_active === "boolean") {
    fields.push(`is_active = $${i++}`);
    values.push(body.is_active);
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: "更新する項目がありません" }, { status: 400 });
  }

  values.push(params.id);

  try {
    const posts = await query<InstagramPost>(
      `update instagram_posts set ${fields.join(", ")} where id = $${i} returning *`,
      values
    );
    if (posts.length === 0) {
      return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ post: posts[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to update instagram post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await query("delete from instagram_posts where id = $1", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to delete instagram post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
