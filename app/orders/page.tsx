"use client";

import { useState } from "react";
import type { Order } from "@/lib/db";

function formatPrice(yen: number) {
  return `¥${yen.toLocaleString("ja-JP")}`;
}

function formatShippingAddress(o: Order) {
  const addr = o.shipping_address as
    | { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string }
    | null;
  if (!addr) return null;
  const parts = [
    addr.postal_code && `〒${addr.postal_code}`,
    addr.state,
    addr.city,
    addr.line1,
    addr.line2,
    addr.country,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(" ");
}

export default function OrdersPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/order-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "確認中にエラーが発生しました");
      setOrders(data.orders ?? []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">注文状況の確認</h1>
      <p className="page-desc">
        ご購入時に使用したメールアドレスを入力すると、注文内容と発送状況を確認できます。
      </p>

      <form onSubmit={handleSubmit} className="login-box" style={{ margin: "0 0 32px" }}>
        <div className="field">
          <label htmlFor="order-lookup-email">メールアドレス</label>
          <input
            id="order-lookup-email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "確認中..." : "確認する"}
        </button>
      </form>

      {searched &&
        (orders.length === 0 ? (
          <div className="empty-state">
            該当する注文が見つかりませんでした。ご購入時のメールアドレスをご確認ください。
          </div>
        ) : (
          <div>
            {orders.map((o) => (
              <div className="order-card" key={o.id}>
                <div className="order-card-header">
                  <span>{new Date(o.created_at).toLocaleString("ja-JP")}</span>
                  <span
                    className={`badge ${o.status === "発送済み" ? "badge-active" : ""}`}
                  >
                    {o.status}
                  </span>
                </div>
                <div className="order-card-items">
                  {o.items.map((it, i) => (
                    <div key={i}>
                      {it.name} × {it.quantity}
                    </div>
                  ))}
                </div>
                <div className="order-card-address">
                  {formatShippingAddress(o) && <div>{formatShippingAddress(o)}</div>}
                </div>
                <div className="order-card-header" style={{ marginTop: 8, marginBottom: 0 }}>
                  <span>合計</span>
                  <span>{formatPrice(o.amount_total)}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
