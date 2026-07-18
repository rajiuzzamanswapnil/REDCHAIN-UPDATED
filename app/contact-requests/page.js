"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, HeartHandshake, LockKeyhole, MapPin, Phone, XCircle } from "lucide-react";
import AppShell from "@/components/AppShell";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { formatDate, initials, readableError } from "@/lib/utils";

export default function ContactRequestsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [privateContacts, setPrivateContacts] = useState({});
  const [tab, setTab] = useState("incoming");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("contact_requests").select(`*, requester:profiles!contact_requests_requester_id_fkey(display_name,state,city), donor:profiles!contact_requests_donor_id_fkey(display_name,state,city), blood_requests(blood_group,hospital_name)`).or(`requester_id.eq.${user.id},donor_id.eq.${user.id}`).order("created_at", { ascending: false });
    const list = data || [];
    setItems(list);
    const approvedDonorIds = list.filter((item) => item.requester_id === user.id && item.status === "approved").map((item) => item.donor_id);
    if (approvedDonorIds.length) {
      const { data: contacts } = await supabase.from("private_profiles").select("user_id,phone,email,contact_preference").in("user_id", approvedDonorIds);
      setPrivateContacts(Object.fromEntries((contacts || []).map((contact) => [contact.user_id, contact])));
    } else setPrivateContacts({});
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  const visible = useMemo(() => items.filter((item) => tab === "incoming" ? item.donor_id === user?.id : item.requester_id === user?.id), [items, tab, user]);

  async function updateStatus(id, status) {
    setSaving(true); setError("");
    const { error: updateError } = await supabase.from("contact_requests").update({ status, decided_at: new Date().toISOString() }).eq("id", id);
    setSaving(false);
    if (updateError) setError(readableError(updateError)); else await load();
  }

  return (
    <AppShell title="Contact Access">
      <div className="page-title-row"><div><h2>Consent-based contact sharing</h2><p>Donors control when their private contact information becomes available to a requester.</p></div></div>
      {error && <div className="notice notice-danger mb-16">{error}</div>}
      <div className="tabs"><button className={`tab ${tab === "incoming" ? "active" : ""}`} onClick={() => setTab("incoming")}>Incoming requests</button><button className={`tab ${tab === "outgoing" ? "active" : ""}`} onClick={() => setTab("outgoing")}>My outgoing requests</button></div>
      <div className="notice notice-info mt-16"><LockKeyhole size={21} /><div>Approval reveals only the donor’s chosen phone/email fields to the specific requester. It does not publish them in the donor directory.</div></div>
      {loading ? <LoadingState label="Loading contact access cases..." /> : visible.length ? <div className="stack mt-20">{visible.map((item) => {
        const person = tab === "incoming" ? item.requester : item.donor;
        const contact = privateContacts[item.donor_id];
        return <div className="card card-pad" key={item.id}><div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}><div className="avatar">{initials(person?.display_name)}</div><div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}><div><strong>{person?.display_name || "RedChain member"}</strong><div style={{ color: "#667085", fontSize: 12 }}><MapPin size={12} style={{ display: "inline", verticalAlign: -2 }} /> {person?.city}, {person?.state}</div></div><StatusBadge status={item.status} /></div><p style={{ margin: "12px 0", color: "#475467", fontSize: 13 }}>{item.message}</p>{item.blood_requests && <div className="notice notice-warning"><HeartHandshake size={18} /><div>Related request: <strong>{item.blood_requests.blood_group}</strong> at {item.blood_requests.hospital_name}</div></div>}<small style={{ color: "#98a2b3" }}>Submitted {formatDate(item.created_at, true)}</small>
          {tab === "incoming" && item.status === "pending" && <div className="table-actions mt-16"><button className="btn btn-success btn-sm" onClick={() => updateStatus(item.id, "approved")} disabled={saving}><CheckCircle2 size={15} /> Approve contact</button><button className="btn btn-secondary btn-sm" onClick={() => updateStatus(item.id, "declined")} disabled={saving}><XCircle size={15} /> Decline</button></div>}
          {tab === "outgoing" && item.status === "pending" && <div className="table-actions mt-16"><button className="btn btn-secondary btn-sm" onClick={() => updateStatus(item.id, "cancelled")} disabled={saving}>Cancel request</button></div>}
          {tab === "outgoing" && item.status === "approved" && contact && <div className="notice notice-success mt-16"><Phone size={19} /><div><strong>Donor approved contact access</strong><div>{contact.phone || contact.email} • Preferred method: {contact.contact_preference}</div></div></div>}
        </div></div></div>;
      })}</div> : <div className="card mt-20"><EmptyState icon={HeartHandshake} title={tab === "incoming" ? "No incoming requests" : "No outgoing requests"} description={tab === "incoming" ? "Contact requests sent to your donor profile will appear here." : "Use the verified donor directory to request consent-based contact access."} /></div>}
    </AppShell>
  );
}
