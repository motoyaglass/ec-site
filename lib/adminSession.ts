// 管理画面のログインセッション用トークンの発行・検証。
// Cookieには ADMIN_SESSION_SECRET そのものではなく、「有効期限 + その署名(HMAC-SHA256)」を入れる。
// これにより (1) Cookieが漏れても秘密鍵は漏れない (2) 有効期限をサーバー側で強制できる。
// middleware(Edge runtime)でも動くよう、Node専用の crypto ではなく Web Crypto API を使う。

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7日

const encoder = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 長さが違う場合も含め、比較時間が内容に依存しないようにした文字列比較
export function safeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

export async function createAdminSessionToken(secret: string, now = Date.now()): Promise<string> {
  const expiresAt = now + ADMIN_SESSION_MAX_AGE_SEC * 1000;
  const payload = `v1.${expiresAt}`;
  const sig = await hmacHex(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined | null,
  secret: string | undefined,
  now = Date.now()
): Promise<boolean> {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt < now) return false;
  const expected = await hmacHex(secret, `${parts[0]}.${parts[1]}`);
  return safeEqual(parts[2], expected);
}
