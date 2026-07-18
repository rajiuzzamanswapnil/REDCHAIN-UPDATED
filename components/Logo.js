import Link from "next/link";
import { Droplets } from "lucide-react";

export default function Logo({ href = "/", compact = false }) {
  return (
    <Link href={href} className="brand" aria-label="RedChain Malaysia home">
      <span className="brand-mark"><Droplets size={21} strokeWidth={2.6} /></span>
      {!compact && (
        <span>
          RedChain
          <small>Malaysia</small>
        </span>
      )}
    </Link>
  );
}
