import { NextRequest, NextResponse } from "next/server";

// Cloudflare Turnstileのトークンをサーバー側で検証する。
// TURNSTILE_SECRET_KEY が未設定の環境(ローカル開発など)では検証をスキップする。
async function verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true; // Turnstile未設定の場合はスキップ

  if (!token) return false;

  try {
    const params = new URLSearchParams({ secret: secretKey, response: token });
    if (ip) params.set("remoteip", ip);

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const verifyData = await verifyRes.json();
    return verifyData?.success === true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password;
  const turnstileToken = typeof body?.turnstileToken === "string" ? body.turnstileToken : undefined;

  const ip = req.headers.get("x-forwarded-for");
  const turnstileOk = await verifyTurnstile(turnstileToken, ip);
  if (!turnstileOk) {
    return NextResponse.json(
      { ok: false, error: "認証に失敗しました。もう一度お試しください" },
      { status: 401 }
    );
  }

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "パスワードが違います" }, { status: 401 });
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "サーバー側で ADMIN_SESSION_SECRET が設定されていません" },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7日
  });
  return res;
}
