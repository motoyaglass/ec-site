import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kougeiglassmotoya.jp";

// 日誌(/blog)は無料記事のみ検索エンジンに開放する。購入者限定記事は
// 各ページの generateMetadata で noindex を個別に設定して除外している。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
