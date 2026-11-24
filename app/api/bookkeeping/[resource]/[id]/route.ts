import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const TABLES: Record<string, string> = {
  vendors: "bk_vendors",
  documents: "bk_documents",
  expenses: "bk_expenses",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { resource: string; id: string } }
) {
  const table = TABLES[params.resource]; // 許可したテーブル名のみ(SQLに埋め込むのはこの固定値だけ)
  if (!table) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  try {
    await query(`delete from ${table} where id = $1`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status: 500 });
  }
}
