// 商品サイズの表示用整形。サイズは cm 単位(小数可)。
// 公開側(ショップ・請求書・納品書)には「仕上がりサイズ」だけを表示し、制作用の型サイズは管理画面でのみ扱う。

type FinishedSize = {
  finished_height?: number | string | null;
  finished_diameter?: number | string | null;
};

function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function fmt(n: number): string {
  return String(Math.round(n * 10) / 10);
}

// 例: "高さ10cm × 径6.5cm" / 片方だけの場合はその項目のみ。どちらも無ければ空文字。
export function formatFinishedSize(p: FinishedSize): string {
  const h = num(p.finished_height);
  const d = num(p.finished_diameter);
  const parts: string[] = [];
  if (h !== null) parts.push(`高さ${fmt(h)}cm`);
  if (d !== null) parts.push(`径${fmt(d)}cm`);
  return parts.join(" × ");
}
