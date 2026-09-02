import { NextRequest, NextResponse } from "next/server";
import { query, Product } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (typeof body.name === "string") {
    fields.push(`name = $${i++}`);
    values.push(body.name);
  }
  if (typeof body.price === "number") {
    fields.push(`price = $${i++}`);
    values.push(Math.round(body.price));
  }
  if (typeof body.description === "string") {
    fields.push(`description = $${i++}`);
    values.push(body.description);
  }
  if (typeof body.image_url === "string" || body.image_url === null) {
    fields.push(`image_url = $${i++}`);
    values.push(body.image_url || null);
  }
  if (typeof body.is_active === "boolean") {
    fields.push(`is_active = $${i++}`);
    values.push(body.is_active);
  }
  if (typeof body.stock_quantity === "number") {
    fields.push(`stock_quantity = $${i++}`);
    values.push(Math.max(0, Math.floor(body.stock_quantity)));
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: "更新する項目がありません" }, { status: 400 });
  }

  values.push(params.id);

  try {
    const products = await query<Product>(
      `update products set ${fields.join(", ")} where id = $${i} returning *`,
      values
    );
    if (products.length === 0) {
      return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ product: products[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to update product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await query("delete from products where id = $1", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to delete product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
