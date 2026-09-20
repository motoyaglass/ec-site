"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useCart } from "./CartContext";
import { useFavorites } from "./FavoritesContext";

export default function Header() {
  const pathname = usePathname();
  const { totalCount } = useCart();
  const { ids: favoriteIds } = useFavorites();
  const [menuOpen, setMenuOpen] = useState(false);

  const isShop = pathname === "/";
  const isBlog = pathname.startsWith("/blog");
  const isFavorites = pathname.startsWith("/favorites");
  const isOrders = pathname.startsWith("/orders");
  const isStockists = pathname.startsWith("/stockists");
  const isCart = pathname.startsWith("/cart");

  // ページ遷移したらメニューを閉じる
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const links = [
    { href: "/", label: "通販", active: isShop },
    { href: "/blog", label: "日誌", active: isBlog },
    {
      href: "/favorites",
      label: "お気に入り",
      active: isFavorites,
      badge: favoriteIds.length > 0 ? favoriteIds.length : undefined,
    },
    { href: "/orders", label: "注文状況確認", active: isOrders },
    { href: "/stockists", label: "取引業者一覧", active: isStockists },
    {
      href: "/cart",
      label: "買物籠",
      active: isCart,
      badge: totalCount > 0 ? totalCount : undefined,
      ariaLabel: "買物籠を見る",
    },
  ];

  // スマホ表示では買物籠は右上のアイコンで常時アクセスできるようにし、
  // ドロワー(ハンバーガーメニュー)には残りのリンクだけを表示する
  const drawerLinks = links.filter((l) => l.href !== "/cart");

  return (
    <header className="site-header">
      <div className="site-header-row">
        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className={`menu-toggle-icon ${menuOpen ? "open" : ""}`} />
        </button>

        <Link href="/" className="site-logo-block" aria-label="工芸硝子モトヤ トップページ">
          <Logo />
        </Link>

        <nav className="site-nav">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`site-nav-link ${l.active ? "active" : ""}`}
              aria-label={l.ariaLabel}
            >
              {l.label}
              {l.badge !== undefined && <span className="nav-badge">{l.badge}</span>}
            </Link>
          ))}
        </nav>

        <Link href="/cart" className="cart-shortcut" aria-label="買物籠を見る">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M9 8V6a3 3 0 0 1 6 0v2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
          {totalCount > 0 && <span className="nav-badge cart-shortcut-badge">{totalCount}</span>}
        </Link>
      </div>

      <nav className={`site-nav-mobile ${menuOpen ? "open" : ""}`}>
        {drawerLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`site-nav-link ${l.active ? "active" : ""}`}
            aria-label={l.ariaLabel}
          >
            {l.label}
            {l.badge !== undefined && <span className="nav-badge">{l.badge}</span>}
          </Link>
        ))}
      </nav>
    </header>
  );
}
