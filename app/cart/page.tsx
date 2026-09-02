"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "../components/CartContext";

function formatPrice(yen: number) {
  return `¥${yen.toLocaleString("ja-JP")}`;
}

export default function CartPage() {
  const { items, totalPrice, removeItem, updateQuantity } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "決済の開始に失敗しました");
      }
      // カートは決済完了後(ショップページに checkout=success で戻った時)にクリアする
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">買物籠</h1>

      {items.length === 0 ? (
        <div className="empty-state">
          買物籠に商品がありません。
          <br />
          <Link href="/" style={{ textDecoration: "underline" }}>
            ショップへ戻る
          </Link>
        </div>
      ) : (
        <div>
          <div className="cart-list">
            {items.map((item) => (
              <div className="cart-row" key={item.productId}>
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt={item.name} className="cart-thumb" />
                ) : (
                  <div className="cart-thumb" />
                )}
                <div className="cart-row-body">
                  <div className="cart-row-name">{item.name}</div>
                  <div className="cart-row-price">{formatPrice(item.price)}</div>
                </div>
                <div className="qty-stepper">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    aria-label="数量を減らす"
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    aria-label="数量を増やす"
                  >
                    ＋
                  </button>
                </div>
                <button className="btn btn-danger" onClick={() => removeItem(item.productId)}>
                  削除
                </button>
              </div>
            ))}
          </div>

          <div className="cart-total">
            <span>合計</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary" onClick={handleCheckout} disabled={loading} style={{ width: "100%" }}>
            {loading ? "処理中..." : "レジに進む"}
          </button>
        </div>
      )}
    </div>
  );
}
