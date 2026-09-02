import Link from "next/link";
import type { Metadata } from "next";
import { query, Post } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ブログ",
  description:
    "吹きガラス工・小野資矢による工芸硝子モトヤの制作日記。ガラス作品づくりの様子やお知らせを綴っています。",
};

async function getPosts(): Promise<Post[]> {
  try {
    return await query<Post>(
      "select * from posts where is_published = true order by created_at desc"
    );
  } catch (err) {
    console.error(err);
    return [];
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

function excerpt(html: string, max = 90) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default async function BlogListPage() {
  const posts = await getPosts();

  return (
    <div>
      {posts.length === 0 ? (
        <div className="empty-state">まだ記事がありません。</div>
      ) : (
        <div className="post-list">
          {posts.map((p) => (
            <div className="post-list-item" key={p.id}>
              {p.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover_image_url} alt={p.title} className="post-thumb" />
              ) : (
                <div className="post-thumb-placeholder" />
              )}
              <div className="post-list-body">
                <Link href={`/blog/${p.id}`} className="post-title">
                  {p.title}
                </Link>
                <p className="post-date">{formatDate(p.created_at)}</p>
                <p className="post-excerpt">{excerpt(p.content)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
