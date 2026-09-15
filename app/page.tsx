import { query, Product } from "@/lib/db";
import AddToCartButton from "./components/AddToCartButton";
import ClearCartOnSuccess from "./components/ClearCartOnSuccess";

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

function formatPrice(yen: number) {
  return `¥${yen.toLocaleString("ja-JP")}`;
}

function formatAvailableAt(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { checkout?: string };
}) {
  const products = await getProducts();

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

      {products.length === 0 ? (
        <div className="empty-state">現在、販売中の商品はありません。</div>
      ) : (
        <div className="product-grid">
          {products.map((p) => {
            const soldOut = p.stock_quantity <= 0;
            const isUpcoming = Boolean(p.available_at && new Date(p.available_at) > new Date());
            return (
              <div className="product-card" key={p.id}>
                {isUpcoming ? (
                  <span className="sold-out-badge">販売開始前</span>
                ) : (
                  soldOut && <span className="sold-out-badge">SOLD OUT</span>
                )}
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="product-image" />
                ) : (
                  <div className="product-image-placeholder">No Image</div>
                )}
                <div className="product-body">
                  <div className="product-name">{p.name}</div>
                  {p.description && <div className="product-desc">{p.description}</div>}
                  <div className="product-price">{formatPrice(p.price)}</div>
                  {isUpcoming && p.available_at && (
                    <p className="hint" style={{ marginBottom: 8 }}>
                      販売開始: {formatAvailableAt(p.available_at)}〜
                    </p>
                  )}
                  <AddToCartButton
                    productId={p.id}
                    name={p.name}
                    price={p.price}
                    imageUrl={p.image_url}
                    soldOut={soldOut}
                    upcoming={isUpcoming}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
