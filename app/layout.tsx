import type { Metadata } from "next";
import Link from "next/link";
import Logo from "./components/Logo";
import BottomSwitcher from "./components/BottomSwitcher";
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
          <main>
            <Link href="/" className="site-logo-block" aria-label="工芸硝子モトヤ トップページ">
              <Logo />
            </Link>
            {children}
          </main>
          <BottomSwitcher />
        </CartProvider>
      </body>
    </html>
  );
}
