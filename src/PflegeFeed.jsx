/**
 * PflegeFeed.jsx — Instagram/Blog-style social feed for nursing students.
 * Supports status updates, photo posts (multi-image, Instagram-style grid),
 * and document sharing, backed by the /api/feed/* endpoints in server.cjs.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Icon, PulseSvg, AvatarCircle, StreakBadge, EmptyState,
  timeAgo, formatFileSize, extractHashtags, fileToDataURL,
  apiGetPosts, apiCreatePost, apiToggleLike, apiAddComment, apiDeletePost,
  apiGetStreak, apiSearchUsers, apiSendRequest, apiGetGroups, apiGetFriends
} from "./feedShared";
import PostCard from "./FeedPostCard";
import FeedNetzwerk from "./FeedNetzwerk";

// ==================== Static demo data (Jobs / Documents pages) ====================
const TRENDING = [
  { tag: "#Pflegekammer", desc: "Diskussion zur neuen Beitragsordnung" },
  { tag: "#Fortbildung", desc: "Top 5 Online-Seminare 2026" },
  { tag: "#Schichtdienst", desc: "Tipps für einen gesunden Schlaf" }
];

const JOBS = [
  {
    id: "j1",
    urgent: true,
    title: "Pflegestudent (m/w/d) - Intensivstation",
    company: "Klinikum Berlin Mitte",
    location: "Berlin (Mitte)",
    tags: [["clock", "Werkstudent (max 20h/Woche)"], ["none", "€ 16-18€ / Std."], ["none", "Für Studierende"]],
    desc: "Sammle wertvolle Praxiserfahrung auf unserer interdisziplinären Intensivstation. Wir bieten flexible Dienstpläne, die sich perfekt in deinen Studienalltag integrieren lassen.",
    posted: "Vor 2 Tagen gepostet",
    cta: "Schnellbewerbung",
    primary: true
  },
  {
    id: "j2",
    urgent: false,
    title: "Aushilfe Pflege (Studierende) w/m/d",
    company: "St. Hedwig-Krankenhaus",
    location: "Berlin (Wedding)",
    tags: [["clock", "Teilzeit / Wochenende"], ["none", "Tarifvertrag"]],
    desc: "Zur Unterstützung unserer Teams auf den Normalstationen suchen wir engagierte Pflegestudierende für Wochenend- und Spätdienste. Profitieren Sie von unserem internen Fortbildungsprogramm.",
    posted: "Gestern gepostet",
    cta: "Details ansehen",
    primary: false
  }
];

const DOCUMENTS = [
  {
    id: "d1",
    icon: "book",
    iconBg: "#DCEAFE",
    iconColor: "#2563EB",
    badge: "Updated Protocol",
    title: "2026 Advanced Cardiac Life Support (ACLS) Guidelines",
    desc: "Comprehensive updated guidelines detailing the algorithmic approach to cardiac emergencies, emphasizing early defibrillation and high-quality CPR.",
    meta: "PDF · 4.2 MB",
    date: null,
    category: "Protocols"
  },
  {
    id: "d2",
    icon: "file",
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
    badge: null,
    title: "Shift Handover Template v2.1",
    desc: "Standardized form for ICU shift changes.",
    meta: "DOCX · 128 KB",
    date: "2 days ago",
    category: "Templates"
  },
  {
    id: "d3",
    icon: "book",
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
    badge: null,
    title: "Study: Fall Prevention in Geriatrics",
    desc: "Summary of recent findings on environmental factors.",
    meta: "PDF · 1.5 MB",
    date: "1 week ago",
    category: "Studies"
  },
  {
    id: "d4",
    icon: "book",
    iconBg: "#DCEAFE",
    iconColor: "#2563EB",
    badge: null,
    title: "Infection Control Policy 2026",
    desc: "Updated ward hygiene requirements.",
    meta: "PDF · 3.1 MB",
    date: "Oct 12",
    category: "Protocols"
  }
];

const COMPOSER_MODES = [
  { key: "status", label: "Status", icon: "edit" },
  { key: "photo", label: "Foto", icon: "image" },
  { key: "document", label: "Dokument", icon: "file" }
];

export default function PflegeFeed({ onHome, currentUser, onOpenAuthModal }) {
  const me = currentUser || { id: "guest", name: "Gast", title: "Pflegeschüler(in)", role: "student" };

  const [activeNav, setActiveNav] = useState("feed"); // 'feed' | 'netzwerk' | 'jobs' | 'documents' | 'profile'

  // Feed data (backend-backed)
  const [posts, setPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");

  const [suggested, setSuggested] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [friendsCount, setFriendsCount] = useState(null);
  const [streak, setStreak] = useState(null); // {current, longest, postedToday}
  const [streakBannerDismissed, setStreakBannerDismissed] = useState(false);
  const [activeDocFilter, setActiveDocFilter] = useState("All Files");
  const [activeProfileTab, setActiveProfileTab] = useState("posts");

  // Composer
  const [showComposer, setShowComposer] = useState(false);
  const [composerMode, setComposerMode] = useState("status");
  const [composerText, setComposerText] = useState("");
  const [composerImages, setComposerImages] = useState([]); // [{file, url}]
  const [composerDoc, setComposerDoc] = useState(null); // {file, name, size}
  const [composerError, setComposerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Post interaction UI state
  const [lightbox, setLightbox] = useState(null); // {images, index}
  const feedScrollRef = useRef(null);

  const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
  const [activeJobChips, setActiveJobChips] = useState(["Werkstudent", "Teilzeit", "Berlin (+20km)"]);
  const [distanceKm, setDistanceKm] = useState(20);

  const isLoggedIn = !!localStorage.getItem("pflegedb_jwt_token");

  // ---- Load feed ----
  useEffect(() => {
    let cancelled = false;
    setFeedLoading(true);
    apiGetPosts()
      .then(data => { if (!cancelled) { setPosts(data); setFeedError(""); } })
      .catch(err => { if (!cancelled) setFeedError(err.message); })
      .finally(() => { if (!cancelled) setFeedLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ---- Load streak, suggested people & my groups (engagement rail) ----
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    apiGetStreak().then(data => { if (!cancelled) setStreak(data); }).catch(() => {});
    apiSearchUsers("")
      .then(data => { if (!cancelled) setSuggested(data.filter(u => u.friendStatus === "none").slice(0, 4)); })
      .catch(() => {});
    apiGetGroups()
      .then(data => { if (!cancelled) setMyGroups(data.filter(g => g.isMember)); })
      .catch(() => {});
    apiGetFriends()
      .then(data => { if (!cancelled) setFriendsCount(data.length); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  function ensureAuth() {
    const token = localStorage.getItem("pflegedb_jwt_token");
    if (!token) {
      if (onOpenAuthModal) onOpenAuthModal();
      else alert("Bitte melde dich an, um diese Funktion zu nutzen.");
      return false;
    }
    return true;
  }

  // ---- Likes / comments / delete ----
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

  const handleDeletePost = async (id) => {
    if (!window.confirm("Diesen Beitrag wirklich löschen?")) return;
    try {
      await apiDeletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    if (!ensureAuth()) return;
    try {
      await apiSendRequest(userId);
      setSuggested(prev => prev.filter(s => s.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  // ---- Composer ----
  const openComposer = (mode = "status") => {
    if (!ensureAuth()) return;
    setComposerMode(mode);
    setShowComposer(true);
  };

  const closeComposer = () => {
    composerImages.forEach(img => URL.revokeObjectURL(img.url));
    setComposerImages([]);
    setComposerDoc(null);
    setComposerText("");
    setComposerMode("status");
    setComposerError("");
    setShowComposer(false);
  };

  const handlePickImages = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 8 * 1024 * 1024) { setComposerError(`${f.name} ist zu groß (max. 8 MB).`); continue; }
      valid.push(f);
    }
    setComposerImages(prev => [...prev, ...valid.map(f => ({ file: f, url: URL.createObjectURL(f) }))].slice(0, 6));
    e.target.value = "";
  };

  const removeImage = (idx) => {
    setComposerImages(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[idx].url);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const handlePickDoc = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const okTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (!okTypes.includes(f.type)) { setComposerError("Nur PDF, DOC, DOCX oder TXT sind erlaubt."); e.target.value = ""; return; }
    if (f.size > 8 * 1024 * 1024) { setComposerError("Datei ist zu groß (max. 8 MB)."); e.target.value = ""; return; }
    setComposerDoc({ file: f, name: f.name, size: f.size });
    e.target.value = "";
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!ensureAuth()) return;
    const text = composerText.trim();
    setComposerError("");

    if (composerMode === "status" && !text) { setComposerError("Bitte gib einen Text ein."); return; }
    if (composerMode === "photo" && composerImages.length === 0) { setComposerError("Bitte füge mindestens ein Foto hinzu."); return; }
    if (composerMode === "document" && !composerDoc) { setComposerError("Bitte wähle ein Dokument aus."); return; }

    setSubmitting(true);
    try {
      const payload = { type: composerMode, text, tags: extractHashtags(text) };
      if (composerMode === "photo") {
        payload.images = await Promise.all(composerImages.map(img => fileToDataURL(img.file)));
      }
      if (composerMode === "document") {
        payload.document = { name: composerDoc.file.name, dataUrl: await fileToDataURL(composerDoc.file) };
      }
      const newPost = await apiCreatePost(payload);
      setPosts(prev => [newPost, ...prev]);
      closeComposer();
    } catch (err) {
      setComposerError(err.message || "Beitrag konnte nicht erstellt werden.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Lightbox ----
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox(lb => lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb);
      if (e.key === "ArrowLeft") setLightbox(lb => lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const navItems = [
    { key: "feed", label: "Feed", icon: "home" },
    { key: "netzwerk", label: "Netzwerk", icon: "users" },
    { key: "jobs", label: "Jobs", icon: "briefcase" },
    { key: "documents", label: "Documents", icon: "file" },
    { key: "profile", label: "Profile", icon: "user" }
  ];

  const visibleDocs = activeDocFilter === "All Files" ? DOCUMENTS : DOCUMENTS.filter(d => d.category === activeDocFilter);
  const myPosts = posts.filter(p => p.authorId === me.id);

  const postCardProps = {
    me,
    onLike: handleLike,
    onAddComment: handleAddComment,
    onDelete: handleDeletePost,
    onOpenLightbox: (images, idx) => setLightbox({ images, index: idx })
  };

  return (
    <div className={`app ${activeNav !== "feed" ? "no-rail" : ""}`}>

      {/* ==================== Embedded Component CSS ==================== */}
      <style>{`
        :root {
          --navy: #16305C;
          --navy-deep: #0F2547;
          --teal: #0D9488;
          --teal-deep: #0B7A70;
          --teal-soft: #EFFAF7;
          --teal-border: #CFEEE7;
          --bg: #F1F4FA;
          --card: #FFFFFF;
          --ink: #16213D;
          --muted: #64748B;
          --border: #E4E8F1;
          --verified: #2563EB;
          --like: #DC2626;

          --header-h: 60px;
          --bottomnav-h: 66px;
          --sidebar-w: 250px;
          --rail-w: 300px;
        }

        .app {
          display: grid;
          grid-template-columns: 1fr;
          grid-template-areas: "main";
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          background: var(--bg);
          color: var(--ink);
          -webkit-font-smoothing: antialiased;
        }
        @media (min-width: 900px) {
          .app {
            grid-template-columns: var(--sidebar-w) 1fr;
            grid-template-areas: "sidebar main";
          }
        }
        @media (min-width: 1180px) {
          .app {
            grid-template-columns: var(--sidebar-w) 1fr var(--rail-w);
            grid-template-areas: "sidebar main rail";
          }
        }

        .sidebar {
          grid-area: sidebar;
          display: none;
          flex-direction: column;
          background: var(--card);
          border-right: 1px solid var(--border);
          padding: 24px 18px;
          position: sticky;
          top: 0;
          height: 100vh;
        }
        @media (min-width: 900px) { .sidebar { display: flex; } }

        .brand-row { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .brand-mark {
          width: 30px; height: 30px; border-radius: 8px; background: var(--navy);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .brand { font-family: 'Sora', sans-serif; font-weight: 800; font-size: 20px; color: var(--navy); }

        .pulse-wrap { margin: 10px 0 18px 2px; }
        .pulse-path {
          stroke-dasharray: 140;
          stroke-dashoffset: 140;
          animation: draw 2.8s ease-in-out infinite;
        }
        @keyframes draw {
          0% { stroke-dashoffset: 140; opacity: .35; }
          45% { stroke-dashoffset: 0; opacity: 1; }
          70% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -140; opacity: .35; }
        }

        .side-profile {
          background: var(--bg);
          border-radius: 16px;
          padding: 18px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 18px;
          cursor: pointer;
        }
        .side-profile .name { font-weight: 700; font-size: 15px; margin-top: 10px; }
        .side-profile .role { font-size: 12.5px; color: var(--muted); margin-top: 2px; }
        .verified-tag {
          display: flex; align-items: center; gap: 4px; margin-top: 5px;
          font-size: 12px; color: var(--verified); font-weight: 600;
        }

        .side-nav { display: flex; flex-direction: column; gap: 4px; }
        .nav-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 10px; border: none;
          background: transparent; color: var(--ink);
          font-weight: 600; font-size: 14.5px; text-align: left;
          transition: background .15s ease, color .15s ease;
          cursor: pointer;
        }
        .nav-btn.active { background: var(--navy); color: #fff; }
        .nav-btn:hover:not(.active) { background: #EEF1F8; }

        .sidebar-spacer { flex: 1; }
        .post-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--teal); color: #fff; border: none; border-radius: 10px;
          padding: 12px 0; font-weight: 700; font-size: 14px;
          transition: background .15s ease, transform .1s ease;
          cursor: pointer;
        }
        .post-btn:hover { background: var(--teal-deep); }
        .post-btn:active { transform: scale(.97); }

        .mobile-header {
          display: none;
          position: fixed; top: 0; left: 0; right: 0;
          height: var(--header-h); z-index: 40;
          background: var(--card); border-bottom: 1px solid var(--border);
          align-items: center; justify-content: space-between;
          padding: 0 16px;
        }
        @media (max-width: 899px) { .mobile-header { display: flex; } }

        .mobile-bottomnav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0;
          height: var(--bottomnav-h); z-index: 40;
          background: var(--card); border-top: 1px solid var(--border);
          align-items: stretch; justify-content: space-around;
        }
        @media (max-width: 899px) { .mobile-bottomnav { display: flex; } }

        .mnav-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 3px; background: none; border: none; color: var(--muted); cursor: pointer;
        }
        .mnav-btn.active { color: var(--teal); }
        .mnav-btn span { font-size: 10.5px; font-weight: 600; }

        .icon-btn { position: relative; display: inline-flex; cursor: pointer; }
        .dot-badge {
          position: absolute; top: -1px; right: -1px; width: 7px; height: 7px;
          border-radius: 999px; background: var(--like);
        }

        .main {
          grid-area: main;
          min-width: 0;
          padding: 24px 16px;
        }
        @media (max-width: 899px) {
          .main { padding: calc(var(--header-h) + 16px) 16px calc(var(--bottomnav-h) + 16px); }
        }

        .desktop-topbar {
          display: none;
          align-items: center; justify-content: flex-end; gap: 16px;
          margin-bottom: 20px;
        }
        @media (min-width: 900px) { .desktop-topbar { display: flex; } }
        .search-box {
          display: flex; align-items: center; gap: 8px;
          background: var(--card); border: 1px solid var(--border); border-radius: 10px;
          padding: 9px 14px; width: 240px; color: var(--muted); font-size: 13.5px;
        }

        .feed-col {
          max-width: 620px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scroll-behavior: smooth;
          overscroll-behavior-y: contain;
          scroll-snap-type: y proximity;
          overflow-y: auto;
          max-height: calc(100vh - 180px);
          padding-right: 6px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .feed-col::-webkit-scrollbar {
          display: none;
        }

        .fp-card {
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }

        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          transition: box-shadow .2s ease, transform .2s ease;
        }
        .card:hover { box-shadow: 0 8px 24px rgba(22,48,92,0.08); transform: translateY(-1px); }

        .post-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; position: relative; }
        .avatar {
          border-radius: 999px; color: #fff; display: flex; align-items: center; justify-content: center;
          font-family: 'Sora', sans-serif; font-weight: 700; flex-shrink: 0;
        }
        .post-name { font-weight: 700; font-size: 15px; }
        .post-meta { font-size: 12.5px; color: var(--muted); }
        .role-badge-inline { display: inline-flex; align-items: center; gap: 3px; background: var(--teal-soft); color: var(--teal-deep); font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 999px; margin-left: 6px; vertical-align: middle; }
        .group-badge-inline { display: inline-flex; align-items: center; gap: 3px; background: var(--bg); color: var(--navy); font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px; margin-left: 6px; vertical-align: middle; }

        .streak-badge { display: inline-flex; align-items: center; gap: 2px; background: #FFF7ED; color: #C2410C; font-size: 11px; font-weight: 800; padding: 2px 7px 2px 5px; border-radius: 999px; vertical-align: middle; }
        .streak-badge-lg { font-size: 13px; padding: 3px 10px 3px 7px; }
        .side-profile .name { display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; }
        .profile-name { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        .streak-banner {
          display: flex; align-items: center; justify-content: space-between; gap: 14px;
          border-radius: 16px; padding: 14px 18px; margin-bottom: 16px;
          background: linear-gradient(120deg, var(--navy) 0%, var(--teal-deep) 100%); color: #fff;
        }
        .streak-banner-done { background: var(--teal-soft); color: var(--ink); border: 1px solid var(--teal-border); }
        .streak-banner-left { display: flex; align-items: center; gap: 12px; font-size: 13.5px; line-height: 1.4; }
        .streak-banner-cta { background: rgba(255,255,255,.18); border: none; color: #fff; font-weight: 700; font-size: 12.5px; padding: 8px 14px; border-radius: 8px; cursor: pointer; white-space: nowrap; }
        .streak-banner-done .streak-banner-cta { background: var(--teal); }
        .streak-banner-close { background: none; border: none; cursor: pointer; display: flex; padding: 4px; opacity: .8; }
        .streak-banner-close:hover { opacity: 1; }

        .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; padding: 34px 20px; color: var(--muted); }
        .empty-state-icon { width: 48px; height: 48px; border-radius: 999px; background: var(--teal-soft); display: flex; align-items: center; justify-content: center; }
        .empty-state-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 14.5px; color: var(--ink); }
        .empty-state-sub { font-size: 12.5px; max-width: 320px; line-height: 1.5; }

        .post-text { font-size: 14.5px; line-height: 1.55; margin-bottom: 12px; }
        .status-paragraph { font-size: 15px; line-height: 1.68; margin: 0 0 14px; white-space: pre-wrap; }
        .post-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; margin-top: 12px; }
        .post-tags span { font-size: 12.5px; color: var(--teal); font-weight: 600; }

        .status-card {
          border-radius: 16px; padding: 40px 24px; margin-bottom: 4px;
          background: linear-gradient(135deg, var(--navy) 0%, var(--teal-deep) 100%);
          display: flex; align-items: center; justify-content: center; text-align: center;
          min-height: 200px; position: relative; overflow: hidden;
        }
        .status-card-text { color: #fff; font-family: 'Sora', sans-serif; font-weight: 700; font-size: clamp(18px, 4vw, 26px); line-height: 1.45; position: relative; z-index: 1; }
        .status-card .pulse-wrap { position: absolute; bottom: 12px; left: 0; right: 0; margin: 0; opacity: .55; display: flex; justify-content: center; }

        .caption-line { font-size: 13.5px; line-height: 1.5; margin: 0 0 10px; }
        .caption-line b { margin-right: 6px; }

        .ig-media { border-radius: 14px; overflow: hidden; margin-bottom: 4px; background: var(--bg); }
        .ig-media img { width: 100%; height: 100%; object-fit: cover; display: block; cursor: pointer; }
        .ig-single img { aspect-ratio: 4 / 5; max-height: 520px; }
        .ig-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
        .ig-grid-2 .ig-tile { aspect-ratio: 1; overflow: hidden; }
        .ig-grid-3 { display: grid; grid-template-columns: 1.3fr 1fr; grid-template-rows: 1fr 1fr; gap: 2px; height: 300px; }
        .ig-grid-3 .ig-tile { overflow: hidden; }
        .ig-grid-3 .ig-tile:first-child { grid-row: 1 / 3; }
        .ig-grid-4 { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
        .ig-grid-4 .ig-tile { aspect-ratio: 1; position: relative; overflow: hidden; }
        .ig-more-overlay {
          position: absolute; inset: 0; background: rgba(15,23,42,.55); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Sora', sans-serif; font-weight: 800; font-size: 22px;
        }

        .attachment-row {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--bg); border-radius: 12px; padding: 12px 14px; margin-bottom: 4px;
        }
        .attachment-left { display: flex; align-items: center; gap: 12px; }
        .attachment-icon {
          width: 38px; height: 38px; border-radius: 999px; background: #FEE2E2;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .attachment-name { font-size: 13.5px; font-weight: 700; }
        .attachment-meta { font-size: 11.5px; color: var(--muted); }

        .post-actions {
          display: flex; align-items: center; gap: 20px;
          border-top: 1px solid var(--border); padding-top: 12px; margin-top: 14px;
        }
        .action-btn {
          display: flex; align-items: center; gap: 6px; background: none; border: none;
          color: var(--muted); font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .action-btn.liked { color: var(--like); }
        .action-btn:last-child { margin-left: auto; }

        .fp-menu-btn { margin-left: auto; background: none; border: none; cursor: pointer; color: var(--muted); padding: 6px; flex-shrink: 0; }
        .fp-menu-dropdown {
          position: absolute; top: 40px; right: 0; background: #fff; border: 1px solid var(--border);
          border-radius: 10px; box-shadow: 0 8px 24px rgba(22,48,92,.14); overflow: hidden; z-index: 20; min-width: 180px;
        }
        .fp-menu-dropdown button {
          display: flex; align-items: center; gap: 8px; width: 100%; padding: 11px 14px;
          background: none; border: none; font-size: 13px; font-weight: 600; color: var(--like); cursor: pointer; text-align: left;
        }
        .fp-menu-dropdown button:hover { background: var(--bg); }

        .comments-panel { border-top: 1px solid var(--border); margin-top: 14px; padding-top: 14px; display: flex; flex-direction: column; gap: 10px; }
        .comment-row { display: flex; gap: 8px; font-size: 13px; }
        .comment-text { line-height: 1.4; }
        .comment-text b { margin-right: 6px; }
        .comment-time { font-size: 11px; color: var(--muted); margin-top: 2px; }
        .comment-empty { font-size: 12.5px; color: var(--muted); }
        .comment-input-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
        .comment-input-row input { flex: 1; border: 1px solid var(--border); border-radius: 999px; padding: 9px 14px; font-size: 13px; font-family: inherit; }
        .comment-send-btn { width: 32px; height: 32px; border-radius: 999px; border: none; background: var(--teal); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .comment-send-btn:disabled { opacity: .4; cursor: default; }

        .stories-row { display: flex; gap: 12px; overflow-x: auto; padding: 2px 2px 6px; -webkit-overflow-scrolling: touch; align-items: flex-start; }
        .story-item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; width: 64px; cursor: pointer; background: none; border: none; padding: 0; }
        .story-ring { display: none; }
        .story-ring-inner { display: none; }
        .story-name { font-size: 11px; font-weight: 600; text-align: center; max-width: 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .composer-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
          z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .composer-modal { background: #fff; border-radius: 18px; width: 100%; max-width: 540px; padding: 26px; max-height: 90vh; overflow-y: auto; }
        .composer-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .composer-modal-head h3 { margin: 0; font-family: 'Sora', sans-serif; font-size: 18px; }
        .composer-close-btn { background: var(--bg); border: none; border-radius: 999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        .composer-mode-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
        .composer-mode-tab {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 12px 8px; border-radius: 12px; border: 1.5px solid var(--border); background: #fff;
          cursor: pointer; font-size: 12px; font-weight: 700; color: var(--muted);
        }
        .composer-mode-tab.active { border-color: var(--teal); color: var(--teal-deep); background: var(--teal-soft); }

        .composer-textarea {
          width: 100%; border: 1px solid var(--border); border-radius: 12px; padding: 12px;
          font-family: inherit; font-size: 14px; resize: vertical; min-height: 100px; box-sizing: border-box;
        }
        .composer-textarea:focus, .comment-input-row input:focus { outline: none; border-color: var(--teal); }

        .composer-upload-block {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 12px;
        }
        .composer-filepick-btn {
          display: flex; align-items: center; gap: 8px; background: var(--bg); border: 1.5px dashed var(--border);
          border-radius: 12px; padding: 13px 16px; font-size: 13px; font-weight: 700; color: var(--navy);
          cursor: pointer; width: 100%; justify-content: center; box-sizing: border-box;
        }
        .composer-thumbs { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 0; }
        .composer-thumb { position: relative; width: 76px; height: 76px; border-radius: 10px; overflow: hidden; }
        .composer-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .composer-thumb button { position: absolute; top: 3px; right: 3px; width: 20px; height: 20px; border-radius: 999px; background: rgba(0,0,0,.6); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .composer-doc-preview { display: flex; align-items: center; justify-content: space-between; background: var(--bg); border-radius: 10px; padding: 11px 14px; margin-top: 12px; }
        .composer-error { color: var(--like); font-size: 12.5px; font-weight: 600; margin-top: 10px; }

        .lightbox-overlay { position: fixed; inset: 0; background: rgba(8,12,24,.92); z-index: 1200; display: flex; align-items: center; justify-content: center; }
        .lightbox-img { max-width: 92vw; max-height: 86vh; object-fit: contain; border-radius: 8px; }
        .lightbox-close { position: absolute; top: 18px; right: 20px; background: rgba(255,255,255,.15); border: none; width: 38px; height: 38px; border-radius: 999px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .lightbox-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,.15); border: none; width: 44px; height: 44px; border-radius: 999px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .lightbox-nav.prev { left: 16px; }
        .lightbox-nav.next { right: 16px; }

        .skeleton-card { height: 190px; border-radius: 16px; background: linear-gradient(90deg, #EEF1F8 25%, #E4E8F1 37%, #EEF1F8 63%); background-size: 400% 100%; animation: skeleton 1.4s ease infinite; }
        @keyframes skeleton { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
        .feed-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 12px; padding: 14px 16px; font-size: 13.5px; }
        .feed-empty { text-align: center; padding: 40px 20px; color: var(--muted); font-size: 14px; }

        .promo-card {
          background: var(--teal-soft);
          border-top: 1px solid var(--teal-border);
          border-right: 1px solid var(--teal-border);
          border-bottom: 1px solid var(--teal-border);
          border-left: 4px solid var(--teal);
          border-radius: 16px;
          padding: 20px;
        }
        .promo-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
        .promo-left { display: flex; align-items: center; gap: 12px; }
        .promo-logo {
          width: 38px; height: 38px; border-radius: 9px; background: #fff; border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .promo-company { font-weight: 700; font-size: 14.5px; }
        .promo-sub { font-size: 12px; color: var(--muted); }
        .hiring-badge {
          background: var(--teal-deep); color: #fff; font-size: 11px; font-weight: 700;
          padding: 4px 10px; border-radius: 999px; flex-shrink: 0;
        }
        .promo-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 17px; margin: 0 0 8px; }
        .promo-desc { font-size: 13.5px; line-height: 1.5; margin: 0 0 16px; }
        .promo-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .promo-tags span {
          display: inline-flex; align-items: center; gap: 5px;
          background: #fff; border: 1px solid var(--border); border-radius: 999px;
          padding: 6px 12px; font-size: 12px; font-weight: 600;
        }

        .rail {
          grid-area: rail;
          display: none;
          flex-direction: column;
          gap: 16px;
          padding: 24px 20px;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        @media (min-width: 1180px) { .rail { display: flex; } }

        .rail-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 18px; }
        .rail-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
        .rail-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 15px; }

        .trend-item + .trend-item { margin-top: 12px; }
        .trend-tag { font-size: 12.5px; color: var(--teal); font-weight: 700; }
        .trend-desc { font-size: 13px; margin-top: 2px; }

        .suggest-item { display: flex; align-items: center; justify-content: space-between; }
        .suggest-item + .suggest-item { margin-top: 12px; }
        .suggest-left { display: flex; align-items: center; gap: 10px; }
        .suggest-name { font-size: 13.5px; font-weight: 700; }
        .suggest-role { font-size: 11.5px; color: var(--muted); }
        .connect-btn {
          width: 30px; height: 30px; border-radius: 999px; flex-shrink: 0;
          border: 1px solid var(--border); background: #fff;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s ease, border-color .15s ease;
          cursor: pointer;
        }
        .connect-btn.connected { background: var(--teal); border-color: var(--teal); }

        .app.no-rail { grid-template-columns: 1fr; grid-template-areas: "main"; }
        @media (min-width: 900px) {
          .app.no-rail { grid-template-columns: var(--sidebar-w) 1fr; grid-template-areas: "sidebar main"; }
        }

        .page-wrap { max-width: 1040px; margin: 0 auto; }
        .page-head { margin-bottom: 22px; }
        .page-title { font-family: 'Sora', sans-serif; font-weight: 800; font-size: 26px; margin: 0 0 6px; }
        .page-sub { font-size: 14px; color: var(--muted); margin: 0; }

        .chip-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 18px; }
        .chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--navy); color: #fff; font-size: 12.5px; font-weight: 600;
          padding: 6px 10px 6px 12px; border-radius: 999px;
        }
        .chip button { background: none; border: none; display: flex; padding: 0; cursor: pointer; }
        .chip-clear { font-size: 12.5px; color: var(--navy); font-weight: 700; background: none; border: none; margin-left: 4px; cursor: pointer; }

        .jobs-layout { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
        .filter-panel { width: 240px; flex-shrink: 0; background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
        .filter-head { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 15px; margin-bottom: 16px; }
        .filter-group-label { font-size: 11.5px; font-weight: 700; letter-spacing: .04em; color: var(--muted); margin-bottom: 10px; }
        .check-row { display: flex; align-items: center; gap: 8px; font-size: 13.5px; margin-bottom: 10px; }
        .check-row input { width: 16px; height: 16px; accent-color: var(--teal); }
        .filter-panel input[type="range"] { width: 100%; margin: 10px 0 6px; accent-color: var(--teal); }
        .range-labels { display: flex; justify-content: space-between; font-size: 11.5px; color: var(--muted); }

        .job-list { flex: 1; min-width: 260px; display: flex; flex-direction: column; gap: 16px; }
        .job-card { border-left: 4px solid var(--teal); }
        .job-card .card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
        .job-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 17px; margin: 0; }
        .job-company { font-size: 13px; color: var(--muted); margin: 4px 0 12px; }
        .urgent-badge { background: var(--teal-deep); color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; flex-shrink: 0; white-space: nowrap; display: flex; align-items: center; gap: 4px; }
        .job-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .job-tags span { display: inline-flex; align-items: center; gap: 5px; background: var(--bg); border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 600; }
        .job-desc { font-size: 13.5px; line-height: 1.5; color: var(--ink); margin: 0 0 14px; }
        .job-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--border); }
        .job-posted { font-size: 12px; color: var(--muted); }
        .job-actions { display: flex; align-items: center; gap: 12px; }
        .bookmark-btn { background: none; border: none; display: flex; cursor: pointer; }
        .apply-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--navy); color: #fff; border: none; border-radius: 9px;
          padding: 9px 16px; font-size: 13px; font-weight: 700; cursor: pointer;
        }
        .apply-btn.outline { background: #fff; color: var(--navy); border: 1px solid var(--navy); }

        .pill-row { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .pill {
          background: #fff; border: 1px solid var(--border); border-radius: 999px;
          padding: 8px 16px; font-size: 13px; font-weight: 600; color: var(--ink); cursor: pointer;
        }
        .pill.active { background: var(--navy); color: #fff; border-color: var(--navy); }

        .doc-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 640px) { .doc-grid { grid-template-columns: 1fr 1fr; } }

        .doc-card { display: flex; flex-direction: column; }
        .doc-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .doc-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .doc-badge { font-size: 11.5px; font-weight: 700; color: var(--teal); background: var(--teal-soft); padding: 4px 10px; border-radius: 999px; }
        .doc-date { font-size: 11.5px; color: var(--muted); }
        .doc-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 15.5px; margin: 0 0 6px; }
        .doc-desc { font-size: 13px; color: var(--muted); line-height: 1.45; margin: 0 0 16px; flex: 1; }
        .doc-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--border); font-size: 12px; color: var(--muted); }
        .doc-footer-left { display: flex; align-items: center; gap: 8px; }

        .upload-tile {
          border: 2px dashed var(--border); border-radius: 16px; background: transparent;
          display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
          padding: 30px 20px; gap: 10px; min-height: 170px; cursor: pointer;
        }
        .upload-tile .upload-circle { width: 44px; height: 44px; border-radius: 999px; background: var(--navy); display: flex; align-items: center; justify-content: center; }
        .upload-tile .upload-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 15px; color: var(--navy); }
        .upload-tile .upload-sub { font-size: 12.5px; color: var(--muted); }

        .profile-banner {
          height: 150px; border-radius: 16px 16px 0 0;
          background: linear-gradient(120deg, var(--navy) 0%, var(--teal-deep) 100%);
          position: relative;
        }
        .profile-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
        .profile-body { padding: 0 24px 24px; position: relative; }
        .profile-avatar-lg {
          width: 88px; height: 88px; border-radius: 999px; border: 4px solid #fff;
          margin-top: -44px; font-size: 30px; position: relative;
        }
        .profile-edit-btn {
          position: absolute; top: 14px; right: 14px; width: 34px; height: 34px; border-radius: 999px;
          background: rgba(255,255,255,.9); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .profile-name-row { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
        .profile-name { font-family: 'Sora', sans-serif; font-weight: 800; font-size: 24px; margin: 0; }
        .profile-role { display: flex; align-items: center; gap: 6px; font-size: 13.5px; color: var(--muted); margin-top: 4px; }
        .profile-bio { font-size: 13.5px; color: var(--ink); line-height: 1.55; margin: 10px 0 0; max-width: 520px; }
        .profile-btns { display: flex; gap: 8px; }
        .edit-profile-btn { background: var(--navy); color: #fff; border: none; border-radius: 9px; padding: 9px 16px; font-weight: 700; font-size: 13px; cursor: pointer; }
        .settings-btn { width: 36px; height: 36px; border-radius: 9px; border: 1px solid var(--border); background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .profile-stats { display: flex; gap: 28px; margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--border); }
        .stat-num { font-family: 'Sora', sans-serif; font-weight: 800; font-size: 18px; }
        .stat-label { font-size: 12px; color: var(--muted); }

        .profile-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 18px; }
        .tab-btn { background: none; border: none; padding: 12px 16px; font-size: 13.5px; font-weight: 600; color: var(--muted); border-bottom: 2px solid transparent; cursor: pointer; }
        .tab-btn.active { color: var(--navy); border-color: var(--teal); }
        .profile-content { display: flex; flex-direction: column; gap: 14px; }
      `}</style>

      {/* ============ Sidebar (>=900px) ============ */}
      <aside className="sidebar">
        <div className="brand-row" onClick={onHome} title="Zurück zur Startseite">
          <div className="brand-mark">
            <Icon name="activity" size={17} color="#fff" strokeWidth={2.4} />
          </div>
          <span className="brand">PflegeFeed</span>
        </div>

        <div className="pulse-wrap">
          <PulseSvg />
        </div>

        <div className="side-profile" onClick={() => setActiveNav("profile")}>
          <AvatarCircle name={me.name} size={56} fontSize={20} avatarType={me.avatarType} avatarIcon={me.avatarIcon} avatarUrl={me.avatarUrl} />
          <div className="name">{me.name} <StreakBadge count={streak?.current} /></div>
          <div className="role">{me.title || (me.role === "teacher" ? "Lehrer / Administrator" : "Pflegeschüler(in)")}</div>
          <div className="verified-tag">
            <Icon name="badge" size={13} color="var(--verified)" /> Verified Status
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`nav-btn ${activeNav === item.key ? "active" : ""}`}
              onClick={() => setActiveNav(item.key)}
            >
              <Icon name={item.icon} size={18} color={activeNav === item.key ? "#fff" : "var(--ink)"} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <button className="post-btn" onClick={() => openComposer("status")}>
          <Icon name="plus" size={17} color="#fff" />
          <span>Post Update</span>
        </button>
      </aside>

      {/* ============ Mobile Header (<900px) ============ */}
      <header className="mobile-header">
        <div className="brand-row" onClick={onHome}>
          <div className="brand-mark" style={{ width: "26px", height: "26px", borderRadius: "7px" }}>
            <Icon name="activity" size={14} color="#fff" strokeWidth={2.4} />
          </div>
          <span className="brand" style={{ fontSize: "16.5px" }}>PflegeFeed</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span className="icon-btn">
            <Icon name="search" size={19} color="var(--navy)" />
          </span>
          <span className="icon-btn">
            <Icon name="bell" size={19} color="var(--navy)" />
            <span className="dot-badge" />
          </span>
          <div onClick={() => setActiveNav("profile")} style={{ cursor: "pointer" }}>
            <AvatarCircle name={me.name} size={26} fontSize={10} avatarType={me.avatarType} avatarIcon={me.avatarIcon} avatarUrl={me.avatarUrl} />
          </div>
        </div>
      </header>

      {/* ============ Main Workspace ============ */}
      <main className="main">
        <div className="desktop-topbar">
          <div className="search-box">
            <Icon name="search" size={16} color="var(--muted)" />
            <span>Search posts, people...</span>
          </div>
          <span className="icon-btn">
            <Icon name="bell" size={20} color="var(--navy)" />
            <span className="dot-badge" />
          </span>
        </div>

        {/* FEED PAGE */}
        {activeNav === "feed" && (
          <>
            {isLoggedIn && streak && !streakBannerDismissed && (streak.current > 0 || !streak.postedToday) && (
              <div className={`streak-banner ${streak.postedToday ? "streak-banner-done" : ""}`}>
                <div className="streak-banner-left">
                  <Icon name="flame" size={20} color={streak.postedToday ? "#EA580C" : "#fff"} strokeWidth={2.2} />
                  <div>
                    {streak.current > 0 ? (
                      <>
                        <b>{streak.current}-Tage-Streak!</b>{" "}
                        {streak.postedToday ? "Heute schon gepostet — stark." : "Poste heute etwas, um ihn zu halten."}
                      </>
                    ) : (
                      <><b>Starte deinen Streak!</b> Teile heute ein Update aus deinem Praktikum.</>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {!streak.postedToday && (
                    <button className="streak-banner-cta" onClick={() => openComposer("status")}>Jetzt posten</button>
                  )}
                  <button className="streak-banner-close" onClick={() => setStreakBannerDismissed(true)}>
                    <Icon name="x" size={14} color={streak.postedToday ? "var(--muted)" : "#fff"} />
                  </button>
                </div>
              </div>
            )}

            <div ref={feedScrollRef} className="feed-col">

              {feedError && <div className="feed-error">{feedError}</div>}

              {feedLoading && (
                <>
                  <div className="skeleton-card" />
                  <div className="skeleton-card" />
                </>
              )}

              {!feedLoading && posts.length === 0 && !feedError && (
                <EmptyState icon="edit" title="Noch keine Beiträge" sub="Sei der/die Erste und teile ein Update!" />
              )}

              {!feedLoading && posts.map(post => <PostCard key={post.id} post={post} {...postCardProps} />)}

              {/* Promoted Job Card */}
              {!feedLoading && (
                <article className="card promo-card" style={{ marginTop: 0 }}>
                  <div className="promo-head">
                    <div className="promo-left">
                      <div className="promo-logo">
                        <Icon name="plus" size={18} color="var(--teal)" />
                      </div>
                      <div>
                        <div className="promo-company">Klinikum am Park</div>
                        <div className="promo-sub">Promoted Job</div>
                      </div>
                    </div>
                    <span className="hiring-badge">HIRING</span>
                  </div>
                  <h3 className="promo-title">Pflegefachkraft (m/w/d) – Minijob</h3>
                  <p className="promo-desc">
                    Wir suchen Unterstützung für unser Pflegeteam an Wochenenden. Flexible Arbeitszeiten, attraktive Vergütung und ein tolles Team warten auf dich!
                  </p>
                  <div className="promo-tags">
                    <span>
                      <Icon name="clock" size={13} color="var(--ink)" /> Minijob / 538€
                    </span>
                    <span>
                      <Icon name="mappin" size={13} color="var(--ink)" /> Berlin-Mitte
                    </span>
                  </div>
                </article>
              )}
            </div>
          </>
        )}

        {/* NETZWERK PAGE */}
        {activeNav === "netzwerk" && (
          <FeedNetzwerk me={me} onOpenAuthModal={onOpenAuthModal} />
        )}

        {/* JOBS PAGE */}
        {activeNav === "jobs" && (
          <div className="page-wrap">
            <div className="page-head">
              <h1 className="page-title">Jobs für Pflegestudierende</h1>
              <p className="page-sub">Finde den passenden Nebenjob oder Ausbildungsplatz während deines Studiums.</p>
            </div>

            <div className="chip-row">
              {activeJobChips.map(chip => (
                <span key={chip} className="chip">
                  {chip}
                  <button onClick={() => setActiveJobChips(prev => prev.filter(c => c !== chip))}>
                    <Icon name="x" size={11} color="#fff" />
                  </button>
                </span>
              ))}
              {activeJobChips.length > 0 && (
                <button className="chip-clear" onClick={() => setActiveJobChips([])}>
                  Alle löschen
                </button>
              )}
            </div>

            <div className="jobs-layout">
              <div className="filter-panel">
                <div className="filter-head">
                  <Icon name="filter" size={17} color="var(--navy)" /> Filter
                </div>
                <div className="filter-group-label">JOB ART</div>
                <label className="check-row">
                  <input type="checkbox" defaultChecked /> Werkstudent (Minijob)
                </label>
                <label className="check-row">
                  <input type="checkbox" defaultChecked /> Teilzeit
                </label>
                <label className="check-row">
                  <input type="checkbox" /> Ausbildung
                </label>

                <div className="filter-group-label" style={{ marginTop: "16px" }}>
                  STANDORT
                </div>
                <label className="check-row">
                  <Icon name="mappin" size={14} color="var(--muted)" /> Berlin
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={distanceKm}
                  onChange={e => setDistanceKm(e.target.value)}
                />
                <div className="range-labels">
                  <span>0 km</span>
                  <span>+{distanceKm} km</span>
                </div>
              </div>

              <div className="job-list">
                {JOBS.map(job => {
                  const isBookmarked = bookmarkedJobs.includes(job.id);
                  return (
                    <article className="card job-card" key={job.id}>
                      <div className="card-top">
                        <div>
                          <h3 className="job-title">{job.title}</h3>
                          <div className="job-company">{job.company}</div>
                        </div>
                        {job.urgent && (
                          <span className="urgent-badge">
                            <Icon name="clock" size={12} color="#fff" /> DRINGEND
                          </span>
                        )}
                      </div>

                      <div className="job-tags">
                        {job.tags.map((t, idx) => (
                          <span key={idx}>
                            {t[0] !== "none" && <Icon name={t[0]} size={12} color="var(--ink)" />}
                            {t[1]}
                          </span>
                        ))}
                      </div>

                      <p className="job-desc">{job.desc}</p>

                      <div className="job-footer">
                        <span className="job-posted">{job.posted}</span>
                        <div className="job-actions">
                          <button
                            className="bookmark-btn"
                            onClick={() => setBookmarkedJobs(prev => prev.includes(job.id) ? prev.filter(i => i !== job.id) : [...prev, job.id])}
                          >
                            <Icon name="bookmark" size={18} color={isBookmarked ? "var(--teal)" : "var(--muted)"} />
                          </button>
                          <button
                            className={`apply-btn ${job.primary ? "" : "outline"}`}
                            onClick={() => alert(`Bewerbung für ${job.title}`)}
                          >
                            {job.primary && <Icon name="plus" size={14} color="#fff" />}
                            {job.cta}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS PAGE */}
        {activeNav === "documents" && (
          <div className="page-wrap">
            <div className="page-head">
              <h1 className="page-title">Clinical Library</h1>
              <p className="page-sub">Shared protocols, studies, and essential templates.</p>
            </div>

            <div className="pill-row">
              {["All Files", "Protocols", "Studies", "Templates"].map(p => (
                <button
                  key={p}
                  className={`pill ${activeDocFilter === p ? "active" : ""}`}
                  onClick={() => setActiveDocFilter(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="doc-grid">
              {visibleDocs.map(doc => (
                <div className="card doc-card" key={doc.id}>
                  <div className="doc-top">
                    <div className="doc-icon" style={{ background: doc.iconBg }}>
                      <Icon name={doc.icon} size={19} color={doc.iconColor} />
                    </div>
                    {doc.badge ? (
                      <span className="doc-badge">{doc.badge}</span>
                    ) : doc.date ? (
                      <span className="doc-date">{doc.date}</span>
                    ) : null}
                  </div>

                  <h3 className="doc-title">{doc.title}</h3>
                  <p className="doc-desc">{doc.desc}</p>

                  <div className="doc-footer">
                    <span className="doc-footer-left">{doc.meta}</span>
                    <button
                      onClick={() => alert(`Downloading ${doc.title}...`)}
                      style={{ background: "none", border: "none", cursor: "pointer" }}
                    >
                      <Icon name="download" size={17} color="var(--navy)" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="upload-tile" onClick={() => openComposer("document")}>
                <div className="upload-circle">
                  <Icon name="upload" size={20} color="#fff" />
                </div>
                <div className="upload-title">Upload Document</div>
                <div className="upload-sub">Share a protocol or template with the community.</div>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE PAGE */}
        {activeNav === "profile" && (
          <div className="page-wrap">
            <div className="profile-card">
              <div className="profile-banner">
                <button className="profile-edit-btn" onClick={() => alert("Edit cover banner")}>
                  <Icon name="edit" size={16} color="var(--navy)" />
                </button>
              </div>

              <div className="profile-body">
                <AvatarCircle name={me.name} size={88} fontSize={30} avatarType={me.avatarType} avatarIcon={me.avatarIcon} avatarUrl={me.avatarUrl} style={{ borderRadius: "999px", border: "4px solid #fff", marginTop: "-44px" }} />

                <div className="profile-name-row">
                  <div>
                    <h2 className="profile-name">{me.name} <StreakBadge count={streak?.current} size="lg" /></h2>
                    <div className="profile-role">
                      <Icon name="book" size={15} color="var(--muted)" /> {me.title || (me.role === "teacher" ? "Lehrer / Administrator" : "Pflegeschülerin")}
                    </div>
                    <p className="profile-bio">
                      Teil der PflegeFeed Community. Teile Fotos, Status-Updates und hilfreiche Dokumente mit deinen Kommiliton:innen.
                    </p>
                  </div>

                  <div className="profile-btns">
                    <button className="edit-profile-btn" onClick={() => alert("Edit profile details")}>
                      Edit Profile
                    </button>
                    <button className="settings-btn" onClick={() => alert("Profile settings")}>
                      <Icon name="settings" size={17} color="var(--ink)" />
                    </button>
                  </div>
                </div>

                <div className="profile-stats">
                  <div>
                    <div className="stat-num">{myPosts.length}</div>
                    <div className="stat-label">Posts</div>
                  </div>
                  <div>
                    <div className="stat-num">{myPosts.filter(p => p.type === "document").length}</div>
                    <div className="stat-label">Documents</div>
                  </div>
                  <div>
                    <div className="stat-num">{friendsCount ?? "–"}</div>
                    <div className="stat-label">Freunde</div>
                  </div>
                  <div>
                    <div className="stat-num">{streak?.current ?? 0}</div>
                    <div className="stat-label">Tage-Streak</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-tabs">
              {[
                ["posts", "Meine Beiträge"],
                ["docs", "Geteilte Dokumente"],
                ["jobs", "Gespeicherte Jobs"]
              ].map(t => (
                <button
                  key={t[0]}
                  className={`tab-btn ${activeProfileTab === t[0] ? "active" : ""}`}
                  onClick={() => setActiveProfileTab(t[0])}
                >
                  {t[1]}
                </button>
              ))}
            </div>

            <div className="profile-content">
              {activeProfileTab === "posts" && (
                myPosts.length === 0
                  ? <EmptyState icon="edit" title="Noch keine Beiträge" sub="Du hast noch keine Beiträge geteilt." />
                  : myPosts.map(post => <PostCard key={post.id} post={post} {...postCardProps} />)
              )}

              {activeProfileTab === "docs" && (
                myPosts.filter(p => p.type === "document").length === 0
                  ? <div className="feed-empty">Noch keine Dokumente geteilt.</div>
                  : myPosts.filter(p => p.type === "document").map(post => (
                    <div className="card attachment-row" style={{ marginBottom: 0 }} key={post.id}>
                      <div className="attachment-left">
                        <div className="attachment-icon" style={{ background: "#DCEAFE" }}>
                          <Icon name="file" size={18} color="#2563EB" />
                        </div>
                        <div>
                          <div className="attachment-name">{post.document.name}</div>
                          <div className="attachment-meta">Geteilt {timeAgo(post.createdAt)} · {formatFileSize(post.document.size)}</div>
                        </div>
                      </div>
                      <a href={post.document.url} download={post.document.name} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                        <Icon name="download" size={17} color="var(--navy)" />
                      </a>
                    </div>
                  ))
              )}

              {activeProfileTab === "jobs" && (
                <div className="card job-card">
                  <h3 className="job-title" style={{ fontSize: "15px" }}>
                    Pflegestudent (m/w/d) - Intensivstation
                  </h3>
                  <div className="job-company">Klinikum Berlin Mitte · Berlin (Mitte)</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ============ Right Rail (>=1180px, Feed view only) ============ */}
      {activeNav === "feed" && (
        <aside className="rail">
          <div className="rail-card">
            <div className="rail-head">
              <Icon name="trending" size={17} color="var(--teal)" />
              <span className="rail-title">Trending Topics</span>
            </div>
            {TRENDING.map((t, idx) => (
              <div className="trend-item" key={idx}>
                <div className="trend-tag">{t.tag}</div>
                <div className="trend-desc">{t.desc}</div>
              </div>
            ))}
          </div>

          {isLoggedIn && suggested.length > 0 && (
            <div className="rail-card">
              <div className="rail-head">
                <Icon name="userplus" size={17} color="var(--navy)" />
                <span className="rail-title">Vorgeschlagen</span>
              </div>
              {suggested.map(p => (
                <div className="suggest-item" key={p.id}>
                  <div className="suggest-left">
                    <AvatarCircle name={p.name} size={36} fontSize={13} avatarType={p.avatarType} avatarIcon={p.avatarIcon} avatarUrl={p.avatarUrl} />
                    <div>
                      <div className="suggest-name">{p.name}</div>
                      <div className="suggest-role">{p.title}</div>
                    </div>
                  </div>
                  <button className="connect-btn" onClick={() => handleSendFriendRequest(p.id)} title="Freundschaftsanfrage senden">
                    <Icon name="plus" size={15} color="var(--navy)" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isLoggedIn && myGroups.length > 0 && (
            <div className="rail-card">
              <div className="rail-head">
                <Icon name="activity" size={17} color="var(--teal)" />
                <span className="rail-title">Meine Gruppen</span>
              </div>
              {myGroups.slice(0, 5).map(g => (
                <div className="suggest-item" key={g.id} style={{ cursor: "pointer" }} onClick={() => setActiveNav("netzwerk")}>
                  <div className="suggest-left">
                    <AvatarCircle name={g.name} size={36} fontSize={13} />
                    <div>
                      <div className="suggest-name">{g.name}</div>
                      <div className="suggest-role">{g.memberCount} Mitglied{g.memberCount === 1 ? "" : "er"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      )}

      {/* ============ Mobile Bottom Nav (<900px) ============ */}
      <nav className="mobile-bottomnav">
        {navItems.map(item => (
          <button
            key={item.key}
            className={`mnav-btn ${activeNav === item.key ? "active" : ""}`}
            onClick={() => setActiveNav(item.key)}
          >
            <Icon name={item.icon} size={19} color={activeNav === item.key ? "var(--teal)" : "var(--muted)"} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ============ Composer Modal ============ */}
      {showComposer && (
        <div className="composer-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeComposer(); }}>
          <div className="composer-modal">
            <div className="composer-modal-head">
              <h3>Neuer Beitrag</h3>
              <button className="composer-close-btn" onClick={closeComposer}>
                <Icon name="x" size={16} color="var(--ink)" />
              </button>
            </div>

            <div className="composer-mode-tabs">
              {COMPOSER_MODES.map(m => (
                <button
                  key={m.key}
                  type="button"
                  className={`composer-mode-tab ${composerMode === m.key ? "active" : ""}`}
                  onClick={() => { setComposerMode(m.key); setComposerError(""); }}
                >
                  <Icon name={m.icon} size={18} color={composerMode === m.key ? "var(--teal-deep)" : "var(--muted)"} />
                  {m.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmitPost}>
              <textarea
                className="composer-textarea"
                placeholder={
                  composerMode === "status" ? "Wie war deine Schicht heute? Teile ein Update... (#hashtags werden erkannt)" :
                    composerMode === "photo" ? "Schreibe eine Bildunterschrift..." :
                      "Beschreibe kurz, worum es in dem Dokument geht..."
                }
                value={composerText}
                onChange={e => setComposerText(e.target.value)}
              />

              {composerMode === "photo" && (
                <div className="composer-upload-block">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={handlePickImages}
                  />
                  <button type="button" className="composer-filepick-btn" onClick={() => imageInputRef.current?.click()}>
                    <Icon name="image" size={17} color="var(--navy)" /> Fotos hinzufügen ({composerImages.length}/6)
                  </button>
                  {composerImages.length > 0 && (
                    <div className="composer-thumbs">
                      {composerImages.map((img, idx) => (
                        <div className="composer-thumb" key={idx}>
                          <img src={img.url} alt="" />
                          <button type="button" onClick={() => removeImage(idx)}>
                            <Icon name="x" size={11} color="#fff" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {composerMode === "document" && (
                <div className="composer-upload-block">
                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    style={{ display: "none" }}
                    onChange={handlePickDoc}
                  />
                  {!composerDoc ? (
                    <button type="button" className="composer-filepick-btn" onClick={() => docInputRef.current?.click()}>
                      <Icon name="upload" size={17} color="var(--navy)" /> Dokument auswählen (PDF, DOC, DOCX, TXT)
                    </button>
                  ) : (
                    <div className="composer-doc-preview">
                      <div className="attachment-left">
                        <div className="attachment-icon">
                          <Icon name="file" size={18} color="#DC2626" />
                        </div>
                        <div>
                          <div className="attachment-name">{composerDoc.name}</div>
                          <div className="attachment-meta">{formatFileSize(composerDoc.size)}</div>
                        </div>
                      </div>
                      <button type="button" onClick={() => setComposerDoc(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                        <Icon name="x" size={16} color="var(--muted)" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {composerError && <div className="composer-error">{composerError}</div>}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
                <button
                  type="button"
                  onClick={closeComposer}
                  style={{ padding: "10px 16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "10px 20px", background: "var(--teal)", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Wird gepostet..." : "Posten"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ Lightbox ============ */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={(e) => { if (e.target === e.currentTarget) setLightbox(null); }}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}>
            <Icon name="x" size={18} color="#fff" />
          </button>
          {lightbox.images.length > 1 && (
            <button
              className="lightbox-nav prev"
              onClick={() => setLightbox(lb => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length }))}
            >
              <Icon name="chevronleft" size={20} color="#fff" />
            </button>
          )}
          <img className="lightbox-img" src={lightbox.images[lightbox.index]} alt="" />
          {lightbox.images.length > 1 && (
            <button
              className="lightbox-nav next"
              onClick={() => setLightbox(lb => ({ ...lb, index: (lb.index + 1) % lb.images.length }))}
            >
              <Icon name="chevronright" size={20} color="#fff" />
            </button>
          )}
        </div>
      )}

    </div>
  );
}
