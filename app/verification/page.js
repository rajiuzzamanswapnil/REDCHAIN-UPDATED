"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileCheck2, FileText, LockKeyhole, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import AppShell from "@/components/AppShell";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { formatDate, readableError, sanitizeFileName } from "@/lib/utils";

export default function VerificationPage() {
  const { user, profile } = useAuth();
  const [donorProfile, setDonorProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("identity_document");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    if (!user) return;
    setLoading(true);
    const [{ data: donorData }, { data: documentData }] = await Promise.all([
      supabase.from("donor_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("verification_documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setDonorProfile(donorData || null);
    setDocuments(documentData || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  async function upload(event) {
    event.preventDefault();
    if (!user || !file) { setError("Choose a PDF, JPG or PNG document first."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("The file must be 5 MB or smaller."); return; }
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) { setError("Only PDF, JPG and PNG files are accepted."); return; }
    setSaving(true); setError(""); setMessage("");
    const path = `${user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("verification-documents").upload(path, file, { upsert: false, contentType: file.type });
    if (uploadError) { setSaving(false); setError(readableError(uploadError)); return; }
    const { error: recordError } = await supabase.from("verification_documents").insert({ user_id: user.id, document_type: documentType, file_path: path, file_name: file.name, mime_type: file.type, file_size: file.size });
    if (recordError) {
      await supabase.storage.from("verification-documents").remove([path]);
      setSaving(false); setError(readableError(recordError)); return;
    }
    await supabase.from("donor_profiles").update({ verification_status: "pending" }).eq("user_id", user.id);
    setSaving(false); setFile(null); setMessage("Document submitted privately for administrator review.");
    await load();
  }

  async function remove(document) {
    if (!["pending", "rejected"].includes(document.status)) return;
    setSaving(true); setError("");
    const { error: storageError } = await supabase.storage.from("verification-documents").remove([document.file_path]);
    if (!storageError) await supabase.from("verification_documents").delete().eq("id", document.id);
    setSaving(false);
    if (storageError) setError(readableError(storageError)); else await load();
  }

  if (loading) return <AppShell title="Verification"><LoadingState label="Loading verification record..." /></AppShell>;

  return (
    <AppShell title="Verification">
      <div className="page-title-row"><div><h2>Donor verification centre</h2><p>Submit evidence privately so an administrator can review your donor registration.</p></div><StatusBadge status={donorProfile?.verification_status || "not submitted"} /></div>
      {profile?.account_type !== "donor" ? <div className="card"><EmptyState icon={FileCheck2} title="Donor profile required" description="Switch your account type to donor and complete blood-group details before requesting verification." action={<Link className="btn btn-primary btn-sm" href="/profile">Update profile</Link>} /></div> : <div className="grid-2">
        <div className="stack">
          <div className="card"><div className="card-head"><h3>Submit verification evidence</h3><UploadCloud size={20} color="#d92745" /></div><form onSubmit={upload} className="card-body stack">
            <div className="notice notice-info"><LockKeyhole size={21} /><div><strong>Private storage bucket</strong><div>Your file is not public. Storage policies allow access only to you and authorised RedChain administrators.</div></div></div>
            <div className="form-group"><label>Document type</label><select className="select" value={documentType} onChange={(e) => setDocumentType(e.target.value)}><option value="identity_document">Identity document</option><option value="donor_card">Blood donor card / record</option><option value="organization_letter">Hospital or organisation letter</option><option value="other_supporting_document">Other supporting document</option></select></div>
            <div className="form-group"><label>Choose file</label><input className="input" style={{ paddingTop: 10 }} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} required /><span className="help-text">Accepted: PDF, JPG, PNG • Maximum 5 MB.</span></div>
            {file && <div className="notice notice-success"><FileText size={19} /><div><strong>{file.name}</strong><div>{(file.size / 1024 / 1024).toFixed(2)} MB</div></div></div>}
            {error && <div className="notice notice-danger">{error}</div>}
            {message && <div className="notice notice-success">{message}</div>}
            <button className="btn btn-primary" disabled={saving || !file}>{saving ? "Uploading securely..." : "Submit for review"}</button>
          </form></div>
          <div className="notice notice-warning"><ShieldCheck size={21} /><div><strong>Verification is a platform trust check, not medical clearance.</strong><div>Every donation still requires hospital-led eligibility screening and compatibility testing.</div></div></div>
        </div>
        <div className="card"><div className="card-head"><h3>Submission history</h3><span style={{ color: "#667085", fontSize: 12 }}>{documents.length} file{documents.length === 1 ? "" : "s"}</span></div>{documents.length ? <div className="stack" style={{ padding: 16 }}>{documents.map((document) => <div key={document.id} style={{ padding: 15, border: "1px solid #e8eaf1", borderRadius: 14 }}><div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}><div className="feature-icon" style={{ width: 42, height: 42, margin: 0, flex: "none" }}><FileText size={20} /></div><div style={{ flex: 1 }}><strong>{document.file_name}</strong><div style={{ color: "#667085", fontSize: 12 }}>{document.document_type.replaceAll("_", " ")} • {formatDate(document.created_at, true)}</div><div style={{ marginTop: 8 }}><StatusBadge status={document.status} /></div>{document.review_notes && <div className="notice notice-warning mt-16">{document.review_notes}</div>}</div>{["pending", "rejected"].includes(document.status) && <button className="icon-btn" title="Delete file" onClick={() => remove(document)} disabled={saving}><Trash2 size={17} /></button>}</div></div>)}</div> : <EmptyState icon={FileCheck2} title="No documents submitted" description="Your verification submission history and administrator decisions will appear here." />}</div>
      </div>}
    </AppShell>
  );
}
