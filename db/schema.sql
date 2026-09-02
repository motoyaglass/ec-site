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
  created_at timestamptz not null default now()
);

-- 既存のproductsテーブルに stock_quantity 列がまだない場合に追加(初回作成時は無視されます)
alter table products add column if not exists stock_quantity integer not null default 1;

-- 注文テーブル(Stripe Webhookから記録)
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  customer_email text,
  shipping_name text,
  shipping_address jsonb,
  items jsonb not null default '[]'::jsonb,  -- [{"id":"...","name":"...","price":1500,"quantity":2}]
  amount_total integer not null default 0,
  created_at timestamptz not null default now()
);

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- アクセス状況(ページビュー)テーブル。/api/track から匿名で記録されます。
create table if not exists page_views (
  id bigserial primary key,
  path text not null,
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_at_idx on page_views (created_at);

-- 取引先(取扱店)テーブル
create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
