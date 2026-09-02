"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Product, Post, Order } from "@/lib/supabase";
import RichTextEditor from "../../components/RichTextEditor";

const emptyProductForm = {
  name: "",
  price: "",
  description: "",
  image_url: "",
  is_active: true,
  stock_quantity: "1",
};

const emptyPostForm = {
  title: "",
  content: "",
  cover_image_url: "",
  is_published: true,
};

export default function AdminDashboardPage() {
  const router = useRouter();

  // 商品管理
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // ブログ管理
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postForm, setPostForm] = useState(emptyPostForm);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [savingPost, setSavingPost] = useState(false);

  // 注文履歴
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    const res = await fetch("/api/products?all=1");
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoadingProducts(false);
  }, []);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    const res = await fetch("/api/posts?all=1");
    const data = await res.json();
    setPosts(data.posts ?? []);
    setLoadingPosts(false);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoadingOrders(false);
  }, []);

  useEffect(() => {
    loadProducts();
    loadPosts();
    loadOrders();
  }, [loadProducts, loadPosts, loadOrders]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  // --- 商品 ---

  function startEditProduct(p: Product) {
    setEditingProductId(p.id);
    setProductForm({
      name: p.name,
      price: String(p.price),
      description: p.description ?? "",
      image_url: p.image_url ?? "",
      is_active: p.is_active,
      stock_quantity: String(p.stock_quantity ?? 0),
    });
    setProductError(null);
  }

  function cancelEditProduct() {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setProductError(null);
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProductError(null);

    const priceNum = Number(productForm.price);
    if (!productForm.name.trim()) {
      setProductError("商品名を入力してください");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setProductError("価格は0以上の数値を入力してください");
      return;
    }

    const stockNum = Number(productForm.stock_quantity);
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      setProductError("在庫数は0以上の数値を入力してください");
      return;
    }

    setSavingProduct(true);
    try {
      const payload = {
        name: productForm.name.trim(),
        price: priceNum,
        description: productForm.description.trim(),
        image_url: productForm.image_url.trim() || null,
        is_active: productForm.is_active,
        stock_quantity: Math.floor(stockNum),
      };

      const res = editingProductId
        ? await fetch(`/api/products/${editingProductId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");

      cancelEditProduct();
      await loadProducts();
    } catch (err) {
      setProductError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("この商品を削除しますか?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadProducts();
    } else {
      const data = await res.json();
      alert(data.error || "削除に失敗しました");
    }
  }

  // --- ブログ ---

  function startEditPost(p: Post) {
    setEditingPostId(p.id);
    setPostForm({
      title: p.title,
      content: p.content ?? "",
      cover_image_url: p.cover_image_url ?? "",
      is_published: p.is_published,
    });
    setPostError(null);
  }

  function cancelEditPost() {
    setEditingPostId(null);
    setPostForm(emptyPostForm);
    setPostError(null);
  }

  async function handlePostSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPostError(null);

    if (!postForm.title.trim()) {
      setPostError("タイトルを入力してください");
      return;
    }

    setSavingPost(true);
    try {
      const payload = {
        title: postForm.title.trim(),
        content: postForm.content,
        cover_image_url: postForm.cover_image_url.trim() || null,
        is_published: postForm.is_published,
      };

      const res = editingPostId
        ? await fetch(`/api/posts/${editingPostId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");

      cancelEditPost();
      await loadPosts();
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSavingPost(false);
    }
  }

  async function handleDeletePost(id: string) {
    if (!confirm("この記事を削除しますか?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadPosts();
    } else {
      const data = await res.json();
      alert(data.error || "削除に失敗しました");
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          管理画面
        </h1>
        <button className="btn btn-secondary" onClick={handleLogout}>
          ログアウト
        </button>
      </div>

      {/* 商品管理 */}
      <div className="admin-section">
        <h2>{editingProductId ? "商品を編集" : "商品を追加"}</h2>
        <form onSubmit={handleProductSubmit}>
          <div className="field">
            <label>商品名</label>
            <input
              value={productForm.name}
              onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>価格(円)</label>
            <input
              type="number"
              min={0}
              value={productForm.price}
              onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>説明</label>
            <textarea
              rows={3}
              value={productForm.description}
              onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>画像URL(任意)</label>
            <input
              value={productForm.image_url}
              onChange={(e) => setProductForm((f) => ({ ...f, image_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="field">
            <label>在庫数</label>
            <input
              type="number"
              min={0}
              value={productForm.stock_quantity}
              onChange={(e) => setProductForm((f) => ({ ...f, stock_quantity: e.target.value }))}
            />
          </div>
          <p className="hint">在庫が0になると、商品一覧に表示されたままSOLD OUT表示になります。</p>
          <div className="checkbox-row">
            <input
              id="is_active"
              type="checkbox"
              checked={productForm.is_active}
              onChange={(e) => setProductForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            <label htmlFor="is_active">ショップに公開する</label>
          </div>

          {productError && <p className="error-text">{productError}</p>}

          <div className="row">
            <button className="btn btn-primary" type="submit" disabled={savingProduct}>
              {savingProduct ? "保存中..." : editingProductId ? "更新する" : "追加する"}
            </button>
            {editingProductId && (
              <button type="button" className="btn btn-secondary" onClick={cancelEditProduct}>
                キャンセル
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h2>商品一覧</h2>
        {loadingProducts ? (
          <p>読み込み中...</p>
        ) : products.length === 0 ? (
          <p className="hint">まだ商品がありません。</p>
        ) : (
          <div>
            {products.map((p) => (
              <div className="admin-product-row" key={p.id}>
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="admin-thumb" />
                ) : (
                  <div className="admin-thumb" />
                )}
                <div>
                  ¥{p.price.toLocaleString("ja-JP")}
                  <br />
                  <span className="hint" style={{ margin: 0 }}>
                    {p.stock_quantity <= 0 ? "SOLD OUT" : `在庫 ${p.stock_quantity}`}
                  </span>
                </div>
                <span className={`badge ${p.is_active ? "badge-active" : ""}`}>
                  {p.is_active ? "公開中" : "非公開"}
                </span>
                <button className="btn btn-secondary" onClick={() => startEditProduct(p)}>
                  編集
                </button>
                <button className="btn btn-danger" onClick={() => handleDeleteProduct(p.id)}>
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ブログ管理 */}
      <div className="admin-section">
        <h2>{editingPostId ? "記事を編集" : "記事を追加"}</h2>
        <form onSubmit={handlePostSubmit}>
          <div className="field">
            <label>タイトル</label>
            <input
              value={postForm.title}
              onChange={(e) => setPostForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>カバー画像URL(任意)</label>
            <input
              value={postForm.cover_image_url}
              onChange={(e) => setPostForm((f) => ({ ...f, cover_image_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="field">
            <label>本文</label>
            <RichTextEditor
              value={postForm.content}
              onChange={(html) => setPostForm((f) => ({ ...f, content: html }))}
            />
          </div>
          <div className="checkbox-row">
            <input
              id="is_published"
              type="checkbox"
              checked={postForm.is_published}
              onChange={(e) => setPostForm((f) => ({ ...f, is_published: e.target.checked }))}
            />
            <label htmlFor="is_published">ブログに公開する</label>
          </div>

          {postError && <p className="error-text">{postError}</p>}

          <div className="row">
            <button className="btn btn-primary" type="submit" disabled={savingPost}>
              {savingPost ? "保存中..." : editingPostId ? "更新する" : "追加する"}
            </button>
            {editingPostId && (
              <button type="button" className="btn btn-secondary" onClick={cancelEditPost}>
                キャンセル
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h2>記事一覧</h2>
        {loadingPosts ? (
          <p>読み込み中...</p>
        ) : posts.length === 0 ? (
          <p className="hint">まだ記事がありません。</p>
        ) : (
          <div>
            {posts.map((p) => (
              <div className="admin-product-row" key={p.id}>
                {p.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_image_url} alt={p.title} className="admin-thumb" />
                ) : (
                  <div className="admin-thumb" />
                )}
                <div>{p.title}</div>
                <div />
                <span className={`badge ${p.is_published ? "badge-active" : ""}`}>
                  {p.is_published ? "公開中" : "非公開"}
                </span>
                <button className="btn btn-secondary" onClick={() => startEditPost(p)}>
                  編集
                </button>
                <button className="btn btn-danger" onClick={() => handleDeletePost(p.id)}>
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 注文履歴 */}
      <div className="admin-section">
        <h2>注文履歴</h2>
        {loadingOrders ? (
          <p>読み込み中...</p>
        ) : orders.length === 0 ? (
          <p className="hint">まだ注文がありません。</p>
        ) : (
          <div>
            {orders.map((o) => (
              <div className="order-card" key={o.id}>
                <div className="order-card-header">
                  <span>{new Date(o.created_at).toLocaleString("ja-JP")}</span>
                  <span>¥{o.amount_total.toLocaleString("ja-JP")}</span>
                </div>
                <div className="order-card-items">
                  {o.items.map((it, i) => (
                    <div key={i}>
                      {it.name} × {it.quantity}
                    </div>
                  ))}
                </div>
                <div className="order-card-address">
                  {o.customer_email && <div>{o.customer_email}</div>}
                  {formatShippingAddress(o)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatShippingAddress(o: Order) {
  const addr = o.shipping_address as
    | { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string }
    | null;
  if (!addr) return null;
  const parts = [
    addr.postal_code && `〒${addr.postal_code}`,
    addr.state,
    addr.city,
    addr.line1,
    addr.line2,
    addr.country,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <div>
      {o.shipping_name && <span>{o.shipping_name} / </span>}
      {parts.join(" ")}
    </div>
  );
}
