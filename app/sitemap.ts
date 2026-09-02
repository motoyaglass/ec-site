import type { MetadataRoute } from "next";
import { query } from "@/lib/db";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kougeiglassmotoya.jp";

type PostRow = { id: string; updated_at: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: PostRow[] = [];
  try {
    posts = await query<PostRow>(
      "select id, updated_at from posts where is_published = true order by created_at desc"
    );
  } catch {
    posts = [];
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/blog`, changeFrequency: "daily", priority: 0.8 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${siteUrl}/blog/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes];
}
