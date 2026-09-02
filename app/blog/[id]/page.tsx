import { notFound } from "next/navigation";
import { queryOne, Post } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getPost(id: string): Promise<Post | null> {
  try {
    return await queryOne<Post>(
      "select * from posts where id = $1 and is_published = true",
      [id]
    );
  } catch (err) {
    console.error(err);
    return null;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

export default async function BlogDetailPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <h1 className="post-detail-title">{post.title}</h1>
      <p className="post-detail-date">{formatDate(post.created_at)}</p>
      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_image_url} alt={post.title} className="post-cover" />
      )}
      <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
