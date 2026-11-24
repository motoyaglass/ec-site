"use client";

import { useMemo, useState } from "react";
import type { ProductMaster } from "@/lib/db";

// 商品マスタ(名前・価格・サイズの台帳)をタイル表示で管理する。
// ここに登録した商品が、ECへの出品(商品タブ)と請求書・納品書の品目のもとになる。

const yen = (n: number) => "¥" + Math.round(n || 0).toLocaleString("ja-JP");

type Form = {
  name: string; price: string;
  finished_height: string; finished_diameter: string; mold_height: string; mold_diameter: string;
};
const emptyForm: Form = {
  name: "", price: "", finished_height: "", finished_diameter: "", mold_height: "", mold_diameter: "",
};
const s = (n: number | null) => (n != null ? String(n) : "");

export default function MasterPanel({
  masters, onChanged,
}: { masters: ProductMaster[]; onChanged: () => void }) {
  const [form, setForm] = useState<Form>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () => masters.filter((m) => !q.trim() || m.name.includes(q.trim())),
    [masters, q]
  );

  async function call(url: string, init: RequestInit) {
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "失敗しました");
    return data;
  }

  async function save() {
    setBusy(true);
    try {
      const body = JSON.stringify({ ...form, price: Number(form.price) || 0 });
      if (editingId) await call(`/api/masters/${editingId}`, { method: "PUT", body });
      else await call("/api/masters", { method: "POST", body });
      setForm(emptyForm);
      setEditingId(null);
      onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : "失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!editingId || !confirm("このマスタを削除しますか?(出品済みの商品や書類の履歴は消えません)")) return;
    try {
      await call(`/api/masters/${editingId}`, { method: "DELETE" });
      setForm(emptyForm);
      setEditingId(null);
      onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : "失敗しました");
    }
  }

  async function addBulk() {
    try {
      const d = await call("/api/masters", { method: "POST", body: JSON.stringify({ lines: bulk }) });
      alert(`${d.added} 件登録しました。`);
      setBulk("");
      setShowBulk(false);
      onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : "失敗しました");
    }
  }

  function pick(m: ProductMaster) {
    setEditingId(m.id);
    setForm({
      name: m.name, price: String(m.price),
      finished_height: s(m.finished_height), finished_diameter: s(m.finished_diameter),
      mold_height: s(m.mold_height), mold_diameter: s(m.mold_diameter),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="admin-section">
      <h2>{editingId ? "マスタを編集" : "商品マスタ"}</h2>

      <div className="bk-row2">
        <div className="field"><label>商品名</label><input value={form.name} onChange={set("name")} placeholder="例：花入れ　小" /></div>
        <div className="field"><label>単価(税込)</label><input type="number" min={0} value={form.price} onChange={set("price")} placeholder="2200" /></div>
      </div>
      <div className="bk-row2">
        <div className="field">
          <label>仕上がりサイズ(cm)</label>
          <div className="bk-row2">
            <input type="number" min={0} step="0.1" placeholder="高さ" value={form.finished_height} onChange={set("finished_height")} />
            <input type="number" min={0} step="0.1" placeholder="径" value={form.finished_diameter} onChange={set("finished_diameter")} />
          </div>
        </div>
        <div className="field">
          <label>型のサイズ(cm・制作用)</label>
          <div className="bk-row2">
            <input type="number" min={0} step="0.1" placeholder="高さ" value={form.mold_height} onChange={set("mold_height")} />
            <input type="number" min={0} step="0.1" placeholder="径" value={form.mold_diameter} onChange={set("mold_diameter")} />
          </div>
        </div>
      </div>
      <div className="row">
        <button className="btn btn-primary" disabled={busy} onClick={save}>{editingId ? "更新する" : "＋ 登録"}</button>
        {editingId && (
          <>
            <button className="btn btn-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>キャンセル</button>
            <button className="btn btn-danger" onClick={remove}>削除</button>
          </>
        )}
        {!editingId && (
          <button className="btn btn-secondary" onClick={() => setShowBulk((v) => !v)}>まとめて登録</button>
        )}
      </div>

      {showBulk && !editingId && (
        <div className="field" style={{ marginTop: 12 }}>
          <label>1行に「商品名 価格」(カンマ・タブ・スペース区切り)</label>
          <textarea rows={6} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={"花入れ　小 2200\nミルクピッチャー 2750"} />
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={addBulk}>この内容で登録</button>
        </div>
      )}

      <div className="field" style={{ marginTop: 16 }}>
        <label>商品名で検索</label>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="登録済みの商品を検索..." />
      </div>

      <div className="master-tiles">
        {filtered.map((m) => (
          <button
            type="button" key={m.id}
            className={`master-tile ${editingId === m.id ? "active" : ""}`}
            onClick={() => pick(m)}
          >
            <span className="master-tile-name">{m.name}</span>
            <span className="master-tile-price">{yen(m.price)}</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="hint">該当する商品がありません。</p>}
      </div>
      <p className="hint">タイルをタップすると編集・削除できます。出品は「商品」タブで、ここから選んで写真と詳細を入力します。</p>
    </div>
  );
}
