import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { query, Post } from "@/lib/db";
import { verifyBlogAccessCookie } from "@/lib/blogAccess";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ブログ",
  description:
    "吹きガラス工・小野資矢による工芸硝子モトヤの制作日記。ガラス作品づくりの様子やお知らせを綴っています。",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

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

export default async function BlogListPage() {
  const cookieStore = cookies();
  const verified = verifyBlogAccessCookie(cookieStore.get("blog_access")?.value);

  const posts = await getPosts();

  return (
    <div>
      {posts.length === 0 ? (
        <div className="empty-state">まだ記事がありません。</div>
      ) : (
        <div className="post-list">
          {posts.map((p) => (
            <div className="post-list-item" key={p.id}>
              <div>
                <Link href={`/blog/${p.id}`} className="post-title-large">
                  {p.title}
                </Link>
                {!p.is_free && <span className="badge" style={{ marginLeft: 8 }}>購入者限定</span>}
                <p className="post-date">{formatDate(p.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {verified && (
        <p className="hint" style={{ marginTop: 24 }}>
          <a href="/api/blog-access/logout">別のメールアドレスで確認し直す</a>
        </p>
      )}
    </div>
  );
}
