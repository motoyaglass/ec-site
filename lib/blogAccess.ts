import crypto from "crypto";

// 日誌(ブログ)の閲覧制限用。ご購入時のメールアドレスと注文履歴を照合し、
// 一致した場合にのみ署名付きCookieを発行して閲覧を許可する。
// 管理ログインと同じ ADMIN_SESSION_SECRET を元にしつつ、用途ごとに鍵を分ける(ドメイン分離)ため
// HMACで派生させた別の鍵を署名に使う。環境変数が未設定の本番環境では、誰でも偽造できる固定値に
// フォールバックせず、署名・検証とも失敗させる(閲覧不可になる側に倒す)。
function getSecret(): string | null {
  const base = process.env.ADMIN_SESSION_SECRET;
  if (!base) {
    return process.env.NODE_ENV === "production" ? null : "dev-only-insecure-secret";
  }
  return crypto.createHmac("sha256", base).update("blog-access-v1").digest("hex");
}

export function signBlogAccess(email: string): string {
  const secret = getSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET が設定されていません");
  const hmac = crypto.createHmac("sha256", secret).update(email).digest("hex");
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

    const secret = getSecret();
    if (!secret) return false;
    const expected = crypto.createHmac("sha256", secret).update(email).digest("hex");
    const a = Buffer.from(hmac);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
