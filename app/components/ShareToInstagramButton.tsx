"use client";

import { useState } from "react";

type Props = {
  title: string;
  coverImageUrl: string | null;
};

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
const FONT_FAMILY = "'Hiragino Sans', 'Yu Gothic', 'Segoe UI', sans-serif";

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const char of text) {
    const test = current + char;
    if (current && ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像を読み込めませんでした"));
    img.src = src;
  });
}

// 日誌の記事を紹介する、Instagramストーリーズ用(1080x1920)の画像を生成して、
// 対応端末では共有シートから、それ以外はダウンロードして手動で投稿してもらう。
export default function ShareToInstagramButton({ title, coverImageUrl }: Props) {
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("generating");
    setMessage(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = STORY_WIDTH;
      canvas.height = STORY_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("この端末では画像を生成できませんでした");

      ctx.fillStyle = "#faf9f7";
      ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

      const cardTop = 1280;
      let coverLoaded = false;

      if (coverImageUrl) {
        try {
          const img = await loadImage(coverImageUrl);
          const areaW = STORY_WIDTH;
          const areaH = cardTop;
          const scale = Math.max(areaW / img.width, areaH / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const dx = (areaW - drawW) / 2;
          const dy = (areaH - drawH) / 2;
          ctx.drawImage(img, dx, dy, drawW, drawH);
          coverLoaded = true;
        } catch {
          coverLoaded = false;
        }
      }

      if (!coverLoaded) {
        ctx.fillStyle = "#efece5";
        ctx.fillRect(0, 0, STORY_WIDTH, cardTop);
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, cardTop, STORY_WIDTH, STORY_HEIGHT - cardTop);

      const paddingX = 90;

      ctx.fillStyle = "#6b6b6b";
      ctx.font = `500 34px ${FONT_FAMILY}`;
      ctx.fillText("日誌", paddingX, cardTop + 90);

      ctx.fillStyle = "#1f1f1f";
      ctx.font = `700 56px ${FONT_FAMILY}`;
      const maxWidth = STORY_WIDTH - paddingX * 2;
      const lines = wrapText(ctx, title, maxWidth).slice(0, 4);
      let ty = cardTop + 175;
      for (const line of lines) {
        ctx.fillText(line, paddingX, ty);
        ty += 70;
      }

      ctx.fillStyle = "#6b6b6b";
      ctx.font = `400 30px ${FONT_FAMILY}`;
      ctx.fillText("工芸硝子モトヤ / kougeiglassmotoya.jp", paddingX, STORY_HEIGHT - 80);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) throw new Error("画像の生成に失敗しました");

      const file = new File([blob], "story.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data?: { files?: File[] }) => boolean;
        share?: (data: { files?: File[]; title?: string }) => Promise<void>;
      };

      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title });
        setStatus("done");
        setMessage("共有メニューからInstagramの「ストーリーズ」を選んでください。");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "story.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setStatus("done");
        setMessage("画像を保存しました。Instagramアプリのストーリーズ投稿画面からこの画像をアップロードしてください。");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "画像の生成に失敗しました");
    }
  }

  return (
    <div className="ig-share">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleClick}
        disabled={status === "generating"}
      >
        {status === "generating" ? "画像を生成中..." : "Instagramのストーリーズで共有"}
      </button>
      {message && <p className="hint ig-share-message">{message}</p>}
    </div>
  );
}
