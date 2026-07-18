"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Hospital, LockKeyhole } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { BLOOD_GROUPS, MALAYSIA_LOCATIONS, MALAYSIA_STATES, REQUEST_COMPONENTS, URGENCY_LEVELS } from "@/lib/constants";
import { readableError } from "@/lib/utils";

function defaultRequiredBy() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function NewRequestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    patientInitials: "", bloodGroup: "", component: "Whole Blood", units: 1,
    hospitalName: "", state: "Kuala Lumpur", city: "Kuala Lumpur", requiredBy: defaultRequiredBy(), urgency: "high",
    reasonCategory: "Emergency treatment", notes: "", contactName: "", phone: "+60", email: user?.email || "", relation: "Family member",
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cities = useMemo(() => MALAYSIA_LOCATIONS[form.state] || [], [form.state]);

  function update(name, value) {
    setForm((current) => name === "state" ? { ...current, state: value, city: MALAYSIA_LOCATIONS[value]?.[0] || "" } : { ...current, [name]: value });
  }

  async function submit(event) {
    event.preventDefault();
    if (!user) return;
    if (!agreed) { setError("Confirm that the information is accurate and hospital compatibility checks are still required."); return; }
    setLoading(true); setError("");
    const { data: request, error: requestError } = await supabase.from("blood_requests").insert({
      requester_id: user.id,
      patient_initials: form.patientInitials.trim().toUpperCase(),
      blood_group: form.bloodGroup,
      blood_component: form.component,
      units_needed: Number(form.units),
      hospital_name: form.hospitalName.trim(),
      hospital_state: form.state,
      hospital_city: form.city,
      required_by: new Date(form.requiredBy).toISOString(),
      urgency: form.urgency,
      reason_category: form.reasonCategory,
      public_notes: form.notes.trim() || null,
    }).select("id").single();
    if (requestError) { setLoading(false); setError(readableError(requestError)); return; }
    const { error: contactError } = await supabase.from("request_private_contacts").insert({
      request_id: request.id,
      contact_name: form.contactName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      relation_to_patient: form.relation.trim(),
    });
    setLoading(false);
    if (contactError) setError(readableError(contactError));
    else router.push(`/requests/${request.id}`);
  }

  return (
    <AppShell title="Create Request">
      <div className="page-title-row"><div><Link href="/requests" style={{ display: "inline-flex", gap: 7, alignItems: "center", color: "#667085", fontWeight: 800, fontSize: 13 }}><ArrowLeft size={15} /> Request board</Link><h2 style={{ marginTop: 8 }}>Create an emergency blood request</h2><p>Use patient initials only. Requester contact details are stored separately and are not shown publicly.</p></div></div>
      <form onSubmit={submit}>
        <div className="grid-2">
          <div className="card"><div className="card-head"><h3>Medical request information</h3><Hospital size={19} color="#d92745" /></div><div className="card-body form-grid">
            <div className="form-group"><label>Patient initials</label><input className="input" value={form.patientInitials} onChange={(e) => update("patientInitials", e.target.value)} maxLength={8} placeholder="Example: A.R." required /><span className="help-text">Do not enter the patient’s full name.</span></div>
            <div className="form-group"><label>Required blood group</label><select className="select" value={form.bloodGroup} onChange={(e) => update("bloodGroup", e.target.value)} required><option value="">Select group</option>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></div>
            <div className="form-group"><label>Blood component</label><select className="select" value={form.component} onChange={(e) => update("component", e.target.value)}>{REQUEST_COMPONENTS.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div className="form-group"><label>Units needed</label><input className="input" type="number" min="1" max="20" value={form.units} onChange={(e) => update("units", e.target.value)} required /></div>
            <div className="form-group full"><label>Hospital / blood centre</label><input className="input" value={form.hospitalName} onChange={(e) => update("hospitalName", e.target.value)} placeholder="Official facility name" required /></div>
            <div className="form-group"><label>State / Federal Territory</label><select className="select" value={form.state} onChange={(e) => update("state", e.target.value)}>{MALAYSIA_STATES.map((state) => <option key={state}>{state}</option>)}</select></div>
            <div className="form-group"><label>City</label><select className="select" value={form.city} onChange={(e) => update("city", e.target.value)}>{cities.map((city) => <option key={city}>{city}</option>)}</select></div>
            <div className="form-group"><label>Required by</label><input className="input" type="datetime-local" value={form.requiredBy} onChange={(e) => update("requiredBy", e.target.value)} required /></div>
            <div className="form-group"><label>Urgency</label><select className="select" value={form.urgency} onChange={(e) => update("urgency", e.target.value)}>{URGENCY_LEVELS.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></div>
            <div className="form-group full"><label>Reason category</label><select className="select" value={form.reasonCategory} onChange={(e) => update("reasonCategory", e.target.value)}><option>Emergency treatment</option><option>Surgery</option><option>Accident or trauma</option><option>Pregnancy-related care</option><option>Cancer treatment</option><option>Blood disorder</option><option>Other hospital-confirmed need</option></select></div>
            <div className="form-group full"><label>Public note (optional)</label><textarea className="textarea" value={form.notes} onChange={(e) => update("notes", e.target.value)} maxLength={700} placeholder="Add coordination details only. Do not include phone numbers or sensitive medical history." /></div>
          </div></div>

          <div className="stack">
            <div className="card"><div className="card-head"><h3>Private requester contact</h3><LockKeyhole size={19} color="#d92745" /></div><div className="card-body form-grid">
              <div className="form-group full"><label>Contact person</label><input className="input" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} required /></div>
              <div className="form-group full"><label>Malaysia phone / WhatsApp</label><input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+60..." required /></div>
              <div className="form-group full"><label>Email (optional)</label><input className="input" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
              <div className="form-group full"><label>Relationship to patient</label><input className="input" value={form.relation} onChange={(e) => update("relation", e.target.value)} required /></div>
            </div></div>
            <div className="notice notice-warning"><AlertTriangle size={22} /><div><strong>Important medical safety notice</strong><div>RedChain helps people coordinate. It does not confirm donor eligibility, blood compatibility or clinical suitability. Final checks must be completed by an authorised hospital or blood centre.</div></div></div>
            <label className="checkbox-row card card-pad"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>I confirm this request is genuine, the information is accurate, and I will close it when the requirement is fulfilled or cancelled.</span></label>
            {error && <div className="notice notice-danger">{error}</div>}
            <div className="form-actions"><Link className="btn btn-secondary" href="/requests">Cancel</Link><button className="btn btn-primary" disabled={loading}>{loading ? "Creating request..." : "Publish request"}</button></div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
