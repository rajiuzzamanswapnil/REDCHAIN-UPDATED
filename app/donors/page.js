"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, HeartHandshake, MapPin, Search, ShieldCheck, UserRound } from "lucide-react";
import AppShell from "@/components/AppShell";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { BLOOD_GROUPS, MALAYSIA_LOCATIONS, MALAYSIA_STATES } from "@/lib/constants";
import { formatDate, initials, readableError } from "@/lib/utils";

function DonorDirectory() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({ search: "", bloodGroup: searchParams.get("blood") || "", state: searchParams.get("state") || "", city: "" });
  const [donors, setDonors] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [contactForm, setContactForm] = useState({ bloodRequestId: searchParams.get("request") || "", message: "I would like to request permission to contact you regarding an emergency blood requirement." });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const [{ data: donorData }, { data: requestData }] = await Promise.all([
        supabase
          .from("donor_profiles")
          .select("user_id,blood_group,is_available,last_donation_date,verification_status,preferred_radius_km,profiles!inner(display_name,state,city,account_status)")
          .eq("verification_status", "verified")
          .eq("is_available", true)
          .eq("profiles.account_status", "active")
          .order("updated_at", { ascending: false }),
        supabase.from("blood_requests").select("id,blood_group,hospital_name,status").eq("requester_id", user.id).in("status", ["open", "matched"]).order("created_at", { ascending: false }),
      ]);
      setDonors(donorData || []);
      setMyRequests(requestData || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const visibleDonors = useMemo(() => donors.filter((donor) => {
    const profile = donor.profiles;
    if (donor.user_id === user?.id) return false;
    if (filters.bloodGroup && donor.blood_group !== filters.bloodGroup) return false;
    if (filters.state && profile?.state !== filters.state) return false;
    if (filters.city && profile?.city !== filters.city) return false;
    if (filters.search && !`${profile?.display_name} ${profile?.city} ${profile?.state}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }), [donors, filters, user]);

  function setFilter(name, value) {
    setFilters((current) => name === "state" ? { ...current, state: value, city: "" } : { ...current, [name]: value });
  }

  async function requestContact(event) {
    event.preventDefault();
    if (!selected || !user) return;
    setSaving(true); setError(""); setNotice("");
    const { error: insertError } = await supabase.from("contact_requests").insert({
      requester_id: user.id,
      donor_id: selected.user_id,
      blood_request_id: contactForm.bloodRequestId || null,
      message: contactForm.message.trim(),
    });
    setSaving(false);
    if (insertError) setError(readableError(insertError, "A contact request may already be pending for this donor."));
    else {
      setNotice("Contact access request sent. The donor will decide whether to share their preferred contact details.");
      setTimeout(() => { setSelected(null); setNotice(""); }, 1700);
    }
  }

  return (
    <AppShell title="Find Donors">
      <div className="page-title-row">
        <div><h2>Verified donor directory</h2><p>Search exact blood groups and general locations. Private contacts remain hidden until the donor approves access.</p></div>
        <StatusBadge status="verified"><ShieldCheck size={13} /> Verified profiles only</StatusBadge>
      </div>

      <div className="card filters">
        <div className="form-group filter-search"><label>Search name or location</label><div style={{ position: "relative" }}><Search size={17} style={{ position: "absolute", left: 13, top: 14, color: "#98a2b3" }} /><input className="input" style={{ paddingLeft: 40 }} value={filters.search} onChange={(e) => setFilter("search", e.target.value)} placeholder="Search directory" /></div></div>
        <div className="form-group"><label>Blood group</label><select className="select" value={filters.bloodGroup} onChange={(e) => setFilter("bloodGroup", e.target.value)}><option value="">All groups</option>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></div>
        <div className="form-group"><label>State</label><select className="select" value={filters.state} onChange={(e) => setFilter("state", e.target.value)}><option value="">All Malaysia</option>{MALAYSIA_STATES.map((state) => <option key={state}>{state}</option>)}</select></div>
        <div className="form-group"><label>City</label><select className="select" value={filters.city} onChange={(e) => setFilter("city", e.target.value)} disabled={!filters.state}><option value="">All cities</option>{(MALAYSIA_LOCATIONS[filters.state] || []).map((city) => <option key={city}>{city}</option>)}</select></div>
        <button className="btn btn-secondary" onClick={() => setFilters({ search: "", bloodGroup: "", state: "", city: "" })}>Clear</button>
      </div>

      <div className="notice notice-info mt-16"><BadgeCheck size={20} /><div><strong>Exact-group discovery only.</strong> RedChain does not make medical compatibility decisions. A hospital or authorised blood centre must confirm eligibility and compatibility.</div></div>

      {loading ? <LoadingState label="Loading verified donors..." /> : visibleDonors.length ? (
        <div className="donor-grid mt-20">
          {visibleDonors.map((donor) => {
            const profile = donor.profiles;
            return <div className="card donor-card" key={donor.user_id}>
              <div className="donor-head"><div className="avatar">{initials(profile?.display_name)}</div><div><div className="donor-name">{profile?.display_name || "Verified donor"}</div><div className="donor-meta"><MapPin size={12} style={{ display: "inline", verticalAlign: -2 }} /> {profile?.city}, {profile?.state}</div></div></div>
              <div className="donor-facts"><div className="fact"><span>Blood group</span><strong style={{ color: "#bd1732", fontSize: 17 }}>{donor.blood_group}</strong></div><div className="fact"><span>Availability</span><strong>Available now</strong></div><div className="fact"><span>Last donation</span><strong>{donor.last_donation_date ? formatDate(donor.last_donation_date) : "Not recorded"}</strong></div><div className="fact"><span>Preferred radius</span><strong>{donor.preferred_radius_km || 25} km</strong></div></div>
              <div className="card-actions"><button className="btn btn-primary btn-block" onClick={() => { setSelected(donor); setError(""); setNotice(""); }}><HeartHandshake size={17} /> Request contact access</button></div>
            </div>;
          })}
        </div>
      ) : <div className="card mt-20"><EmptyState icon={UserRound} title="No matching verified donors" description="Try clearing one location filter or search another exact blood group. Availability can change at any time." /></div>}

      {selected && <Modal title={`Contact ${selected.profiles?.display_name || "verified donor"}`} onClose={() => setSelected(null)}>
        <div className="notice notice-info mb-16"><ShieldCheck size={20} /><div>The donor’s phone and email stay private until they approve this request.</div></div>
        <form className="stack" onSubmit={requestContact}>
          <div className="form-group"><label>Related emergency request (optional)</label><select className="select" value={contactForm.bloodRequestId} onChange={(e) => setContactForm((current) => ({ ...current, bloodRequestId: e.target.value }))}><option value="">General donor enquiry</option>{myRequests.map((request) => <option key={request.id} value={request.id}>{request.blood_group} • {request.hospital_name}</option>)}</select></div>
          <div className="form-group"><label>Message</label><textarea className="textarea" value={contactForm.message} onChange={(e) => setContactForm((current) => ({ ...current, message: e.target.value }))} maxLength={500} required /></div>
          {error && <div className="notice notice-danger">{error}</div>}
          {notice && <div className="notice notice-success">{notice}</div>}
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? "Sending..." : "Send request"}</button></div>
        </form>
      </Modal>}
    </AppShell>
  );
}

export default function DonorsPage() {
  return <Suspense fallback={<LoadingState />}><DonorDirectory /></Suspense>;
}
