"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "../components/CartContext";
import { SHIPPING_REGIONS, FREE_SHIPPING_THRESHOLD, calculateShippingFee } from "@/lib/shipping";

function formatPrice(yen: number) {
  return `¥${yen.toLocaleString("ja-JP")}`;
}

export default function CartPage() {
  const { items, totalPrice, removeItem, updateQuantity } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regionId, setRegionId] = useState("");

  const freeShipping = totalPrice >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = useMemo(
    () => (regionId ? calculateShippingFee(totalPrice, regionId) : null),
    [totalPrice, regionId]
  );

  async function handleCheckout() {
    if (!regionId) {
      setError("お届け先の地域を選択してください");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          region: regionId,
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

          <div className="field">
            <label htmlFor="shipping-region">お届け先の地域</label>
            <select
              id="shipping-region"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
            >
              <option value="">選択してください</option>
              {SHIPPING_REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {freeShipping ? (
            <p className="hint">
              {FREE_SHIPPING_THRESHOLD.toLocaleString("ja-JP")}円以上のご購入のため送料無料です。
            </p>
          ) : (
            regionId && (
              <p className="hint">
                送料: {formatPrice(shippingFee ?? 0)}(ゆうパック・沖縄発)
              </p>
            )
          )}

          <div className="cart-total">
            <span>商品合計</span>
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
