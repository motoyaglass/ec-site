"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// 管理画面「書類・確定申告」タブ。請求書・納品書の作成、経費入力、青色申告の簡易集計、マスタ設定をまとめたもの。
// データはすべてサーバー(Postgres)に保存し、/api/bookkeeping/* 経由で読み書きする。

type Item = { name: string; size?: string; qty: number; price: number };
type Doc = {
  id: string; no: string; to: string; date: string; due: string; note: string;
  items: Item[]; sub: number; tax: number; total: number;
};
type Expense = { id: string; date: string; category: string; vendor: string; memo: string; amount: number };
// ECサイトの商品(productsテーブル)をそのまま書類の品目マスタとして使う。
// 非公開(ショップに出さない)商品も含めて取得する。
type Product = { id: string; name: string; price: number; size: string | null; is_active: boolean };
type Vendor = { id: string; name: string; contact: string };
type Profile = Record<string, string>;
type DocType = "invoice" | "delivery";
type SubTab = "invoice" | "delivery" | "expense" | "tax" | "settings";

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: "invoice", label: "請求書" },
  { key: "delivery", label: "納品書" },
  { key: "expense", label: "経費入力" },
  { key: "tax", label: "確定申告集計" },
  { key: "settings", label: "マスタ・設定" },
];

const EXPENSE_CATEGORIES_ALL = [
  "仕入高（材料費）", "租税公課", "荷造運賃", "水道光熱費", "旅費交通費", "通信費", "広告宣伝費",
  "接待交際費", "損害保険料", "修繕費", "消耗品費", "減価償却費", "福利厚生費", "給料賃金",
  "外注費", "利子割引料", "地代家賃", "雑費", "その他（自由入力）",
];
const TAX_CATEGORIES = EXPENSE_CATEGORIES_ALL.filter(
  (c) => c !== "仕入高（材料費）" && c !== "その他（自由入力）"
);

const yen = (n: number) => "¥" + Math.round(n || 0).toLocaleString("ja-JP");
const todayStr = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/bookkeeping/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "通信に失敗しました");
  return data as T;
}

// html2pdf.js は初回のPDF出力時にだけ読み込む(CSPで cdnjs.cloudflare.com を許可済み)
type Html2Pdf = () => {
  set: (o: unknown) => { from: (el: HTMLElement) => { save: () => Promise<void> } };
};
function loadHtml2Pdf(): Promise<Html2Pdf> {
  const w = window as unknown as { html2pdf?: Html2Pdf };
  if (w.html2pdf) return Promise.resolve(w.html2pdf);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    s.onload = () => (w.html2pdf ? resolve(w.html2pdf) : reject(new Error("PDFライブラリの読み込みに失敗しました")));
    s.onerror = () => reject(new Error("PDFライブラリの読み込みに失敗しました"));
    document.head.appendChild(s);
  });
}

async function downloadPdf(el: HTMLElement, filename: string) {
  const html2pdf = await loadHtml2Pdf();
  await html2pdf()
    .set({
      margin: 0,
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(el)
    .save();
}

// 印刷対象の書類だけを印刷する(globals.css の .bk-printing / .bk-print-target)
function printElement(id: string) {
  document.body.classList.add("bk-printing");
  document.querySelectorAll(".bk-print-target").forEach((e) => e.classList.remove("bk-print-target"));
  document.getElementById(id)?.classList.add("bk-print-target");
  window.print();
  setTimeout(() => {
    document.body.classList.remove("bk-printing");
    document.getElementById(id)?.classList.remove("bk-print-target");
  }, 500);
}

export default function BookkeepingPanel() {
  const [sub, setSub] = useState<SubTab>("invoice");
  const [profile, setProfile] = useState<Profile>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<Doc[]>([]);
  const [deliveries, setDeliveries] = useState<Doc[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [p, pr, v, inv, dn, ex] = await Promise.all([
        api<{ profile: Profile }>("profile"),
        fetch("/api/products?all=1").then(async (r) => {
          const d = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error((d as { error?: string }).error || "商品の読み込みに失敗しました");
          return d as { products: Product[] };
        }),
        api<{ vendors: Vendor[] }>("vendors"),
        api<{ documents: Doc[] }>("documents?type=invoice"),
        api<{ documents: Doc[] }>("documents?type=delivery"),
        api<{ expenses: Expense[] }>("expenses"),
      ]);
      setProfile(p.profile);
      setProducts(pr.products);
      setVendors(v.vendors);
      setInvoices(inv.documents);
      setDeliveries(dn.documents);
      setExpenses(ex.expenses);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "読み込みに失敗しました");
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="bk">
      <div className="admin-tabs bk-subtabs">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-tab ${sub === t.key ? "active" : ""}`}
            onClick={() => setSub(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loadError && (
        <p className="error-text">
          データを読み込めませんでした: {loadError}
          <br />
          初回は、データベースに書類用のテーブルを追加する必要があります(README参照)。
        </p>
      )}

      {sub === "invoice" && (
        <DocEditor type="invoice" profile={profile} products={products} history={invoices} onSaved={reload} />
      )}
      {sub === "delivery" && (
        <DocEditor type="delivery" profile={profile} products={products} history={deliveries} onSaved={reload} />
      )}
      {sub === "expense" && <ExpensePanel expenses={expenses} vendors={vendors} onChanged={reload} />}
      {sub === "tax" && <TaxPanel profile={profile} invoices={invoices} expenses={expenses} />}
      {sub === "settings" && (
        <SettingsPanel profile={profile} products={products} vendors={vendors} onChanged={reload} />
      )}
    </div>
  );
}

/* ============================ 請求書・納品書 ============================ */

function DocEditor({
  type, profile, products, history, onSaved,
}: {
  type: DocType; profile: Profile; products: Product[]; history: Doc[]; onSaved: () => void;
}) {
  const isInvoice = type === "invoice";
  const label = isInvoice ? "請求書" : "納品書";
  const today = todayStr();
  const due = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  })();

  const [to, setTo] = useState("");
  const [no, setNo] = useState(`${isInvoice ? "INV" : "DN"}-${today.replace(/-/g, "")}`);
  const [date, setDate] = useState(today);
  const [dueDate, setDueDate] = useState(due);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<Item[]>([{ name: "", qty: 1, price: 0 }]);
  const [busy, setBusy] = useState(false);
  const sheetId = `bk-sheet-${type}`;

  // 単価はECサイトと同じ税込価格。合計=税込、税抜と消費税は内訳(参考)として計算する
  const total = useMemo(() => items.reduce((s, i) => s + i.qty * i.price, 0), [items]);
  const tax = Math.floor((total * 10) / 110);
  const sub = total - tax;

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, ...patch };
        if (patch.name !== undefined) {
          const match = products.find((p) => p.name === patch.name);
          if (match) {
            next.price = match.price; // 登録済み商品名なら単価・サイズを自動入力
            next.size = match.size || "";
          }
        }
        return next;
      })
    );
  }

  async function save() {
    setBusy(true);
    try {
      await api("documents", {
        method: "POST",
        body: JSON.stringify({ type, no, to, date, due: dueDate, note, items }),
      });
      onSaved();
      alert("履歴に保存しました。");
    } catch (e) {
      alert(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function pdf() {
    const el = document.getElementById(sheetId);
    if (!el) return;
    setBusy(true);
    try {
      await downloadPdf(el, `${label}_${no || "draft"}_${to}.pdf`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "PDFの作成に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  function loadDoc(d: Doc) {
    setTo(d.to);
    setNo(d.no);
    setDate(d.date);
    setDueDate(d.due || due);
    setNote(d.note);
    setItems(d.items.length ? d.items : [{ name: "", qty: 1, price: 0 }]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!confirm("この履歴を削除しますか?")) return;
    try {
      await api(`documents/${id}`, { method: "DELETE" });
      onSaved();
    } catch (e) {
      alert(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  const bankLines = [
    profile["b-bank"],
    profile["b-branch"],
    profile["b-type"] ? profile["b-type"] + "口座" : "",
    profile["b-number"] ? "口座番号：" + profile["b-number"] : "",
    profile["b-holder"] ? "口座名義：" + profile["b-holder"] : "",
  ].filter(Boolean);

  return (
    <div>
      <div className="bk-layout">
        <div className="admin-section">
          <h2>宛先・{isInvoice ? "請求" : "納品"}情報</h2>
          <div className="field">
            <label>お客様名</label>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="例：鈴木花子 様 / 〇〇商店 様" />
          </div>
          <div className="bk-row2">
            <div className="field">
              <label>{label}番号</label>
              <input value={no} onChange={(e) => setNo(e.target.value)} />
            </div>
            <div className="field">
              <label>{isInvoice ? "発行日" : "納品日"}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {isInvoice && (
            <div className="field">
              <label>お支払期限</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label>備考(任意)</label>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <div className="admin-section">
          <h2>品目</h2>
          <datalist id="bk-product-datalist">
            {products.map((p) => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
          {items.map((it, idx) => (
            <div className="bk-item-row" key={idx}>
              <input
                list="bk-product-datalist"
                placeholder="品名(登録済み商品 or 自由入力)"
                value={it.name}
                onChange={(e) => updateItem(idx, { name: e.target.value })}
              />
              <input
                placeholder="サイズ"
                value={it.size || ""}
                onChange={(e) => updateItem(idx, { size: e.target.value })}
              />
              <input
                type="number" min={0} value={it.qty}
                onChange={(e) => updateItem(idx, { qty: Number(e.target.value) || 0 })}
              />
              <input
                type="number" min={0} value={it.price}
                onChange={(e) => updateItem(idx, { price: Number(e.target.value) || 0 })}
              />
              <button
                type="button" className="btn btn-danger"
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button" className="btn btn-secondary"
            onClick={() => setItems((prev) => [...prev, { name: "", qty: 1, price: 0 }])}
          >
            ＋ 品目を追加
          </button>
          <p className="hint">品名にオンラインストアと共通の商品名を入力すると、単価(税込)が自動入力されます。商品は「商品」タブで管理します。</p>
          <div className="bk-totals">
            <div>税抜金額（参考）：{yen(sub)}</div>
            <div>内消費税（10%・参考）：{yen(tax)}</div>
            <div className="bk-grand">合計（税込）：{yen(total)}</div>
          </div>
        </div>
      </div>

      <div className="row" style={{ margin: "4px 0 20px" }}>
        <button className="btn btn-primary" disabled={busy} onClick={pdf}>PDFをダウンロード</button>
        <button className="btn btn-secondary" onClick={() => printElement(sheetId)}>印刷</button>
        <button className="btn btn-secondary" disabled={busy} onClick={save}>履歴に保存</button>
      </div>

      <div className="admin-section">
        <h2>{label} 発行履歴</h2>
        <table className="bk-table">
          <thead>
            <tr><th>番号</th><th>宛先</th><th>{isInvoice ? "発行日" : "納品日"}</th><th>合計</th><th></th></tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td colSpan={5} className="hint">まだ履歴はありません</td></tr>
            )}
            {history.map((d) => (
              <tr key={d.id}>
                <td>{d.no}</td><td>{d.to}</td><td>{d.date}</td><td>{yen(d.total)}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => loadDoc(d)}>開く</button>{" "}
                  <button className="btn btn-danger" onClick={() => remove(d.id)}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* プレビュー(PDF・印刷の対象) */}
      <div className="bk-doc-sheet" id={sheetId}>
        <div className="bk-inv-header">
          <div className="bk-inv-title">{label}</div>
          <div className="bk-inv-meta">
            <div>{label}番号：{no || "-"}</div>
            <div>{isInvoice ? "発行日" : "納品日"}：{date || "-"}</div>
            {isInvoice && <div>お支払期限：{dueDate || "-"}</div>}
          </div>
        </div>
        <div className="bk-inv-to">{to || "お客様名"}</div>
        <div className="bk-inv-amount">
          {isInvoice ? "ご請求金額" : "納品金額合計"}
          <span className="bk-amt">{yen(total)}</span>（税込）
        </div>
        <table className="bk-inv-items">
          <thead><tr><th>品目</th><th>数量</th><th>単価(税込)</th><th>金額</th></tr></thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx}>
                <td>{i.name || "(品名未入力)"}{i.size && <span className="bk-item-size"> （{i.size}）</span>}</td><td>{i.qty}</td><td>{yen(i.price)}</td><td>{yen(i.qty * i.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bk-inv-totals">
          <div><span>税抜金額（参考）</span><span>{yen(sub)}</span></div>
          <div><span>内消費税（10%・参考）</span><span>{yen(tax)}</span></div>
          <div className="bk-inv-grand"><span>合計（税込）</span><span>{yen(total)}</span></div>
        </div>
        {note && <div className="bk-inv-note">{note}</div>}
        <div className="bk-inv-footer">
          <div>
            {isInvoice && (
              <>
                <strong>お振込先</strong>
                <br />
                {bankLines.length ? bankLines.map((l, i) => <span key={i}>{l}<br /></span>) : "（振込先未設定）"}
              </>
            )}
          </div>
          <div className="bk-from">
            {profile["s-name"]}<br />
            {profile["s-addr"]}<br />
            {profile["s-tel"] && <>TEL: {profile["s-tel"]}<br /></>}
            {profile["s-mail"]}
            {isInvoice && profile["s-invoiceno"] && <><br />登録番号：{profile["s-invoiceno"]}</>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ 経費 ============================ */

function ExpensePanel({
  expenses, vendors, onChanged,
}: { expenses: Expense[]; vendors: Vendor[]; onChanged: () => void }) {
  const [date, setDate] = useState(todayStr());
  const [category, setCategory] = useState(EXPENSE_CATEGORIES_ALL[0]);
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  async function add() {
    try {
      await api("expenses", {
        method: "POST",
        body: JSON.stringify({ date, category, vendor, memo, amount: Number(amount) || 0 }),
      });
      setVendor(""); setAmount(""); setMemo("");
      onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : "保存に失敗しました");
    }
  }
  async function remove(id: string) {
    if (!confirm("この経費を削除しますか?")) return;
    try {
      await api(`expenses/${id}`, { method: "DELETE" });
      onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  return (
    <div>
      <div className="admin-section">
        <h2>経費を記録する</h2>
        <datalist id="bk-vendor-datalist">
          {vendors.map((v) => <option key={v.id} value={v.name} />)}
        </datalist>
        <div className="bk-row2">
          <div className="field"><label>日付</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="field">
            <label>費目（勘定科目）</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES_ALL.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field"><label>業者名</label><input list="bk-vendor-datalist" value={vendor} onChange={(e) => setVendor(e.target.value)} /></div>
          <div className="field"><label>金額</label><input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        </div>
        <div className="field"><label>メモ(任意)</label><input value={memo} onChange={(e) => setMemo(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={add}>＋ 記録</button>
        <p className="hint">仕入高（材料費）は原価として、確定申告集計で他の経費と分けて計算されます。</p>
      </div>

      <div className="admin-section">
        <h2>経費一覧</h2>
        <table className="bk-table">
          <thead><tr><th>日付</th><th>費目</th><th>業者名</th><th>メモ</th><th>金額</th><th></th></tr></thead>
          <tbody>
            {expenses.length === 0 && <tr><td colSpan={6} className="hint">まだ経費が記録されていません</td></tr>}
            {expenses.map((e) => (
              <tr key={e.id}>
                <td>{e.date}</td><td>{e.category}</td><td>{e.vendor}</td><td>{e.memo}</td><td>{yen(e.amount)}</td>
                <td><button className="btn btn-danger" onClick={() => remove(e.id)}>削除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================ 確定申告集計 ============================ */

function TaxPanel({ profile, invoices, expenses }: { profile: Profile; invoices: Doc[]; expenses: Expense[] }) {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [startInv, setStartInv] = useState("0");
  const [endInv, setEndInv] = useState("0");
  const [deduction, setDeduction] = useState("100000");

  const s = useMemo(() => {
    const sales = invoices.filter((r) => (r.date || "").startsWith(year)).reduce((a, r) => a + r.total, 0);
    const ex = expenses.filter((e) => (e.date || "").startsWith(year));
    const purchase = ex.filter((e) => e.category === "仕入高（材料費）").reduce((a, e) => a + e.amount, 0);
    const si = Number(startInv) || 0;
    const ei = Number(endInv) || 0;
    const cogs = si + purchase - ei;
    const gross = sales - cogs;
    const breakdown = TAX_CATEGORIES.map((cat) => ({
      cat,
      sum: ex
        .filter((e) => e.category === cat || (cat === "雑費" && e.category === "その他（自由入力）"))
        .reduce((a, e) => a + e.amount, 0),
    }));
    const expenseTotal = breakdown.reduce((a, b) => a + b.sum, 0);
    const diff = gross - expenseTotal;
    const ded = Number(deduction) || 0;
    return { sales, purchase, si, ei, cogs, gross, breakdown, expenseTotal, diff, ded, income: diff - ded };
  }, [invoices, expenses, year, startInv, endInv, deduction]);

  async function pdf() {
    const el = document.getElementById("bk-sheet-tax");
    if (!el) return;
    try {
      await downloadPdf(el, `青色申告決算書_簡易集計_${year}.pdf`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "PDFの作成に失敗しました");
    }
  }

  return (
    <div>
      <div className="bk-note">
        本ページは青色申告決算書（一般用）の作成を補助するための簡易集計ツールです。実際の提出書類は国税庁の「確定申告書等作成コーナー」等で正式な形式をご確認のうえ提出してください。65万円の特別控除には電子申告（e-Tax）や複式簿記の記帳など一定の条件があります。減価償却費は自動計算されないため、金額をご自身で算出して経費入力から記録してください。集計結果の正確性は保証されません。不明な点は税務署や税理士にご確認ください。
      </div>

      <div className="admin-section">
        <div className="bk-row2">
          <div className="field"><label>集計対象年</label><input type="number" value={year} onChange={(e) => setYear(e.target.value)} /></div>
          <div className="field"><label>期首棚卸高</label><input type="number" min={0} value={startInv} onChange={(e) => setStartInv(e.target.value)} /></div>
          <div className="field"><label>期末棚卸高</label><input type="number" min={0} value={endInv} onChange={(e) => setEndInv(e.target.value)} /></div>
          <div className="field"><label>青色申告特別控除額</label><input type="number" min={0} value={deduction} onChange={(e) => setDeduction(e.target.value)} /></div>
        </div>
        <div className="row">
          <button className="btn btn-secondary" onClick={() => setDeduction("0")}>0円</button>
          <button className="btn btn-secondary" onClick={() => setDeduction("100000")}>10万円</button>
          <button className="btn btn-secondary" onClick={() => setDeduction("550000")}>55万円</button>
          <button className="btn btn-secondary" onClick={() => setDeduction("650000")}>65万円</button>
        </div>
        <p className="hint">売上は請求書の発行履歴（発行日が集計対象年のもの）から自動集計します。納品書は集計に含まれません。</p>
      </div>

      <div className="row" style={{ marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={pdf}>PDFをダウンロード</button>
        <button className="btn btn-secondary" onClick={() => printElement("bk-sheet-tax")}>印刷</button>
      </div>

      <div className="bk-doc-sheet bk-tax-sheet" id="bk-sheet-tax">
        <div className="bk-inv-header">
          <div className="bk-inv-title" style={{ fontSize: 18, letterSpacing: 3 }}>青色申告決算書（簡易集計）</div>
          <div className="bk-inv-meta">{year} 年分</div>
        </div>
        <div style={{ fontSize: 12.5, marginBottom: 16 }}>
          氏名・工房名：{profile["s-name"]}<br />住所：{profile["s-addr"]}<br />事業内容：{profile["s-business"]}
        </div>

        <div className="bk-section-title">Ⅰ. 売上・売上原価</div>
        <table>
          <tbody>
            <tr><th>① 売上（収入）金額</th><td>{yen(s.sales)}</td></tr>
            <tr><th>② 期首棚卸高</th><td>{yen(s.si)}</td></tr>
            <tr><th>③ 仕入高（材料費）</th><td>{yen(s.purchase)}</td></tr>
            <tr><th>④ 期末棚卸高</th><td>{yen(s.ei)}</td></tr>
            <tr><th>⑤ 売上原価（②+③-④）</th><td>{yen(s.cogs)}</td></tr>
            <tr className="bk-grand-row"><th>⑥ 差引金額（粗利益）（①-⑤）</th><td>{yen(s.gross)}</td></tr>
          </tbody>
        </table>

        <div className="bk-section-title">Ⅱ. 経費の内訳</div>
        <table>
          <tbody>
            {s.breakdown.map((b) => <tr key={b.cat}><th>{b.cat}</th><td>{yen(b.sum)}</td></tr>)}
          </tbody>
        </table>

        <div className="bk-section-title">Ⅲ. 所得金額</div>
        <table>
          <tbody>
            <tr><th>⑦ 経費計</th><td>{yen(s.expenseTotal)}</td></tr>
            <tr><th>⑧ 差引金額（⑥-⑦）</th><td>{yen(s.diff)}</td></tr>
            <tr><th>⑨ 青色申告特別控除額</th><td>{yen(s.ded)}</td></tr>
            <tr className="bk-grand-row"><th>⑩ 所得金額（⑧-⑨）</th><td>{yen(s.income)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================ マスタ・設定 ============================ */

const PROFILE_FIELDS: { key: string; label: string; placeholder?: string }[] = [
  { key: "s-name", label: "工房名・氏名", placeholder: "例：工芸硝子モトヤ 小野資矢" },
  { key: "s-addr", label: "住所" },
  { key: "s-tel", label: "電話番号" },
  { key: "s-mail", label: "メールアドレス" },
  { key: "s-business", label: "事業内容", placeholder: "例：手作りガラス製品の製造・販売" },
  { key: "s-invoiceno", label: "登録番号(インボイス制度・任意)", placeholder: "T1234567890123（未登録なら空欄）" },
  { key: "b-bank", label: "銀行名" },
  { key: "b-branch", label: "支店名" },
  { key: "b-type", label: "口座種別(普通/当座)" },
  { key: "b-number", label: "口座番号" },
  { key: "b-holder", label: "口座名義" },
];

function SettingsPanel({
  profile, products, vendors, onChanged,
}: { profile: Profile; products: Product[]; vendors: Vendor[]; onChanged: () => void }) {
  const [form, setForm] = useState<Profile>(profile);
  const [vdName, setVdName] = useState("");
  const [vdContact, setVdContact] = useState("");

  useEffect(() => setForm(profile), [profile]);

  async function run(fn: () => Promise<unknown>, okMsg?: string) {
    try {
      await fn();
      onChanged();
      if (okMsg) alert(okMsg);
    } catch (e) {
      alert(e instanceof Error ? e.message : "失敗しました");
    }
  }

  return (
    <div className="bk-layout">
      <div className="admin-section">
        <h2>発行者情報・銀行振込先</h2>
        {PROFILE_FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label>{f.label}</label>
            <input
              value={form[f.key] || ""} placeholder={f.placeholder}
              onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
            />
          </div>
        ))}
        <button
          className="btn btn-primary"
          onClick={() => run(() => api("profile", { method: "POST", body: JSON.stringify(form) }), "発行者情報を保存しました。")}
        >
          この情報を保存する
        </button>
      </div>

      <div>
        <div className="admin-section">
          <h2>商品マスタ</h2>
          <p className="hint">
            商品はオンラインストアと共通で、「商品」タブで管理します(現在 {products.length} 件)。請求書・納品書の品目では、ここに登録した商品名を入力すると単価が自動入力されます。ショップに出さない商品(受注専用など)は、商品の「ショップに公開する」をオフにして登録してください。
          </p>
        </div>

        <div className="admin-section">
          <h2>取引先(業者)マスタ</h2>
          <div className="field"><label>業者名</label><input value={vdName} onChange={(e) => setVdName(e.target.value)} /></div>
          <div className="field"><label>連絡先・メモ(任意)</label><input value={vdContact} onChange={(e) => setVdContact(e.target.value)} /></div>
          <button
            className="btn btn-secondary"
            onClick={() =>
              run(async () => {
                await api("vendors", { method: "POST", body: JSON.stringify({ name: vdName, contact: vdContact }) });
                setVdName(""); setVdContact("");
              })
            }
          >
            ＋ 登録
          </button>
          <table className="bk-table">
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td>{v.name}</td><td>{v.contact}</td>
                  <td><button className="btn btn-danger" onClick={() => run(() => api(`vendors/${v.id}`, { method: "DELETE" }))}>削除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
