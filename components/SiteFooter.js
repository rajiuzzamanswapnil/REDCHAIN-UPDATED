import Link from "next/link";
import Logo from "./Logo";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Logo />
        <div>Verified matching • Controlled contact sharing • Malaysia-wide access</div>
        <div className="footer-links">
          <Link href="/requests">Requests</Link>
          <Link href="/feedback">Feedback</Link>
          <Link href="/auth">Account</Link>
        </div>
      </div>
    </footer>
  );
}
