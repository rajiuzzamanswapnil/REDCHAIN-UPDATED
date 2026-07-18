"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  ClipboardList,
  Droplets,
  FileCheck2,
  Gauge,
  HeartHandshake,
  LogOut,
  MessageSquareMore,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Logo from "./Logo";
import LoadingState from "./LoadingState";
import ConfigGuard from "./ConfigGuard";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

const baseLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/requests", label: "Requests", icon: ClipboardList },
  { href: "/donors", label: "Find Donors", icon: Search },
  { href: "/contact-requests", label: "Contact Access", icon: HeartHandshake },
  { href: "/profile", label: "My Profile", icon: UserRound },
  { href: "/verification", label: "Verification", icon: FileCheck2 },
  { href: "/feedback", label: "Feedback", icon: MessageSquareMore },
];

export default function AppShell({ title, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  useEffect(() => {
    async function loadUnread() {
      if (!user) return;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setUnread(count || 0);
    }
    loadUnread();
  }, [user, pathname]);

  const links = useMemo(() => {
    if (!isAdmin) return baseLinks;
    return [
      ...baseLinks.filter((link) => link.href !== "/verification"),
      { href: "/admin", label: "Administration", icon: ShieldCheck },
    ];
  }, [isAdmin]);

  if (loading || !user) return <LoadingState label="Securing your RedChain session..." />;

  return (
    <ConfigGuard>
      <div className="app-layout">
        <aside className="sidebar">
          <Logo href="/dashboard" />
          <div className="sidebar-section">Workspace</div>
          <nav className="sidebar-nav">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
              return (
                <Link key={href} href={href} className={active ? "active" : ""} title={label}>
                  <Icon size={19} /> <span>{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-profile">
              <div className="avatar">{initials(profile?.display_name || user.email)}</div>
              <div>
                <strong>{profile?.display_name || "RedChain Member"}</strong>
                <small>{profile?.role === "admin" ? "Administrator" : profile?.account_type || "Member"}</small>
              </div>
            </div>
            <button className="btn btn-ghost btn-block" style={{ color: "#bbc4d8", marginTop: 8 }} onClick={signOut}><LogOut size={17} /> <span>Sign out</span></button>
          </div>
        </aside>
        <main className="app-main">
          <div className="app-topbar">
            <h1>{title}</h1>
            <div className="topbar-actions">
              {profile?.account_status !== "suspended" && <Link href="/requests/new" className="btn btn-primary btn-sm"><Droplets size={16} /> New request</Link>}
              <Link href="/dashboard#notifications" className="icon-btn" title="Notifications">
                <Bell size={18} />
                {unread > 0 && <span className="notification-dot" />}
              </Link>
            </div>
          </div>
          <div className="app-content">
            <div className="content-wrap">
              {profile?.account_status === "suspended" ? (
                <div className="card card-pad">
                  <div className="notice notice-danger">
                    <ShieldCheck size={22} />
                    <div><strong>Account access is suspended.</strong><div>Your profile remains protected, but RedChain actions are disabled until an administrator restores the account.</div></div>
                  </div>
                </div>
              ) : children}
            </div>
          </div>
        </main>
      </div>
    </ConfigGuard>
  );
}
