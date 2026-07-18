"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, LockKeyhole, MapPin, ShieldCheck, UserRound } from "lucide-react";
import AppShell from "@/components/AppShell";
import LoadingState from "@/components/LoadingState";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { ACCOUNT_TYPES, BLOOD_GROUPS, CONTACT_PREFERENCES, DONATION_ELIGIBILITY_NOTICE, MALAYSIA_LOCATIONS, MALAYSIA_STATES } from "@/lib/constants";
import { profileCompletion, readableError } from "@/lib/utils";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [privateProfile, setPrivateProfile] = useState(null);
  const [donorProfile, setDonorProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const [{ data: privateData }, { data: donorData }] = await Promise.all([
        supabase.from("private_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("donor_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setPrivateProfile(privateData || null);
      setDonorProfile(donorData || null);
      setForm({
        displayName: profile?.display_name || "",
        accountType: profile?.account_type || "donor",
        state: profile?.state || "Kuala Lumpur",
        city: profile?.city || "Kuala Lumpur",
        fullName: privateData?.full_name || user.user_metadata?.full_name || "",
        phone: privateData?.phone || "+60",
        email: privateData?.email || user.email || "",
        contactPreference: privateData?.contact_preference || "whatsapp",
        bloodGroup: donorData?.blood_group || "",
        available: donorData?.is_available ?? true,
        lastDonationDate: donorData?.last_donation_date || "",
        preferredRadius: donorData?.preferred_radius_km || 25,
        medicalDeclaration: donorData?.medical_declaration || false,
      });
      setLoading(false);
    }
    load();
  }, [user, profile]);

  const completion = useMemo(() => profileCompletion(profile, privateProfile, donorProfile), [profile, privateProfile, donorProfile]);
  const cities = form ? MALAYSIA_LOCATIONS[form.state] || [] : [];

  function update(name, value) {
    setForm((current) => name === "state" ? { ...current, state: value, city: MALAYSIA_LOCATIONS[value]?.[0] || "" } : { ...current, [name]: value });
  }

  async function save(event) {
    event.preventDefault();
    if (!user || !form) return;
    setSaving(true); setError(""); setMessage("");
    const { error: profileError } = await supabase.from("profiles").update({
      display_name: form.displayName.trim(), account_type: form.accountType, state: form.state, city: form.city,
    }).eq("id", user.id);
    if (profileError) { setSaving(false); setError(readableError(profileError)); return; }
    const { error: privateError } = await supabase.from("private_profiles").upsert({
      user_id: user.id, full_name: form.fullName.trim(), phone: form.phone.trim(), email: form.email.trim() || null, contact_preference: form.contactPreference,
    });
    if (privateError) { setSaving(false); setError(readableError(privateError)); return; }
    if (form.accountType === "donor") {
      const { error: donorError } = await supabase.from("donor_profiles").upsert({
        user_id: user.id,
        blood_group: form.bloodGroup || null,
        is_available: form.available,
        last_donation_date: form.lastDonationDate || null,
        preferred_radius_km: Number(form.preferredRadius),
        medical_declaration: form.medicalDeclaration,
      });
      if (donorError) { setSaving(false); setError(readableError(donorError)); return; }
    }
    await refreshProfile();
    setPrivateProfile((current) => ({ ...current, full_name: form.fullName, phone: form.phone, email: form.email, contact_preference: form.contactPreference }));
    setDonorProfile((current) => form.accountType === "donor" ? ({ ...current, blood_group: form.bloodGroup, is_available: form.available, last_donation_date: form.lastDonationDate, preferred_radius_km: form.preferredRadius, medical_declaration: form.medicalDeclaration }) : current);
    setSaving(false); setMessage("Profile updated successfully.");
  }

  if (loading || !form) return <AppShell title="My Profile"><LoadingState label="Loading profile..." /></AppShell>;

  return (
    <AppShell title="My Profile">
      <div className="page-title-row"><div><h2>Profile and privacy settings</h2><p>Your public directory information and private contact details are stored separately.</p></div><StatusBadge status={profile?.account_status || "active"} /></div>
      <div className="card card-pad mb-16"><div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center" }}><div><strong>Profile completion: {completion}%</strong><div style={{ color: "#667085", fontSize: 13 }}>Complete information improves the quality of request coordination.</div></div><div style={{ width: "min(360px,45%)" }}><div className="progress"><div style={{ width: `${completion}%` }} /></div></div></div></div>
      <form onSubmit={save}>
        <div className="grid-2">
          <div className="stack">
            <div className="card"><div className="card-head"><h3>Public profile</h3><UserRound size={19} color="#d92745" /></div><div className="card-body form-grid">
              <div className="form-group full"><label>Public display name</label><input className="input" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} required /><span className="help-text">Visible to authenticated RedChain members. Use a privacy-aware name such as “Swapnil R.”</span></div>
              <div className="form-group full"><label>Account type</label><select className="select" value={form.accountType} onChange={(e) => update("accountType", e.target.value)}>{ACCOUNT_TYPES.map((item) => <option key={item}>{item}</option>)}</select></div>
              <div className="form-group"><label>State / Federal Territory</label><select className="select" value={form.state} onChange={(e) => update("state", e.target.value)}>{MALAYSIA_STATES.map((state) => <option key={state}>{state}</option>)}</select></div>
              <div className="form-group"><label>City</label><select className="select" value={form.city} onChange={(e) => update("city", e.target.value)}>{cities.map((city) => <option key={city}>{city}</option>)}</select></div>
              <div className="notice notice-info full"><MapPin size={19} /><div>Only your general city and state are used for matching. Do not enter a home address.</div></div>
            </div></div>

            <div className="card"><div className="card-head"><h3>Private contact information</h3><LockKeyhole size={19} color="#d92745" /></div><div className="card-body form-grid">
              <div className="form-group full"><label>Full legal name</label><input className="input" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required /></div>
              <div className="form-group full"><label>Phone / WhatsApp</label><input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+60..." required /></div>
              <div className="form-group full"><label>Email</label><input className="input" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
              <div className="form-group full"><label>Preferred contact method</label><select className="select" value={form.contactPreference} onChange={(e) => update("contactPreference", e.target.value)}>{CONTACT_PREFERENCES.map((item) => <option key={item}>{item}</option>)}</select></div>
              <div className="notice notice-success full"><ShieldCheck size={20} /><div>These fields are protected by Row Level Security and are not included in the searchable donor directory.</div></div>
            </div></div>
          </div>

          <div className="stack">
            {form.accountType === "donor" && <div className="card"><div className="card-head"><h3>Donor profile</h3><StatusBadge status={donorProfile?.verification_status || "not submitted"} /></div><div className="card-body form-grid">
              <div className="form-group"><label>Blood group</label><select className="select" value={form.bloodGroup} onChange={(e) => update("bloodGroup", e.target.value)} required><option value="">Select group</option>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></div>
              <div className="form-group"><label>Preferred travel radius</label><select className="select" value={form.preferredRadius} onChange={(e) => update("preferredRadius", e.target.value)}><option value="10">10 km</option><option value="25">25 km</option><option value="50">50 km</option><option value="100">100 km</option></select></div>
              <div className="form-group full"><label>Last donation date (optional)</label><input className="input" type="date" value={form.lastDonationDate} onChange={(e) => update("lastDonationDate", e.target.value)} /></div>
              <label className="checkbox-row full"><input type="checkbox" checked={form.available} onChange={(e) => update("available", e.target.checked)} /><span><strong>Available for matching</strong><br />Turn this off whenever you cannot donate or do not want new contact requests.</span></label>
              <label className="checkbox-row full"><input type="checkbox" checked={form.medicalDeclaration} onChange={(e) => update("medicalDeclaration", e.target.checked)} /><span>I understand that RedChain registration is not medical clearance and that the hospital must complete all eligibility and compatibility checks.</span></label>
              <div className="notice notice-warning full">{DONATION_ELIGIBILITY_NOTICE}</div>
            </div></div>}
            <div className="card card-pad"><div className="feature-icon"><CheckCircle2 /></div><h3>Profile visibility summary</h3><div className="timeline"><div className="timeline-item"><div className="timeline-dot" /><div className="timeline-content"><strong>Public to signed-in users</strong><small>Display name, account type, city and state.</small></div></div><div className="timeline-item"><div className="timeline-dot" /><div className="timeline-content"><strong>Visible in donor search</strong><small>Blood group, availability, verification status and last donation date.</small></div></div><div className="timeline-item"><div className="timeline-dot" /><div className="timeline-content"><strong>Private and controlled</strong><small>Full name, phone, email and verification documents.</small></div></div></div></div>
            {error && <div className="notice notice-danger">{error}</div>}
            {message && <div className="notice notice-success">{message}</div>}
            <button className="btn btn-primary btn-block" disabled={saving}>{saving ? "Saving changes..." : "Save profile"}</button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
