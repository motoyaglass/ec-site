import crypto from "crypto";

// 日誌(ブログ)の閲覧制限用。ご購入時のメールアドレスと注文履歴を照合し、
// 一致した場合にのみ署名付きCookieを発行して閲覧を許可する。
function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "dev-only-insecure-secret";
}

export function signBlogAccess(email: string): string {
  const hmac = crypto.createHmac("sha256", getSecret()).update(email).digest("hex");
  return Buffer.from(`${email}.${hmac}`, "utf8").toString("base64url");
}

export function verifyBlogAccessCookie(cookieValue: string | undefined | null): boolean {
  if (!cookieValue) return false;

  try {
    const decoded = Buffer.from(cookieValue, "base64url").toString("utf8");
    const separatorIndex = decoded.lastIndexOf(".");
    if (separatorIndex === -1) return false;

    const email = decoded.slice(0, separatorIndex);
    const hmac = decoded.slice(separatorIndex + 1);
    if (!email || !hmac) return false;

    const expected = crypto.createHmac("sha256", getSecret()).update(email).digest("hex");
    const a = Buffer.from(hmac);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
