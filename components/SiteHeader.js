"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "@/contexts/AuthContext";

export default function SiteHeader() {
  const { user, profile, signOut } = useAuth();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/requests">Emergency requests</Link>
          <Link href="/donors">Find donors</Link>
          <Link href="/#privacy">Privacy</Link>
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <Link className="btn btn-secondary btn-sm desktop-only" href="/dashboard"><LayoutDashboard size={16} /> Dashboard</Link>
              <Link className="btn btn-soft btn-sm" href="/profile"><UserRound size={16} /> {profile?.display_name || "Profile"}</Link>
              <button className="btn btn-ghost btn-sm desktop-only" onClick={signOut}><LogOut size={16} /></button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost btn-sm desktop-only" href="/auth">Sign in</Link>
              <Link className="btn btn-primary btn-sm" href="/auth?mode=signup">Join RedChain</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
