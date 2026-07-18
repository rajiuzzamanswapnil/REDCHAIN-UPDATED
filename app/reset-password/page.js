"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { readableError } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function update(event) {
    event.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true); setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) setError(readableError(updateError));
    else router.replace("/dashboard");
  }

  return <div className="config-error"><div className="card card-pad" style={{ width: "min(480px,100%)" }}><div className="feature-icon"><KeyRound /></div><h2>Set a new password</h2><p style={{ color: "#667085" }}>Choose a strong password with at least eight characters.</p><form onSubmit={update} className="stack"><div className="form-group"><label>New password</label><input className="input" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div><div className="form-group"><label>Confirm password</label><input className="input" type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>{error && <div className="notice notice-danger">{error}</div>}<button className="btn btn-primary" disabled={loading}>{loading ? "Updating..." : "Update password"}</button><Link href="/auth" className="btn btn-ghost">Back to sign in</Link></form></div></div>;
}
