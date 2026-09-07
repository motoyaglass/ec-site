import type { MetadataRoute } from "next";
import { query, Post } from "@/lib/db";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kougeiglassmotoya.jp";

// 日誌のうち無料記事のみ検索エンジン向けのsitemapに含める。
// 購入者限定記事はクロールさせても閲覧できないため含めない(各ページ側でnoindexも設定済み)。
async function getFreePosts(): Promise<Post[]> {
  try {
    return await query<Post>(
      "select * from posts where is_published = true and is_free = true order by created_at desc"
    );
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const freePosts = await getFreePosts();

  return [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/stockists`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/tokushoho`, changeFrequency: "yearly", priority: 0.2 },
    ...freePosts.map((p) => ({
      url: `${siteUrl}/blog/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
