"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, HeartHandshake, LockKeyhole, MapPin, Search, ShieldCheck, UserCheck } from "lucide-react";
import AppShell from "@/components/AppShell";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { formatDate, initials, readableError } from "@/lib/utils";

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [request, setRequest] = useState(null);
  const [privateContact, setPrivateContact] = useState(null);
  const [responses, setResponses] = useState([]);
  const [currentDonor, setCurrentDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [message, setMessage] = useState("I am available and would like to offer help. Please confirm the hospital’s donor screening instructions.");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    const [requestResult, contactResult, responseResult, donorResult] = await Promise.all([
      supabase.from("blood_requests").select("*, profiles!blood_requests_requester_id_fkey(display_name,state,city)").eq("id", id).maybeSingle(),
      supabase.from("request_private_contacts").select("*").eq("request_id", id).maybeSingle(),
      supabase.from("donor_responses").select("*, donor:profiles!donor_responses_donor_id_fkey(display_name,state,city)").eq("request_id", id).order("created_at", { ascending: false }),
      supabase.from("donor_profiles").select("verification_status,is_available").eq("user_id", user.id).maybeSingle(),
    ]);
    const responseRows = responseResult.data || [];
    const acceptedIds = responseRows.filter((row) => ["accepted", "completed"].includes(row.status)).map((row) => row.donor_id);
    let contactMap = {};
    if (acceptedIds.length) {
      const { data: donorContacts } = await supabase.from("private_profiles").select("user_id,phone,email,contact_preference").in("user_id", acceptedIds);
      contactMap = Object.fromEntries((donorContacts || []).map((contact) => [contact.user_id, contact]));
    }
    setRequest(requestResult.data || null);
    setPrivateContact(contactResult.data || null);
    setResponses(responseRows.map((row) => ({ ...row, private_contact: contactMap[row.donor_id] || null })));
    setCurrentDonor(donorResult.data || null);
    setLoading(false);
  }, [user, id]);

  useEffect(() => { load(); }, [load]);

  async function offerHelp(event) {
    event.preventDefault();
    setSaving(true); setError("");
    const { error: offerError } = await supabase.from("donor_responses").insert({ request_id: id, donor_id: user.id, message: message.trim(), status: "offered" });
    setSaving(false);
    if (offerError) setError(readableError(offerError, "You may already have a response for this request."));
    else { setModal(null); await load(); }
  }

  async function changeRequestStatus(status) {
    setSaving(true); setError("");
    const { error: updateError } = await supabase.from("blood_requests").update({ status }).eq("id", id);
    setSaving(false);
    if (updateError) setError(readableError(updateError)); else await load();
  }

  async function updateResponse(responseId, status) {
    setSaving(true); setError("");
    const { error: responseError } = await supabase.from("donor_responses").update({ status }).eq("id", responseId);
    if (!responseError && status === "accepted") await supabase.from("blood_requests").update({ status: "matched" }).eq("id", id);
    setSaving(false);
    if (responseError) setError(readableError(responseError)); else await load();
  }

  if (loading) return <AppShell title="Request Details"><LoadingState /></AppShell>;
  if (!request) return <AppShell title="Request Details"><div className="card"><EmptyState title="Request not available" description="It may have been removed, or your account does not have permission to view it." action={<Link className="btn btn-primary btn-sm" href="/requests">Back to requests</Link>} /></div></AppShell>;

  const isOwner = request.requester_id === user?.id;
  const active = ["open", "matched"].includes(request.status);
  const ownResponse = responses.find((item) => item.donor_id === user?.id);
  const canOffer = !isOwner && !isAdmin && active && !ownResponse && currentDonor?.verification_status === "verified" && currentDonor?.is_available;

  return (
    <AppShell title="Request Details">
      <div className="page-title-row"><div><Link href="/requests" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#667085", fontWeight: 800, fontSize: 13 }}><ArrowLeft size={15} /> Emergency requests</Link></div><StatusBadge status={request.status} /></div>
      {error && <div className="notice notice-danger mb-16">{error}</div>}
      <div className="detail-grid">
        <div className="stack">
          <div className="card detail-hero">
            <div className="detail-top">
              <div className="detail-title"><div className="blood-orb">{request.blood_group}</div><div><h2>{request.hospital_name}</h2><div style={{ color: "#667085" }}><MapPin size={15} style={{ display: "inline", verticalAlign: -3 }} /> {request.hospital_city}, {request.hospital_state}</div></div></div>
              <StatusBadge status={request.urgency} />
            </div>
            <div className="detail-list">
              <div className="detail-item"><span>Blood component</span><strong>{request.blood_component}</strong></div>
              <div className="detail-item"><span>Units needed</span><strong>{request.units_needed}</strong></div>
              <div className="detail-item"><span>Required by</span><strong>{formatDate(request.required_by, true)}</strong></div>
              <div className="detail-item"><span>Patient reference</span><strong>{request.patient_initials}</strong></div>
              <div className="detail-item"><span>Reason category</span><strong>{request.reason_category}</strong></div>
              <div className="detail-item"><span>Posted by</span><strong>{request.profiles?.display_name || "RedChain member"}</strong></div>
            </div>
            {request.public_notes && <div className="notice notice-info mt-16">{request.public_notes}</div>}
          </div>

          <div className="card">
            <div className="card-head"><h3>Donor responses</h3><StatusBadge status={responses.length ? "active" : "pending"}>{responses.length} response{responses.length === 1 ? "" : "s"}</StatusBadge></div>
            {responses.length ? <div className="stack" style={{ padding: 16 }}>{responses.map((response) => (
              <div key={response.id} style={{ border: "1px solid #e8eaf1", borderRadius: 15, padding: 16, display: "flex", alignItems: "flex-start", gap: 13 }}>
                <div className="avatar">{initials(response.donor?.display_name)}</div>
                <div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><strong>{response.donor?.display_name || "Donor"}</strong><StatusBadge status={response.status} /></div><div style={{ color: "#667085", fontSize: 13, marginTop: 5 }}>{response.message}</div><small style={{ color: "#98a2b3" }}>{response.donor?.city}, {response.donor?.state} • {formatDate(response.created_at, true)}</small>
                  {["accepted", "completed"].includes(response.status) && response.private_contact && <div className="notice notice-success mt-16"><LockKeyhole size={18} /><div><strong>Approved contact</strong><div>{response.private_contact.phone || response.private_contact.email} • Preferred: {response.private_contact.contact_preference}</div></div></div>}
                  {(isOwner || isAdmin) && response.status === "offered" && <div className="table-actions mt-16"><button className="btn btn-success btn-sm" onClick={() => updateResponse(response.id, "accepted")} disabled={saving}><CheckCircle2 size={15} /> Accept donor</button><button className="btn btn-secondary btn-sm" onClick={() => updateResponse(response.id, "declined")} disabled={saving}>Decline</button></div>}
                </div>
              </div>
            ))}</div> : <EmptyState icon={HeartHandshake} title="No donor responses yet" description="Use the matching directory to contact verified donors, or wait for available donors to respond." />}
          </div>
        </div>

        <div className="stack">
          <div className="card card-pad">
            <h3 style={{ marginTop: 0 }}>Actions</h3>
            {canOffer && <button className="btn btn-primary btn-block" onClick={() => setModal("offer")}><HeartHandshake size={17} /> Offer to help</button>}
            {!isOwner && !isAdmin && active && !ownResponse && !canOffer && <div className="notice notice-warning"><ShieldCheck size={20} /><div><strong>Verified donors only</strong><div>Complete donor verification and enable availability before offering help.</div></div></div>}
            {!isOwner && ownResponse && <div className="notice notice-success"><UserCheck size={20} /><div><strong>Your response: {ownResponse.status}</strong><div>The requester has been notified.</div></div></div>}
            {(isOwner || isAdmin) && active && <div className="stack" style={{ gap: 9 }}><Link className="btn btn-primary btn-block" href={`/donors?blood=${encodeURIComponent(request.blood_group)}&state=${encodeURIComponent(request.hospital_state)}&request=${request.id}`}><Search size={17} /> Find matching donors</Link><button className="btn btn-success btn-block" onClick={() => changeRequestStatus("fulfilled")} disabled={saving}>Mark fulfilled</button><button className="btn btn-secondary btn-block" onClick={() => changeRequestStatus("cancelled")} disabled={saving}>Cancel request</button></div>}
            {!active && <div className="notice notice-info"><Clock3 size={19} /><div>This request is closed with status <strong>{request.status}</strong>.</div></div>}
          </div>

          {privateContact && <div className="card"><div className="card-head"><h3>Private requester contact</h3><LockKeyhole size={18} color="#d92745" /></div><div className="card-body"><div className="stack" style={{ gap: 10 }}><div><small style={{ color: "#667085" }}>Contact person</small><strong style={{ display: "block" }}>{privateContact.contact_name}</strong></div><div><small style={{ color: "#667085" }}>Phone</small><strong style={{ display: "block" }}>{privateContact.phone}</strong></div>{privateContact.email && <div><small style={{ color: "#667085" }}>Email</small><strong style={{ display: "block" }}>{privateContact.email}</strong></div>}<div><small style={{ color: "#667085" }}>Relationship</small><strong style={{ display: "block" }}>{privateContact.relation_to_patient}</strong></div></div></div></div>}

          <div className="notice notice-warning"><AlertTriangle size={21} /><div><strong>Hospital screening is mandatory.</strong><div>RedChain cannot confirm donation eligibility or blood compatibility.</div></div></div>
        </div>
      </div>

      {modal === "offer" && <Modal title="Offer donor support" onClose={() => setModal(null)}><form onSubmit={offerHelp} className="stack"><div className="notice notice-info">Your public display name and general location will be visible to the requester. Your private contact remains protected until an approved workflow allows access.</div><div className="form-group"><label>Message to requester</label><textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} required /></div>{error && <div className="notice notice-danger">{error}</div>}<div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? "Sending..." : "Submit response"}</button></div></form></Modal>}
    </AppShell>
  );
}
