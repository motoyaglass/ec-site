import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// 保存先ディレクトリ。Railwayではここに Volume をマウントしてください(例: /data/uploads)。
// 未設定の場合はプロジェクト内の .uploads フォルダに保存されます(再デプロイで消える点に注意)。
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), ".uploads");

const MAX_SIZE = 8 * 1024 * 1024; // 8MB

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "画像ファイルを選択してください" }, { status: 400 });
  }

  const ext = EXT_BY_MIME[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "対応していない画像形式です(jpg, png, webp, gifのみ)" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "画像サイズは8MB以下にしてください" }, { status: 400 });
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    return NextResponse.json({ url: `/api/uploads/${filename}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "アップロードに失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
