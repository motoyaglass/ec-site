"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/db";
import { useFavorites } from "../components/FavoritesContext";
import ProductCard from "../components/ProductCard";

export default function FavoritesPage() {
  const { ids } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setProducts(data.products ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const favoriteProducts = products.filter((p) => ids.includes(p.id));

  return (
    <div>
      <h1 className="page-title">お気に入り</h1>
      <p className="page-desc">ハートマークで登録した商品は、この端末に保存されます。</p>

      {!loaded ? (
        <p>読み込み中...</p>
      ) : ids.length === 0 ? (
        <div className="empty-state">
          お気に入りに登録した商品はまだありません。
          <br />
          <Link href="/" style={{ textDecoration: "underline" }}>
            ショップへ戻る
          </Link>
        </div>
      ) : favoriteProducts.length === 0 ? (
        <div className="empty-state">
          お気に入りに登録した商品は現在、販売終了または非公開になっています。
        </div>
      ) : (
        <div className="product-grid">
          {favoriteProducts.map((p) => (
            <ProductCard product={p} key={p.id} />
          ))}
        </div>
      )}
    </div>
  );
}
