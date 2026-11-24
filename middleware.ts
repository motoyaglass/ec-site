import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/adminSession";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedPage = pathname.startsWith("/admin/dashboard");
  const isProtectedApi =
    // /api/products/[id]/click は訪問者から匿名でクリックを記録するための公開エンドポイント
    (pathname.startsWith("/api/products") &&
      req.method !== "GET" &&
      !pathname.endsWith("/click")) ||
    // /api/products?all=1 は非公開商品(書類専用商品など)も返すため管理者のみ
    (pathname === "/api/products" && req.method === "GET" && req.nextUrl.searchParams.has("all")) ||
    (pathname.startsWith("/api/posts") && req.method !== "GET") ||
    (pathname.startsWith("/api/partners") && req.method !== "GET") ||
    // /api/orders は注文者の個人情報を含むため、GETも含めて常に保護する
    pathname.startsWith("/api/orders") ||
    // /api/upload は管理画面からの画像アップロード専用(配信用の /api/uploads/* は公開のまま)
    (pathname === "/api/upload" || pathname.startsWith("/api/upload/")) ||
    // /api/stats はアクセス状況の集計(管理画面専用)。/api/track は訪問者から匿名で叩かれるため公開のまま。
    pathname.startsWith("/api/stats") ||
    // /api/bookkeeping は請求書・経費など業務データのため、GETも含めて常に保護する
    pathname.startsWith("/api/bookkeeping") ||
    // /api/masters は型のサイズなど内部情報を含む商品マスタ(GETも含めて管理者のみ)
    pathname.startsWith("/api/masters");

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const session = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const authorized = await verifyAdminSessionToken(session, process.env.ADMIN_SESSION_SECRET);

  if (!authorized) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/dashboard/:path*",
    "/api/products/:path*",
    "/api/posts/:path*",
    "/api/partners/:path*",
    "/api/orders/:path*",
    "/api/upload/:path*",
    "/api/stats/:path*",
    "/api/bookkeeping/:path*",
    "/api/masters/:path*",
  ],
};
