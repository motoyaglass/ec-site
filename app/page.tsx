import { supabaseAdmin, Product } from "@/lib/supabase";
import AddToCartButton from "./components/AddToCartButton";
import ClearCartOnSuccess from "./components/ClearCartOnSuccess";

export const dynamic = "force-dynamic";

async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

function formatPrice(yen: number) {
  return `¥${yen.toLocaleString("ja-JP")}`;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { checkout?: string };
}) {
  const products = await getProducts();

  return (
    <div>
      <h1 className="page-title">Shop</h1>
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
            return (
              <div className="product-card" key={p.id}>
                {soldOut && <span className="sold-out-badge">SOLD OUT</span>}
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
                  <AddToCartButton
                    productId={p.id}
                    name={p.name}
                    price={p.price}
                    imageUrl={p.image_url}
                    soldOut={soldOut}
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
