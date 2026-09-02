"use client";

import { useState } from "react";
import { useCart } from "./CartContext";

export default function AddToCartButton({
  productId,
  name,
  price,
  imageUrl,
  soldOut,
}: {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  soldOut: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem({ productId, name, price, image_url: imageUrl });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      className="btn btn-primary"
      onClick={handleClick}
      disabled={soldOut}
      style={{ width: "100%" }}
    >
      {soldOut ? "SOLD OUT" : added ? "カートに追加しました" : "カートに入れる"}
    </button>
  );
}
