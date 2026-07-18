"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquareMore, ShieldCheck, Sparkles } from "lucide-react";
import AppShell from "@/components/AppShell";
import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { readableError } from "@/lib/utils";

const questions = [
  ["usefulness_rating", "Usefulness", "RedChain would help users find or coordinate blood donors more effectively."],
  ["usability_rating", "Usability", "The system is clear and easy to use during an urgent situation."],
  ["trust_rating", "Trust", "Donor verification and administrator oversight improve confidence in the platform."],
  ["privacy_rating", "Privacy", "Controlled contact sharing reduces unnecessary exposure of personal information."],
];

function Rating({ value, onChange }) {
  return <div className="rating-grid">{[1,2,3,4,5].map((rating) => <button key={rating} type="button" className={`rating-button ${Number(value) === rating ? "active" : ""}`} onClick={() => onChange(rating)}>{rating}</button>)}</div>;
}

export default function FeedbackPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ usefulness_rating: 0, usability_rating: 0, trust_rating: 0, privacy_rating: 0, would_recommend: "yes", comments: "" });
  const [existing, setExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase.from("feedback_responses").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setForm({ usefulness_rating: data.usefulness_rating, usability_rating: data.usability_rating, trust_rating: data.trust_rating, privacy_rating: data.privacy_rating, would_recommend: data.would_recommend ? "yes" : "no", comments: data.comments || "" });
        setExisting(true);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  async function submit(event) {
    event.preventDefault();
    if (questions.some(([key]) => !form[key])) { setError("Please rate all four research dimensions."); return; }
    setSaving(true); setError(""); setMessage("");
    const { error: saveError } = await supabase.from("feedback_responses").upsert({
      user_id: user.id,
      usefulness_rating: Number(form.usefulness_rating),
      usability_rating: Number(form.usability_rating),
      trust_rating: Number(form.trust_rating),
      privacy_rating: Number(form.privacy_rating),
      would_recommend: form.would_recommend === "yes",
      comments: form.comments.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setSaving(false);
    if (saveError) setError(readableError(saveError)); else { setExisting(true); setMessage("Thank you. Your evaluation has been saved for the RedChain research analysis."); }
  }

  if (loading) return <AppShell title="Research Feedback"><LoadingState /></AppShell>;

  return (
    <AppShell title="Research Feedback">
      <div className="page-title-row"><div><h2>Evaluate the RedChain concept</h2><p>This short questionnaire measures perceived usefulness, usability, trust and privacy protection.</p></div>{existing && <span className="badge badge-green"><CheckCircle2 size={13} /> Response saved</span>}</div>
      <div className="detail-grid">
        <form className="stack" onSubmit={submit}>
          {questions.map(([key, title, description]) => <div className="card card-pad" key={key}><div style={{ display: "flex", gap: 13, alignItems: "flex-start", marginBottom: 16 }}><div className="feature-icon" style={{ margin: 0, width: 42, height: 42 }}><Sparkles size={19} /></div><div><h3 style={{ margin: 0 }}>{title}</h3><p style={{ margin: "4px 0 0", color: "#667085", fontSize: 13 }}>{description}</p></div></div><Rating value={form[key]} onChange={(value) => setForm((current) => ({ ...current, [key]: value }))} /><div style={{ display: "flex", justifyContent: "space-between", color: "#98a2b3", fontSize: 11, marginTop: 6 }}><span>Strongly disagree</span><span>Strongly agree</span></div></div>)}
          <div className="card card-pad"><div className="form-grid"><div className="form-group full"><label>Would you recommend RedChain for emergency donor coordination?</label><select className="select" value={form.would_recommend} onChange={(e) => setForm((current) => ({ ...current, would_recommend: e.target.value }))}><option value="yes">Yes</option><option value="no">No</option></select></div><div className="form-group full"><label>Comments or improvement ideas</label><textarea className="textarea" maxLength={1200} value={form.comments} onChange={(e) => setForm((current) => ({ ...current, comments: e.target.value }))} placeholder="Share what felt useful, confusing, trustworthy or privacy-friendly." /></div></div></div>
          {error && <div className="notice notice-danger">{error}</div>}
          {message && <div className="notice notice-success">{message}</div>}
          <button className="btn btn-primary" disabled={saving}>{saving ? "Saving response..." : existing ? "Update evaluation" : "Submit evaluation"}</button>
        </form>
        <div className="stack">
          <div className="card card-pad"><div className="feature-icon"><MessageSquareMore /></div><h3>Why this matters</h3><p style={{ color: "#667085" }}>The RedChain proposal includes questionnaire-based evaluation. These responses give the presentation a working data collection feature instead of a static mock-up.</p></div>
          <div className="notice notice-info"><ShieldCheck size={21} /><div><strong>Research privacy</strong><div>Your ratings are visible to authorised administrators for aggregate analysis. They are not displayed in the public donor directory.</div></div></div>
          <div className="card card-pad"><h3>Scale guide</h3><div className="timeline"><div className="timeline-item"><div className="timeline-dot" /><div className="timeline-content"><strong>1 — Strongly disagree</strong><small>The feature does not meet the stated purpose.</small></div></div><div className="timeline-item"><div className="timeline-dot" /><div className="timeline-content"><strong>3 — Neutral</strong><small>Neither positive nor negative.</small></div></div><div className="timeline-item"><div className="timeline-dot" /><div className="timeline-content"><strong>5 — Strongly agree</strong><small>The feature clearly meets the stated purpose.</small></div></div></div></div>
        </div>
      </div>
    </AppShell>
  );
}
