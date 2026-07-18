"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  EyeOff,
  Filter,
  HeartHandshake,
  Hospital,
  LockKeyhole,
  MapPin,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import StatusBadge from "@/components/StatusBadge";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { formatDate, requestLocation } from "@/lib/utils";

const defaultStats = { verified_donors: 0, active_requests: 0, fulfilled_requests: 0, states_covered: 16 };

export default function HomePage() {
  const [stats, setStats] = useState(defaultStats);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    async function loadHome() {
      if (!isSupabaseConfigured) return;
      const [{ data: statsData }, { data: requestData }] = await Promise.all([
        supabase.rpc("get_public_stats"),
        supabase
          .from("blood_requests")
          .select("id, blood_group, hospital_name, hospital_state, hospital_city, urgency, required_by, units_needed")
          .in("status", ["open", "matched"])
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
      if (statsData?.[0]) setStats(statsData[0]);
      setRequests(requestData || []);
    }
    loadHome();
  }, []);

  return (
    <div className="page">
      <SiteHeader />
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow"><ShieldCheck size={14} /> Privacy-aware donor matching</span>
            <h1>Find verified blood donors <span>faster across Malaysia.</span></h1>
            <p className="hero-copy">
              RedChain connects emergency blood requests with available donors by blood group and location—while keeping phone numbers and personal details private until the donor approves contact access.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/requests/new">Create emergency request <ArrowRight size={18} /></Link>
              <Link className="btn btn-secondary" href="/auth?mode=signup">Register as donor <HeartHandshake size={18} /></Link>
            </div>
            <div className="hero-trust">
              <span><CheckCircle2 size={16} color="#159455" /> Administrator verification</span>
              <span><LockKeyhole size={16} color="#159455" /> Controlled contact release</span>
              <span><MapPin size={16} color="#159455" /> Malaysia location filters</span>
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-panel-head">
              <div>
                <small style={{ color: "#667085", fontWeight: 800 }}>LIVE REQUEST BOARD</small>
                <h3>Emergency needs in Malaysia</h3>
              </div>
              <span className="live-dot" />
            </div>
            {requests.length ? requests.map((request) => (
              <div className="request-mini" key={request.id}>
                <div className="blood-orb">{request.blood_group}</div>
                <div>
                  <strong>{request.hospital_name}</strong>
                  <small>{requestLocation(request)} • {request.units_needed} unit{request.units_needed > 1 ? "s" : ""}</small>
                  <small style={{ display: "block" }}>Required {formatDate(request.required_by, true)}</small>
                </div>
                <StatusBadge status={request.urgency} />
              </div>
            )) : (
              <div className="notice notice-info">
                <Hospital size={20} />
                <div><strong>No public requests loaded yet.</strong><br />Connect Supabase and add the first emergency request.</div>
              </div>
            )}
            <Link className="btn btn-soft btn-block" href="/auth">Sign in to view and respond <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <div className="container stats-grid">
        <div className="stat-card"><strong>{stats.verified_donors || 0}+</strong><span>Verified donors</span></div>
        <div className="stat-card"><strong>{stats.active_requests || 0}</strong><span>Active requests</span></div>
        <div className="stat-card"><strong>{stats.fulfilled_requests || 0}</strong><span>Requests fulfilled</span></div>
        <div className="stat-card"><strong>{stats.states_covered || 16}</strong><span>States & federal territories</span></div>
      </div>

      <section className="page-section" id="privacy">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow"><EyeOff size={14} /> Built for trust</span>
            <h2>A safer alternative to public social media posts</h2>
            <p>RedChain structures emergency coordination without exposing donor phone numbers to everyone.</p>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon"><UserCheck /></div>
              <h3>Verified donor profiles</h3>
              <p>Donors submit a private verification document. Administrators approve, reject or request further information before a verified badge appears.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Filter /></div>
              <h3>Structured matching</h3>
              <p>Search by exact blood group, state, city and current availability instead of repeatedly calling outdated contacts.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><LockKeyhole /></div>
              <h3>Consent-based contact</h3>
              <p>Requesters see a donor’s public display name and general area only. Full contact details become available after donor approval.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Clock3 /></div>
              <h3>Request status tracking</h3>
              <p>Track open, matched, fulfilled and cancelled requests so outdated emergencies do not continue circulating.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><DatabaseZap /></div>
              <h3>Centralised records</h3>
              <p>Profiles, requests, responses, verification decisions and activity logs are organised in one secure Supabase database.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><BadgeCheck /></div>
              <h3>Administrative oversight</h3>
              <p>Administrators manage users, review verification evidence, moderate requests, publish notices and inspect research feedback.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section" id="how-it-works" style={{ background: "white", borderTop: "1px solid #e8eaf1", borderBottom: "1px solid #e8eaf1" }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow"><Search size={14} /> Four clear steps</span>
              <h2>How RedChain works</h2>
              <p>Simple enough for urgent use, structured enough for reliable coordination.</p>
            </div>
            <Link className="btn btn-primary" href="/auth?mode=signup">Create free account</Link>
          </div>
          <div className="workflow">
            <div className="step-card"><Users size={25} /><h3>Create your profile</h3><p>Choose donor, recipient or organisation and complete your Malaysia location and private contact details.</p></div>
            <div className="step-card"><ShieldCheck size={25} /><h3>Get verified</h3><p>Donors upload evidence privately. Only administrators and the document owner can access the file.</p></div>
            <div className="step-card"><Hospital size={25} /><h3>Submit or discover</h3><p>Create an emergency request or find exact-group donors filtered by state, city and availability.</p></div>
            <div className="step-card"><HeartHandshake size={25} /><h3>Connect with consent</h3><p>Send a contact-access request. The donor decides whether to release their preferred contact method.</p></div>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container">
          <div className="card card-pad" style={{ background: "linear-gradient(135deg,#111a34,#54182a)", color: "white", padding: 38 }}>
            <div className="section-head" style={{ margin: 0 }}>
              <div>
                <span className="eyebrow">Emergency coordination</span>
                <h2 style={{ color: "white", marginTop: 14 }}>Every minute matters. Make the search structured.</h2>
                <p style={{ color: "#c4cada", maxWidth: 720 }}>RedChain supports coordination only. Final donor eligibility, blood compatibility and transfusion decisions must be confirmed by an authorised hospital or blood centre.</p>
              </div>
              <Link className="btn btn-primary" href="/requests/new">Create a request <ArrowRight size={18} /></Link>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
