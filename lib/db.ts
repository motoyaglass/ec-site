import { Pool } from "pg";

// Railway の Postgres プラグインが自動で発行する DATABASE_URL を使う。
// このクライアントは必ずサーバー側(API Route / Server Component)からのみ import すること。

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://placeholder",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string | null;
  is_active: boolean;
  stock_quantity: number;
  created_at: string;
};

export type Post = {
  id: string;
  title: string;
  content: string; // リッチテキストエディタで生成されたHTML
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type Partner = {
  id: string;
  name: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  stripe_session_id: string;
  customer_email: string | null;
  shipping_name: string | null;
  shipping_address: Record<string, unknown> | null;
  items: OrderItem[];
  amount_total: number;
  created_at: string;
};
