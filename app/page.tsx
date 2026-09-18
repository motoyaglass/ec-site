import Link from "next/link";
import { query, Product } from "@/lib/db";
import ProductCard from "./components/ProductCard";
import ClearCartOnSuccess from "./components/ClearCartOnSuccess";
import InstagramFeed from "./components/InstagramFeed";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kougeiglassmotoya.jp";

function absoluteUrl(path: string) {
  return path.startsWith("http") ? path : `${siteUrl}${path}`;
}

function buildProductsJsonLd(products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((p, i) => {
      const isUpcoming = Boolean(p.available_at && new Date(p.available_at) > new Date());
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.name,
          description: p.description || undefined,
          image: p.image_url ? absoluteUrl(p.image_url) : undefined,
          url: siteUrl,
          offers: {
            "@type": "Offer",
            priceCurrency: "JPY",
            price: p.price,
            availability: isUpcoming
              ? "https://schema.org/PreOrder"
              : p.stock_quantity > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            availabilityStarts: isUpcoming ? p.available_at ?? undefined : undefined,
            url: siteUrl,
          },
        },
      };
    }),
  };
}

async function getProducts(): Promise<Product[]> {
  try {
    return await query<Product>(
      "select * from products where is_active = true order by created_at desc"
    );
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { checkout?: string; category?: string };
}) {
  const products = await getProducts();

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c)))
  ).sort((a, b) => a.localeCompare(b, "ja"));

  const activeCategory =
    searchParams.category && categories.includes(searchParams.category)
      ? searchParams.category
      : null;

  const visibleProducts = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : products;

  return (
    <div>
      {products.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProductsJsonLd(products)) }}
        />
      )}
      <ClearCartOnSuccess success={searchParams.checkout === "success"} />

      {searchParams.checkout === "success" && (
        <p style={{ color: "#1a7a3c", marginBottom: 24 }}>ご購入ありがとうございました。決済が完了しました。</p>
      )}
      {searchParams.checkout === "canceled" && (
        <p style={{ color: "#6b6b6b", marginBottom: 24 }}>決済がキャンセルされました。</p>
      )}

      {categories.length > 0 && (
        <div className="category-filter">
          <Link href="/" className={`category-chip ${!activeCategory ? "active" : ""}`}>
            すべて
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/?category=${encodeURIComponent(c)}`}
              className={`category-chip ${activeCategory === c ? "active" : ""}`}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="empty-state">現在、販売中の商品はありません。</div>
      ) : visibleProducts.length === 0 ? (
        <div className="empty-state">該当する商品がありません。</div>
      ) : (
        <div className="product-grid">
          {visibleProducts.map((p) => (
            <ProductCard product={p} key={p.id} />
          ))}
        </div>
      )}

      <InstagramFeed />
    </div>
  );
}
