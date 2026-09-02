import { NextRequest, NextResponse } from "next/server";
import { query, Post } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const fields: string[] = ["updated_at = now()"];
  const values: unknown[] = [];
  let i = 1;

  if (typeof body.title === "string") {
    fields.push(`title = $${i++}`);
    values.push(body.title);
  }
  if (typeof body.content === "string") {
    fields.push(`content = $${i++}`);
    values.push(body.content);
  }
  if (typeof body.cover_image_url === "string" || body.cover_image_url === null) {
    fields.push(`cover_image_url = $${i++}`);
    values.push(body.cover_image_url || null);
  }
  if (typeof body.is_published === "boolean") {
    fields.push(`is_published = $${i++}`);
    values.push(body.is_published);
  }

  values.push(params.id);

  try {
    const posts = await query<Post>(
      `update posts set ${fields.join(", ")} where id = $${i} returning *`,
      values
    );
    if (posts.length === 0) {
      return NextResponse.json({ error: "記事が見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ post: posts[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to update post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await query("delete from posts where id = $1", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to delete post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
