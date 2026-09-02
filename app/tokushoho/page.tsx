import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
};

const rows = [
  { label: "販売業者", value: "工芸硝子モトヤ 小野資矢" },
  { label: "運営統括責任者", value: "小野資矢" },
  { label: "所在地", value: "ご請求をいただいた場合、遅滞なく開示いたします" },
  { label: "電話番号", value: "ご請求をいただいた場合、遅滞なく開示いたします" },
  { label: "メールアドレス", value: "motoyaglass@gmail.com" },
  { label: "販売価格", value: "各商品ページに表示する価格(消費税込)" },
  { label: "商品代金以外の必要料金", value: "送料(お届け先により異なります。ご注文確定画面にてご確認いただけます)" },
  { label: "お支払い方法", value: "クレジットカード決済" },
  { label: "お支払い時期", value: "ご注文時にお支払いが確定します" },
  { label: "商品のお届け時期", value: "ご注文を受けてから5日以内に発送いたします" },
  {
    label: "返品について",
    value: "商品に欠陥がある場合を除き、お客様のご都合による返品・交換はお受けしておりません。",
  },
];

export default function TokushohoPage() {
  return (
    <div>
      <h1 className="page-title">特定商取引法に基づく表記</h1>
      <dl className="legal-list">
        {rows.map((r) => (
          <div className="legal-row" key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
