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

  return (
    <header className="site-header">
      <div className="site-header-row">
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

        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className={`menu-toggle-icon ${menuOpen ? "open" : ""}`} />
        </button>
      </div>

      <nav className={`site-nav-mobile ${menuOpen ? "open" : ""}`}>
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
    </header>
  );
}
