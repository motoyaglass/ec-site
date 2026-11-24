import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cm(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n < 1000 ? Math.round(n * 10) / 10 : null;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 200) : "";
  if (!name) return NextResponse.json({ error: "商品名を入力してください" }, { status: 400 });
  try {
    await query(
      `update product_masters set name = $1, price = $2, finished_height = $3, finished_diameter = $4,
         mold_height = $5, mold_diameter = $6 where id = $7`,
      [name, Math.max(0, Math.round(Number(body.price) || 0)), cm(body.finished_height),
       cm(body.finished_diameter), cm(body.mold_height), cm(body.mold_diameter), params.id]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  try {
    await query("delete from product_masters where id = $1", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status: 500 });
  }
}
