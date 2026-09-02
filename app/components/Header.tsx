"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

export default function Header() {
  const pathname = usePathname();
  const isBlog = pathname.startsWith("/blog");

  return (
    <header className="site-header">
      <Link href="/" className="site-logo-block" aria-label="工芸硝子モトヤ トップページ">
        <Logo />
      </Link>
      <nav className="site-nav">
        <Link href="/" className={`site-nav-link ${!isBlog ? "active" : ""}`}>
          ショップ
        </Link>
        <Link href="/blog" className={`site-nav-link ${isBlog ? "active" : ""}`}>
          ブログ
        </Link>
      </nav>
    </header>
  );
}
