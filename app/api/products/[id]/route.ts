import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string") update.name = body.name;
  if (typeof body.price === "number") update.price = Math.round(body.price);
  if (typeof body.description === "string") update.description = body.description;
  if (typeof body.image_url === "string" || body.image_url === null) update.image_url = body.image_url || null;
  if (typeof body.is_active === "boolean") update.is_active = body.is_active;
  if (typeof body.stock_quantity === "number")
    update.stock_quantity = Math.max(0, Math.floor(body.stock_quantity));

  const { data, error } = await supabaseAdmin
    .from("products")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin.from("products").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
