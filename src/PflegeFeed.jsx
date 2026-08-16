/**
 * PflegeFeed.jsx — Nursing Social Network, Job Portal & Clinical Library
 * 
 * Re-designed using requested Design Tokens, Typography (Sora + Inter),
 * CSS Grid App Shell, Hand-Drawn Inline SVG Icons, and Interactive Features.
 */

import React, { useState } from "react";

// Inline Hand-Drawn SVG Icon Helper
function Icon({ name, size = 18, color = "currentColor", strokeWidth = 2, className = "" }) {
  const paths = {
    home: '<path d="M4 11 L12 4 L20 11"/><path d="M6 10 V20 H18 V10"/>',
    briefcase: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8 V6 a2 2 0 0 1 2-2 h2 a2 2 0 0 1 2 2 v2"/>',
    file: '<path d="M6 3 H14 L18 7 V21 H6 Z"/><path d="M14 3 V7 H18"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21 c0-4.4 3.6-8 8-8 s8 3.6 8 8"/>',
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
    filter: '<line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="7" cy="18" r="2"/>'
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

function PulseSvg() {
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

const INITIAL_POSTS = [
  {
    id: "p1",
    name: "Lukas Schmidt",
    role: "Pflegeschüler im 3. Lehrjahr",
    time: "2 Std.",
    color: "#3B82F6",
    initials: "LS",
    text: "Erster Tag auf der Intensivstation! Die Einarbeitung war super strukturiert und das Team ist fantastisch. Ich freue mich auf die kommenden Wochen und alles, was ich hier lernen werde.",
    tags: ["#Pflege", "#Praktikum", "#Intensivpflege"],
    illustration: true,
    likes: 38,
    comments: 6,
    liked: false
  },
  {
    id: "p2",
    name: "Dr. med. K. Fischer",
    role: "Pflegepädagoge",
    time: "5 Std.",
    color: "var(--navy)",
    initials: "KF",
    text: "Zur Erinnerung: Die neuen Standards für die moderne Wundversorgung sind ab nächster Woche gültig. Ich habe die Zusammenfassung noch einmal angehängt. Bitte lesen!",
    attachment: { name: "Wundversorgung_Protocol_v2.pdf", meta: "PDF · 1.2 MB" },
    likes: 24,
    comments: 5,
    liked: false
  }
];

const TRENDING = [
  { tag: "#Pflegekammer", desc: "Diskussion zur neuen Beitragsordnung" },
  { tag: "#Fortbildung", desc: "Top 5 Online-Seminare 2024" },
  { tag: "#Schichtdienst", desc: "Tipps für einen gesunden Schlaf" }
];

const INITIAL_SUGGESTED = [
  { id: "s1", name: "Max Bauer", role: "Stationsleitung", color: "#0F766E", initials: "MB", connected: false },
  { id: "s2", name: "Julia Koch", role: "Wundexpertin ICW", color: "#B45309", initials: "JK", connected: false }
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
    title: "2024 Advanced Cardiac Life Support (ACLS) Guidelines",
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
    title: "Infection Control Policy 2024",
    desc: "Updated ward hygiene requirements.",
    meta: "PDF · 3.1 MB",
    date: "Oct 12",
    category: "Protocols"
  }
];

export default function PflegeFeed({ onHome }) {
  const [activeNav, setActiveNav] = useState("feed"); // 'feed' | 'jobs' | 'documents' | 'profile'
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [suggested, setSuggested] = useState(INITIAL_SUGGESTED);
  const [activeDocFilter, setActiveDocFilter] = useState("All Files");
  const [activeProfileTab, setActiveProfileTab] = useState("posts"); // 'posts' | 'docs' | 'jobs'

  // Modal / Action states
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [bookmarkedJobs, setBookmarkedJobs] = useState([]);

  // Job Filters
  const [activeJobChips, setActiveJobChips] = useState(["Werkstudent", "Teilzeit", "Berlin (+20km)"]);
  const [distanceKm, setDistanceKm] = useState(20);

  // Like Toggle
  const handleLike = (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  // Connect Toggle
  const handleConnect = (id) => {
    setSuggested(prev => prev.map(s => s.id === id ? { ...s, connected: !s.connected } : s));
  };

  // Create Post Submit
  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newObj = {
      id: `p-${Date.now()}`,
      name: "Anna Müller",
      role: "Nursing Professional",
      time: "Just now",
      color: "var(--teal)",
      initials: "AM",
      text: newPostText.trim(),
      likes: 0,
      comments: 0,
      liked: false
    };

    setPosts(prev => [newObj, ...prev]);
    setNewPostText("");
    setShowPostModal(false);
  };

  const navItems = [
    { key: "feed", label: "Feed", icon: "home" },
    { key: "jobs", label: "Jobs", icon: "briefcase" },
    { key: "documents", label: "Documents", icon: "file" },
    { key: "profile", label: "Profile", icon: "user" }
  ];

  const visibleDocs = activeDocFilter === "All Files" ? DOCUMENTS : DOCUMENTS.filter(d => d.category === activeDocFilter);

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
        }

        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          transition: box-shadow .2s ease, transform .2s ease;
        }
        .card:hover { box-shadow: 0 8px 24px rgba(22,48,92,0.08); transform: translateY(-1px); }

        .post-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .avatar {
          border-radius: 999px; color: #fff; display: flex; align-items: center; justify-content: center;
          font-family: 'Sora', sans-serif; font-weight: 700; flex-shrink: 0;
        }
        .post-name { font-weight: 700; font-size: 15px; }
        .post-meta { font-size: 12.5px; color: var(--muted); }

        .post-text { font-size: 14.5px; line-height: 1.55; margin-bottom: 12px; }
        .post-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
        .post-tags span { font-size: 12.5px; color: var(--teal); font-weight: 600; }

        .post-illustration {
          border-radius: 12px; height: 160px; margin-bottom: 16px;
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-deep) 100%);
          display: flex; align-items: center; justify-content: center;
        }

        .attachment-row {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--bg); border-radius: 12px; padding: 12px 14px; margin-bottom: 16px;
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
          border-top: 1px solid var(--border); padding-top: 12px;
        }
        .action-btn {
          display: flex; align-items: center; gap: 6px; background: none; border: none;
          color: var(--muted); font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .action-btn.liked { color: var(--like); }
        .action-btn:last-child { margin-left: auto; }

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
          <div className="avatar" style={{ width: "56px", height: "56px", fontSize: "20px", background: "var(--teal)" }}>
            AM
          </div>
          <div className="name">Anna Müller</div>
          <div className="role">Nursing Professional</div>
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
        <button className="post-btn" onClick={() => setShowPostModal(true)}>
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
          <div className="avatar" onClick={() => setActiveNav("profile")} style={{ width: "26px", height: "26px", fontSize: "10px", background: "var(--teal)", cursor: "pointer" }}>
            AM
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
          <div className="feed-col">
            {posts.map(post => (
              <article className="card" key={post.id}>
                <div className="post-head">
                  <div className="avatar" style={{ width: "44px", height: "44px", fontSize: "16px", background: post.color }}>
                    {post.initials}
                  </div>
                  <div>
                    <div className="post-name">{post.name}</div>
                    <div className="post-meta">{post.role} · {post.time}</div>
                  </div>
                </div>

                <p className="post-text">{post.text}</p>

                {post.tags && (
                  <div className="post-tags">
                    {post.tags.map((t, idx) => (
                      <span key={idx}>{t}</span>
                    ))}
                  </div>
                )}

                {post.illustration && (
                  <div className="post-illustration">
                    <svg width="72%" height="60%" viewBox="0 0 200 90" fill="none">
                      <rect x="4" y="10" width="46" height="34" rx="4" stroke="var(--teal)" strokeWidth="1.6" opacity="0.9" />
                      <path d="M8 32 L16 32 L20 20 L26 40 L31 26 L36 32 L46 32" stroke="#34D399" strokeWidth="1.6" fill="none" />
                      <rect x="58" y="4" width="46" height="34" rx="4" stroke="var(--teal)" strokeWidth="1.6" opacity="0.7" />
                      <path d="M62 22 L70 22 L74 12 L80 30 L85 18 L90 22 L100 22" stroke="#60A5FA" strokeWidth="1.6" fill="none" />
                      <rect x="112" y="14" width="82" height="60" rx="6" stroke="#fff" strokeWidth="1.6" opacity="0.85" />
                      <circle cx="153" cy="44" r="16" stroke="var(--teal)" strokeWidth="1.4" opacity="0.6" />
                      <path d="M118 74 Q153 88 188 74" stroke="#fff" strokeWidth="1.4" opacity="0.4" fill="none" />
                    </svg>
                  </div>
                )}

                {post.attachment && (
                  <div className="attachment-row">
                    <div className="attachment-left">
                      <div className="attachment-icon">
                        <Icon name="file" size={18} color="#DC2626" />
                      </div>
                      <div>
                        <div className="attachment-name">{post.attachment.name}</div>
                        <div className="attachment-meta">{post.attachment.meta}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Downloading ${post.attachment.name}...`)}
                      style={{ background: "none", border: "none", cursor: "pointer" }}
                    >
                      <Icon name="download" size={17} color="var(--navy)" />
                    </button>
                  </div>
                )}

                <div className="post-actions">
                  <button className={`action-btn ${post.liked ? "liked" : ""}`} onClick={() => handleLike(post.id)}>
                    <Icon name="heart" size={17} color={post.liked ? "var(--like)" : "var(--muted)"} />
                    <span>{post.likes}</span>
                  </button>
                  <button className="action-btn">
                    <Icon name="message" size={17} color="var(--muted)" />
                    <span>{post.comments}</span>
                  </button>
                  <button className="action-btn">
                    <Icon name="share" size={16} color="var(--muted)" />
                  </button>
                </div>
              </article>
            ))}

            {/* Promoted Job Card */}
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
          </div>
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

              <div className="upload-tile" onClick={() => alert("Upload dialog opened")}>
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
                <div className="avatar profile-avatar-lg" style={{ background: "var(--teal)" }}>
                  AM
                </div>

                <div className="profile-name-row">
                  <div>
                    <h2 className="profile-name">Anna Müller</h2>
                    <div className="profile-role">
                      <Icon name="book" size={15} color="var(--muted)" /> Pflegeschülerin
                    </div>
                    <p className="profile-bio">
                      Passionate about patient care and learning new techniques. Currently completing practical rotations at St. Marien Hospital.
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
                    <div className="stat-num">42</div>
                    <div className="stat-label">Posts</div>
                  </div>
                  <div>
                    <div className="stat-num">12</div>
                    <div className="stat-label">Documents</div>
                  </div>
                  <div>
                    <div className="stat-num">128</div>
                    <div className="stat-label">Contacts</div>
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
                <div className="card">
                  <div className="post-head">
                    <div className="avatar" style={{ width: "40px", height: "40px", fontSize: "14px", background: "var(--teal)" }}>
                      AM
                    </div>
                    <div>
                      <div className="post-name">Anna Müller</div>
                      <div className="post-meta">2 hours ago</div>
                    </div>
                  </div>
                  <p className="post-text" style={{ marginBottom: "14px" }}>
                    Just finished a really interesting shift in the ER. The pace is incredible, but you learn so much about rapid assessment. Huge thanks to my mentor today!
                  </p>
                  <div className="post-actions" style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="action-btn">
                      <Icon name="heart" size={16} color="var(--muted)" />
                      <span>12</span>
                    </span>
                    <span className="action-btn">
                      <Icon name="message" size={16} color="var(--muted)" />
                      <span>3</span>
                    </span>
                  </div>
                </div>
              )}

              {activeProfileTab === "docs" && (
                <div className="card attachment-row" style={{ marginBottom: 0 }}>
                  <div className="attachment-left">
                    <div className="attachment-icon" style={{ background: "#DCEAFE" }}>
                      <Icon name="file" size={18} color="#2563EB" />
                    </div>
                    <div>
                      <div className="attachment-name">Hygiene Protocols Summary 2024.pdf</div>
                      <div className="attachment-meta">Shared 2 days ago · 1.2 MB</div>
                    </div>
                  </div>
                  <button onClick={() => alert("Downloading...")} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <Icon name="download" size={17} color="var(--navy)" />
                  </button>
                </div>
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

          <div className="rail-card">
            <div className="rail-head">
              <Icon name="userplus" size={17} color="var(--navy)" />
              <span className="rail-title">Vorgeschlagen</span>
            </div>
            {suggested.map(p => (
              <div className="suggest-item" key={p.id}>
                <div className="suggest-left">
                  <div className="avatar" style={{ width: "36px", height: "36px", fontSize: "13px", background: p.color }}>
                    {p.initials}
                  </div>
                  <div>
                    <div className="suggest-name">{p.name}</div>
                    <div className="suggest-role">{p.role}</div>
                  </div>
                </div>
                <button
                  className={`connect-btn ${p.connected ? "connected" : ""}`}
                  onClick={() => handleConnect(p.id)}
                >
                  <Icon name={p.connected ? "check" : "plus"} size={15} color={p.connected ? "#fff" : "var(--navy)"} />
                </button>
              </div>
            ))}
          </div>
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

      {/* ============ Post Update Modal ============ */}
      {showPostModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "520px", padding: "28px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontFamily: "Sora, sans-serif" }}>Post Update</h3>
            <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <textarea
                rows="4"
                placeholder="Share your thoughts or clinical update..."
                value={newPostText}
                onChange={e => setNewPostText(e.target.value)}
                required
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--border)", fontFamily: "inherit" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  style={{ padding: "10px 16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 20px", background: "var(--teal)", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                >
                  Post Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
