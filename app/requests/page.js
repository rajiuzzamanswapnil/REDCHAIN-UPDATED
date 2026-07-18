"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Clock3, MapPin, Plus, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { BLOOD_GROUPS, MALAYSIA_STATES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", bloodGroup: "", state: "", status: "active" });

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase
        .from("blood_requests")
        .select("*, profiles!blood_requests_requester_id_fkey(display_name,state,city)")
        .order("created_at", { ascending: false });
      setRequests(data || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const visible = useMemo(() => requests.filter((request) => {
    if (filters.status === "active" && !["open", "matched"].includes(request.status)) return false;
    if (filters.status === "mine" && request.requester_id !== user?.id) return false;
    if (filters.status && !["active", "mine"].includes(filters.status) && request.status !== filters.status) return false;
    if (filters.bloodGroup && request.blood_group !== filters.bloodGroup) return false;
    if (filters.state && request.hospital_state !== filters.state) return false;
    if (filters.search && !`${request.hospital_name} ${request.hospital_city} ${request.patient_initials}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }), [requests, filters, user]);

  return (
    <AppShell title="Emergency Requests">
      <div className="page-title-row"><div><h2>Emergency request board</h2><p>Track current needs, respond as a donor and close fulfilled requests to prevent outdated circulation.</p></div><Link className="btn btn-primary" href="/requests/new"><Plus size={17} /> New request</Link></div>
      <div className="card filters">
        <div className="form-group filter-search"><label>Search hospital or city</label><div style={{ position: "relative" }}><Search size={17} style={{ position: "absolute", left: 13, top: 14, color: "#98a2b3" }} /><input className="input" style={{ paddingLeft: 40 }} value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} placeholder="Search requests" /></div></div>
        <div className="form-group"><label>Blood group</label><select className="select" value={filters.bloodGroup} onChange={(e) => setFilters((f) => ({ ...f, bloodGroup: e.target.value }))}><option value="">All groups</option>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></div>
        <div className="form-group"><label>State</label><select className="select" value={filters.state} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}><option value="">All Malaysia</option>{MALAYSIA_STATES.map((state) => <option key={state}>{state}</option>)}</select></div>
        <div className="form-group"><label>View</label><select className="select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}><option value="active">Active requests</option><option value="mine">My requests</option><option value="open">Open</option><option value="matched">Matched</option><option value="fulfilled">Fulfilled</option><option value="cancelled">Cancelled</option></select></div>
        <button className="btn btn-secondary" onClick={() => setFilters({ search: "", bloodGroup: "", state: "", status: "active" })}>Reset</button>
      </div>
      {loading ? <LoadingState label="Loading emergency requests..." /> : visible.length ? <div className="request-list mt-20">{visible.map((request) => (
        <Link href={`/requests/${request.id}`} key={request.id} className="card request-card">
          <div className="blood-orb">{request.blood_group}</div>
          <div><h3>{request.hospital_name} <StatusBadge status={request.urgency} /></h3><div className="request-meta"><span><MapPin size={13} /> {request.hospital_city}, {request.hospital_state}</span><span><Clock3 size={13} /> Required {formatDate(request.required_by, true)}</span><span>{request.units_needed} unit{request.units_needed > 1 ? "s" : ""} • {request.blood_component}</span></div><small style={{ color: "#98a2b3" }}>Posted by {request.profiles?.display_name || "RedChain member"}</small></div>
          <div style={{ textAlign: "right" }}><StatusBadge status={request.status} /><div style={{ marginTop: 8, color: "#667085", fontSize: 12 }}>View details →</div></div>
        </Link>
      ))}</div> : <div className="card mt-20"><EmptyState icon={ClipboardList} title="No requests match these filters" description="Try viewing all active requests or create a new structured emergency request." action={<Link className="btn btn-primary btn-sm" href="/requests/new">Create request</Link>} /></div>}
    </AppShell>
  );
}
