"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  ClipboardList,
  Clock3,
  FileCheck2,
  HeartHandshake,
  MapPin,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { formatDate, profileCompletion, timeAgo } from "@/lib/utils";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(null);
  const [donorProfile, setDonorProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({ requests: 0, contacts: 0, responses: 0 });

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const [privateResult, donorResult, requestResult, contactResult, responseResult, notificationResult] = await Promise.all([
        supabase.from("private_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("donor_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("blood_requests").select("*").eq("requester_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("contact_requests").select("id", { count: "exact" }).or(`requester_id.eq.${user.id},donor_id.eq.${user.id}`),
        supabase.from("donor_responses").select("id", { count: "exact" }).eq("donor_id", user.id),
        supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
      ]);
      setPrivateProfile(privateResult.data || null);
      setDonorProfile(donorResult.data || null);
      setRequests(requestResult.data || []);
      setNotifications(notificationResult.data || []);
      setCounts({
        requests: requestResult.data?.length || 0,
        contacts: contactResult.count || 0,
        responses: responseResult.count || 0,
      });
      setLoading(false);
    }
    load();
  }, [user]);

  const completion = useMemo(() => profileCompletion(profile, privateProfile, donorProfile), [profile, privateProfile, donorProfile]);

  async function markAllRead() {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
  }

  if (loading) return <AppShell title="Dashboard"><LoadingState /></AppShell>;

  return (
    <AppShell title="Dashboard">
      <div className="page-title-row">
        <div>
          <h2>Welcome, {profile?.display_name || "RedChain member"}</h2>
          <p>Manage your profile, emergency requests, donor responses and private contact approvals.</p>
        </div>
        <Link className="btn btn-primary" href="/requests/new"><ClipboardList size={17} /> Create emergency request</Link>
      </div>

      {completion < 100 && (
        <div className="notice notice-warning mb-16">
          <UserRound size={21} />
          <div style={{ flex: 1 }}>
            <strong>Your profile is {completion}% complete.</strong>
            <div>Complete your private contact information{profile?.account_type === "donor" ? " and donor details" : ""} for a smoother presentation demo.</div>
            <div className="progress" style={{ marginTop: 10 }}><div style={{ width: `${completion}%` }} /></div>
          </div>
          <Link className="btn btn-secondary btn-sm" href="/profile">Complete profile</Link>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card metric-card"><div><div className="metric-label">My requests</div><div className="metric-value">{counts.requests}</div></div><div className="metric-icon"><ClipboardList /></div></div>
        <div className="card metric-card"><div><div className="metric-label">Contact cases</div><div className="metric-value">{counts.contacts}</div></div><div className="metric-icon"><HeartHandshake /></div></div>
        <div className="card metric-card"><div><div className="metric-label">Donor responses</div><div className="metric-value">{counts.responses}</div></div><div className="metric-icon"><CheckCheck /></div></div>
        <div className="card metric-card"><div><div className="metric-label">Verification</div><div style={{ marginTop: 8 }}><StatusBadge status={donorProfile?.verification_status || "not submitted"} /></div></div><div className="metric-icon"><ShieldCheck /></div></div>
      </div>

      <div className="grid-2 mt-20">
        <div className="card">
          <div className="card-head"><h3>Recent emergency requests</h3><Link className="btn btn-ghost btn-sm" href="/requests">View all</Link></div>
          {requests.length ? <div className="request-list" style={{ padding: 14 }}>{requests.map((request) => (
            <Link href={`/requests/${request.id}`} key={request.id} className="request-card" style={{ border: "1px solid #e8eaf1", borderRadius: 14 }}>
              <div className={`urgency-line urgency-${request.urgency}`} />
              <div><h3>{request.blood_group} blood • {request.hospital_name}</h3><div className="request-meta"><span><MapPin size={13} /> {request.hospital_city}, {request.hospital_state}</span><span><Clock3 size={13} /> {formatDate(request.required_by, true)}</span></div></div>
              <StatusBadge status={request.status} />
            </Link>
          ))}</div> : <EmptyState icon={ClipboardList} title="No emergency requests yet" description="Your submitted requests will appear here with status updates." action={<Link className="btn btn-primary btn-sm" href="/requests/new">Create request</Link>} />}
        </div>

        <div className="card" id="notifications">
          <div className="card-head"><h3>Notifications</h3>{notifications.some((item) => !item.is_read) && <button className="btn btn-ghost btn-sm" onClick={markAllRead}><CheckCheck size={15} /> Mark all read</button>}</div>
          {notifications.length ? <div className="stack" style={{ padding: 14, gap: 8 }}>{notifications.map((notification) => (
            <div key={notification.id} style={{ padding: 14, borderRadius: 13, background: notification.is_read ? "#fff" : "#fff5f7", border: "1px solid #eceef3", display: "flex", gap: 12 }}>
              <div className="feature-icon" style={{ width: 38, height: 38, margin: 0, flex: "none" }}><Bell size={17} /></div>
              <div><strong style={{ fontSize: 13 }}>{notification.title}</strong><div style={{ color: "#667085", fontSize: 12 }}>{notification.message}</div><small style={{ color: "#98a2b3" }}>{timeAgo(notification.created_at)}</small></div>
            </div>
          ))}</div> : <EmptyState icon={Bell} title="No notifications" description="Verification decisions, contact requests and request updates will appear here." />}
        </div>
      </div>

      <div className="card mt-20">
        <div className="card-head"><h3>Quick actions</h3></div>
        <div className="grid-3" style={{ padding: 20 }}>
          <Link className="feature-card" href="/donors"><div className="feature-icon"><Search /></div><h3>Find verified donors</h3><p>Filter by exact blood group, state, city and availability.</p></Link>
          <Link className="feature-card" href="/verification"><div className="feature-icon"><FileCheck2 /></div><h3>Submit verification</h3><p>Upload a private identity or donor document for administrator review.</p></Link>
          <Link className="feature-card" href="/contact-requests"><div className="feature-icon"><HeartHandshake /></div><h3>Manage contact access</h3><p>Approve, decline or review consent-based contact requests.</p></Link>
        </div>
      </div>
    </AppShell>
  );
}
