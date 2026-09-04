import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { queryOne, Post } from "@/lib/db";
import { verifyBlogAccessCookie } from "@/lib/blogAccess";
import ShareToInstagramButton from "../../components/ShareToInstagramButton";
import BlogAccessGate from "../../components/BlogAccessGate";

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
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

export default async function BlogDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { blogAccessError?: string };
}) {
  const cookieStore = cookies();
  const verified = verifyBlogAccessCookie(cookieStore.get("blog_access")?.value);

  if (!verified) {
    return <BlogAccessGate redirectTo={`/blog/${params.id}`} error={searchParams?.blogAccessError} />;
  }

  const post = await getPost(params.id);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <h1 className="post-detail-title">{post.title}</h1>
      <p className="post-detail-date">{formatDate(post.created_at)}</p>
      <ShareToInstagramButton title={post.title} coverImageUrl={null} />
      <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
