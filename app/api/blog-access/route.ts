import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { signBlogAccess } from "@/lib/blogAccess";

export const dynamic = "force-dynamic";

function safePath(path: string): string {
  return path.startsWith("/blog") ? path : "/blog";
}

// サイト経由でのご購入(注文テーブルに記録がある)メールアドレスかどうかを照合し、
// 一致すれば日誌の閲覧用Cookieを発行する。
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const rawEmail = String(form?.get("email") || "").trim();
  const redirectTo = safePath(String(form?.get("redirectTo") || "/blog"));

  function fail(error: string) {
    const url = new URL(redirectTo, req.url);
    url.searchParams.set("blogAccessError", error);
    return NextResponse.redirect(url, { status: 303 });
  }

  if (!rawEmail) {
    return fail("メールアドレスを入力してください");
  }

  let found = false;
  try {
    const rows = await query<{ id: string }>(
      "select id from orders where lower(customer_email) = lower($1) limit 1",
      [rawEmail]
    );
    found = rows.length > 0;
  } catch {
    return fail("確認中にエラーが発生しました。しばらくしてからお試しください");
  }

  if (!found) {
    return fail("ご購入時のメールアドレスと一致するものが見つかりませんでした");
  }

  const token = signBlogAccess(rawEmail.toLowerCase());
  const url = new URL(redirectTo, req.url);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set("blog_access", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1年
  });
  return res;
}
