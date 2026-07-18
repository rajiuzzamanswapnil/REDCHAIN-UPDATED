"use client";

import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ConfigGuard({ children }) {
  const { configured } = useAuth();
  if (configured) return children;
  return (
    <div className="config-error">
      <div className="card card-pad">
        <div className="notice notice-warning">
          <AlertTriangle size={22} />
          <div>
            <strong>Supabase connection is not configured.</strong>
            <div style={{ marginTop: 5 }}>
              Add <span className="code-pill">NEXT_PUBLIC_SUPABASE_URL</span> and <span className="code-pill">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</span> in Vercel Project Settings → Environment Variables, then redeploy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
