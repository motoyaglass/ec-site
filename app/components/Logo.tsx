import Image from "next/image";

export default function Logo() {
  return (
    <Image
      src="/logo/logo.png"
      alt="工芸硝子モトヤ"
      width={2185}
      height={1631}
      priority
      className="site-logo-img"
    />
  );
}
