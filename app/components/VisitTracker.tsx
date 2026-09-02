"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// ページ遷移のたびに /api/track へ匿名でアクセスを記録する。
// 管理画面自体へのアクセスは集計対象に含めない。
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {
      // 記録に失敗してもページ表示には影響させない
    });
  }, [pathname]);

  return null;
}
