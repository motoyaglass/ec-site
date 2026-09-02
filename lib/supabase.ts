import { createClient } from "@supabase/supabase-js";

// service role key を使うため、このクライアントは必ずサーバー側(API Route / Server Component)からのみ import すること。
// クライアントコンポーネントに直接渡さない。

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder";

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

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
