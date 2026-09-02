"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import CartButton from "./CartButton";

export default function Header() {
  const pathname = usePathname();
  const isBlog = pathname.startsWith("/blog");

  return (
    <header className="site-header">
      <Link href="/" className="site-logo-block" aria-label="工芸硝子モトヤ トップページ">
        <Logo />
      </Link>
      <div className="site-header-right">
        <nav className="site-nav">
          <Link href="/" className={`site-nav-link ${!isBlog ? "active" : ""}`}>
            SHOP
          </Link>
          <Link href="/blog" className={`site-nav-link ${isBlog ? "active" : ""}`}>
            BLOG
          </Link>
        </nav>
        <CartButton />
      </div>
    </header>
  );
}
