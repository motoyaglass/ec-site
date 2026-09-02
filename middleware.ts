import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedPage = pathname.startsWith("/admin/dashboard");
  const isProtectedApi =
    (pathname.startsWith("/api/products") && req.method !== "GET") ||
    (pathname.startsWith("/api/posts") && req.method !== "GET") ||
    // /api/orders は注文者の個人情報を含むため、GETも含めて常に保護する
    pathname.startsWith("/api/orders") ||
    // /api/upload は管理画面からの画像アップロード専用(配信用の /api/uploads/* は公開のまま)
    (pathname === "/api/upload" || pathname.startsWith("/api/upload/"));

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const session = req.cookies.get(COOKIE_NAME)?.value;
  const expected = process.env.ADMIN_SESSION_SECRET;

  const authorized = Boolean(session) && Boolean(expected) && session === expected;

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
    "/api/orders/:path*",
    "/api/upload/:path*",
  ],
};
