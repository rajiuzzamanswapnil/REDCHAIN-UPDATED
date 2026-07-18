"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  Megaphone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { formatDate, initials, readableError } from "@/lib/utils";

function oneRelation(value) {
  return Array.isArray(value) ? value[0] : value;
}

const tabs = [
  ["overview", "Overview"], ["verifications", "Verifications"], ["requests", "Requests"], ["users", "Users"], ["research", "Research"], ["audit", "Audit log"],
];

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, donors: 0, requests: 0, pending: 0 });
  const [documents, setDocuments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [audits, setAudits] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [review, setReview] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [announcement, setAnnouncement] = useState({ title: "", message: "", severity: "info" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return; }
    setLoading(true); setError("");
    const [userResult, donorResult, requestResult, pendingResult, documentResult, usersResult, feedbackResult, auditResult, announcementResult] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("donor_profiles").select("user_id", { count: "exact", head: true }).eq("verification_status", "verified"),
      supabase.from("blood_requests").select("id", { count: "exact", head: true }).in("status", ["open", "matched"]),
      supabase.from("verification_documents").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("verification_documents").select("*, profiles!verification_documents_user_id_fkey(display_name,state,city,donor_profiles(blood_group,verification_status))").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*, donor_profiles(blood_group,verification_status,is_available)").order("created_at", { ascending: false }),
      supabase.from("feedback_responses").select("*, profiles!feedback_responses_user_id_fkey(display_name)").order("updated_at", { ascending: false }),
      supabase.from("audit_logs").select("*, actor:profiles!audit_logs_actor_id_fkey(display_name)").order("created_at", { ascending: false }).limit(100),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    const { data: requestRows } = await supabase.from("blood_requests").select("*, profiles!blood_requests_requester_id_fkey(display_name)").order("created_at", { ascending: false }).limit(100);
    setStats({ users: userResult.count || 0, donors: donorResult.count || 0, requests: requestResult.count || 0, pending: pendingResult.count || 0 });
    setDocuments(documentResult.data || []);
    setRequests(requestRows || []);
    setUsers(usersResult.data || []);
    setFeedback(feedbackResult.data || []);
    setAudits(auditResult.data || []);
    setAnnouncements(announcementResult.data || []);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  const averages = useMemo(() => {
    if (!feedback.length) return { usefulness: 0, usability: 0, trust: 0, privacy: 0, recommend: 0 };
    const avg = (key) => feedback.reduce((sum, row) => sum + Number(row[key] || 0), 0) / feedback.length;
    return { usefulness: avg("usefulness_rating"), usability: avg("usability_rating"), trust: avg("trust_rating"), privacy: avg("privacy_rating"), recommend: Math.round((feedback.filter((row) => row.would_recommend).length / feedback.length) * 100) };
  }, [feedback]);

  async function openDocument(document) {
    setError("");
    const { data, error: signedError } = await supabase.storage.from("verification-documents").createSignedUrl(document.file_path, 300);
    if (signedError) setError(readableError(signedError)); else window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function decideVerification(status) {
    if (!review) return;
    setSaving(true); setError(""); setMessage("");
    const { error: documentError } = await supabase.from("verification_documents").update({ status, review_notes: reviewNotes.trim() || null, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", review.id);
    if (!documentError) {
      await supabase.from("donor_profiles").update({ verification_status: status === "approved" ? "verified" : "rejected", verified_by: user.id, verified_at: status === "approved" ? new Date().toISOString() : null }).eq("user_id", review.user_id);
    }
    setSaving(false);
    if (documentError) setError(readableError(documentError)); else { setReview(null); setReviewNotes(""); setMessage(`Verification ${status}.`); await load(); }
  }

  async function changeRequestStatus(id, status) {
    setSaving(true); setError("");
    const { error: updateError } = await supabase.from("blood_requests").update({ status, moderated_by: user.id }).eq("id", id);
    setSaving(false);
    if (updateError) setError(readableError(updateError)); else await load();
  }

  async function changeUserStatus(id, accountStatus) {
    if (id === user.id && accountStatus === "suspended") { setError("You cannot suspend your own administrator account."); return; }
    setSaving(true); setError("");
    const { error: updateError } = await supabase.from("profiles").update({ account_status: accountStatus }).eq("id", id);
    setSaving(false);
    if (updateError) setError(readableError(updateError)); else await load();
  }

  async function publishAnnouncement(event) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    const { error: insertError } = await supabase.from("announcements").insert({ title: announcement.title.trim(), message: announcement.message.trim(), severity: announcement.severity, created_by: user.id, is_active: true });
    setSaving(false);
    if (insertError) setError(readableError(insertError)); else { setAnnouncement({ title: "", message: "", severity: "info" }); setMessage("Announcement published."); await load(); }
  }

  if (authLoading || loading) return <AppShell title="Administration"><LoadingState label="Loading administration centre..." /></AppShell>;
  if (!isAdmin) return <AppShell title="Administration"><div className="card"><EmptyState icon={ShieldAlert} title="Administrator access required" description="Your profile does not have the admin role. Run the included 03_make_admin.sql after creating your account." /></div></AppShell>;

  return (
    <AppShell title="Administration">
      <div className="page-title-row"><div><h2>RedChain administration centre</h2><p>Review donor evidence, moderate emergency requests, manage accounts and analyse research feedback.</p></div><button className="btn btn-secondary" onClick={load}><RefreshCw size={16} /> Refresh</button></div>
      {error && <div className="notice notice-danger mb-16">{error}</div>}
      {message && <div className="notice notice-success mb-16">{message}</div>}
      <div className="tabs">{tabs.map(([key, label]) => <button key={key} className={`tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}</button>)}</div>

      {tab === "overview" && <>
        <div className="dashboard-grid mt-20">
          <div className="card metric-card"><div><div className="metric-label">Registered users</div><div className="metric-value">{stats.users}</div></div><div className="metric-icon"><Users /></div></div>
          <div className="card metric-card"><div><div className="metric-label">Verified donors</div><div className="metric-value">{stats.donors}</div></div><div className="metric-icon"><ShieldCheck /></div></div>
          <div className="card metric-card"><div><div className="metric-label">Active requests</div><div className="metric-value">{stats.requests}</div></div><div className="metric-icon"><ClipboardList /></div></div>
          <div className="card metric-card"><div><div className="metric-label">Pending reviews</div><div className="metric-value">{stats.pending}</div></div><div className="metric-icon"><FileCheck2 /></div></div>
        </div>
        <div className="grid-2 mt-20">
          <div className="card"><div className="card-head"><h3>Latest verification queue</h3><button className="btn btn-ghost btn-sm" onClick={() => setTab("verifications")}>Review all</button></div>{documents.filter((d) => d.status === "pending").slice(0,5).length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Donor</th><th>Blood</th><th>Submitted</th><th>Status</th></tr></thead><tbody>{documents.filter((d) => d.status === "pending").slice(0,5).map((doc) => <tr key={doc.id}><td>{doc.profiles?.display_name}</td><td>{oneRelation(doc.profiles?.donor_profiles)?.blood_group || "—"}</td><td>{formatDate(doc.created_at)}</td><td><StatusBadge status={doc.status} /></td></tr>)}</tbody></table></div> : <EmptyState icon={FileCheck2} title="Queue is clear" description="No pending donor verification documents." />}</div>
          <div className="card"><div className="card-head"><h3>Research snapshot</h3><button className="btn btn-ghost btn-sm" onClick={() => setTab("research")}>View analysis</button></div><div className="card-body"><div className="chart-row"><span>Usefulness</span><div className="chart-bar"><div style={{ width: `${averages.usefulness * 20}%` }} /></div><strong>{averages.usefulness.toFixed(1)}</strong></div><div className="chart-row"><span>Usability</span><div className="chart-bar"><div style={{ width: `${averages.usability * 20}%` }} /></div><strong>{averages.usability.toFixed(1)}</strong></div><div className="chart-row"><span>Trust</span><div className="chart-bar"><div style={{ width: `${averages.trust * 20}%` }} /></div><strong>{averages.trust.toFixed(1)}</strong></div><div className="chart-row"><span>Privacy</span><div className="chart-bar"><div style={{ width: `${averages.privacy * 20}%` }} /></div><strong>{averages.privacy.toFixed(1)}</strong></div></div></div>
        </div>
        <div className="card mt-20"><div className="card-head"><h3>Publish system announcement</h3><Megaphone size={19} color="#d92745" /></div><form className="card-body form-grid" onSubmit={publishAnnouncement}><div className="form-group"><label>Title</label><input className="input" value={announcement.title} onChange={(e) => setAnnouncement((a) => ({ ...a, title: e.target.value }))} required /></div><div className="form-group"><label>Severity</label><select className="select" value={announcement.severity} onChange={(e) => setAnnouncement((a) => ({ ...a, severity: e.target.value }))}><option value="info">Information</option><option value="warning">Warning</option><option value="critical">Critical</option></select></div><div className="form-group full"><label>Message</label><textarea className="textarea" value={announcement.message} onChange={(e) => setAnnouncement((a) => ({ ...a, message: e.target.value }))} required /></div><div className="form-actions full"><button className="btn btn-primary" disabled={saving}>Publish announcement</button></div></form></div>
      </>}

      {tab === "verifications" && <div className="card mt-20"><div className="card-head"><h3>Donor verification documents</h3><span style={{ color: "#667085", fontSize: 12 }}>{documents.length} submissions</span></div>{documents.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Donor</th><th>Location</th><th>Document</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead><tbody>{documents.map((doc) => <tr key={doc.id}><td><div className="table-user"><div className="avatar">{initials(doc.profiles?.display_name)}</div><div><strong>{doc.profiles?.display_name}</strong><small style={{ display: "block", color: "#667085" }}>{oneRelation(doc.profiles?.donor_profiles)?.blood_group || "No blood group"}</small></div></div></td><td>{doc.profiles?.city}, {doc.profiles?.state}</td><td>{doc.file_name}</td><td>{formatDate(doc.created_at, true)}</td><td><StatusBadge status={doc.status} /></td><td><div className="table-actions"><button className="btn btn-secondary btn-sm" onClick={() => openDocument(doc)}><ExternalLink size={14} /> Open</button>{doc.status === "pending" && <button className="btn btn-primary btn-sm" onClick={() => { setReview(doc); setReviewNotes(""); }}>Review</button>}</div></td></tr>)}</tbody></table></div> : <EmptyState icon={FileCheck2} title="No verification documents" description="Donor submissions will appear here." />}</div>}

      {tab === "requests" && <div className="card mt-20"><div className="card-head"><h3>Emergency request moderation</h3><span style={{ color: "#667085", fontSize: 12 }}>{requests.length} records</span></div>{requests.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Request</th><th>Hospital</th><th>Requester</th><th>Urgency</th><th>Status</th><th>Moderate</th></tr></thead><tbody>{requests.map((request) => <tr key={request.id}><td><strong>{request.blood_group}</strong> • {request.units_needed} unit(s)</td><td>{request.hospital_name}<small style={{ display: "block", color: "#667085" }}>{request.hospital_city}, {request.hospital_state}</small></td><td>{request.profiles?.display_name}</td><td><StatusBadge status={request.urgency} /></td><td><StatusBadge status={request.status} /></td><td><select className="select" style={{ height: 36, minWidth: 130 }} value={request.status} onChange={(e) => changeRequestStatus(request.id, e.target.value)} disabled={saving}><option value="open">Open</option><option value="matched">Matched</option><option value="fulfilled">Fulfilled</option><option value="cancelled">Cancelled</option><option value="flagged">Flagged</option></select></td></tr>)}</tbody></table></div> : <EmptyState icon={ClipboardList} title="No requests" description="Emergency requests will appear here." />}</div>}

      {tab === "users" && <div className="card mt-20"><div className="card-head"><h3>User and role management</h3><span style={{ color: "#667085", fontSize: 12 }}>{users.length} accounts</span></div><div className="table-wrap"><table className="data-table"><thead><tr><th>User</th><th>Type</th><th>Location</th><th>Donor status</th><th>Account</th><th>Action</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><div className="table-user"><div className="avatar">{initials(item.display_name)}</div><div><strong>{item.display_name}</strong><small style={{ display: "block", color: "#667085" }}>{item.role}</small></div></div></td><td><StatusBadge status={item.account_type} /></td><td>{item.city}, {item.state}</td><td>{oneRelation(item.donor_profiles) ? <StatusBadge status={oneRelation(item.donor_profiles).verification_status} /> : "—"}</td><td><StatusBadge status={item.account_status} /></td><td>{item.account_status === "active" ? <button className="btn btn-secondary btn-sm" onClick={() => changeUserStatus(item.id, "suspended")} disabled={saving}>Suspend</button> : <button className="btn btn-success btn-sm" onClick={() => changeUserStatus(item.id, "active")} disabled={saving}>Reactivate</button>}</td></tr>)}</tbody></table></div></div>}

      {tab === "research" && <div className="stack mt-20"><div className="dashboard-grid"><div className="card metric-card"><div><div className="metric-label">Responses</div><div className="metric-value">{feedback.length}</div></div><div className="metric-icon"><BarChart3 /></div></div><div className="card metric-card"><div><div className="metric-label">Usefulness / 5</div><div className="metric-value">{averages.usefulness.toFixed(1)}</div></div></div><div className="card metric-card"><div><div className="metric-label">Privacy / 5</div><div className="metric-value">{averages.privacy.toFixed(1)}</div></div></div><div className="card metric-card"><div><div className="metric-label">Would recommend</div><div className="metric-value">{averages.recommend}%</div></div></div></div><div className="card"><div className="card-head"><h3>Questionnaire responses</h3></div>{feedback.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Participant</th><th>Usefulness</th><th>Usability</th><th>Trust</th><th>Privacy</th><th>Recommend</th><th>Comment</th></tr></thead><tbody>{feedback.map((row) => <tr key={row.id}><td>{row.profiles?.display_name || "Participant"}</td><td>{row.usefulness_rating}/5</td><td>{row.usability_rating}/5</td><td>{row.trust_rating}/5</td><td>{row.privacy_rating}/5</td><td>{row.would_recommend ? "Yes" : "No"}</td><td style={{ maxWidth: 260 }}>{row.comments || "—"}</td></tr>)}</tbody></table></div> : <EmptyState icon={BarChart3} title="No research feedback yet" description="Ask presentation participants to complete the feedback page." />}</div></div>}

      {tab === "audit" && <div className="card mt-20"><div className="card-head"><h3>Security and activity audit log</h3><Activity size={19} color="#d92745" /></div>{audits.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody>{audits.map((log) => <tr key={log.id}><td>{formatDate(log.created_at, true)}</td><td>{log.actor?.display_name || "System"}</td><td><strong>{log.action.replaceAll("_", " ")}</strong></td><td>{log.entity_type}</td><td style={{ maxWidth: 380 }}>{log.details ? JSON.stringify(log.details) : "—"}</td></tr>)}</tbody></table></div> : <EmptyState icon={Activity} title="No audit activity" description="Important profile, request and verification changes will be recorded here." />}</div>}

      {review && <Modal title={`Review ${review.profiles?.display_name || "donor"}`} onClose={() => setReview(null)}><div className="stack"><div className="notice notice-info"><FileCheck2 size={20} /><div><strong>{review.file_name}</strong><div>{review.document_type.replaceAll("_", " ")} • Submitted {formatDate(review.created_at, true)}</div></div></div><button className="btn btn-secondary" onClick={() => openDocument(review)}><ExternalLink size={16} /> Open private document</button><div className="form-group"><label>Review notes</label><textarea className="textarea" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Required when rejecting; optional when approving." /></div><div className="grid-2"><button className="btn btn-danger" onClick={() => decideVerification("rejected")} disabled={saving}><XCircle size={16} /> Reject</button><button className="btn btn-success" onClick={() => decideVerification("approved")} disabled={saving}><CheckCircle2 size={16} /> Approve donor</button></div></div></Modal>}
    </AppShell>
  );
}
