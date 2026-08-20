/* eslint-disable react-refresh/only-export-components -- intentional mixed module: small
   presentational bits live alongside the API helpers they share, same pattern as feedShared.jsx. */
/**
 * elearningShared.jsx — API helpers + small reusable pieces shared across
 * ELearningCertificates.jsx, LessonViewer.jsx and CourseEditor.jsx.
 */

import React from "react";

export const CATEGORIES = [
  'Notfallmedizin', 'Palliative Care', 'Wundmanagement', 'Hygiene & Infektion',
  'Management & Führung', 'Spezialisierte Pflege', 'Digitale Pflege', 'Intensivmedizin', 'Allgemein'
];

function authHeaders() {
  const token = localStorage.getItem("pflegedb_jwt_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function asJson(res, fallback) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || fallback);
  return data;
}

const API = "/api/elearning";

export async function apiGetCourses({ q, category } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category && category !== 'Alle') params.set('category', category);
  const qs = params.toString();
  const res = await fetch(`${API}/courses${qs ? `?${qs}` : ''}`, { headers: { ...authHeaders() } });
  return asJson(res, "Kurse konnten nicht geladen werden.");
}

export async function apiGetCourse(id) {
  const res = await fetch(`${API}/courses/${id}`, { headers: { ...authHeaders() } });
  return asJson(res, "Kurs konnte nicht geladen werden.");
}

export async function apiCreateCourse(payload) {
  const res = await fetch(`${API}/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload)
  });
  return asJson(res, "Kurs konnte nicht erstellt werden.");
}

export async function apiUpdateCourse(id, payload) {
  const res = await fetch(`${API}/courses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload)
  });
  return asJson(res, "Kurs konnte nicht aktualisiert werden.");
}

export async function apiDeleteCourse(id) {
  const res = await fetch(`${API}/courses/${id}`, { method: "DELETE", headers: { ...authHeaders() } });
  return asJson(res, "Kurs konnte nicht gelöscht werden.");
}

export async function apiEnroll(id) {
  const res = await fetch(`${API}/courses/${id}/enroll`, { method: "POST", headers: { ...authHeaders() } });
  return asJson(res, "Einschreibung fehlgeschlagen.");
}

export async function apiCompleteLesson(courseId, lessonId) {
  const res = await fetch(`${API}/courses/${courseId}/lessons/${lessonId}/complete`, { method: "POST", headers: { ...authHeaders() } });
  return asJson(res, "Lektion konnte nicht abgeschlossen werden.");
}

export async function apiSubmitQuiz(courseId, lessonId, answers) {
  const res = await fetch(`${API}/courses/${courseId}/lessons/${lessonId}/quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ answers })
  });
  return asJson(res, "Quiz konnte nicht ausgewertet werden.");
}

export async function apiMyEnrollments() {
  const res = await fetch(`${API}/my/enrollments`, { headers: { ...authHeaders() } });
  return asJson(res, "Fortschritt konnte nicht geladen werden.");
}

export async function apiMyCertificates() {
  const res = await fetch(`${API}/my/certificates`, { headers: { ...authHeaders() } });
  return asJson(res, "Zertifikate konnten nicht geladen werden.");
}

export async function apiUploadCertificate(payload) {
  const res = await fetch(`${API}/certificates/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload)
  });
  return asJson(res, "Urkunde konnte nicht hochgeladen werden.");
}

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==================== Small building blocks ====================
export function ProgressBar({ percent = 0, color = '#0052cc', height = 6 }) {
  return (
    <div style={{ width: '100%', height, background: '#e2e8f0', borderRadius: height / 2, overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, percent))}%`, height: '100%', background: color, transition: 'width .3s ease' }} />
    </div>
  );
}

export const CERT_STATUS_STYLE = {
  active: { bg: '#d1fae5', text: '#065f46', label: 'Gültig' },
  expiring: { bg: '#fef3c7', text: '#92400e', label: 'Läuft ab' },
  expired: { bg: '#fee2e2', text: '#991b1b', label: 'Abgelaufen' }
};

export function CertStatusBadge({ status }) {
  const s = CERT_STATUS_STYLE[status] || CERT_STATUS_STYLE.active;
  return (
    <span style={{ background: s.bg, color: s.text, padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 800 }}>
      {s.label}
    </span>
  );
}

export function formatDateDe(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}
