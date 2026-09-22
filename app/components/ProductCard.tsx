import type { Product } from "@/lib/db";
import AddToCartButton from "./AddToCartButton";

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

function formatShipDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
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
      {p.is_preorder && <span className="preorder-badge">予約販売(受注生産)</span>}
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
        {p.is_preorder && (
          <p className="hint preorder-hint" style={{ marginBottom: 8 }}>
            {p.preorder_note || "受注生産のため、発送までお時間をいただきます。"}
            {p.preorder_ship_date && (
              <>
                <br />
                発送予定: {formatShipDate(p.preorder_ship_date)}〜
              </>
            )}
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
