"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useCart } from "./CartContext";

export default function Header() {
  const pathname = usePathname();
  const { totalCount } = useCart();
  const isShop = pathname === "/";
  const isBlog = pathname.startsWith("/blog");
  const isStockists = pathname.startsWith("/stockists");
  const isCart = pathname.startsWith("/cart");

  return (
    <header className="site-header">
      <Link href="/" className="site-logo-block" aria-label="工芸硝子モトヤ トップページ">
        <Logo />
      </Link>
      <nav className="site-nav">
        <Link href="/" className={`site-nav-link ${isShop ? "active" : ""}`}>
          通販
        </Link>
        <Link href="/blog" className={`site-nav-link ${isBlog ? "active" : ""}`}>
          日誌
        </Link>
        <Link href="/stockists" className={`site-nav-link ${isStockists ? "active" : ""}`}>
          取引業者一覧
        </Link>
        <Link href="/cart" className={`site-nav-link ${isCart ? "active" : ""}`} aria-label="買物籠を見る">
          買物籠
          {totalCount > 0 && <span className="nav-badge">{totalCount}</span>}
        </Link>
      </nav>
    </header>
  );
}
