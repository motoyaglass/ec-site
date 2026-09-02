"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import CartButton from "./CartButton";

export default function Header() {
  const pathname = usePathname();
  const isShop = pathname === "/";
  const isBlog = pathname.startsWith("/blog");
  const isStockists = pathname.startsWith("/stockists");

  return (
    <header className="site-header">
      <Link href="/" className="site-logo-block" aria-label="工芸硝子モトヤ トップページ">
        <Logo />
      </Link>
      <div className="site-header-right">
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
        </nav>
        <CartButton />
      </div>
    </header>
  );
}
