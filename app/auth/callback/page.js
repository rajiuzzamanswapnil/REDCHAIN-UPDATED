"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    async function complete() {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) { setError(exchangeError.message); return; }
      }
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) { setError(sessionError.message); return; }
      if (data.session) router.replace("/dashboard");
      else setTimeout(() => router.replace("/auth"), 1200);
    }
    complete();
  }, [router]);

  return (
    <div className="config-error">
      <div className="card card-pad" style={{ textAlign: "center", maxWidth: 520 }}>
        {error ? <><XCircle size={48} color="#b42318" style={{ margin: "0 auto 14px" }} /><h2>Confirmation could not be completed</h2><p>{error}</p><Link className="btn btn-primary" href="/auth">Return to sign in</Link></> : <><CheckCircle2 size={48} color="#159455" style={{ margin: "0 auto 14px" }} /><h2>Email confirmed</h2><p style={{ color: "#667085" }}>Preparing your RedChain dashboard...</p><div className="spinner" /></>}
      </div>
    </div>
  );
}
