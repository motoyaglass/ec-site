export default function Footer() {
  return (
    <footer className="site-footer">
      <p>
        「工芸硝子モトヤ」は、ガラス作家・小野資矢が一つひとつ手作りするガラス作品を制作・販売する個人ショップです。
      </p>
      <p className="site-footer-copyright">
        &copy; {new Date().getFullYear()} 工芸硝子モトヤ(小野資矢)
      </p>
    </footer>
  );
}
