"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Close } from "@/components/Icons";

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminStudentsPage() {
  const supabase = createClient();
  const [domains, setDomains] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: doms }, { data: studs }] = await Promise.all([
      supabase.from("student_email_domains").select("id, domain, is_active, created_at").order("domain"),
      supabase.from("profiles").select("id, full_name, student_email, student_verified_at").eq("student_verified", true).order("student_verified_at", { ascending: false })
    ]);
    setDomains(doms ?? []);
    setStudents(studs ?? []);
    setLoading(false);
  }

  async function addDomain(e) {
    e.preventDefault();
    setError("");
    const domain = newDomain.trim().toLowerCase().replace(/^@/, "");
    if (!domain) return;
    const { error: insErr } = await supabase.from("student_email_domains").insert({ domain });
    if (insErr) { setError(insErr.message.includes("duplicate") ? "That domain already exists." : insErr.message); return; }
    setNewDomain("");
    await fetchAll();
  }

  async function toggleDomain(d) {
    await supabase.from("student_email_domains").update({ is_active: !d.is_active }).eq("id", d.id);
    await fetchAll();
  }

  async function removeDomain(id) {
    await supabase.from("student_email_domains").delete().eq("id", id);
    await fetchAll();
  }

  async function revoke(profileId) {
    const res = await fetch("/api/student/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId })
    });
    if (res.ok) await fetchAll();
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <div className="admin-eyebrow">Verification</div>
          <h1 className="admin-page-title">Student Verification</h1>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <section className="account-card" style={{ maxWidth: 640 }}>
        <h2 className="account-card__title">Approved university domains</h2>
        <p className="form-hint" style={{ marginBottom: 12 }}>Only emails on these domains can request verification. Leave empty to allow any domain.</p>
        <form onSubmit={addDomain} className="student-verify__row" style={{ marginBottom: 14 }}>
          <input className="form-input" placeholder="nu.edu.pk" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} />
          <button type="submit" className="button button--dark">Add domain</button>
        </form>
        {domains.length === 0 ? (
          <p className="admin-muted">No domains yet — any university email is allowed.</p>
        ) : (
          <div className="domain-list">
            {domains.map((d) => (
              <div key={d.id} className="domain-chip">
                <span>{d.domain}</span>
                <button type="button" className={`status-badge status-badge--${d.is_active ? "active" : "draft"}`} onClick={() => toggleDomain(d)}>
                  {d.is_active ? "Active" : "Off"}
                </button>
                <button type="button" className="variant-del" onClick={() => removeDomain(d.id)} aria-label="Remove domain"><Close size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 className="account-section-title">Verified students</h2>
        {loading ? (
          <div className="admin-loading">Loading…</div>
        ) : students.length === 0 ? (
          <div className="admin-empty"><p>No verified students yet.</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Student email</th><th>Verified</th><th>Actions</th></tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.full_name || <span className="admin-muted">—</span>}</td>
                    <td>{s.student_email || <span className="admin-muted">—</span>}</td>
                    <td>{fmtDate(s.student_verified_at)}</td>
                    <td>
                      <button type="button" className="admin-btn-delete" onClick={() => revoke(s.id)}>Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
