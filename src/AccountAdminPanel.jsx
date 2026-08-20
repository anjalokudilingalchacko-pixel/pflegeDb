/**
 * AccountAdminPanel.jsx — System Administrator dashboard: account lifecycle
 * (create/edit/deactivate/reactivate/reset-password), supervisor/classroom
 * linking, and an audit log. Backed by the /api/admin/* endpoints in
 * server.cjs, which enforce the admin-only role check server-side too —
 * this component's own role guard below is defense in depth, not the
 * only gate.
 */

import React, { useState, useEffect, useCallback } from "react";
import { AvatarCircle } from "./feedShared";

const ROLE_LABELS = { admin: "Administrator", teacher: "Lehrkraft", praxisanleiter: "Praxisanleiter", student: "Schüler(in)" };
const ROLE_COLORS = { admin: "#4338CA", teacher: "#B45309", praxisanleiter: "#0D9488", student: "#0369A1" };

function authHeaders() {
  const token = localStorage.getItem("pflegedb_jwt_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function asJson(res, fallback) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || fallback);
  return data;
}

const api = {
  listUsers: () => fetch("/api/admin/users", { headers: authHeaders() }).then(r => asJson(r, "Nutzer konnten nicht geladen werden.")),
  createUser: (payload) => fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(payload) }).then(r => asJson(r, "Konto konnte nicht erstellt werden.")),
  updateUser: (id, payload) => fetch(`/api/admin/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(payload) }).then(r => asJson(r, "Konto konnte nicht aktualisiert werden.")),
  deactivate: (id) => fetch(`/api/admin/users/${id}/deactivate`, { method: "POST", headers: authHeaders() }).then(r => asJson(r, "Aktion fehlgeschlagen.")),
  reactivate: (id) => fetch(`/api/admin/users/${id}/reactivate`, { method: "POST", headers: authHeaders() }).then(r => asJson(r, "Aktion fehlgeschlagen.")),
  resetPassword: (id) => fetch(`/api/admin/users/${id}/reset-password`, { method: "POST", headers: authHeaders() }).then(r => asJson(r, "Passwort konnte nicht zurückgesetzt werden.")),
  auditLog: () => fetch("/api/admin/audit-log", { headers: authHeaders() }).then(r => asJson(r, "Audit-Log konnte nicht geladen werden.")),
  classrooms: () => fetch("/api/classrooms").then(r => r.json())
};

const EMPTY_FORM = { name: "", email: "", password: "", role: "student", specialty: "", institution: "", cohortYear: "", supervisorId: "", classroomId: "" };

export default function AccountAdminPanel({ onHome, currentUser }) {
  const isAdmin = currentUser?.role === "admin";

  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'audit'
  const [roleFilter, setRoleFilter] = useState("all");

  const [auditLog, setAuditLog] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [tempPasswordFor, setTempPasswordFor] = useState(null); // { name, tempPassword }

  const loadUsers = useCallback(() => {
    if (!isAdmin) return;
    setLoading(true);
    Promise.all([api.listUsers(), api.classrooms()])
      .then(([u, c]) => { setUsers(u); setClassrooms(c); setError(""); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    if (!isAdmin || activeTab !== "audit") return;
    setAuditLoading(true);
    api.auditLog().then(setAuditLog).catch(err => setError(err.message)).finally(() => setAuditLoading(false));
  }, [isAdmin, activeTab]);

  if (!isAdmin) {
    return (
      <div className="acc-admin-app">
        <style>{ACC_ADMIN_CSS}</style>
        <header className="acc-admin-header">
          <button className="acc-back-btn" onClick={onHome}>← Zurück</button>
        </header>
        <div className="acc-denied">
          <div className="acc-denied-icon">🔒</div>
          <h2>Kein Zugriff</h2>
          <p>Die Kontenverwaltung ist nur für die Systemadministration sichtbar.</p>
        </div>
      </div>
    );
  }

  const visibleUsers = roleFilter === "all" ? users : users.filter(u => u.role === roleFilter);
  const supervisors = users.filter(u => u.role === "praxisanleiter" && u.active !== false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditingId(u.id);
    setForm({
      name: u.name, email: u.email, password: "", role: u.role,
      specialty: u.specialty || "", institution: u.institution || "", cohortYear: u.cohortYear || "",
      supervisorId: u.supervisorId || "", classroomId: u.classroomId || ""
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => setShowForm(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setFormError("Name und E-Mail sind erforderlich."); return; }
    if (!editingId && !form.password.trim()) { setFormError("Bitte ein Passwort vergeben."); return; }

    setSubmitting(true);
    setFormError("");
    try {
      if (editingId) {
        await api.updateUser(editingId, {
          name: form.name.trim(), email: form.email.trim(), role: form.role,
          specialty: (form.role === "praxisanleiter" || form.role === "teacher") ? (form.specialty || null) : null,
          institution: form.role === "teacher" ? (form.institution || null) : null,
          cohortYear: form.role === "student" ? (form.cohortYear || null) : null,
          supervisorId: form.role === "student" ? (form.supervisorId || null) : null,
          classroomId: form.role === "student" ? (form.classroomId || null) : null
        });
      } else {
        await api.createUser({
          name: form.name.trim(), email: form.email.trim(), password: form.password.trim(), role: form.role,
          specialty: form.specialty || null, institution: form.institution || null, cohortYear: form.cohortYear || null,
          supervisorId: form.supervisorId || null, classroomId: form.classroomId || null
        });
      }
      setShowForm(false);
      loadUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u) => {
    const verb = u.active === false ? "reaktivieren" : "deaktivieren";
    if (!window.confirm(`Konto von ${u.name} wirklich ${verb}?`)) return;
    try {
      if (u.active === false) await api.reactivate(u.id);
      else await api.deactivate(u.id);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (u) => {
    if (!window.confirm(`Neues temporäres Passwort für ${u.name} generieren?`)) return;
    try {
      const { tempPassword } = await api.resetPassword(u.id);
      setTempPasswordFor({ name: u.name, tempPassword });
    } catch (err) {
      alert(err.message);
    }
  };

  const classroomName = (id) => classrooms.find(c => c.id === id)?.name || "—";
  const supervisorName = (id) => users.find(u => u.id === id)?.name || "—";

  return (
    <div className="acc-admin-app">
      <style>{ACC_ADMIN_CSS}</style>

      <header className="acc-admin-header">
        <button className="acc-back-btn" onClick={onHome}>← Zurück</button>
        <div>
          <h1>Kontenverwaltung</h1>
          <p>Konten anlegen, Rollen zuweisen, Praxisanleiter mit Schüler:innen verknüpfen.</p>
        </div>
      </header>

      <div className="acc-tabs">
        <button className={`acc-tab ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>Nutzer</button>
        <button className={`acc-tab ${activeTab === "audit" ? "active" : ""}`} onClick={() => setActiveTab("audit")}>Audit-Log</button>
      </div>

      {error && <div className="acc-error">{error}</div>}

      {activeTab === "users" && (
        <>
          <div className="acc-toolbar">
            <div className="acc-role-filters">
              {["all", "admin", "teacher", "praxisanleiter", "student"].map(r => (
                <button key={r} className={`acc-pill ${roleFilter === r ? "active" : ""}`} onClick={() => setRoleFilter(r)}>
                  {r === "all" ? "Alle" : ROLE_LABELS[r]}
                </button>
              ))}
            </div>
            <button className="acc-btn-primary" onClick={openCreate}>+ Neues Konto</button>
          </div>

          {loading ? (
            <div className="acc-skeleton" />
          ) : (
            <div className="acc-table-wrap">
              <table className="acc-table">
                <thead>
                  <tr>
                    <th>Name</th><th>E-Mail</th><th>Rolle</th><th>Details</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map(u => (
                    <tr key={u.id} className={u.active === false ? "acc-row-inactive" : ""}>
                      <td className="acc-name-cell">
                        <span className="acc-avatar-wrap">
                          <AvatarCircle name={u.name} size={26} fontSize={11} avatarType={u.avatarType} avatarIcon={u.avatarIcon} avatarUrl={u.avatarUrl} />
                        </span>
                        {u.name}
                        {u.id === currentUser?.id && <span className="acc-you-badge">Du</span>}
                      </td>
                      <td>{u.email}</td>
                      <td><span className="acc-role-badge" style={{ background: `${ROLE_COLORS[u.role]}1a`, color: ROLE_COLORS[u.role] }}>{ROLE_LABELS[u.role] || u.role}</span></td>
                      <td className="acc-detail-cell">
                        {u.role === "student" && (
                          <>
                            {u.classroomId && <div>Klasse: {classroomName(u.classroomId)}</div>}
                            {u.supervisorId && <div>Praxisanleiter: {supervisorName(u.supervisorId)}</div>}
                          </>
                        )}
                        {u.role === "praxisanleiter" && u.specialty && <div>{u.specialty}</div>}
                        {u.role === "teacher" && (
                          <>
                            {u.institution && <div>{u.institution}</div>}
                            {u.specialty && <div>{u.specialty}</div>}
                          </>
                        )}
                      </td>
                      <td>
                        <span className={`acc-status-badge ${u.active === false ? "inactive" : "active"}`}>
                          {u.active === false ? "Deaktiviert" : "Aktiv"}
                        </span>
                        {u.active !== false && !u.emailVerified && (
                          <span className="acc-status-badge unverified" style={{ marginLeft: 6 }}>E-Mail unbestätigt</span>
                        )}
                      </td>
                      <td className="acc-actions-cell">
                        <button className="acc-link-btn" onClick={() => openEdit(u)}>Bearbeiten</button>
                        <button className="acc-link-btn" onClick={() => handleResetPassword(u)}>Passwort zurücksetzen</button>
                        <button
                          className={`acc-link-btn ${u.active === false ? "" : "danger"}`}
                          onClick={() => handleToggleActive(u)}
                          disabled={u.id === currentUser?.id}
                          title={u.id === currentUser?.id ? "Du kannst dein eigenes Konto nicht deaktivieren." : ""}
                        >
                          {u.active === false ? "Reaktivieren" : "Deaktivieren"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {visibleUsers.length === 0 && (
                    <tr><td colSpan={6} className="acc-empty-cell">Keine Konten in dieser Ansicht.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "audit" && (
        auditLoading ? <div className="acc-skeleton" /> : (
          <div className="acc-table-wrap">
            <table className="acc-table">
              <thead><tr><th>Zeitpunkt</th><th>Von</th><th>Aktion</th><th>Betrifft</th><th>Details</th></tr></thead>
              <tbody>
                {auditLog.map(entry => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.createdAt).toLocaleString("de-DE")}</td>
                    <td>{entry.actorName}</td>
                    <td>{entry.action}</td>
                    <td>{users.find(u => u.id === entry.targetUserId)?.name || entry.targetUserId || "—"}</td>
                    <td>{entry.detail}</td>
                  </tr>
                ))}
                {auditLog.length === 0 && <tr><td colSpan={5} className="acc-empty-cell">Noch keine Einträge.</td></tr>}
              </tbody>
            </table>
          </div>
        )
      )}

      {showForm && (
        <div className="acc-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}>
          <div className="acc-modal">
            <div className="acc-modal-head">
              <h3>{editingId ? "Konto bearbeiten" : "Neues Konto"}</h3>
              <button className="acc-close-btn" onClick={closeForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="acc-form">
              <label>Name
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </label>
              <label>E-Mail
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </label>
              {!editingId && (
                <label>Initiales Passwort
                  <input type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </label>
              )}
              <label>Rolle
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="student">Schüler(in)</option>
                  <option value="teacher">Lehrkraft</option>
                  <option value="praxisanleiter">Praxisanleiter</option>
                  <option value="admin">Administrator</option>
                </select>
              </label>

              {form.role === "praxisanleiter" && (
                <label>Fachbereich
                  <input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="z.B. Intensivstation" />
                </label>
              )}

              {form.role === "teacher" && (
                <>
                  <label>Einrichtung (Schule / Klinik)
                    <input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} placeholder="z.B. Berufsfachschule für Pflege München" />
                  </label>
                  <label>Unterrichtsfach / Fachbereich
                    <input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="z.B. Innere Medizin" />
                  </label>
                </>
              )}

              {form.role === "student" && (
                <>
                  <label>Jahrgang
                    <input value={form.cohortYear} onChange={e => setForm(f => ({ ...f, cohortYear: e.target.value }))} placeholder="z.B. 2026" />
                  </label>
                  <label>Klasse
                    <select value={form.classroomId} onChange={e => setForm(f => ({ ...f, classroomId: e.target.value }))}>
                      <option value="">— keine —</option>
                      {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label>Praxisanleiter
                    <select value={form.supervisorId} onChange={e => setForm(f => ({ ...f, supervisorId: e.target.value }))}>
                      <option value="">— keine/r —</option>
                      {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                </>
              )}

              {formError && <div className="acc-form-error">{formError}</div>}

              <div className="acc-form-actions">
                <button type="button" className="acc-btn-outline" onClick={closeForm}>Abbrechen</button>
                <button type="submit" className="acc-btn-primary" disabled={submitting}>
                  {submitting ? "Speichern…" : editingId ? "Speichern" : "Konto erstellen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tempPasswordFor && (
        <div className="acc-overlay" onClick={(e) => { if (e.target === e.currentTarget) setTempPasswordFor(null); }}>
          <div className="acc-modal acc-modal-narrow">
            <div className="acc-modal-head">
              <h3>Neues Passwort</h3>
              <button className="acc-close-btn" onClick={() => setTempPasswordFor(null)}>×</button>
            </div>
            <p>Temporäres Passwort für <b>{tempPasswordFor.name}</b> — bitte manuell weitergeben, es wird nur einmal angezeigt:</p>
            <div className="acc-temp-password">{tempPasswordFor.tempPassword}</div>
            <div className="acc-form-actions">
              <button type="button" className="acc-btn-primary" onClick={() => setTempPasswordFor(null)}>Verstanden</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ACC_ADMIN_CSS = `
  .acc-admin-app { min-height: 100vh; background: #F1F4FA; font-family: 'Inter', sans-serif; padding: 28px 32px 60px; box-sizing: border-box; }
  .acc-admin-header { display: flex; align-items: flex-start; gap: 18px; margin-bottom: 22px; }
  .acc-back-btn { background: #fff; border: 1px solid #E4E8F1; border-radius: 9px; padding: 8px 14px; font-weight: 700; font-size: 13px; cursor: pointer; color: #16305C; flex-shrink: 0; }
  .acc-admin-header h1 { font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 800; margin: 4px 0 4px; color: #16213D; }
  .acc-admin-header p { margin: 0; color: #64748B; font-size: 13.5px; }

  .acc-tabs { display: flex; gap: 4px; border-bottom: 1px solid #E4E8F1; margin-bottom: 20px; }
  .acc-tab { background: none; border: none; padding: 10px 16px; font-weight: 700; font-size: 13.5px; color: #64748B; border-bottom: 2px solid transparent; cursor: pointer; }
  .acc-tab.active { color: #16305C; border-color: #0D9488; }

  .acc-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; font-size: 13.5px; }

  .acc-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .acc-role-filters { display: flex; gap: 6px; flex-wrap: wrap; }
  .acc-pill { background: #fff; border: 1px solid #E4E8F1; border-radius: 999px; padding: 7px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; color: #16213D; }
  .acc-pill.active { background: #16305C; color: #fff; border-color: #16305C; }

  .acc-btn-primary { background: #0D9488; color: #fff; border: none; border-radius: 9px; padding: 10px 18px; font-weight: 700; font-size: 13px; cursor: pointer; }
  .acc-btn-primary:hover { background: #0B7A70; }
  .acc-btn-primary:disabled { opacity: .6; cursor: default; }
  .acc-btn-outline { background: #F1F4FA; border: 1px solid #E4E8F1; border-radius: 9px; padding: 10px 18px; font-weight: 700; font-size: 13px; cursor: pointer; }

  .acc-skeleton { height: 220px; border-radius: 16px; background: linear-gradient(90deg, #EEF1F8 25%, #E4E8F1 37%, #EEF1F8 63%); background-size: 400% 100%; animation: acc-skel 1.4s ease infinite; }
  @keyframes acc-skel { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

  .acc-table-wrap { background: #fff; border: 1px solid #E4E8F1; border-radius: 16px; overflow: hidden; overflow-x: auto; }
  .acc-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 720px; }
  .acc-table th { text-align: left; padding: 12px 16px; background: #F8FAFC; color: #64748B; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; border-bottom: 1px solid #E4E8F1; }
  .acc-table td { padding: 12px 16px; border-bottom: 1px solid #F1F4FA; vertical-align: middle; }
  .acc-row-inactive { opacity: .55; }
  .acc-name-cell { font-weight: 700; white-space: nowrap; }
  .acc-avatar-wrap { display: inline-flex; vertical-align: middle; margin-right: 6px; }
  .acc-you-badge { margin-left: 8px; background: #EFFAF7; color: #0B7A70; font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 999px; }
  .acc-role-badge { font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
  .acc-detail-cell { color: #64748B; font-size: 12px; }
  .acc-status-badge { font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
  .acc-status-badge.active { background: #DCFCE7; color: #16A34A; }
  .acc-status-badge.inactive { background: #F1F5F9; color: #64748B; }
  .acc-status-badge.unverified { background: #FEF3C7; color: #B45309; }
  .acc-actions-cell { white-space: nowrap; }
  .acc-link-btn { background: none; border: none; color: #2563EB; font-weight: 600; font-size: 12.5px; cursor: pointer; padding: 4px 8px; }
  .acc-link-btn.danger { color: #DC2626; }
  .acc-link-btn:disabled { color: #94A3B8; cursor: default; }
  .acc-empty-cell { text-align: center; color: #94A3B8; padding: 30px; }

  .acc-denied { text-align: center; padding: 60px 20px; color: #64748B; }
  .acc-denied-icon { font-size: 40px; margin-bottom: 10px; }
  .acc-denied h2 { color: #16213D; font-family: 'Sora', sans-serif; }

  .acc-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .acc-modal { background: #fff; border-radius: 18px; width: 100%; max-width: 460px; padding: 26px; max-height: 90vh; overflow-y: auto; }
  .acc-modal-narrow { max-width: 380px; }
  .acc-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .acc-modal-head h3 { margin: 0; font-family: 'Sora', sans-serif; font-size: 17px; }
  .acc-close-btn { background: #F1F4FA; border: none; border-radius: 999px; width: 30px; height: 30px; font-size: 16px; cursor: pointer; }

  .acc-form { display: flex; flex-direction: column; gap: 12px; }
  .acc-form label { display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; font-weight: 700; color: #16213D; }
  .acc-form input, .acc-form select { border: 1px solid #E4E8F1; border-radius: 9px; padding: 9px 11px; font-family: inherit; font-size: 13.5px; font-weight: 400; }
  .acc-form-error { color: #DC2626; font-size: 12.5px; font-weight: 600; }
  .acc-form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }

  .acc-temp-password { font-family: monospace; font-size: 18px; font-weight: 700; background: #F1F4FA; border: 1px dashed #CBD5E1; border-radius: 10px; padding: 12px; text-align: center; letter-spacing: .05em; margin: 10px 0 16px; }
`;
