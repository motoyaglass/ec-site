"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEM_WIDTH = 92;

export default function BottomSwitcher() {
  const pathname = usePathname();
  const isBlog = pathname.startsWith("/blog");

  return (
    <div className="bottom-switcher">
      <div
        className="bottom-switcher-indicator"
        style={{
          width: ITEM_WIDTH,
          transform: `translateX(${isBlog ? ITEM_WIDTH : 0}px)`,
        }}
      />
      <Link href="/" className={!isBlog ? "active" : ""} style={{ width: ITEM_WIDTH }}>
        ショップ
      </Link>
      <Link href="/blog" className={isBlog ? "active" : ""} style={{ width: ITEM_WIDTH }}>
        ブログ
      </Link>
    </div>
  );
}
