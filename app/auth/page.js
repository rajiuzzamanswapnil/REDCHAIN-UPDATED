"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, EyeOff, HeartHandshake, Loader2, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import ConfigGuard from "@/components/ConfigGuard";
import { supabase } from "@/lib/supabase/client";
import { ACCOUNT_TYPES, MALAYSIA_LOCATIONS, MALAYSIA_STATES } from "@/lib/constants";
import { readableError } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState(searchParams.get("mode") === "signup" ? "signup" : "signin");
  const [form, setForm] = useState({ fullName: "", displayName: "", email: "", password: "", accountType: "donor", state: "Kuala Lumpur", city: "Kuala Lumpur" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const cities = useMemo(() => MALAYSIA_LOCATIONS[form.state] || [], [form.state]);

  useEffect(() => {
    if (user) router.replace(searchParams.get("next") || "/dashboard");
  }, [user, router, searchParams]);

  function update(name, value) {
    setForm((current) => {
      if (name === "state") return { ...current, state: value, city: MALAYSIA_LOCATIONS[value]?.[0] || "" };
      return { ...current, [name]: value };
    });
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
        if (signInError) throw signInError;
        router.replace(searchParams.get("next") || "/dashboard");
      } else {
        if (!form.fullName.trim() || !form.displayName.trim()) throw new Error("Please provide your full name and a public display name.");
        const redirectTo = `${window.location.origin}/auth/callback`;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: form.fullName.trim(),
              display_name: form.displayName.trim(),
              account_type: form.accountType,
              state: form.state,
              city: form.city,
            },
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) router.replace("/dashboard");
        else setMessage("Registration successful. Open the confirmation email from Supabase, then sign in.");
      }
    } catch (submitError) {
      setError(readableError(submitError));
    } finally { setLoading(false); }
  }

  async function resetPassword() {
    if (!form.email.trim()) { setError("Enter your email address first."); return; }
    setLoading(true); setError(""); setMessage("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    if (resetError) setError(readableError(resetError));
    else setMessage("Password reset email sent. Check your inbox.");
    setLoading(false);
  }

  return (
    <ConfigGuard>
      <div className="auth-page">
        <div className="auth-visual">
          <div>
            <Logo />
            <h1>Verified help, without public exposure.</h1>
            <p>Join a Malaysia-focused blood donor coordination system that protects contact information and keeps requests organised.</p>
          </div>
          <div className="auth-points">
            <div className="auth-point"><ShieldCheck size={21} /><strong>Private by design</strong><div style={{ color: "#bbc4d8", fontSize: 12 }}>RLS-protected data and private documents.</div></div>
            <div className="auth-point"><HeartHandshake size={21} /><strong>Consent first</strong><div style={{ color: "#bbc4d8", fontSize: 12 }}>Donors approve contact release.</div></div>
            <div className="auth-point"><CheckCircle2 size={21} /><strong>Verified profiles</strong><div style={{ color: "#bbc4d8", fontSize: 12 }}>Administrator review workflow.</div></div>
            <div className="auth-point"><EyeOff size={21} /><strong>No public phone list</strong><div style={{ color: "#bbc4d8", fontSize: 12 }}>Only general location is searchable.</div></div>
          </div>
        </div>
        <div className="auth-form-wrap">
          <div className="auth-card">
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#667085", fontWeight: 800, fontSize: 13 }}><ArrowLeft size={16} /> Back to home</Link>
            <h2>{mode === "signin" ? "Welcome back" : "Create your RedChain account"}</h2>
            <p>{mode === "signin" ? "Sign in to manage requests, donor access and your profile." : "Choose your role and start with a privacy-aware profile."}</p>
            <div className="auth-switch">
              <button className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setError(""); setMessage(""); }}>Sign in</button>
              <button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); setMessage(""); }}>Register</button>
            </div>
            <form onSubmit={submit} className="form-grid">
              {mode === "signup" && <>
                <div className="form-group full"><label>Full legal name <span style={{ color: "#d92745" }}>*</span></label><input className="input" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Used privately for verification" required /></div>
                <div className="form-group full"><label>Public display name <span style={{ color: "#d92745" }}>*</span></label><input className="input" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} placeholder="Example: Swapnil R." required /><span className="help-text">This is the name other RedChain members can see.</span></div>
                <div className="form-group full"><label>Account type</label><select className="select" value={form.accountType} onChange={(e) => update("accountType", e.target.value)}>{ACCOUNT_TYPES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></div>
                <div className="form-group"><label>State / Federal Territory</label><select className="select" value={form.state} onChange={(e) => update("state", e.target.value)}>{MALAYSIA_STATES.map((item) => <option key={item}>{item}</option>)}</select></div>
                <div className="form-group"><label>City</label><select className="select" value={form.city} onChange={(e) => update("city", e.target.value)}>{cities.map((item) => <option key={item}>{item}</option>)}</select></div>
              </>}
              <div className="form-group full"><label>Email address</label><input className="input" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="name@example.com" required /></div>
              <div className="form-group full"><label>Password</label><input className="input" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Minimum 8 characters" minLength={8} required /></div>
              {error && <div className="notice notice-danger full">{error}</div>}
              {message && <div className="notice notice-success full">{message}</div>}
              <div className="full"><button className="btn btn-primary btn-block" disabled={loading}>{loading ? <><Loader2 size={17} className="spinner-inline" /> Processing...</> : mode === "signin" ? "Sign in securely" : "Create account"}</button></div>
              {mode === "signin" && <div className="full" style={{ textAlign: "center" }}><button type="button" className="btn btn-ghost btn-sm" onClick={resetPassword} disabled={loading}>Forgot password?</button></div>}
            </form>
          </div>
        </div>
      </div>
    </ConfigGuard>
  );
}

export default function AuthPage() {
  return <Suspense fallback={<div className="loading-state"><div className="spinner" />Loading...</div>}><AuthContent /></Suspense>;
}
