"use client";

import { useState } from "react";
import { useCart } from "./CartContext";

export default function AddToCartButton({
  productId,
  name,
  price,
  imageUrl,
  soldOut,
  upcoming,
}: {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  soldOut: boolean;
  upcoming?: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    if (upcoming) return;
    addItem({ productId, name, price, image_url: imageUrl });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);

    fetch(`/api/products/${productId}/click`, { method: "POST", keepalive: true }).catch(() => {
      // 記録に失敗してもカート追加自体には影響させない
    });
  }

  return (
    <button
      className="btn btn-primary"
      onClick={handleClick}
      disabled={soldOut || upcoming}
      style={{ width: "100%" }}
    >
      {upcoming ? "販売開始前" : soldOut ? "SOLD OUT" : added ? "買物籠に追加しました" : "買物籠に入れる"}
    </button>
  );
}
