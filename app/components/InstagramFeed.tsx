"use client";

import { useEffect, useState } from "react";
import type { InstagramPost } from "@/lib/db";

declare global {
  interface Window {
    instgrm?: {
      Embeds: { process: () => void };
    };
  }
}

export default function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/instagram-posts")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPosts(data.posts ?? []);
      })
      .catch(() => {
        // 取得に失敗しても致命的ではないので何も表示しない
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (posts.length === 0) return;

    function process() {
      window.instgrm?.Embeds.process();
    }

    const existing = document.getElementById("instagram-embed-script");
    if (existing) {
      process();
      return;
    }

    const script = document.createElement("script");
    script.id = "instagram-embed-script";
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = process;
    document.body.appendChild(script);
  }, [posts]);

  if (!loaded || posts.length === 0) return null;

  return (
    <div className="instagram-feed">
      <h2 className="instagram-feed-title">Instagram</h2>
      <p className="page-desc" style={{ marginBottom: 20 }}>
        制作の様子はInstagramでも発信しています。
      </p>
      <div className="instagram-feed-grid">
        {posts.map((p) => (
          <blockquote
            key={p.id}
            className="instagram-media"
            data-instgrm-permalink={p.url}
            data-instgrm-version="14"
            style={{ margin: 0 }}
          />
        ))}
      </div>
    </div>
  );
}
