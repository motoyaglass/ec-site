import type { Product } from "@/lib/db";
import AddToCartButton from "./AddToCartButton";
import FavoriteButton from "./FavoriteButton";

const LOW_STOCK_THRESHOLD = 3;

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

export default function ProductCard({ product: p }: { product: Product }) {
  const soldOut = p.stock_quantity <= 0;
  const isUpcoming = Boolean(p.available_at && new Date(p.available_at) > new Date());
  const isLowStock = !soldOut && !isUpcoming && p.stock_quantity <= LOW_STOCK_THRESHOLD;

  return (
    <div className="product-card">
      {isUpcoming ? (
        <span className="sold-out-badge">販売開始前</span>
      ) : soldOut ? (
        <span className="sold-out-badge">SOLD OUT</span>
      ) : (
        isLowStock && <span className="sold-out-badge low-stock-badge">残りわずか</span>
      )}
      <FavoriteButton productId={p.id} />
      {p.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image_url} alt={p.name} className="product-image" />
      ) : (
        <div className="product-image-placeholder">No Image</div>
      )}
      <div className="product-body">
        {p.category && <div className="product-category">{p.category}</div>}
        <div className="product-name">{p.name}</div>
        {p.description && <div className="product-desc">{p.description}</div>}
        <div className="product-price">{formatPrice(p.price)}</div>
        {isLowStock && (
          <p className="hint" style={{ marginBottom: 8 }}>
            残り{p.stock_quantity}点
          </p>
        )}
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
}
