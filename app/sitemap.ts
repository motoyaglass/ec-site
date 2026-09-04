import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kougeiglassmotoya.jp";

// 日誌(/blog, /blog/[id])はサイト経由の購入者限定のため、
// 個別記事ページは検索エンジンにインデックスさせない(sitemapに含めない)。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/stockists`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/tokushoho`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
