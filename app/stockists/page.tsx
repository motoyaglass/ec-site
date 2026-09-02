import type { Metadata } from "next";
import { query, Partner } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "取引業者一覧",
  description: "工芸硝子モトヤの作品をお取り扱いいただいている取引先の一覧です。",
};

async function getPartners(): Promise<Partner[]> {
  try {
    return await query<Partner>(
      "select * from partners where is_active = true order by name asc"
    );
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default async function StockistsPage() {
  const partners = await getPartners();

  return (
    <div>
      {partners.length === 0 ? (
        <div className="empty-state">現在、掲載している取引先はありません。</div>
      ) : (
        <ul className="partner-list">
          {partners.map((p) => (
            <li className="partner-list-item" key={p.id}>
              {p.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
