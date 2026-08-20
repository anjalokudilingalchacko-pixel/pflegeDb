/**
 * LetsZeichnenView.jsx — LetsZeichnen: a whiteboard/sketch tool built directly on Excalidraw's
 * real drawing engine (https://github.com/excalidraw/excalidraw) — the actual <Excalidraw/> React
 * component, not a reimplementation. Every tool (freehand draw, shapes, text, arrows, eraser,
 * colors, stroke styles, layers, zoom/pan, export, keyboard shortcuts...) is Excalidraw's own.
 *
 * What's intentionally different from the real Excalidraw: drawings save to this app's own JSON
 * backend (GET/POST/PUT/DELETE /api/drawings) instead of Excalidraw's live-collaboration backend
 * (excalidraw.com's socket.io server + end-to-end-encrypted rooms) — that needs infrastructure
 * this local prototype doesn't have, so real-time multi-user co-drawing isn't included; everything
 * else about the canvas and its tools is the real thing.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { UserProfileMenu, authHeaders } from './feedShared';
import { LogoLetsZeichnen } from './icons';

const LZ_CSS = `
:root {
  --lz-bg: #FFFFFF;
  --lz-surface: #FAF9FF;
  --lz-ink: #1E1B2E;
  --lz-muted: #7C7794;
  --lz-border: #E8E5F5;
  --lz-accent: #6965DB;
  --lz-accent-deep: #5B4FCF;
  --lz-accent-soft: #EFEDFC;
}
.lz-scroll { flex: 1; overflow-y: auto; background: var(--lz-bg); }
.lz-btn-primary { background: var(--lz-accent); color: #fff; border: none; border-radius: 10px; padding: 10px 18px; font-size: 0.86rem; font-weight: 700; cursor: pointer; transition: background 0.15s ease; display: inline-flex; align-items: center; gap: 8px; font-family: 'Inter', sans-serif; }
.lz-btn-primary:hover { background: var(--lz-accent-deep); }
.lz-btn-primary:disabled { background: #DEDBF0; color: #A8A3C4; cursor: not-allowed; }
.lz-btn-outline { background: #fff; color: var(--lz-ink); border: 1px solid var(--lz-border); border-radius: 10px; padding: 10px 18px; font-size: 0.86rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease; font-family: 'Inter', sans-serif; }
.lz-btn-outline:hover { background: var(--lz-surface); border-color: #D5D0EE; }
.lz-card { background: #fff; border-radius: 14px; padding: 18px; border: 1px solid var(--lz-border); transition: box-shadow 0.15s ease, border-color 0.15s ease; }
.lz-card:hover { box-shadow: 0 6px 20px -10px rgba(30,27,46,0.18); border-color: #D5D0EE; }
`;

// =====================================================================
// Editor — the real <Excalidraw/> canvas, with our own save/load wired to its onChange callback.
// =====================================================================
function LetsZeichnenEditor({ drawing, onBack, onSaved }) {
  const [title, setTitle] = useState(drawing.title);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const sceneRef = useRef({ elements: drawing.elements || [], appState: drawing.appState || {}, files: drawing.files || {} });
  const saveTimerRef = useRef(null);
  const titleRef = useRef(title);
  titleRef.current = title;

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const { elements, appState, files } = sceneRef.current;
      const res = await fetch(`/api/drawings/${drawing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title: titleRef.current, elements, appState, files })
      });
      const data = await res.json();
      if (res.ok) { setDirty(false); onSaved?.(data); }
    } catch { /* keep local state; retry on next change */ }
    finally { setSaving(false); }
  }, [drawing.id, onSaved]);

  const scheduleSave = useCallback(() => {
    setDirty(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(save, 1500);
  }, [save]);

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  // Excalidraw fires onChange once on its own as it hydrates from initialData, before the user
  // has touched anything — skip that first call so opening a drawing doesn't immediately flag it
  // "Unsaved changes" and schedule a pointless save of the exact same data.
  const hasHydratedRef = useRef(false);
  const handleChange = (elements, appState, files) => {
    sceneRef.current = { elements, appState, files };
    if (!hasHydratedRef.current) { hasHydratedRef.current = true; return; }
    scheduleSave();
  };

  const goBack = async () => {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); await save(); }
    onBack();
  };

  const initialDataRef = useRef({
    elements: drawing.elements || [],
    appState: { ...(drawing.appState || {}), viewBackgroundColor: drawing.appState?.viewBackgroundColor || '#ffffff' },
    files: drawing.files || {},
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--lz-surface)' }}>
      <header style={{ height: '54px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '0 16px', background: '#fff', borderBottom: '1px solid var(--lz-border)', position: 'relative', zIndex: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <button onClick={goBack} title="Back to drawings" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.15rem', color: 'var(--lz-muted)', padding: '4px' }}>←</button>
          <div style={{ width: '22px', height: '22px', flexShrink: 0 }}><LogoLetsZeichnen /></div>
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); scheduleSave(); }}
            style={{ border: 'none', outline: 'none', fontSize: '0.92rem', fontWeight: 700, color: 'var(--lz-ink)', fontFamily: "'Inter', sans-serif", background: 'transparent', minWidth: 0, width: '200px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--lz-muted)', fontWeight: 600 }}>{saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved'}</span>
          <button className="lz-btn-primary" style={{ padding: '7px 14px', fontSize: '0.78rem' }} onClick={() => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); save(); }} disabled={saving}>Save</button>
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Excalidraw
          initialData={initialDataRef.current}
          onChange={handleChange}
          theme="light"
          name={title}
        />
      </div>
    </div>
  );
}

// =====================================================================
// Dashboard
// =====================================================================
function LetsZeichnenDashboard({ currentUser, onOpen, onHome, userRole, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchDrawings = useCallback(() => {
    fetch('/api/drawings', { headers: { ...authHeaders() } })
      .then(async res => {
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data.error);
        return data;
      })
      .then(data => { setDrawings(Array.isArray(data) ? data : []); setLoadError(''); })
      .catch(err => setLoadError(err.message || 'Could not load your drawings.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDrawings(); }, [fetchDrawings]);

  const createDrawing = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title: 'Untitled drawing', elements: [] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onOpen(data);
    } catch (err) {
      alert(err.message || 'Could not create the drawing.');
    } finally {
      setCreating(false);
    }
  };

  const deleteDrawing = async (d) => {
    if (!window.confirm(`Delete "${d.title}"? This can't be undone.`)) return;
    try {
      await fetch(`/api/drawings/${d.id}`, { method: 'DELETE', headers: { ...authHeaders() } });
      setDrawings(prev => prev.filter(x => x.id !== d.id));
    } catch { /* ignore */ }
  };

  const openDrawing = async (d) => {
    try {
      const res = await fetch(`/api/drawings/${d.id}`, { headers: { ...authHeaders() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onOpen(data);
    } catch (err) {
      alert(err.message || 'Could not open this drawing.');
    }
  };

  return (
    <div className="module-view-container" style={{ background: 'var(--lz-bg)' }}>
      <header style={{ height: '64px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff', borderBottom: '1px solid var(--lz-border)' }}>
        <div onClick={onHome} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} title="Back to home">
          <div style={{ width: '28px', height: '28px' }}><LogoLetsZeichnen /></div>
          <span style={{ color: 'var(--lz-ink)', fontWeight: 700, fontSize: '1.2rem', fontFamily: "'Inter', sans-serif" }}>LetsZeichnen</span>
        </div>
        <UserProfileMenu variant="light" userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
      </header>

      <div className="lz-scroll">
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', gap: '14px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 700, color: 'var(--lz-ink)', fontFamily: "'Inter', sans-serif" }}>Your drawings</h1>
              <p style={{ margin: 0, color: 'var(--lz-muted)', fontSize: '0.85rem' }}>Sketch freely on Excalidraw's real whiteboard engine.</p>
            </div>
            <button className="lz-btn-primary" onClick={createDrawing} disabled={creating}>+ New drawing</button>
          </div>

          {loading ? (
            <div className="lz-card" style={{ textAlign: 'center', color: 'var(--lz-muted)', padding: '40px' }}>Loading…</div>
          ) : loadError ? (
            <div className="lz-card" style={{ textAlign: 'center', color: '#D93025', padding: '40px' }}>{loadError}</div>
          ) : drawings.length === 0 ? (
            <div className="lz-card" style={{ textAlign: 'center', padding: '56px 24px' }}>
              <div style={{ width: '64px', height: '64px', margin: '0 auto 16px' }}><LogoLetsZeichnen /></div>
              <h2 style={{ margin: '0 0 8px 0', color: 'var(--lz-ink)', fontSize: '1.15rem' }}>No drawings yet</h2>
              <p style={{ color: 'var(--lz-muted)', fontSize: '0.88rem', margin: '0 0 20px 0' }}>Create your first sketch — freehand drawing, shapes, arrows, text and more.</p>
              <button className="lz-btn-primary" onClick={createDrawing} disabled={creating}>+ New drawing</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {drawings.map(d => (
                <div key={d.id} className="lz-card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }} onClick={() => openDrawing(d)}>
                  <div style={{ width: '100%', aspectRatio: '16 / 9', background: 'var(--lz-accent-soft)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '32px', height: '32px' }}><LogoLetsZeichnen /></div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--lz-ink)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--lz-muted)', marginTop: '2px' }}>{d.elementCount} {d.elementCount === 1 ? 'element' : 'elements'}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteDrawing(d); }}
                    style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#D93025', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, padding: 0 }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Top level
// =====================================================================
export default function LetsZeichnenView({ onHome, userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  const [openDrawing, setOpenDrawing] = useState(null);
  const isLoggedIn = !!currentUser;

  if (!isLoggedIn) {
    return (
      <div className="module-view-container" style={{ background: 'var(--lz-bg)' }}>
        <style>{LZ_CSS}</style>
        <header style={{ height: '64px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff', borderBottom: '1px solid var(--lz-border)' }}>
          <div onClick={onHome} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} title="Back to home">
            <div style={{ width: '28px', height: '28px' }}><LogoLetsZeichnen /></div>
            <span style={{ color: 'var(--lz-ink)', fontWeight: 700, fontSize: '1.2rem', fontFamily: "'Inter', sans-serif" }}>LetsZeichnen</span>
          </div>
          <UserProfileMenu variant="light" userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
        </header>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="lz-card" style={{ textAlign: 'center', padding: '48px 32px', maxWidth: '420px' }}>
            <div style={{ width: '64px', height: '64px', margin: '0 auto 16px' }}><LogoLetsZeichnen /></div>
            <h2 style={{ margin: '0 0 8px 0', color: 'var(--lz-ink)', fontSize: '1.25rem' }}>Welcome to LetsZeichnen</h2>
            <p style={{ color: 'var(--lz-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              A whiteboard for freehand sketches, diagrams and notes — built on Excalidraw's real drawing engine. Sign in to get started.
            </p>
            <button className="lz-btn-primary" onClick={onOpenAuthModal}>Sign in</button>
          </div>
        </div>
      </div>
    );
  }

  if (openDrawing) {
    return (
      <>
        <style>{LZ_CSS}</style>
        <LetsZeichnenEditor
          drawing={openDrawing}
          onBack={() => setOpenDrawing(null)}
          onSaved={setOpenDrawing}
        />
      </>
    );
  }

  return (
    <>
      <style>{LZ_CSS}</style>
      <LetsZeichnenDashboard
        currentUser={currentUser}
        onOpen={setOpenDrawing}
        onHome={onHome}
        userRole={userRole}
        setCurrentUser={setCurrentUser}
        onOpenAuthModal={onOpenAuthModal}
        onOpenAvatarPicker={onOpenAvatarPicker}
      />
    </>
  );
}
