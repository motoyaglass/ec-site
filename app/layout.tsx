import type { Metadata } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { CartProvider } from "./components/CartContext";
import VisitTracker from "./components/VisitTracker";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kougeiglassmotoya.jp";

const siteTitle = "工芸硝子モトヤ | 吹きガラス工 小野資矢";
const siteDescription =
  "吹きガラス工・小野資矢が営む工芸硝子モトヤの公式サイト。一つひとつ手作りするガラス作品の販売と、制作の様子を綴るブログ。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | 工芸硝子モトヤ",
  },
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: "工芸硝子モトヤ",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "工芸硝子モトヤ",
  url: siteUrl,
  description: siteDescription,
  founder: {
    "@type": "Person",
    name: "小野資矢",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CartProvider>
          <VisitTracker />
          <Header />
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
