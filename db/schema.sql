-- Railway PostgreSQLに接続して実行してください。
-- 例: psql "$DATABASE_URL" -f db/schema.sql
-- または Railwayダッシュボードの Postgres サービス → Data タブ → Query から貼り付けて実行できます。

create extension if not exists pgcrypto;

-- 商品テーブル
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price integer not null,              -- 日本円(税込・整数、例: 1500)
  description text not null default '',
  image_url text,
  is_active boolean not null default true,
  stock_quantity integer not null default 1,  -- 在庫数。0になると一覧に表示したままSOLD OUT表示になる
  available_at timestamptz,                   -- 販売開始日時。NULLなら即時販売可
  category text,                              -- 商品カテゴリ(任意の自由入力。絞り込み表示に使用)
  created_at timestamptz not null default now()
);

-- 既存のproductsテーブルに stock_quantity 列がまだない場合に追加(初回作成時は無視されます)
alter table products add column if not exists stock_quantity integer not null default 1;

-- 販売開始日時(NULLなら即時販売可)。指定時刻より前は購入不可として扱う。
alter table products add column if not exists available_at timestamptz;

-- 商品カテゴリ(任意)
alter table products add column if not exists category text;

-- 注文テーブル(Stripe Webhookから記録)
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  customer_email text,
  shipping_name text,
  shipping_address jsonb,
  items jsonb not null default '[]'::jsonb,  -- [{"id":"...","name":"...","price":1500,"quantity":2}]
  amount_total integer not null default 0,
  status text not null default '処理中',       -- '処理中' | '発送済み'。購入者向け注文状況確認ページに表示
  created_at timestamptz not null default now()
);

-- 既存環境向け(テーブルが既にある場合に列を追加)
alter table orders add column if not exists status text not null default '処理中';

-- 決済完了時に在庫を安全に減算するための関数(0未満にはならない)
create or replace function decrement_stock(p_id uuid, qty integer)
returns void as $$
begin
  update products
  set stock_quantity = greatest(stock_quantity - qty, 0)
  where id = p_id;
end;
$$ language plpgsql;

-- ブログ記事テーブル
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',    -- リッチテキストエディタが生成するHTML
  cover_image_url text,
  is_published boolean not null default true,
  is_free boolean not null default false,  -- true: 誰でも閲覧可, false: サイト購入者限定
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 既存環境向け(テーブルが既にある場合に列を追加)
alter table posts add column if not exists is_free boolean not null default false;

-- アクセス状況(ページビュー)テーブル。/api/track から匿名で記録されます。
create table if not exists page_views (
  id bigserial primary key,
  path text not null,
  referrer text,
  device text,
  created_at timestamptz not null default now()
);

-- 既存環境向け(テーブルが既にある場合に列を追加)
alter table page_views add column if not exists referrer text;
alter table page_views add column if not exists device text;

create index if not exists page_views_created_at_idx on page_views (created_at);

-- 取引先(取扱店)テーブル
create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 既存環境向け(テーブルが既にある場合に列を追加)
alter table partners add column if not exists address text;

-- 商品クリック数(「買物籠に入れる」ボタン押下)を記録するテーブル。
-- どの商品が一番クリックされているかを管理画面で確認するために使う。
create table if not exists product_clicks (
  id bigserial primary key,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists product_clicks_product_id_idx on product_clicks (product_id);

-- Instagram投稿の埋め込み管理(トップページに表示する投稿を管理画面から登録)
create table if not exists instagram_posts (
  id uuid primary key default gen_random_uuid(),
  url text not null,                           -- 投稿のパーマリンクURL(例: https://www.instagram.com/p/XXXXXXX/)
  sort_order integer not null default 0,       -- 表示順(小さいほど先に表示)
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
