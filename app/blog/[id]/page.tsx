import { notFound } from "next/navigation";
import type { Metadata } from "next";
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

function excerpt(html: string, max = 120) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const post = await getPost(params.id);
  if (!post) return {};

  const description = excerpt(post.content);

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
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
