import { statusTone } from "@/lib/utils";

export default function StatusBadge({ status, children }) {
  return <span className={`badge badge-${statusTone(status)}`}>{children || String(status || "unknown").replaceAll("_", " ")}</span>;
}
