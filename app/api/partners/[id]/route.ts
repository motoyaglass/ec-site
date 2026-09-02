import { NextRequest, NextResponse } from "next/server";
import { query, Partner } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (typeof body.name === "string") {
    if (!body.name.trim()) {
      return NextResponse.json({ error: "店舗名は必須です" }, { status: 400 });
    }
    fields.push(`name = $${i++}`);
    values.push(body.name.trim());
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
    const partners = await query<Partner>(
      `update partners set ${fields.join(", ")} where id = $${i} returning *`,
      values
    );
    if (partners.length === 0) {
      return NextResponse.json({ error: "取引先が見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ partner: partners[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to update partner";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await query("delete from partners where id = $1", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to delete partner";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
