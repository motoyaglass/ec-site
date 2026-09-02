import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <nav className="site-footer-links">
        <Link href="/tokushoho">特定商取引法に基づく表記</Link>
      </nav>
      <p className="site-footer-copyright">
        &copy; {new Date().getFullYear()} 工芸硝子モトヤ 小野資矢
      </p>
    </footer>
  );
}
