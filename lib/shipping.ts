// 送料の設定。
// - 商品合計金額が FREE_SHIPPING_THRESHOLD 以上の場合は送料無料
// - それ以外は「ゆうパック60サイズ・沖縄(工芸硝子モトヤ)発」の地域別運賃(日本郵便公式サイトの
//   都道府県別基本運賃表を基準)を、お届け先の地域に応じて請求する
//   参考: https://www.post.japanpost.jp/service/domestic/charge/list/yu-pack/47.html
export const FREE_SHIPPING_THRESHOLD = 20000; // 円(税込)

export type ShippingRegion = {
  id: string;
  label: string;
  amount: number; // 円
};

export const SHIPPING_REGIONS: ShippingRegion[] = [
  { id: "okinawa", label: "沖縄県", amount: 820 },
  { id: "kyushu", label: "九州(福岡・佐賀・長崎・熊本・大分・宮崎・鹿児島)", amount: 1100 },
  { id: "chugoku", label: "中国(岡山・広島・鳥取・島根・山口)", amount: 1340 },
  {
    id: "kanto-tokai-kinki-shikoku",
    label: "関東・東海・近畿・四国(茨城・栃木・群馬・埼玉・千葉・東京・神奈川・山梨・静岡・愛知・岐阜・三重・奈良・滋賀・京都・大阪・兵庫・和歌山・徳島・香川・愛媛・高知)",
    amount: 1450,
  },
  { id: "shinetsu-hokuriku", label: "信越・北陸(新潟・長野・富山・石川・福井)", amount: 1600 },
  { id: "hokkaido-tohoku", label: "北海道・東北(北海道・青森・岩手・宮城・秋田・山形・福島)", amount: 1750 },
];

export function getShippingRegion(id: string): ShippingRegion | undefined {
  return SHIPPING_REGIONS.find((r) => r.id === id);
}

export function calculateShippingFee(subtotal: number, regionId: string): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return getShippingRegion(regionId)?.amount ?? 0;
}
