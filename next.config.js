const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Cloudflare Turnstile(管理ログインのボット対策ウィジェット)のスクリプトのみ外部許可
      "script-src 'self' https://challenges.cloudflare.com",
      // 管理画面・各ページで style={{...}} のインラインスタイルを多用しているため style-src のみ unsafe-inline を許可
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self' https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // next/image は public/ 配下のロゴ画像(ローカルファイル)にしか使っていないため、
  // 外部ホストを画像最適化プロキシ(/_next/image)経由でSSRFに使われないよう remotePatterns は設定しない。
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
