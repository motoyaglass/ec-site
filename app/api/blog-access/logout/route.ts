import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 日誌の閲覧用Cookieを削除し、確認フォームに戻す(別のメールアドレスで確認し直す用)。
export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/blog", req.url));
  res.cookies.set("blog_access", "", { path: "/", maxAge: 0 });
  return res;
}
