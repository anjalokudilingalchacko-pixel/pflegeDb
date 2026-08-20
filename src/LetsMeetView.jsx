/**
 * LetsMeetView.jsx — LetsMeet: real-time video calls for classes and appointments.
 *
 * Same job as Zoom/Google Meet, scoped to what this app actually needs:
 *   - start an instant call, or schedule one ahead of time (with a real invite list or a
 *     classroom tag)
 *   - join by room code, with a camera/mic check screen first
 *   - a live video grid backed by LiveKit (a self-hosted WebRTC SFU — every participant sends
 *     one stream to the server, which forwards it to everyone else)
 *   - mic/camera toggle, screen share, in-call chat, a participant list, host can remove someone
 *   - the host can end the call for everyone
 *
 * No fake participants, no canned transcripts — every name on screen is a real logged-in user,
 * and a meeting only exists once someone actually creates it. This app never talks WebRTC
 * directly: it fetches a room-scoped LiveKit access token from server.cjs
 * (GET /api/meetings/:id/livekit-token, only handed out once access + live status are confirmed)
 * and hands it to LiveKit's own client — the in-call screen is LiveKit's official `VideoConference`
 * prefab component (grid/focus layout, control bar, chat, screen share, settings), not a custom
 * reimplementation, so it looks and behaves like LiveKit because it *is* LiveKit's UI.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfileMenu, AvatarCircle, authHeaders, apiSearchUsers } from './feedShared';
import { LogoLetsMeet } from './icons';
import { LiveKitRoom, VideoConference, useRoomContext } from '@livekit/components-react';
import { DisconnectReason } from 'livekit-client';
import '@livekit/components-styles';

const MEET_CSS = `
:root {
  --bg: #FFFFFF;
  --surface: #F8F9FA;
  --card: #FFFFFF;
  --ink: #1F1F1F;
  --muted: #5F6368;
  --border: #DADCE0;
  --like: #D93025;
  --meet: #3B82F6;
  --meet-deep: #1D4ED8;
  --meet-soft: #eff6ff;
  --meet-border: #93c5fd;
  --join: #16A34A;
  --join-deep: #0F8A3C;
  --join-soft: #E6F4EA;
  --join-border: #A8DAB5;
}
.mt-scroll { flex: 1; overflow-y: auto; background: var(--bg); }
.mt-btn-primary { background: var(--join); color: #fff; border: none; border-radius: 999px; padding: 10px 20px; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: background 0.15s ease, box-shadow 0.15s ease; display: inline-flex; align-items: center; gap: 8px; font-family: 'Inter', sans-serif; }
.mt-btn-primary:hover { background: var(--join-deep); box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.mt-btn-primary:disabled { background: #E8EAED; color: #9AA0A6; cursor: not-allowed; }
.mt-btn-outline { background: var(--card); color: var(--ink); border: 1px solid var(--border); border-radius: 999px; padding: 10px 20px; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; font-family: 'Inter', sans-serif; }
.mt-btn-outline:hover { background: var(--surface); border-color: #C4C7C5; }
.mt-card { background: var(--card); border-radius: 12px; padding: 20px; border: 1px solid var(--border); transition: box-shadow 0.15s ease; }
.mt-card:hover { box-shadow: 0 1px 2px rgba(60,64,67,0.08), 0 1px 6px rgba(60,64,67,0.08); }
.mt-chip { display: inline-flex; align-items: center; gap: 6px; background: var(--meet-soft); color: var(--meet-deep); border: 1px solid var(--meet-border); border-radius: 999px; padding: 4px 10px 4px 4px; font-size: 0.78rem; font-weight: 600; }
.mt-live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--join); display: inline-block; animation: mtPulse 1.4s ease-in-out infinite; }
@keyframes mtPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.mt-icon-pill { width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 1.05rem; transition: all 0.15s ease; }
.mt-topbar-btn { display: inline-flex; align-items: center; gap: 6px; background: var(--surface); border: 1px solid var(--border); color: var(--ink); border-radius: 999px; padding: 7px 14px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; font-family: 'Inter', sans-serif; }
.mt-topbar-btn:hover { background: #F1F3F4; }
.mt-topbar-btn.active { background: var(--meet-soft); border-color: var(--meet-border); color: var(--meet-deep); }
.mt-search-input { width: 100%; padding: 9px 14px 9px 36px; border-radius: 8px; border: 1px solid var(--border); font-size: 0.85rem; outline: none; background: var(--surface); box-sizing: border-box; font-family: 'Inter', sans-serif; color: var(--ink); }
.mt-search-input:focus { border-color: var(--meet); background: #fff; }
.mt-code-input { border: none; outline: none; background: transparent; font-size: 0.88rem; font-family: 'Inter', sans-serif; color: var(--ink); flex: 1; min-width: 0; }
.mt-code-input::placeholder { color: #80868B; }
@media (max-width: 760px) {
  .mt-list-row { flex-direction: column; align-items: flex-start !important; gap: 10px !important; }
  .mt-topbar-codebar { display: none !important; }
}
`;

// Restyles LiveKit's own VideoConference via its official theming surface (CSS custom
// properties under [data-lk-theme]) — the component itself is untouched, only the design
// tokens change: a deeper graphite background, this app's blue as the accent, softer
// rounded corners and elevation, and the app's own type family instead of the system default.
const LIVEKIT_THEME_CSS = `
[data-lk-theme='default'] {
  --lk-bg: #0b0f19;
  --lk-bg2: #121826;
  --lk-bg3: #1a2233;
  --lk-bg4: #232c40;
  --lk-bg5: #2d374d;
  --lk-fg: #f8fafc;
  --lk-fg2: #e2e8f0;
  --lk-fg3: #cbd5e1;
  --lk-fg4: #94a3b8;
  --lk-fg5: #64748b;
  --lk-border-color: rgba(148, 163, 184, 0.16);
  --lk-accent-fg: #ffffff;
  --lk-accent-bg: #3b82f6;
  --lk-accent2: #2563eb;
  --lk-accent3: #1d4ed8;
  --lk-accent4: #1e40af;
  --lk-danger-fg: #ffffff;
  --lk-danger: #ef4444;
  --lk-danger2: #dc2626;
  --lk-danger3: #b91c1c;
  --lk-danger4: #991b1b;
  --lk-control-fg: var(--lk-fg2);
  --lk-control-bg: rgba(255, 255, 255, 0.06);
  --lk-control-hover-bg: rgba(255, 255, 255, 0.1);
  --lk-control-active-bg: var(--lk-accent-bg);
  --lk-control-active-hover-bg: var(--lk-accent2);
  --lk-connection-excellent: #22c55e;
  --lk-connection-good: #f59e0b;
  --lk-connection-poor: #ef4444;
  --lk-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --lk-border-radius: 0.875rem;
  --lk-box-shadow: 0 8px 28px -8px rgba(0, 0, 0, 0.45);
  --lk-drop-shadow: rgba(59, 130, 246, 0.25) 0px 0px 24px;
  --lk-grid-gap: 0.75rem;
  --lk-control-bar-height: 76px;
}
[data-lk-theme='default'] .lk-participant-tile {
  border-radius: var(--lk-border-radius);
  overflow: hidden;
}
[data-lk-theme='default'] .lk-control-bar {
  border-top: 1px solid var(--lk-border-color);
  backdrop-filter: blur(12px);
}
[data-lk-theme='default'] .lk-button {
  border-radius: 0.65rem;
  font-family: var(--lk-font-family);
  font-weight: 600;
}
`;

// Abstract hero graphic for the empty-dashboard state — soft overlapping blobs behind a
// video-call glyph, in the app's own palette rather than borrowed artwork.
function MeetHeroIllustration() {
  return (
    <svg viewBox="0 0 200 160" width="220" height="176" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="128" rx="70" ry="14" fill="#F1F3F4" />
      <circle cx="60" cy="70" r="46" fill="#E8F0FE" />
      <circle cx="138" cy="60" r="30" fill="#E6F4EA" />
      <rect x="46" y="46" width="108" height="76" rx="18" fill="#FFFFFF" stroke="#DADCE0" strokeWidth="1.5" />
      <rect x="60" y="62" width="52" height="38" rx="8" fill="#3B82F6" />
      <circle cx="86" cy="81" r="10" fill="#FFFFFF" fillOpacity="0.9" />
      <path d="M120 74L138 64V98L120 88V74Z" fill="#1D4ED8" />
      <circle cx="132" cy="98" r="14" fill="#16A34A" />
      <path d="M126 98l4 4 8-8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function formatDateTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}

// =====================================================================
// Local camera/mic — one real MediaStream, requested once per call session.
// =====================================================================
function useLocalMedia() {
  const [stream, setStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let acquired = null;
    navigator.mediaDevices?.getUserMedia({ audio: true, video: true })
      .then(mediaStream => {
        if (cancelled) { mediaStream.getTracks().forEach(t => t.stop()); return; }
        acquired = mediaStream;
        setStream(mediaStream);
      })
      .catch(err => {
        if (cancelled) return;
        setError(
          err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? "Camera/microphone access was denied. You can still join and listen/watch — allow access in your browser to send your own audio/video."
            : 'Could not start the camera/microphone. You can still join without your own audio/video.'
        );
      })
      .finally(() => { if (!cancelled) setReady(true); });

    return () => {
      cancelled = true;
      acquired?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggleMic = () => {
    if (!stream) return;
    const next = !micOn;
    stream.getAudioTracks().forEach(t => { t.enabled = next; });
    setMicOn(next);
  };
  const toggleCam = () => {
    if (!stream) return;
    const next = !camOn;
    stream.getVideoTracks().forEach(t => { t.enabled = next; });
    setCamOn(next);
  };

  return { stream, micOn, camOn, toggleMic, toggleCam, error, ready };
}

// =====================================================================
// Pre-join: camera/mic check before entering the call.
// =====================================================================
function PreJoinScreen({ meeting, currentUser, onJoin, onCancel }) {
  const { stream, micOn, camOn, toggleMic, toggleCam, error, ready } = useLocalMedia();
  const localRef = useRef(null);
  useEffect(() => {
    if (localRef.current) localRef.current.srcObject = stream || null;
  }, [stream]);

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, #16233b 0%, #0b1220 62%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: 'min(460px, 100%)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '18px' }}>
          <div style={{ width: '26px', height: '26px' }}><LogoLetsMeet /></div>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Inter', sans-serif" }}>LetsMeet</span>
        </div>

        <div style={{ position: 'relative', background: '#1e293b', borderRadius: '20px', overflow: 'hidden', aspectRatio: '16 / 10', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px', boxShadow: '0 24px 48px -20px rgba(0,0,0,0.6)' }}>
          {stream && camOn ? (
            <video ref={localRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          ) : (
            <AvatarCircle name={currentUser.name} size={80} fontSize={28} avatarType={currentUser.avatarType} avatarIcon={currentUser.avatarIcon} avatarUrl={currentUser.avatarUrl} />
          )}
          <div style={{ position: 'absolute', bottom: '16px', display: 'flex', gap: '12px' }}>
            <button onClick={toggleMic} disabled={!stream} title={micOn ? 'Turn off microphone' : 'Turn on microphone'} className="mt-icon-pill"
              style={{ width: '48px', height: '48px', cursor: stream ? 'pointer' : 'default', background: micOn ? 'rgba(255,255,255,0.14)' : 'var(--like)', color: '#fff', fontSize: '1.15rem' }}>
              {micOn ? '🎤' : '🔇'}
            </button>
            <button onClick={toggleCam} disabled={!stream} title={camOn ? 'Turn off camera' : 'Turn on camera'} className="mt-icon-pill"
              style={{ width: '48px', height: '48px', cursor: stream ? 'pointer' : 'default', background: camOn ? 'rgba(255,255,255,0.14)' : 'var(--like)', color: '#fff', fontSize: '1.15rem' }}>
              {camOn ? '📹' : '🚫'}
            </button>
          </div>
        </div>

        <h2 style={{ color: '#fff', margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.01em', fontFamily: "'Inter', sans-serif" }}>{meeting.title}</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 20px 0' }}>
          {meeting.hostName && meeting.hostId !== currentUser.id ? `Host: ${meeting.hostName} • ` : ''}Ready to join, {currentUser.name.split(' ')[0]}?
        </p>

        {error && (
          <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)', color: '#fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem', marginBottom: '18px', textAlign: 'left' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button className="mt-btn-outline" style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', border: '1.5px solid rgba(255,255,255,0.15)' }} onClick={onCancel}>Cancel</button>
          <button className="mt-btn-primary" style={{ padding: '10px 26px' }} disabled={!ready} onClick={() => onJoin({ stream, micOn, camOn })}>
            {ready ? 'Join now' : 'Setting up camera…'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Live call room — fetches a room-scoped LiveKit token, then hands the actual call
// (media, presence, chat) off to LiveKit's client SDK via <LiveKitRoom>.
// =====================================================================
function MeetingRoomLive({ meeting, currentUser, media, onExit }) {
  const [lkToken, setLkToken] = useState(null);
  const [lkUrl, setLkUrl] = useState(null);
  const [tokenError, setTokenError] = useState('');
  const [farewell, setFarewell] = useState(null); // null | 'ended' | 'removed'
  const isHost = meeting.hostId === currentUser.id;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/meetings/${meeting.id}/livekit-token`, { headers: { ...authHeaders() } })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data;
      })
      .then(data => { if (!cancelled) { setLkToken(data.token); setLkUrl(data.url); } })
      .catch(err => { if (!cancelled) setTokenError(err.message || 'Could not connect to the meeting.'); });
    return () => { cancelled = true; };
  }, [meeting.id]);

  // The pre-join screen's preview camera is only for that screen's check — LiveKit acquires
  // and owns its own tracks once connected, so the preview stream is released here.
  useEffect(() => () => media.stream?.getTracks().forEach(t => t.stop()), [media.stream]);

  const handleDisconnected = useCallback((reason) => {
    if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
      setFarewell('removed');
      setTimeout(onExit, 1800);
    } else if (reason === DisconnectReason.ROOM_DELETED || reason === DisconnectReason.ROOM_CLOSED) {
      setFarewell('ended');
      setTimeout(onExit, 1800);
    } else {
      onExit();
    }
  }, [onExit]);

  if (farewell) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>👋</div>
          <p style={{ color: '#cbd5e1' }}>{farewell === 'removed' ? 'You were removed by the host.' : 'This meeting has ended.'}</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff', maxWidth: '360px', padding: '24px' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>⚠️</div>
          <p style={{ color: '#fecaca' }}>{tokenError}</p>
          <button className="mt-btn-outline" style={{ marginTop: '18px', background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', border: '1.5px solid rgba(255,255,255,0.15)' }} onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  if (!lkToken) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', animation: 'mtPulse 1.2s ease-in-out infinite' }}>🎥</div>
      </div>
    );
  }

  return (
    <>
      <style>{LIVEKIT_THEME_CSS}</style>
      <LiveKitRoom
        serverUrl={lkUrl} token={lkToken} connect audio={media.micOn} video={media.camOn}
        onDisconnected={handleDisconnected} data-lk-theme="default" style={{ height: '100vh' }}
      >
        <VideoConference />
        {isHost && <HostEndCallButton meetingId={meeting.id} />}
      </LiveKitRoom>
    </>
  );
}

// Host-only escape hatch layered on top of LiveKit's own UI: ending the meeting is our app's
// business logic (marks the meeting record ended, deletes the LiveKit room server-side so
// everyone disconnects), not something the generic VideoConference component could know about.
function HostEndCallButton({ meetingId }) {
  useRoomContext(); // asserts we're inside <LiveKitRoom>
  const [ending, setEnding] = useState(false);

  const handleEndForEveryone = async () => {
    if (!window.confirm('End this meeting for everyone?')) return;
    setEnding(true);
    try {
      await fetch(`/api/meetings/${meetingId}/end`, { method: 'POST', headers: { ...authHeaders() } });
    } catch { /* server-side room deletion still disconnects everyone */ }
  };

  return (
    <button
      onClick={handleEndForEveryone}
      disabled={ending}
      title="End for everyone"
      style={{ position: 'fixed', top: '14px', right: '14px', zIndex: 50, padding: '8px 16px', borderRadius: '999px', border: '1.5px solid rgba(248,113,113,0.6)', cursor: ending ? 'default' : 'pointer', background: 'rgba(15,23,42,0.85)', color: '#f87171', fontWeight: 800, fontSize: '0.78rem', opacity: ending ? 0.6 : 1 }}
    >
      {ending ? 'Ending…' : 'End for everyone'}
    </button>
  );
}

// =====================================================================
// Schedule / instant-create modal
// =====================================================================
function NewMeetingModal({ mode, currentUser, onClose, onCreated }) {
  const [title, setTitle] = useState(mode === 'instant' ? '' : '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState([]);
  const [invitees, setInvitees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canTagClassroom = ['teacher', 'praxisanleiter', 'admin'].includes(currentUser.role);

  useEffect(() => {
    if (!canTagClassroom) return;
    fetch('/api/classrooms/mine', { headers: { ...authHeaders() } })
      .then(res => res.json())
      .then(data => setClassrooms(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [canTagClassroom]);

  useEffect(() => {
    if (!inviteQuery.trim()) { setInviteResults([]); return; }
    const timer = setTimeout(() => {
      apiSearchUsers(inviteQuery.trim()).then(setInviteResults).catch(() => setInviteResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [inviteQuery]);

  const addInvitee = (u) => {
    if (!invitees.some(i => i.id === u.id)) setInvitees(prev => [...prev, u]);
    setInviteQuery('');
    setInviteResults([]);
  };
  const removeInvitee = (id) => setInvitees(prev => prev.filter(i => i.id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (mode === 'scheduled' && (!date || !time)) { setError('Please pick a date and time.'); return; }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          title: title.trim(),
          type: mode,
          scheduledFor: mode === 'scheduled' ? new Date(`${date}T${time}`).toISOString() : undefined,
          classroomId: classroomId || undefined,
          inviteeEmails: invitees.map(i => i.email)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data, mode === 'instant');
    } catch (err) {
      setError(err.message || 'Could not create the meeting.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', borderRadius: '16px', background: '#fff', color: 'var(--ink)', border: '1px solid var(--border)' }}>
        <div className="modal-header" style={{ borderBottomColor: 'var(--border)' }}>
          <h3 style={{ fontFamily: "'Inter', sans-serif", color: 'var(--ink)' }}>{mode === 'instant' ? 'Start an instant meeting' : 'Schedule a meeting'}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#5F6368', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ color: 'var(--ink)' }}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px', fontSize: '0.8rem', color: 'var(--muted)' }}>Title</label>
              <input type="text" placeholder="e.g. Wound care consultation" value={title} onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem' }} required />
            </div>

            {mode === 'scheduled' && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px', fontSize: '0.8rem', color: 'var(--muted)' }}>Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box' }} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px', fontSize: '0.8rem', color: 'var(--muted)' }}>Time</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box' }} required />
                </div>
              </div>
            )}

            {canTagClassroom && classrooms.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px', fontSize: '0.8rem', color: 'var(--muted)' }}>Attach to a class (optional)</label>
                <select value={classroomId} onChange={e => setClassroomId(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <option value="">— No class —</option>
                  {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '4px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px', fontSize: '0.8rem', color: 'var(--muted)' }}>Invite people (optional)</label>
              <input type="text" placeholder="Search by name or email…" value={inviteQuery} onChange={e => setInviteQuery(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem' }} />
              {inviteResults.length > 0 && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', marginTop: '4px', maxHeight: '140px', overflowY: 'auto' }}>
                  {inviteResults.map(u => (
                    <div key={u.id} onClick={() => addInvitee(u)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', cursor: 'pointer' }}>
                      <AvatarCircle name={u.name} size={22} fontSize={9} avatarType={u.avatarType} avatarIcon={u.avatarIcon} avatarUrl={u.avatarUrl} />
                      <span style={{ fontSize: '0.82rem' }}>{u.name} <span style={{ color: 'var(--muted)' }}>({u.title || u.role})</span></span>
                    </div>
                  ))}
                </div>
              )}
              {invitees.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {invitees.map(u => (
                    <span key={u.id} className="mt-chip">{u.name} <span onClick={() => removeInvitee(u.id)} style={{ cursor: 'pointer', fontWeight: 900 }}>✕</span></span>
                  ))}
                </div>
              )}
            </div>

            {error && <div style={{ color: 'var(--like)', fontSize: '0.8rem', marginTop: '10px' }}>{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="submit" className="mt-btn-primary" disabled={saving}>
              {saving ? 'Creating…' : mode === 'instant' ? 'Start now' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================================
// Dashboard
// =====================================================================
const STATUS_BADGE = {
  live: { bg: 'var(--join-soft)', color: 'var(--join-deep)', icon: '●' },
  scheduled: { bg: '#F1F3F4', color: 'var(--muted)', icon: '📅' },
  ended: { bg: '#F1F3F4', color: 'var(--muted)', icon: '✓' }
};

function MeetingListItem({ meeting, currentUser, onJoin, onStart, onEnd, onCancel }) {
  const isHost = meeting.hostId === currentUser.id;
  const badge = STATUS_BADGE[meeting.status];
  return (
    <div className="mt-list-row mt-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: badge.bg, color: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: meeting.status === 'live' ? '0.7rem' : '1.05rem', flexShrink: 0 }}>
          {meeting.status === 'live' ? <span className="mt-live-dot" style={{ width: '10px', height: '10px' }} /> : badge.icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.92rem' }}>{meeting.title}</span>
            {meeting.classroomName && <span className="tag">🏫 {meeting.classroomName}</span>}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '3px' }}>
            {isHost ? 'You are the host' : `Host: ${meeting.hostName}`}
            {meeting.type === 'scheduled' && meeting.scheduledFor && ` • ${formatDateTime(meeting.scheduledFor)}`}
            {meeting.status === 'ended' && ` • Ended${meeting.attendeeCount ? ` • ${meeting.attendeeCount} ${meeting.attendeeCount === 1 ? 'attendee' : 'attendees'}` : ''}`}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {meeting.status === 'live' && <button className="mt-btn-primary" onClick={() => onJoin(meeting)}>Join</button>}
        {meeting.status === 'scheduled' && isHost && (
          <>
            <button className="mt-btn-primary" onClick={() => onStart(meeting)}>Start now</button>
            <button className="mt-btn-outline" onClick={() => onCancel(meeting)}>Cancel</button>
          </>
        )}
        {meeting.status === 'scheduled' && !isHost && (
          <span style={{ fontSize: '0.8rem', color: '#80868B', fontWeight: 600 }}>Waiting for host</span>
        )}
        {meeting.status === 'live' && isHost && (
          <button className="mt-btn-outline" style={{ color: 'var(--like)', borderColor: '#f6c1bb' }} onClick={() => onEnd(meeting)}>End</button>
        )}
      </div>
    </div>
  );
}

function MeetDashboard({ currentUser, onEnterPreJoin, onHome, userRole, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalMode, setModalMode] = useState(null); // null | 'instant' | 'scheduled'
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMeetings = useCallback(() => {
    fetch('/api/meetings/mine', { headers: { ...authHeaders() } })
      .then(async res => {
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data.error);
        return data;
      })
      .then(data => { setMeetings(Array.isArray(data) ? data : []); setLoadError(''); })
      .catch(err => setLoadError(err.message || 'Could not load your meetings.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMeetings();
    const interval = setInterval(fetchMeetings, 15000);
    return () => clearInterval(interval);
  }, [fetchMeetings]);

  const lookupByCode = async (code) => {
    setJoining(true);
    setJoinError('');
    try {
      const res = await fetch(`/api/meetings/lookup/${encodeURIComponent(code.trim())}`, { headers: { ...authHeaders() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.status !== 'live') {
        setJoinError("This meeting hasn't started yet — wait for the host.");
        return;
      }
      onEnterPreJoin(data);
    } catch (err) {
      setJoinError(err.message || 'Meeting not found.');
    } finally {
      setJoining(false);
    }
  };

  const handleStart = async (meeting) => {
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/start`, { method: 'POST', headers: { ...authHeaders() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onEnterPreJoin(data);
    } catch (err) {
      alert(err.message || 'Could not start the meeting.');
    }
  };

  const handleEnd = async (meeting) => {
    if (!window.confirm('End this meeting for everyone?')) return;
    try {
      await fetch(`/api/meetings/${meeting.id}/end`, { method: 'POST', headers: { ...authHeaders() } });
      fetchMeetings();
    } catch { /* list refresh below will reflect reality either way */ }
  };

  const handleCancel = async (meeting) => {
    if (!window.confirm('Cancel this scheduled meeting?')) return;
    try {
      await fetch(`/api/meetings/${meeting.id}`, { method: 'DELETE', headers: { ...authHeaders() } });
      setMeetings(prev => prev.filter(m => m.id !== meeting.id));
    } catch { /* ignore */ }
  };

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? meetings.filter(m => m.title.toLowerCase().includes(q) || m.hostName.toLowerCase().includes(q) || (m.classroomName || '').toLowerCase().includes(q))
    : meetings;
  const live = filtered.filter(m => m.status === 'live');
  const scheduled = filtered.filter(m => m.status === 'scheduled');
  const isEmpty = !loading && !loadError && live.length === 0 && scheduled.length === 0 && !q;

  return (
    <>
      <header style={{ height: '64px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '0 24px', background: '#ffffff', borderBottom: '1px solid var(--border)' }}>
        <div onClick={onHome} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }} title="Back to home">
          <div style={{ width: '28px', height: '28px' }}><LogoLetsMeet /></div>
          <span style={{ color: 'var(--ink)', fontWeight: 600, fontSize: '1.2rem', fontFamily: "'Inter', sans-serif" }}>LetsMeet</span>
        </div>

        <div className="mt-topbar-codebar" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center', maxWidth: '620px' }}>
          <form
            onSubmit={e => { e.preventDefault(); if (joinCode.trim()) lookupByCode(joinCode); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '999px', padding: '6px 6px 6px 16px', flex: 1, minWidth: 0 }}
          >
            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>⌨️</span>
            <input className="mt-code-input" value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Enter a code or link" />
            <button type="submit" className="mt-btn-outline" style={{ padding: '7px 16px', fontSize: '0.82rem', flexShrink: 0 }} disabled={joining || !joinCode.trim()}>
              {joining ? '…' : 'Join'}
            </button>
          </form>

          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button className="mt-btn-primary" onClick={() => setShowNewMenu(v => !v)}>
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> New
            </button>
            {showNewMenu && (
              <>
                <div onClick={() => setShowNewMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 4px 16px rgba(60,64,67,0.18)', minWidth: '240px', overflow: 'hidden', zIndex: 20 }}>
                  <button
                    onClick={() => { setModalMode('instant'); setShowNewMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '13px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', fontFamily: "'Inter', sans-serif", textAlign: 'left' }}
                  >
                    🎥 Start an instant meeting
                  </button>
                  <button
                    onClick={() => { setModalMode('scheduled'); setShowNewMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '13px 16px', border: 'none', borderTop: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', fontFamily: "'Inter', sans-serif", textAlign: 'left' }}
                  >
                    📅 Schedule for later
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ flexShrink: 0 }}>
          <UserProfileMenu variant="light" userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
        </div>
      </header>

      <div className="mt-scroll">
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: isEmpty ? '56px 24px 24px' : '32px 24px 24px' }}>
          {joinError && (
            <div style={{ background: '#FCE8E6', color: '#B3261E', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center' }}>{joinError}</div>
          )}

          {isEmpty && (
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <MeetHeroIllustration />
              <h1 style={{ margin: '18px 0 8px 0', fontSize: '1.7rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', fontFamily: "'Inter', sans-serif" }}>Video calls, made simple</h1>
              <p style={{ margin: '0 auto', maxWidth: '420px', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Start an instant meeting or schedule one for later. Every name on screen is a real, logged-in participant.
              </p>
            </div>
          )}

          {!isEmpty && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '14px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', fontFamily: "'Inter', sans-serif" }}>Your meetings</h2>
              <div style={{ position: 'relative', width: '220px', maxWidth: '100%' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#80868B', fontSize: '0.85rem' }}>🔍</span>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search meetings" className="mt-search-input" />
              </div>
            </div>
          )}

          {loading ? (
            <div className="mt-card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>Loading your meetings…</div>
          ) : loadError ? (
            <div className="mt-card" style={{ textAlign: 'center', color: 'var(--like)', padding: '40px' }}>{loadError}</div>
          ) : (
            <>
              {live.length > 0 && (
                <div style={{ marginBottom: '22px' }}>
                  <h3 style={{ fontSize: '0.78rem', color: 'var(--join-deep)', marginBottom: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>● Live now</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {live.map(m => <MeetingListItem key={m.id} meeting={m} currentUser={currentUser} onJoin={onEnterPreJoin} onStart={handleStart} onEnd={handleEnd} onCancel={handleCancel} />)}
                  </div>
                </div>
              )}
              {scheduled.length > 0 && (
                <div style={{ marginBottom: '22px' }}>
                  <h3 style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Scheduled</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {scheduled.map(m => <MeetingListItem key={m.id} meeting={m} currentUser={currentUser} onJoin={onEnterPreJoin} onStart={handleStart} onEnd={handleEnd} onCancel={handleCancel} />)}
                  </div>
                </div>
              )}
              {live.length === 0 && scheduled.length === 0 && q && (
                <div className="mt-card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px' }}>No meetings found for "{searchQuery}".</div>
              )}
            </>
          )}
        </div>
      </div>

      {modalMode && (
        <NewMeetingModal
          mode={modalMode}
          currentUser={currentUser}
          onClose={() => setModalMode(null)}
          onCreated={(meeting, enterNow) => {
            setModalMode(null);
            fetchMeetings();
            if (enterNow) onEnterPreJoin(meeting);
          }}
        />
      )}
    </>
  );
}

function MeetTopBar({ onHome, userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  return (
    <header style={{ height: '60px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', background: '#ffffff', borderBottom: '1px solid var(--border)', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
      <div onClick={onHome} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} title="Back to home">
        <div style={{ width: '28px', height: '28px' }}><LogoLetsMeet /></div>
        <span style={{ color: 'var(--ink)', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em', fontFamily: "'Sora', sans-serif" }}>LetsMeet</span>
      </div>
      <UserProfileMenu variant="light" userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
    </header>
  );
}

// =====================================================================
// Top level
// =====================================================================
export default function LetsMeetView({ onHome, userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker, initialRoomCode, onConsumedInitialRoomCode }) {
  const isLoggedIn = !!currentUser;
  const [activeMeeting, setActiveMeeting] = useState(null); // meeting we're pre-joining / in
  const [inCall, setInCall] = useState(false);
  const [media, setMedia] = useState(null);
  const [deepLinkError, setDeepLinkError] = useState('');

  useEffect(() => {
    if (!initialRoomCode || !isLoggedIn) return;
    fetch(`/api/meetings/lookup/${encodeURIComponent(initialRoomCode)}`, { headers: { ...authHeaders() } })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setActiveMeeting(data);
      })
      .catch(err => setDeepLinkError(err.message || 'Meeting nicht gefunden.'))
      .finally(() => onConsumedInitialRoomCode?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoomCode, isLoggedIn]);

  const handleExitCall = () => {
    setInCall(false);
    setActiveMeeting(null);
    setMedia(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="module-view-container" style={{ background: 'var(--bg)' }}>
        <style>{MEET_CSS}</style>
        <MeetTopBar onHome={onHome} userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="mt-card" style={{ textAlign: 'center', padding: '48px 32px', maxWidth: '420px' }}>
            <div style={{ width: '64px', height: '64px', margin: '0 auto 16px' }}><LogoLetsMeet /></div>
            <h2 style={{ margin: '0 0 8px 0', color: 'var(--ink)', fontSize: '1.25rem', fontFamily: "'Inter', sans-serif" }}>Welcome to LetsMeet</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              Start or schedule real video meetings for class and appointments. Sign in to get started.
            </p>
            <button className="mt-btn-primary" onClick={onOpenAuthModal}>Sign in</button>
          </div>
        </div>
      </div>
    );
  }

  if (activeMeeting && !inCall) {
    return (
      <>
        <style>{MEET_CSS}</style>
        <PreJoinScreen
          meeting={activeMeeting}
          currentUser={currentUser}
          onCancel={() => { setActiveMeeting(null); setDeepLinkError(''); }}
          onJoin={(m) => { setMedia(m); setInCall(true); }}
        />
      </>
    );
  }

  if (activeMeeting && inCall && media) {
    return (
      <>
        <style>{MEET_CSS}</style>
        <MeetingRoomLive meeting={activeMeeting} currentUser={currentUser} media={media} onExit={handleExitCall} />
      </>
    );
  }

  return (
    <div className="module-view-container" style={{ background: 'var(--bg)' }}>
      <style>{MEET_CSS}</style>
      {deepLinkError && (
        <div style={{ background: '#FCE8E6', color: '#B3261E', textAlign: 'center', padding: '10px', fontSize: '0.85rem' }}>{deepLinkError}</div>
      )}
      <MeetDashboard
        currentUser={currentUser}
        onEnterPreJoin={(m) => { setActiveMeeting(m); setInCall(false); setMedia(null); }}
        onHome={onHome} userRole={userRole} setCurrentUser={setCurrentUser}
        onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker}
      />
    </div>
  );
}
