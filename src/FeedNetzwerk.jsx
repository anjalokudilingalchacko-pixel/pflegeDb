/**
 * FeedNetzwerk.jsx — the "Netzwerk" page of PflegeFeed: friends, incoming
 * and outgoing friend requests, and groups (with a per-group mini feed).
 * Rendered inside PflegeFeed.jsx's <main>, reusing its global styles/vars.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Icon, AvatarCircle, StreakBadge, EmptyState, timeAgo,
  apiSearchUsers, apiGetFriends, apiUnfriend,
  apiGetRequests, apiSendRequest, apiAcceptRequest, apiDeclineRequest, apiCancelRequest,
  apiGetGroups, apiGetGroup, apiCreateGroup, apiJoinGroup, apiLeaveGroup, apiDeleteGroup,
  apiGetPosts, apiCreatePost, apiToggleLike, apiAddComment, apiDeletePost
} from "./feedShared";
import PostCard from "./FeedPostCard";

const NET_TABS = [
  { key: "friends", label: "Freunde", icon: "users" },
  { key: "requests", label: "Anfragen", icon: "userplus" },
  { key: "groups", label: "Gruppen", icon: "activity" }
];

export default function FeedNetzwerk({ me, onOpenAuthModal }) {
  const [activeTab, setActiveTab] = useState("friends");
  const [activeGroupId, setActiveGroupId] = useState(null);

  function ensureAuth() {
    const token = localStorage.getItem("pflegedb_jwt_token");
    if (!token) {
      if (onOpenAuthModal) onOpenAuthModal();
      else alert("Bitte melde dich an, um diese Funktion zu nutzen.");
      return false;
    }
    return true;
  }

  if (activeGroupId) {
    return <GroupDetail groupId={activeGroupId} me={me} ensureAuth={ensureAuth} onBack={() => setActiveGroupId(null)} />;
  }

  return (
    <div className="page-wrap">
      <style>{`
        .net-empty-wrap { padding: 30px 0; }
        .user-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 4px; }
        .user-row + .user-row { border-top: 1px solid var(--border); }
        .user-row-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .user-row-name { font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 6px; }
        .user-row-sub { font-size: 12px; color: var(--muted); margin-top: 1px; }
        .net-btn {
          display: inline-flex; align-items: center; gap: 6px; border-radius: 9px; border: none;
          padding: 8px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0;
        }
        .net-btn-primary { background: var(--teal); color: #fff; }
        .net-btn-primary:hover { background: var(--teal-deep); }
        .net-btn-outline { background: #fff; border: 1px solid var(--border); color: var(--ink); }
        .net-btn-outline:hover { border-color: var(--like); color: var(--like); }
        .net-btn-ghost { background: var(--bg); color: var(--muted); cursor: default; }
        .net-btn-danger { background: #fff; border: 1px solid #FECACA; color: var(--like); }
        .net-btn[disabled] { opacity: .55; cursor: default; }

        .net-search { display: flex; align-items: center; gap: 8px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 11px 14px; margin-bottom: 20px; }
        .net-search input { flex: 1; border: none; outline: none; font-size: 13.5px; font-family: inherit; background: transparent; }

        .net-section-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 14.5px; margin: 26px 0 12px; display: flex; align-items: center; gap: 8px; }
        .net-section-title:first-child { margin-top: 0; }
        .net-count-pill { background: var(--bg); color: var(--muted); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }

        .group-card { display: flex; flex-direction: column; }
        .group-cover { height: 64px; border-radius: 12px; background: linear-gradient(120deg, var(--navy) 0%, var(--teal-deep) 100%); margin-bottom: -26px; }
        .group-avatar-ring { width: 52px; height: 52px; border-radius: 14px; border: 3px solid var(--card); background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif; font-weight: 800; font-size: 18px; margin-left: 14px; }
        .group-name { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 15.5px; margin: 12px 0 4px; }
        .group-desc { font-size: 13px; color: var(--muted); line-height: 1.45; margin: 0 0 14px; flex: 1; min-height: 18px; }
        .group-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--border); }
        .group-member-count { font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 5px; }

        .create-group-modal-body { display: flex; flex-direction: column; gap: 12px; }
        .create-group-modal-body label { font-size: 12.5px; font-weight: 700; color: var(--ink); }
        .create-group-modal-body input, .create-group-modal-body textarea {
          width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px;
          font-family: inherit; font-size: 13.5px; box-sizing: border-box;
        }
        .create-group-modal-body textarea { min-height: 70px; resize: vertical; }
      `}</style>

      <div className="page-head">
        <h1 className="page-title">Netzwerk</h1>
        <p className="page-sub">Vernetze dich mit Kommiliton:innen, verwalte Anfragen und tritt Lerngruppen bei.</p>
      </div>

      <div className="pill-row">
        {NET_TABS.map(t => (
          <button key={t.key} className={`pill ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
            <Icon name={t.icon} size={13} color={activeTab === t.key ? "#fff" : "var(--ink)"} strokeWidth={2.2} />
            {" "}{t.label}
          </button>
        ))}
      </div>

      {activeTab === "friends" && <FriendsTab me={me} ensureAuth={ensureAuth} />}
      {activeTab === "requests" && <RequestsTab me={me} ensureAuth={ensureAuth} />}
      {activeTab === "groups" && <GroupsTab me={me} ensureAuth={ensureAuth} onOpenGroup={setActiveGroupId} />}
    </div>
  );
}

// ==================== Freunde ====================
function FriendsTab() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    apiGetFriends()
      .then(data => { setFriends(data); setError(""); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect -- load() sets a loading flag before its async fetch, the standard data-fetch idiom

  const handleUnfriend = async (userId, name) => {
    if (!window.confirm(`${name} wirklich aus deiner Freundesliste entfernen?`)) return;
    try {
      await apiUnfriend(userId);
      setFriends(prev => prev.filter(f => f.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <><div className="skeleton-card" /><div className="skeleton-card" style={{ marginTop: 16 }} /></>;
  if (error) return <div className="feed-error">{error}</div>;
  if (friends.length === 0) {
    return <div className="net-empty-wrap"><EmptyState icon="users" title="Noch keine Freunde" sub="Suche unter „Anfragen“ nach Kommiliton:innen und sende eine Anfrage." /></div>;
  }

  return (
    <div className="card">
      {friends.map(f => (
        <div className="user-row" key={f.id}>
          <div className="user-row-left">
            <AvatarCircle name={f.name} size={42} avatarType={f.avatarType} avatarIcon={f.avatarIcon} avatarUrl={f.avatarUrl} />
            <div>
              <div className="user-row-name">{f.name} <StreakBadge count={f.streak} /></div>
              <div className="user-row-sub">{f.title}</div>
            </div>
          </div>
          <button className="net-btn net-btn-danger" onClick={() => handleUnfriend(f.id, f.name)}>
            Entfernen
          </button>
        </div>
      ))}
    </div>
  );
}

// ==================== Anfragen ====================
function RequestsTab({ ensureAuth }) {
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiGetRequests()
      .then(data => { setRequests(data); setError(""); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect -- load() sets a loading flag before its async fetch, the standard data-fetch idiom

  const runSearch = useCallback((q) => {
    setSearching(true);
    apiSearchUsers(q)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    const handle = setTimeout(() => runSearch(query), 250);
    return () => clearTimeout(handle);
  }, [query, runSearch]);

  const handleSend = async (userId) => {
    if (!ensureAuth()) return;
    try {
      await apiSendRequest(userId);
      setResults(prev => prev.map(u => u.id === userId ? { ...u, friendStatus: "pending_out" } : u));
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAccept = async (id) => {
    try { await apiAcceptRequest(id); load(); } catch (err) { alert(err.message); }
  };
  const handleDecline = async (id) => {
    try { await apiDeclineRequest(id); load(); } catch (err) { alert(err.message); }
  };
  const handleCancel = async (id) => {
    try { await apiCancelRequest(id); load(); } catch (err) { alert(err.message); }
  };

  const requestButton = (u) => {
    if (u.friendStatus === "friends") return <span className="net-btn net-btn-ghost"><Icon name="check" size={13} color="var(--teal)" /> Befreundet</span>;
    if (u.friendStatus === "pending_out") return <span className="net-btn net-btn-ghost">Angefragt</span>;
    if (u.friendStatus === "pending_in") return <span className="net-btn net-btn-ghost">Hat dich angefragt</span>;
    return <button className="net-btn net-btn-primary" onClick={() => handleSend(u.id)}><Icon name="userplus" size={13} color="#fff" /> Anfrage</button>;
  };

  return (
    <>
      <div className="net-search">
        <Icon name="search" size={16} color="var(--muted)" />
        <input
          type="text"
          placeholder="Nach Namen oder E-Mail suchen..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {query.trim() && (
        <div className="card" style={{ marginBottom: 4 }}>
          {searching && <div className="feed-empty" style={{ padding: "16px 0" }}>Suche...</div>}
          {!searching && results.length === 0 && <div className="feed-empty" style={{ padding: "16px 0" }}>Keine Nutzer gefunden.</div>}
          {!searching && results.map(u => (
            <div className="user-row" key={u.id}>
              <div className="user-row-left">
                <AvatarCircle name={u.name} size={42} avatarType={u.avatarType} avatarIcon={u.avatarIcon} avatarUrl={u.avatarUrl} />
                <div>
                  <div className="user-row-name">{u.name} <StreakBadge count={u.streak} /></div>
                  <div className="user-row-sub">{u.title}</div>
                </div>
              </div>
              {requestButton(u)}
            </div>
          ))}
        </div>
      )}

      {loading && <div className="skeleton-card" />}
      {error && <div className="feed-error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="net-section-title">
            Eingehende Anfragen {requests.incoming.length > 0 && <span className="net-count-pill">{requests.incoming.length}</span>}
          </div>
          {requests.incoming.length === 0
            ? <div className="feed-empty">Keine offenen Anfragen.</div>
            : (
              <div className="card">
                {requests.incoming.map(r => (
                  <div className="user-row" key={r.id}>
                    <div className="user-row-left">
                      <AvatarCircle name={r.user.name} size={42} avatarType={r.user.avatarType} avatarIcon={r.user.avatarIcon} avatarUrl={r.user.avatarUrl} />
                      <div>
                        <div className="user-row-name">{r.user.name}</div>
                        <div className="user-row-sub">{timeAgo(r.createdAt)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="net-btn net-btn-outline" onClick={() => handleDecline(r.id)}>Ablehnen</button>
                      <button className="net-btn net-btn-primary" onClick={() => handleAccept(r.id)}>Annehmen</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          <div className="net-section-title">
            Gesendete Anfragen {requests.outgoing.length > 0 && <span className="net-count-pill">{requests.outgoing.length}</span>}
          </div>
          {requests.outgoing.length === 0
            ? <div className="feed-empty">Keine gesendeten Anfragen.</div>
            : (
              <div className="card">
                {requests.outgoing.map(r => (
                  <div className="user-row" key={r.id}>
                    <div className="user-row-left">
                      <AvatarCircle name={r.user.name} size={42} avatarType={r.user.avatarType} avatarIcon={r.user.avatarIcon} avatarUrl={r.user.avatarUrl} />
                      <div>
                        <div className="user-row-name">{r.user.name}</div>
                        <div className="user-row-sub">{timeAgo(r.createdAt)}</div>
                      </div>
                    </div>
                    <button className="net-btn net-btn-outline" onClick={() => handleCancel(r.id)}>Zurückziehen</button>
                  </div>
                ))}
              </div>
            )}
        </>
      )}
    </>
  );
}

// ==================== Gruppen ====================
function GroupsTab({ ensureAuth, onOpenGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiGetGroups()
      .then(data => { setGroups(data); setError(""); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);  

  const handleToggleMembership = async (group) => {
    if (!ensureAuth()) return;
    try {
      if (group.isMember) await apiLeaveGroup(group.id);
      else await apiJoinGroup(group.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!ensureAuth()) return;
    if (!name.trim()) { setCreateError("Bitte gib einen Gruppennamen ein."); return; }
    setCreating(true);
    setCreateError("");
    try {
      await apiCreateGroup({ name: name.trim(), description: description.trim() });
      setShowCreate(false);
      setName("");
      setDescription("");
      load();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <><div className="skeleton-card" /><div className="skeleton-card" style={{ marginTop: 16 }} /></>;
  if (error) return <div className="feed-error">{error}</div>;

  return (
    <>
      <div className="doc-grid">
        {groups.map(g => (
          <div className="card group-card" key={g.id} style={{ cursor: "pointer" }} onClick={() => onOpenGroup(g.id)}>
            <div className="group-cover" />
            <div className="group-avatar-ring">{g.name.slice(0, 2).toUpperCase()}</div>
            <div className="group-name">{g.name}</div>
            <p className="group-desc">{g.description || "Keine Beschreibung."}</p>
            <div className="group-footer">
              <span className="group-member-count">
                <Icon name="users" size={13} color="var(--muted)" /> {g.memberCount} Mitglied{g.memberCount === 1 ? "" : "er"}
              </span>
              <button
                className={`net-btn ${g.isMember ? "net-btn-outline" : "net-btn-primary"}`}
                onClick={(e) => { e.stopPropagation(); handleToggleMembership(g); }}
              >
                {g.isMember ? "Verlassen" : "Beitreten"}
              </button>
            </div>
          </div>
        ))}

        <div className="upload-tile" onClick={() => { if (ensureAuth()) setShowCreate(true); }}>
          <div className="upload-circle">
            <Icon name="plus" size={20} color="#fff" />
          </div>
          <div className="upload-title">Neue Gruppe erstellen</div>
          <div className="upload-sub">Starte eine offene Lern- oder Praxisgruppe.</div>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="net-empty-wrap"><EmptyState icon="activity" title="Noch keine Gruppen" sub="Erstelle die erste Gruppe für deinen Kurs oder deine Station." /></div>
      )}

      {showCreate && (
        <div className="composer-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="composer-modal" style={{ maxWidth: 440 }}>
            <div className="composer-modal-head">
              <h3>Neue Gruppe</h3>
              <button className="composer-close-btn" onClick={() => setShowCreate(false)}>
                <Icon name="x" size={16} color="var(--ink)" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="create-group-modal-body">
              <div>
                <label>Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Kurs 2026-A München" maxLength={80} />
              </div>
              <div>
                <label>Beschreibung (optional)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Worum geht es in dieser Gruppe?" maxLength={300} />
              </div>
              {createError && <div className="composer-error">{createError}</div>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "10px 16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
                  Abbrechen
                </button>
                <button type="submit" disabled={creating} style={{ padding: "10px 20px", background: "var(--teal)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: creating ? "default" : "pointer", opacity: creating ? 0.7 : 1 }}>
                  {creating ? "Wird erstellt..." : "Gruppe erstellen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== Group detail (mini feed) ====================
function GroupDetail({ groupId, me, ensureAuth, onBack }) {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const loadGroup = useCallback(() => {
    setLoading(true);
    apiGetGroup(groupId)
      .then(data => { setGroup(data); setError(""); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [groupId]);

  const loadPosts = useCallback(() => {
    setPostsLoading(true);
    apiGetPosts(groupId)
      .then(setPosts)
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [groupId]);

  useEffect(() => { loadGroup(); loadPosts(); }, [loadGroup, loadPosts]);

  const handleLike = async (id) => {
    if (!ensureAuth()) return;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 } : p));
    try {
      const data = await apiToggleLike(id);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: data.likes, likedByMe: data.likedByMe } : p));
    } catch (err) {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 } : p));
      alert(err.message);
    }
  };

  const handleAddComment = async (id, text) => {
    if (!ensureAuth()) return;
    const comment = await apiAddComment(id, text);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, comments: [...p.comments, comment] } : p));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Diesen Beitrag wirklich löschen?")) return;
    try {
      await apiDeletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureAuth()) return;
    const text = draft.trim();
    if (!text) { setPostError("Bitte gib einen Text ein."); return; }
    setPosting(true);
    setPostError("");
    try {
      const newPost = await apiCreatePost({ type: "status", text, tags: [], groupId });
      setPosts(prev => [newPost, ...prev]);
      setDraft("");
    } catch (err) {
      setPostError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleJoin = async () => {
    if (!ensureAuth()) return;
    try { await apiJoinGroup(groupId); loadGroup(); } catch (err) { alert(err.message); }
  };
  const handleLeave = async () => {
    if (!window.confirm("Diese Gruppe wirklich verlassen?")) return;
    try { await apiLeaveGroup(groupId); onBack(); } catch (err) { alert(err.message); }
  };
  const handleDeleteGroup = async () => {
    if (!window.confirm("Diese Gruppe inkl. aller Beiträge wirklich löschen?")) return;
    try { await apiDeleteGroup(groupId); onBack(); } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="page-wrap"><div className="skeleton-card" /></div>;
  if (error || !group) return <div className="page-wrap"><div className="feed-error">{error || "Gruppe nicht gefunden."}</div></div>;

  return (
    <div className="page-wrap">
      <style>{`
        .group-detail-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: var(--muted); font-weight: 600; font-size: 13px; cursor: pointer; margin-bottom: 14px; padding: 0; }
        .group-detail-back:hover { color: var(--navy); }
        .group-detail-banner { height: 110px; border-radius: 16px 16px 0 0; background: linear-gradient(120deg, var(--navy) 0%, var(--teal-deep) 100%); }
        .group-detail-body { padding: 0 22px 20px; }
        .group-detail-avatar { width: 64px; height: 64px; border-radius: 16px; border: 4px solid var(--card); margin-top: -32px; background: #fff; color: var(--navy); display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif; font-weight: 800; font-size: 22px; }
        .group-detail-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-top: 10px; flex-wrap: wrap; }
        .group-detail-name { font-family: 'Sora', sans-serif; font-weight: 800; font-size: 21px; margin: 0; }
        .group-detail-desc { font-size: 13.5px; color: var(--muted); margin: 4px 0 0; max-width: 480px; }
        .group-detail-actions { display: flex; gap: 8px; }
        .group-composer { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 20px; }
        .group-composer textarea { flex: 1; border: 1px solid var(--border); border-radius: 12px; padding: 11px; font-family: inherit; font-size: 13.5px; resize: vertical; min-height: 46px; box-sizing: border-box; }
        .group-composer-col { flex: 1; display: flex; flex-direction: column; gap: 8px; }
      `}</style>

      <button className="group-detail-back" onClick={onBack}>
        <Icon name="arrowleft" size={16} color="var(--muted)" /> Zurück zu Gruppen
      </button>

      <div className="profile-card">
        <div className="group-detail-banner" />
        <div className="group-detail-body">
          <div className="group-detail-avatar">{group.name.slice(0, 2).toUpperCase()}</div>
          <div className="group-detail-title-row">
            <div>
              <h2 className="group-detail-name">{group.name}</h2>
              <p className="group-detail-desc">{group.description || "Keine Beschreibung."}</p>
            </div>
            <div className="group-detail-actions">
              {group.isMember ? (
                <button className="net-btn net-btn-outline" onClick={handleLeave}>Verlassen</button>
              ) : (
                <button className="net-btn net-btn-primary" onClick={handleJoin}>Beitreten</button>
              )}
              {group.isOwner && <button className="net-btn net-btn-danger" onClick={handleDeleteGroup}>Löschen</button>}
            </div>
          </div>

          <div className="profile-stats">
            <div>
              <div className="stat-num">{group.memberCount}</div>
              <div className="stat-label">Mitglieder</div>
            </div>
            <div>
              <div className="stat-num">{posts.length}</div>
              <div className="stat-label">Beiträge</div>
            </div>
          </div>

          {group.members?.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              {group.members.slice(0, 12).map(m => (
                <AvatarCircle key={m.id} name={m.name} size={34} fontSize={12} avatarType={m.avatarType} avatarIcon={m.avatarIcon} avatarUrl={m.avatarUrl} />
              ))}
            </div>
          )}
        </div>
      </div>

      {group.isMember && (
        <form className="group-composer" onSubmit={handleSubmit}>
          <AvatarCircle name={me.name} size={40} avatarType={me.avatarType} avatarIcon={me.avatarIcon} avatarUrl={me.avatarUrl} />
          <div className="group-composer-col">
            <textarea
              placeholder={`Etwas mit "${group.name}" teilen...`}
              value={draft}
              onChange={e => setDraft(e.target.value)}
            />
            {postError && <div className="composer-error">{postError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={posting || !draft.trim()}
                style={{ padding: "9px 18px", background: "var(--teal)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: posting ? "default" : "pointer", opacity: posting || !draft.trim() ? 0.6 : 1 }}
              >
                {posting ? "Wird gepostet..." : "Posten"}
              </button>
            </div>
          </div>
        </form>
      )}

      {postsLoading && <div className="skeleton-card" />}
      {!postsLoading && posts.length === 0 && (
        <div className="net-empty-wrap"><EmptyState icon="message" title="Noch keine Beiträge" sub={group.isMember ? "Sei der/die Erste und teile ein Update." : "Tritt der Gruppe bei, um mitzuposten."} /></div>
      )}
      {!postsLoading && posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          me={me}
          onLike={handleLike}
          onAddComment={handleAddComment}
          onDelete={handleDelete}
          onOpenLightbox={() => {}}
        />
      ))}
    </div>
  );
}
