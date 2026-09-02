import type { Metadata } from "next";
import Header from "./components/Header";
import CartButton from "./components/CartButton";
import { CartProvider } from "./components/CartContext";
import VisitTracker from "./components/VisitTracker";
import "./globals.css";

export const metadata: Metadata = {
  title: "工芸硝子モトヤ",
  description: "工芸硝子モトヤ 個人ショップ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <CartProvider>
          <VisitTracker />
          <CartButton />
          <Header />
          <main>{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
