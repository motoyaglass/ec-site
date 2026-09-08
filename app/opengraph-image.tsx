import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
// ビルドコンテナには外部ネットワークアクセスが無く、フォント取得(Google Fonts)が
// ビルド時に失敗してしまうため、リクエスト時に生成するようにする。
export const dynamic = "force-dynamic";
export const alt = "工芸硝子モトヤ | 吹きガラス工 小野資矢";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Google FontsからOGP画像に必要な文字だけを含む軽量なフォントデータを取得する。
// (Satori/ImageResponseはCJKフォントを自前で用意する必要があるため)
async function loadJapaneseFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(
      text
    )}`;
    const cssRes = await fetch(cssUrl, {
      headers: {
        // 古いUAを装うことでwoff2ではなくtruetype形式のURLを取得する
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/24.0.1312.52 Safari/537.36",
      },
    });
    const css = await cssRes.text();
    const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
    if (!match) return null;
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image() {
  const logoPath = path.join(process.cwd(), "public/logo/logo.png");
  const logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;

  const text = "工芸硝子モトヤ吹きガラス工小野資矢";
  const fontData = await loadJapaneseFont(text);

  // フォント取得に失敗した場合、テキストなし(ロゴ画像のみ)にフォールバックする。
  // Satoriはテキストを1文字でも描画する場合フォント指定が必須なため、
  // フォントが無い場合はテキストごと諦めてビルド/配信を壊さないようにする。
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#faf9f7",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoBase64} width={480} height={358} style={{ objectFit: "contain" }} />
        {fontData && (
          <>
            <div style={{ marginTop: 36, fontSize: 44, fontWeight: 700, color: "#1f1f1f" }}>
              工芸硝子モトヤ
            </div>
            <div style={{ marginTop: 14, fontSize: 24, color: "#6b6b6b" }}>
              吹きガラス工 小野資矢
            </div>
          </>
        )}
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Noto Sans JP", data: fontData, weight: 700 as const, style: "normal" as const }]
        : [],
    }
  );
}
