"use client";

import Link from "next/link";
import { useCart } from "./CartContext";

export default function CartButton() {
  const { totalCount } = useCart();

  return (
    <Link href="/cart" className="cart-button" aria-label="カートを見る">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.5 2.5h2l2.68 12.6a2 2 0 0 0 2 1.6h8.86a2 2 0 0 0 1.97-1.63l1.4-7.47H6" />
      </svg>
      {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
    </Link>
  );
}
