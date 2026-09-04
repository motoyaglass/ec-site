"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Product, Post, Order, Partner } from "@/lib/db";
import RichTextEditor from "../../components/RichTextEditor";

type DailyStat = { day: string; count: number };
type HourlyStat = { hour: string; count: number };
type PathStat = { path: string; count: number };
type SourceStat = { source: string; count: number };
type DeviceStat = { device: string; count: number };
type Stats = {
  today: number;
  last7: number;
  last30: number;
  total: number;
  daily: DailyStat[];
  hourly: HourlyStat[];
  topPaths: PathStat[];
  sources: SourceStat[];
  devices: DeviceStat[];
};

const deviceLabel: Record<string, string> = {
  pc: "PC",
  mobile: "モバイル",
  tablet: "タブレット",
  不明: "不明",
};

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

const emptyPartnerForm = {
  name: "",
  is_active: true,
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
  const [uploadingProductImage, setUploadingProductImage] = useState(false);

  // ブログ管理
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postForm, setPostForm] = useState(emptyPostForm);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [savingPost, setSavingPost] = useState(false);

  // 取引先管理
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [partnerForm, setPartnerForm] = useState(emptyPartnerForm);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [savingPartner, setSavingPartner] = useState(false);

  // 注文履歴
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // アクセス状況
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

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

  const loadPartners = useCallback(async () => {
    setLoadingPartners(true);
    const res = await fetch("/api/partners?all=1");
    const data = await res.json();
    setPartners(data.partners ?? []);
    setLoadingPartners(false);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoadingOrders(false);
  }, []);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (res.ok) setStats(data);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const maxDaily = useMemo(
    () => Math.max(1, ...(stats?.daily.map((d) => d.count) ?? [0])),
    [stats]
  );

  const maxHourly = useMemo(
    () => Math.max(1, ...(stats?.hourly.map((h) => h.count) ?? [0])),
    [stats]
  );

  const totalSources = useMemo(
    () => Math.max(1, (stats?.sources ?? []).reduce((sum, s) => sum + s.count, 0)),
    [stats]
  );

  const totalDevices = useMemo(
    () => Math.max(1, (stats?.devices ?? []).reduce((sum, d) => sum + d.count, 0)),
    [stats]
  );

  useEffect(() => {
    loadProducts();
    loadPosts();
    loadPartners();
    loadOrders();
    loadStats();
  }, [loadProducts, loadPosts, loadPartners, loadOrders, loadStats]);

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

  async function handleProductImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じファイルを選び直せるようにリセット
    if (!file) return;

    setUploadingProductImage(true);
    setProductError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "画像のアップロードに失敗しました");
      setProductForm((f) => ({ ...f, image_url: data.url }));
    } catch (err) {
      setProductError(err instanceof Error ? err.message : "画像のアップロードに失敗しました");
    } finally {
      setUploadingProductImage(false);
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

  // --- 取引先 ---

  function startEditPartner(p: Partner) {
    setEditingPartnerId(p.id);
    setPartnerForm({
      name: p.name,
      is_active: p.is_active,
    });
    setPartnerError(null);
  }

  function cancelEditPartner() {
    setEditingPartnerId(null);
    setPartnerForm(emptyPartnerForm);
    setPartnerError(null);
  }

  async function handlePartnerSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPartnerError(null);

    if (!partnerForm.name.trim()) {
      setPartnerError("店舗名を入力してください");
      return;
    }

    setSavingPartner(true);
    try {
      const payload = {
        name: partnerForm.name.trim(),
        is_active: partnerForm.is_active,
      };

      const res = editingPartnerId
        ? await fetch(`/api/partners/${editingPartnerId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/partners", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");

      cancelEditPartner();
      await loadPartners();
    } catch (err) {
      setPartnerError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSavingPartner(false);
    }
  }

  async function handleDeletePartner(id: string) {
    if (!confirm("この取引先を削除しますか?")) return;
    const res = await fetch(`/api/partners/${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadPartners();
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

      {/* アクセス状況 */}
      <div className="admin-section">
        <h2>アクセス状況</h2>
        {loadingStats ? (
          <p>読み込み中...</p>
        ) : !stats ? (
          <p className="hint">アクセス状況を取得できませんでした。</p>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.today}</div>
                <div className="stat-label">本日</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.last7}</div>
                <div className="stat-label">過去7日</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.last30}</div>
                <div className="stat-label">過去30日</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">累計</div>
              </div>
            </div>
            {stats.daily.length > 0 && (
              <div className="stats-daily">
                {stats.daily.map((d) => (
                  <div className="stats-daily-row" key={d.day}>
                    <span className="stats-daily-date">{d.day.slice(5)}</span>
                    <div className="stats-daily-bar-track">
                      <div
                        className="stats-daily-bar"
                        style={{ width: `${(d.count / maxDaily) * 100}%` }}
                      />
                    </div>
                    <span className="stats-daily-count">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="hint">
              ページを開いた回数(閲覧数)を記録しています。管理画面へのアクセスは含みません。
            </p>

            <h3 className="stats-subheading">時間帯別アクセス(過去30日・日本時間)</h3>
            {stats.hourly.length > 0 && (
              <div className="stats-daily">
                {stats.hourly.map((h) => (
                  <div className="stats-daily-row" key={h.hour}>
                    <span className="stats-daily-date">{h.hour}時</span>
                    <div className="stats-daily-bar-track">
                      <div
                        className="stats-daily-bar"
                        style={{ width: `${(h.count / maxHourly) * 100}%` }}
                      />
                    </div>
                    <span className="stats-daily-count">{h.count}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="stats-marketing-grid">
              <div>
                <h3 className="stats-subheading">人気ページ(過去30日)</h3>
                {stats.topPaths.length === 0 ? (
                  <p className="hint">データがありません。</p>
                ) : (
                  <ul className="stats-rank-list">
                    {stats.topPaths.map((p) => (
                      <li key={p.path}>
                        <span className="stats-rank-label">{p.path}</span>
                        <span className="stats-rank-count">{p.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="stats-subheading">流入元(過去30日)</h3>
                {stats.sources.length === 0 ? (
                  <p className="hint">データがありません。</p>
                ) : (
                  <ul className="stats-rank-list">
                    {stats.sources.map((s) => (
                      <li key={s.source}>
                        <span className="stats-rank-label">{s.source}</span>
                        <span className="stats-rank-count">
                          {s.count}({Math.round((s.count / totalSources) * 100)}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="stats-subheading">デバイス(過去30日)</h3>
                {stats.devices.length === 0 ? (
                  <p className="hint">データがありません。</p>
                ) : (
                  <ul className="stats-rank-list">
                    {stats.devices.map((d) => (
                      <li key={d.device}>
                        <span className="stats-rank-label">{deviceLabel[d.device] ?? d.device}</span>
                        <span className="stats-rank-count">
                          {d.count}({Math.round((d.count / totalDevices) * 100)}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
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
            <label>商品画像(任意)</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleProductImageSelect}
              disabled={uploadingProductImage}
            />
            {uploadingProductImage && <p className="hint">アップロード中...</p>}
            {productForm.image_url && (
              <div className="row" style={{ marginTop: 8, alignItems: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={productForm.image_url} alt="プレビュー" className="admin-thumb" />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setProductForm((f) => ({ ...f, image_url: "" }))}
                >
                  画像を削除
                </button>
              </div>
            )}
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
                <div />
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

      {/* 取引先管理 */}
      <div className="admin-section">
        <h2>{editingPartnerId ? "取引先を編集" : "取引先を追加"}</h2>
        <form onSubmit={handlePartnerSubmit}>
          <div className="field">
            <label>店舗名</label>
            <input
              value={partnerForm.name}
              onChange={(e) => setPartnerForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="checkbox-row">
            <input
              id="partner_is_active"
              type="checkbox"
              checked={partnerForm.is_active}
              onChange={(e) => setPartnerForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            <label htmlFor="partner_is_active">STOCKISTSページに公開する</label>
          </div>

          {partnerError && <p className="error-text">{partnerError}</p>}

          <div className="row">
            <button className="btn btn-primary" type="submit" disabled={savingPartner}>
              {savingPartner ? "保存中..." : editingPartnerId ? "更新する" : "追加する"}
            </button>
            {editingPartnerId && (
              <button type="button" className="btn btn-secondary" onClick={cancelEditPartner}>
                キャンセル
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h2>取引先一覧</h2>
        {loadingPartners ? (
          <p>読み込み中...</p>
        ) : partners.length === 0 ? (
          <p className="hint">まだ取引先がありません。</p>
        ) : (
          <div>
            {partners.map((p) => (
              <div className="admin-product-row" key={p.id}>
                <div />
                <div>{p.name}</div>
                <div />
                <span className={`badge ${p.is_active ? "badge-active" : ""}`}>
                  {p.is_active ? "公開中" : "非公開"}
                </span>
                <button className="btn btn-secondary" onClick={() => startEditPartner(p)}>
                  編集
                </button>
                <button className="btn btn-danger" onClick={() => handleDeletePartner(p.id)}>
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
