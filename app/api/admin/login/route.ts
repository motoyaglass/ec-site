import { NextRequest, NextResponse } from "next/server";

// ログイン試行のレート制限(簡易実装)。IPアドレスごとに一定時間内の失敗回数を記録し、
// 超えた場合はパスワードが合っていてもロックする(総当たり攻撃対策)。
// サーバープロセスのメモリ上で保持するだけの簡易的なものなので、再デプロイで自動的にリセットされる。
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15分
const RATE_LIMIT_MAX_ATTEMPTS = 5;

type LoginAttempt = { count: number; firstAttemptAt: number };
const loginAttempts = new Map<string, LoginAttempt>();

function getClientKey(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(key: string): boolean {
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }
  return entry.count >= RATE_LIMIT_MAX_ATTEMPTS;
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttemptAt: now });
  } else {
    entry.count += 1;
  }
}

function clearAttempts(key: string) {
  loginAttempts.delete(key);
}

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
  const clientKey = getClientKey(req);
  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      { ok: false, error: "試行回数が多すぎます。15分ほど時間をおいてから再度お試しください" },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const password = body?.password;
  const turnstileToken = typeof body?.turnstileToken === "string" ? body.turnstileToken : undefined;

  const ip = req.headers.get("x-forwarded-for");
  const turnstileOk = await verifyTurnstile(turnstileToken, ip);
  if (!turnstileOk) {
    recordFailedAttempt(clientKey);
    return NextResponse.json(
      { ok: false, error: "認証に失敗しました。もう一度お試しください" },
      { status: 401 }
    );
  }

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    recordFailedAttempt(clientKey);
    return NextResponse.json({ ok: false, error: "パスワードが違います" }, { status: 401 });
  }

  clearAttempts(clientKey);

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
