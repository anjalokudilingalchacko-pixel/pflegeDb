/* eslint-disable react-refresh/only-export-components -- intentional mixed module: small
   presentational bits (Icon, AvatarCircle, ...) live alongside the formatting/API helpers
   they share, so every consumer imports from one place instead of three. */
/**
 * feedShared.jsx — icons, formatting helpers and API calls shared across
 * PflegeFeed.jsx, FeedPostCard.jsx and FeedNetzwerk.jsx. Kept in one place
 * so all three surfaces render identical avatars/icons and talk to the
 * backend the same way.
 */

import React, { useState } from "react";

// ==================== Icons ====================
export function Icon({ name, size = 18, color = "currentColor", strokeWidth = 2, className = "" }) {
  const paths = {
    home: '<path d="M4 11 L12 4 L20 11"/><path d="M6 10 V20 H18 V10"/>',
    briefcase: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8 V6 a2 2 0 0 1 2-2 h2 a2 2 0 0 1 2 2 v2"/>',
    file: '<path d="M6 3 H14 L18 7 V21 H6 Z"/><path d="M14 3 V7 H18"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21 c0-4.4 3.6-8 8-8 s8 3.6 8 8"/>',
    users: '<circle cx="8" cy="8" r="3.5"/><path d="M2 21 c0-4 2.7-7 6-7 s6 3 6 7"/><circle cx="17" cy="9" r="3"/><path d="M14.5 21 c0-3.5 2-6 5-6"/>',
    search: '<circle cx="10" cy="10" r="7"/><line x1="21" y1="21" x2="15.5" y2="15.5"/>',
    bell: '<path d="M6 10 a6 6 0 0 1 12 0 c0 5 2 6 2 6 H4 s2-1 2-6"/><path d="M10 20 a2 2 0 0 0 4 0"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    heart: '<path d="M12 21 s-7-4.5-9.5-9 C1 8 3 4 7 4 c2 0 4 1.2 5 3 c1-1.8 3-3 5-3 c4 0 6 4 4.5 8 C19 16.5 12 21 12 21 Z"/>',
    message: '<path d="M4 4 H20 V16 H8 L4 20 Z"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><line x1="8.3" y1="10.7" x2="15.7" y2="6.3"/><line x1="8.3" y1="13.3" x2="15.7" y2="17.7"/>',
    download: '<path d="M12 3 V15 M7 10 L12 15 L17 10"/><path d="M4 19 H20"/>',
    mappin: '<path d="M12 21 s7-6.5 7-12 a7 7 0 0 0 -14 0 c0 5.5 7 12 7 12 Z"/><circle cx="12" cy="9" r="2.3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7 V12 L16 14"/>',
    trending: '<path d="M3 17 L10 10 L14 14 L21 6"/><path d="M15 6 H21 V12"/>',
    userplus: '<circle cx="9" cy="8" r="4"/><path d="M2 21 c0-4 3-7 7-7 s7 3 7 7"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>',
    check: '<path d="M4 12 L10 18 L20 6"/>',
    activity: '<path d="M2 12 H7 L9 6 L13 18 L15 12 H22"/>',
    badge: '<path d="M12 2 L14.3 3.8 L17.2 3.3 L18.1 6.1 L20.5 7.9 L19.1 10.3 L20.5 12.7 L18.1 14.5 L17.2 17.3 L14.3 16.8 L12 18.6 L9.7 16.8 L6.8 17.3 L5.9 14.5 L3.5 12.7 L4.9 10.3 L3.5 7.9 L5.9 6.1 L6.8 3.3 L9.7 3.8 Z"/><path d="M8.7 12 L11 14.3 L15.3 9.3"/>',
    bookmark: '<path d="M6 3 H18 V21 L12 17 L6 21 Z"/>',
    edit: '<path d="M4 20 L4 16 L15.5 4.5 L19.5 8.5 L8 20 Z"/><path d="M13.5 6.5 L17.5 10.5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5 V5.5 M12 18.5 V21.5 M2.5 12 H5.5 M18.5 12 H21.5 M5 5 L7.1 7.1 M16.9 16.9 L19 19 M5 19 L7.1 16.9 M16.9 7.1 L19 5"/>',
    upload: '<path d="M12 21 V9 M7 14 L12 9 L17 14"/><path d="M4 19 H20"/>',
    x: '<line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>',
    book: '<path d="M4 5 H12 V19 H4 Z"/><path d="M12 5 H20 V19 H12 Z"/><line x1="12" y1="5" x2="12" y2="19"/>',
    filter: '<line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="7" cy="18" r="2"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 15.5 L16 10.5 L5.5 20.5"/>',
    chevronleft: '<path d="M15 5 L8 12 L15 19"/>',
    chevronright: '<path d="M9 5 L16 12 L9 19"/>',
    send: '<path d="M4 12 L20 4 L13 20 L11 13 L4 12 Z"/>',
    dots: '<circle cx="12" cy="5.2" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="18.8" r="1.7"/>',
    trash: '<path d="M5 7 H19 M9 7 V4.5 H15 V7 M7.5 7 L8.3 20 H15.7 L16.5 7"/><line x1="10.3" y1="10.5" x2="10.6" y2="17"/><line x1="13.7" y1="10.5" x2="13.4" y2="17"/>',
    flame: '<path d="M12 2 c1 3-3 4-3 8 a3 3 0 0 0 6 0 c0-1.5-1-2-1-2 c1.5 1 3 3 3 5.5 A5 5 0 0 1 7 13.5 C7 8 12 6 12 2 Z"/>',
    logout: '<path d="M9 21 H5 a2 2 0 0 1 -2-2 V5 a2 2 0 0 1 2-2 h4"/><path d="M16 17 L21 12 L16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    arrowleft: '<line x1="19" y1="12" x2="5" y2="12"/><path d="M12 19 L5 12 L12 5"/>',
    camera: '<path d="M4 8 H7 L9 5 H15 L17 8 H20 a1 1 0 0 1 1 1 V18 a1 1 0 0 1 -1 1 H4 a1 1 0 0 1 -1-1 V9 a1 1 0 0 1 1-1 Z"/><circle cx="12" cy="13" r="3.5"/>',
    // Avatar icon set — keep in sync with server.cjs's ALLOWED_AVATAR_ICONS allowlist.
    stethoscope: '<path d="M6 3 V10 a4 4 0 0 0 8 0 V3"/><path d="M6 3 H4 M14 3 H16"/><path d="M14 10 v3 a5 5 0 0 0 10 0 v-1"/><circle cx="19" cy="9" r="2"/><circle cx="9" cy="20" r="2.3"/>',
    'heart-pulse': '<path d="M12 20 s-7-4.3-9.3-8.7 C1.4 8 3.2 4.3 7 4.3 c2 0 3.7 1.1 5 2.9 c1.3-1.8 3-2.9 5-2.9 c3.8 0 5.6 3.7 4.3 7 C19.7 15.7 12 20 12 20 Z"/><path d="M4 12 H8 L10 8 L13 15 L15 11 H20"/>',
    syringe: '<path d="M21 3 L18 6 M19 5 L14.5 9.5 M4 20 L9.5 14.5"/><path d="M16 4 L20 8"/><path d="M8 12 L12 16 L9.5 18.5 a2 2 0 0 1 -2.8 0 L5.5 17.3 a2 2 0 0 1 0-2.8 Z"/><path d="M11 9 L15 13"/>',
    clipboard: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4 V3 a1 1 0 0 1 1-1 h4 a1 1 0 0 1 1 1 v1"/><path d="M8.5 12 L11 14.5 L15.5 9.5"/>',
    'graduation-cap': '<path d="M2 8 L12 3 L22 8 L12 13 Z"/><path d="M6 10.5 V16 c0 1.7 2.7 3 6 3 s6-1.3 6-3 v-5.5"/><path d="M22 8 V15"/>',
    microscope: '<path d="M9 21 H17"/><path d="M11 21 V17"/><path d="M8 17 H16 a4 4 0 0 0 0-8 h-1"/><path d="M11 9 V5 a2 2 0 0 1 2-2 h1"/><circle cx="10" cy="9" r="3"/><line x1="6.5" y1="11.5" x2="8.5" y2="9.5"/>',
    'first-aid': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7 V5 a2 2 0 0 1 2-2 h4 a2 2 0 0 1 2 2 v2"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>',
    pill: '<rect x="3.5" y="9.5" width="17" height="8" rx="4" transform="rotate(-45 12 13.5)"/><line x1="10.5" y1="7.5" x2="16.5" y2="13.5"/>',
    baby: '<circle cx="12" cy="8" r="4"/><path d="M9 8 q1.5 1.2 3 0 M9.3 6.6 v.6 M14.7 6.6 v.6"/><path d="M5 21 c0-4.5 3-8 7-8 s7 3.5 7 8"/>',
    wheelchair: '<circle cx="9" cy="16.5" r="4.5"/><circle cx="12" cy="5" r="1.6"/><path d="M12 8 V13 H18 M12 13 L9 8 M14 13 L17 19 H20"/>',
    brain: '<path d="M9 4 a3 3 0 0 0 -3 3 a3 3 0 0 0 -1 5.8 A3.2 3.2 0 0 0 8 18 a3 3 0 0 0 1 -.2 V6 a2 2 0 0 0 -2 -2 Z"/><path d="M15 4 a3 3 0 0 1 3 3 a3 3 0 0 1 1 5.8 A3.2 3.2 0 0 1 16 18 a3 3 0 0 1 -1 -.2 V6 a2 2 0 0 1 2 -2 Z"/>',
    shield: '<path d="M12 3 L19 6 V11 c0 5-3 8-7 10 C8 19 5 16 5 11 V6 Z"/><path d="M9 11.5 L11 13.5 L15.5 9"/>'
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: paths[name] || '' }}
    />
  );
}

export function PulseSvg() {
  return (
    <svg width="120" height="18" viewBox="0 0 120 20" fill="none">
      <path
        className="pulse-path"
        d="M0 10 H30 L36 2 L44 18 L50 10 H62 L68 4 L74 16 L80 10 H120"
        stroke="var(--teal)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ==================== Helpers ====================
const AVATAR_PALETTE = ["#0D9488", "#16305C", "#3B82F6", "#B45309", "#0F766E", "#7C3AED", "#DB2777", "#059669"];

export function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  if (d < 7) return `vor ${d} Tag${d > 1 ? "en" : ""}`;
  const w = Math.floor(d / 7);
  if (w < 5) return `vor ${w} Woche${w > 1 ? "n" : ""}`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function extractHashtags(text) {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];
  return [...new Set(matches)].slice(0, 6);
}

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==================== API ====================
const FEED_API = "/api/feed";
const SOCIAL_API = "/api/social";

export function authHeaders() {
  const token = localStorage.getItem("pflegedb_jwt_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function asJson(res, fallbackError) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || fallbackError);
  return data;
}

export async function apiGetPosts(groupId) {
  const qs = groupId ? `?groupId=${encodeURIComponent(groupId)}` : "";
  const res = await fetch(`${FEED_API}/posts${qs}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("Beiträge konnten nicht geladen werden.");
  return res.json();
}

export async function apiCreatePost(payload) {
  const res = await fetch(`${FEED_API}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload)
  });
  return asJson(res, "Beitrag konnte nicht erstellt werden.");
}

export async function apiToggleLike(id) {
  const res = await fetch(`${FEED_API}/posts/${id}/like`, { method: "POST", headers: { ...authHeaders() } });
  return asJson(res, "Aktion fehlgeschlagen.");
}

export async function apiAddComment(id, text) {
  const res = await fetch(`${FEED_API}/posts/${id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ text })
  });
  return asJson(res, "Kommentar konnte nicht gespeichert werden.");
}

export async function apiDeletePost(id) {
  const res = await fetch(`${FEED_API}/posts/${id}`, { method: "DELETE", headers: { ...authHeaders() } });
  return asJson(res, "Löschen fehlgeschlagen.");
}

export async function apiSetAvatar(payload) {
  const res = await fetch("/api/profile/avatar", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload)
  });
  return asJson(res, "Avatar konnte nicht gespeichert werden.");
}

export async function apiGetStreak() {
  const res = await fetch(`${SOCIAL_API}/streak`, { headers: { ...authHeaders() } });
  return asJson(res, "Streak konnte nicht geladen werden.");
}

export async function apiSearchUsers(q) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  const res = await fetch(`${SOCIAL_API}/users${qs}`, { headers: { ...authHeaders() } });
  return asJson(res, "Nutzer konnten nicht geladen werden.");
}

export async function apiGetFriends() {
  const res = await fetch(`${SOCIAL_API}/friends`, { headers: { ...authHeaders() } });
  return asJson(res, "Freunde konnten nicht geladen werden.");
}

export async function apiUnfriend(userId) {
  const res = await fetch(`${SOCIAL_API}/friends/${userId}`, { method: "DELETE", headers: { ...authHeaders() } });
  return asJson(res, "Aktion fehlgeschlagen.");
}

export async function apiGetRequests() {
  const res = await fetch(`${SOCIAL_API}/requests`, { headers: { ...authHeaders() } });
  return asJson(res, "Anfragen konnten nicht geladen werden.");
}

export async function apiSendRequest(toUserId) {
  const res = await fetch(`${SOCIAL_API}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ toUserId })
  });
  return asJson(res, "Anfrage konnte nicht gesendet werden.");
}

export async function apiAcceptRequest(id) {
  const res = await fetch(`${SOCIAL_API}/requests/${id}/accept`, { method: "POST", headers: { ...authHeaders() } });
  return asJson(res, "Aktion fehlgeschlagen.");
}

export async function apiDeclineRequest(id) {
  const res = await fetch(`${SOCIAL_API}/requests/${id}/decline`, { method: "POST", headers: { ...authHeaders() } });
  return asJson(res, "Aktion fehlgeschlagen.");
}

export async function apiCancelRequest(id) {
  const res = await fetch(`${SOCIAL_API}/requests/${id}`, { method: "DELETE", headers: { ...authHeaders() } });
  return asJson(res, "Aktion fehlgeschlagen.");
}

export async function apiGetGroups() {
  const res = await fetch(`${SOCIAL_API}/groups`, { headers: { ...authHeaders() } });
  return asJson(res, "Gruppen konnten nicht geladen werden.");
}

export async function apiGetGroup(id) {
  const res = await fetch(`${SOCIAL_API}/groups/${id}`, { headers: { ...authHeaders() } });
  return asJson(res, "Gruppe konnte nicht geladen werden.");
}

export async function apiCreateGroup(payload) {
  const res = await fetch(`${SOCIAL_API}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload)
  });
  return asJson(res, "Gruppe konnte nicht erstellt werden.");
}

export async function apiJoinGroup(id) {
  const res = await fetch(`${SOCIAL_API}/groups/${id}/join`, { method: "POST", headers: { ...authHeaders() } });
  return asJson(res, "Beitritt fehlgeschlagen.");
}

export async function apiLeaveGroup(id) {
  const res = await fetch(`${SOCIAL_API}/groups/${id}/leave`, { method: "POST", headers: { ...authHeaders() } });
  return asJson(res, "Aktion fehlgeschlagen.");
}

export async function apiDeleteGroup(id) {
  const res = await fetch(`${SOCIAL_API}/groups/${id}`, { method: "DELETE", headers: { ...authHeaders() } });
  return asJson(res, "Löschen fehlgeschlagen.");
}

// ==================== Small building blocks ====================
// Curated avatar icon gallery — id must match server.cjs's ALLOWED_AVATAR_ICONS allowlist.
// `tags` drive the interest-filter chips in AvatarPicker.jsx.
export const AVATAR_ICONS = [
  { id: 'stethoscope', label: 'Stethoskop', tags: ['Innere Medizin', 'Allgemein'] },
  { id: 'heart-pulse', label: 'Herzschlag', tags: ['Kardiologie', 'Intensivpflege'] },
  { id: 'syringe', label: 'Spritze', tags: ['Intensivpflege', 'Chirurgie'] },
  { id: 'clipboard', label: 'Klemmbrett', tags: ['Dokumentation', 'Allgemein'] },
  { id: 'graduation-cap', label: 'Doktorhut', tags: ['Ausbildung', 'Allgemein'] },
  { id: 'microscope', label: 'Mikroskop', tags: ['Labor', 'Diagnostik'] },
  { id: 'first-aid', label: 'Erste Hilfe', tags: ['Notfallpflege', 'Allgemein'] },
  { id: 'pill', label: 'Tablette', tags: ['Pharmakologie', 'Allgemein'] },
  { id: 'baby', label: 'Baby', tags: ['Pädiatrie'] },
  { id: 'wheelchair', label: 'Rollstuhl', tags: ['Geriatrie', 'Reha'] },
  { id: 'brain', label: 'Gehirn', tags: ['Neurologie', 'Psychiatrie'] },
  { id: 'shield', label: 'Schutzschild', tags: ['Hygiene', 'Notfallpflege'] }
];

// Base visuals are inlined (not left to an external `.avatar` CSS class) so this component
// renders correctly anywhere it's imported, not only inside PflegeFeed's own stylesheet.
const AVATAR_BASE_STYLE = {
  borderRadius: '999px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: '#fff',
  fontWeight: 700,
  fontFamily: "'Sora', sans-serif"
};

export function AvatarCircle({ name, size = 44, fontSize, style, avatarType, avatarIcon, avatarUrl }) {
  if (avatarType === 'photo' && avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="avatar"
        style={{ ...AVATAR_BASE_STYLE, width: size, height: size, objectFit: 'cover', ...style }}
      />
    );
  }
  if (avatarType === 'icon' && avatarIcon) {
    return (
      <div
        className="avatar"
        style={{ ...AVATAR_BASE_STYLE, width: size, height: size, background: avatarColor(name), ...style }}
      >
        <Icon name={avatarIcon} size={Math.round(size * 0.55)} color="#fff" strokeWidth={2} />
      </div>
    );
  }
  return (
    <div
      className="avatar"
      style={{ ...AVATAR_BASE_STYLE, width: size, height: size, fontSize: fontSize || Math.round(size * 0.36), background: avatarColor(name), ...style }}
    >
      {getInitials(name)}
    </div>
  );
}

export function StreakBadge({ count, size = "sm" }) {
  if (!count || count < 2) return null;
  return (
    <span className={`streak-badge streak-badge-${size}`} title={`${count} Tage in Folge aktiv`}>
      <Icon name="flame" size={size === "sm" ? 12 : 14} color="#EA580C" strokeWidth={2.2} />
      {count}
    </span>
  );
}

export function EmptyState({ icon = "activity", title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon name={icon} size={22} color="var(--teal-deep)" />
      </div>
      <div className="empty-state-title">{title}</div>
      {sub && <div className="empty-state-sub">{sub}</div>}
    </div>
  );
}

export function PostImageGrid({ images, onOpen }) {
  const n = images.length;
  if (n === 0) return null;
  if (n === 1) {
    return (
      <div className="ig-media ig-single">
        <img src={images[0]} alt="" onClick={() => onOpen(0)} />
      </div>
    );
  }
  if (n === 2 || n === 3) {
    return (
      <div className={`ig-media ${n === 2 ? "ig-grid-2" : "ig-grid-3"}`}>
        {images.map((src, i) => (
          <div className="ig-tile" key={i} onClick={() => onOpen(i)}>
            <img src={src} alt="" />
          </div>
        ))}
      </div>
    );
  }
  const shown = images.slice(0, 4);
  return (
    <div className="ig-media ig-grid-4">
      {shown.map((src, i) => (
        <div className="ig-tile" key={i} onClick={() => onOpen(i)}>
          <img src={src} alt="" />
          {i === 3 && n > 4 && <div className="ig-more-overlay">+{n - 4}</div>}
        </div>
      ))}
    </div>
  );
}

// ==================== User profile / login menu ====================
// Shared across every top-level page (PflegeFeed, TAM Survey, Klassenzimmer,
// Pflegeplanung, E-Learning, Körper, ...) so the logged-in avatar/login entry
// point looks and behaves identically everywhere.
export const ROLE_MENU_ICON = { teacher: '👨‍🏫', praxisanleiter: '🩺', admin: '⚙️', student: '🎓' };
export const ROLE_MENU_GRADIENT = {
  teacher: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
  praxisanleiter: 'linear-gradient(135deg, #0d9488 0%, #0b7a70 100%)',
  admin: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)',
  student: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
};

export function UserProfileMenu({ userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker, variant = 'dark' }) {
  const [isOpen, setIsOpen] = useState(false);
  const roleIcon = ROLE_MENU_ICON[userRole] || ROLE_MENU_ICON.student;
  const roleGradient = ROLE_MENU_GRADIENT[userRole] || ROLE_MENU_GRADIENT.student;
  // 'dark': translucent-white login button, for dark/colored headers.
  // 'light': solid gray login button, for white/light headers (would be invisible with the dark styling).
  const loggedOutBg = variant === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.25)';
  const loggedOutBorder = variant === 'light' ? '2px solid #cbd5e1' : '2px solid rgba(255,255,255,0.5)';
  const loggedOutColor = variant === 'light' ? '#475569' : '#ffffff';

  const handleLogout = () => {
    localStorage.removeItem('pflegedb_jwt_token');
    if (setCurrentUser) setCurrentUser(null);
    setIsOpen(false);
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={handleProfileClick}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: currentUser ? roleGradient : loggedOutBg,
          color: currentUser ? '#ffffff' : loggedOutColor,
          border: currentUser ? '2px solid rgba(255,255,255,0.5)' : loggedOutBorder,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          padding: 0
        }}
        title={currentUser ? `${currentUser.name} (${currentUser.title})` : "Login / Register"}
      >
        {currentUser
          ? (currentUser.avatarType && currentUser.avatarType !== 'emoji'
              ? <AvatarCircle name={currentUser.name} size={34} avatarType={currentUser.avatarType} avatarIcon={currentUser.avatarIcon} avatarUrl={currentUser.avatarUrl} style={{ border: 'none' }} />
              : roleIcon)
          : '👤'}
      </button>

      {isOpen && currentUser && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            width: '240px',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
            border: '1px solid #cbd5e1',
            padding: '16px',
            zIndex: 9999,
            color: '#0f172a',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => { setIsOpen(false); if (onOpenAvatarPicker) onOpenAvatarPicker(); }}
              title="Profilbild ändern"
              style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0, padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: '50%' }}
            >
              {currentUser.avatarType && currentUser.avatarType !== 'emoji' ? (
                <AvatarCircle name={currentUser.name} size={40} avatarType={currentUser.avatarType} avatarIcon={currentUser.avatarIcon} avatarUrl={currentUser.avatarUrl} />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                  {roleIcon}
                </div>
              )}
              <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '18px', height: '18px', borderRadius: '50%', background: '#0284c7', border: '2px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="camera" size={9} color="#ffffff" />
              </span>
            </button>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {currentUser.title}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: '8px',
              padding: '8px 12px',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            🔒 Abmelden (Logout)
          </button>
        </div>
      )}
    </div>
  );
}
