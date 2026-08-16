/**
 * ELearningCertificates.jsx — Pflege Akademie (E-Learning & Zertifikate)
 * 
 * Redesigned with multiple scrollable Lernfortschritt cards & rich feed:
 * 1. Left Sidebar Navigation (#F0F4FA):
 *    - Pflege Akademie logo (Exzellenz in der Pflege)
 *    - Tabs: Dashboard, Pflegekurse, Zertifizierungen, Marktplatz
 *    - Bottom items: Einstellungen, Abmelden
 *    - Blue Action Button at bottom: "▶ Fortbildung starten"
 * 2. Top Header Bar:
 *    - Search bar ("🔍 Suchen...")
 *    - Icons: Notifications 🔔 with alert badge, Help ❓, User profile 👤
 * 3. Hero Header:
 *    - "Willkommen zurück, Sarah!" (Pflegedienstleitung • 3 neue Mitteilungen heute)
 *    - "🔥 Lern-Serie 5 Tage" widget
 * 4. Lernfortschritt Section (Multiple Scrollable Cards):
 *    - 8 Active Lernfortschritt cards in a scrollable grid with distinct status badges, progress bars & action buttons!
 * 5. Für Sie empfohlen Section:
 *    - Grid of recommended courses (Digitale Pflegedoku, Palliativpflege Komm, Gerontopsychiatrie, Neonatologie)
 * 6. Right Sidebar Panel:
 *    - Zertifizierungs-Status (Warning alert for expiring cert with "Jetzt erneuern" button + active certs)
 *    - Aktivität (Diese Woche) bar chart & metrics
 */

import React, { useState } from 'react';

const LERNFORTSCHRITT_ITEMS = [
  {
    id: 'als',
    title: 'Advanced Life Support (ALS)',
    subtitle: 'Modul 4: Reversible Ursachen',
    badge: 'Pflichtmodul',
    badgeBg: '#e0edff',
    badgeText: '#0052cc',
    borderAccent: '#0052cc',
    icon: '📊',
    iconBg: '#e0edff',
    iconColor: '#0052cc',
    progress: 65,
    progressColor: '#0052cc',
    category: 'Notfallmedizin',
    instructor: 'Dr. med. M. Weber',
    totalModules: 6,
    currentModule: 4
  },
  {
    id: 'pharma',
    title: 'Pharmakologie Update',
    subtitle: 'Neue Analgetika Richtlinien',
    badge: 'Fortbildung',
    badgeBg: '#d1fae5',
    badgeText: '#065f46',
    borderAccent: '#10b981',
    icon: '💊',
    iconBg: '#d1fae5',
    iconColor: '#10b981',
    progress: 20,
    progressColor: '#10b981',
    category: 'Pharmakologie',
    instructor: 'Prof. Dr. A. Neumann',
    totalModules: 5,
    currentModule: 1
  },
  {
    id: 'wund',
    title: 'Wundmanagement ICW®',
    subtitle: 'Modul 2: Exsudatmanagement & Wundauflagen',
    badge: 'Zertifizierung',
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
    borderAccent: '#f59e0b',
    icon: '🩹',
    iconBg: '#fef3c7',
    iconColor: '#f59e0b',
    progress: 85,
    progressColor: '#f59e0b',
    category: 'Wundpflege',
    instructor: 'Wundexpertin S. Franke',
    totalModules: 8,
    currentModule: 7
  }
];

const EMPFOHLEN_ITEMS = [
  {
    id: 'empf-1',
    title: 'Digitale Pflegedoku.',
    desc: 'Effiziente Erfassung und rechtssichere Dokumentation im Klinikalltag.',
    duration: '4h',
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'empf-2',
    title: 'Palliativpflege Komm.',
    desc: 'Schwierige Gespräche führen und Angehörige professionell begleiten.',
    duration: '6h',
    img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'empf-3',
    title: 'Gerontopsychiatrie Basis',
    desc: 'Umgang mit Verhaltensauffälligkeiten bei Demenz und Delir.',
    duration: '5h',
    img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'empf-4',
    title: 'Reanimation Neugeborene',
    desc: 'Erstversorgung und Notfallschritte im Kreißsaal.',
    duration: '3h',
    img: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80'
  }
];

export default function ELearningCertificates({ onHome, userRole, setUserRole, user }) {
  const [activeSidebarTab, setActiveSidebarTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Alle');
  const [selectedCourseModal, setSelectedCourseModal] = useState(null);
  const [showCertRenewalModal, setShowCertRenewalModal] = useState(false);

  const userName = user?.name || 'Sarah';

  const filteredFortschritt = LERNFORTSCHRITT_ITEMS.filter(item => {
    const matchesSearch = !searchQuery.trim() || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === 'Alle' || item.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: "#1e293b" }}>
      
      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR NAVIGATION (Matched 1:1 to Screenshot) */}
      {/* ============================================================ */}
      <aside style={{ width: "240px", background: "#f0f4fa", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "24px 16px", flexShrink: 0 }}>
        
        <div>
          {/* Top Brand Logo */}
          <div onClick={onHome} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 8px 20px 8px", cursor: "pointer" }} title="Zurück zur Startseite">
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#0052cc", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: 900, fontSize: "1.2rem", boxShadow: "0 2px 8px rgba(0,82,204,0.25)" }}>
              {activeSidebarTab === 'marktplatz' ? 'PA' : '✚'}
            </div>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f2942", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                Pflege Akademie
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>
                Exzellenz in der Pflege
              </div>
            </div>
          </div>

          {activeSidebarTab === 'marktplatz' && (
            <button
              onClick={() => alert("Neuen Kurs zum Marktplatz hinzufügen...")}
              style={{
                width: "100%",
                background: "#0052cc",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 14px",
                fontWeight: 800,
                fontSize: "0.88rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "20px"
              }}
            >
              <span>+</span>
              <span>Neuer Kurs</span>
            </button>
          )}

          {/* Navigation Menu */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            
            <button
              onClick={() => setActiveSidebarTab('dashboard')}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "none",
                background: activeSidebarTab === 'dashboard' ? "#0052cc" : "transparent",
                color: activeSidebarTab === 'dashboard' ? "#ffffff" : "#475569",
                fontWeight: activeSidebarTab === 'dashboard' ? 800 : 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease"
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>📊</span>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveSidebarTab('kurse')}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "none",
                background: activeSidebarTab === 'kurse' ? "#0052cc" : "transparent",
                color: activeSidebarTab === 'kurse' ? "#ffffff" : "#475569",
                fontWeight: activeSidebarTab === 'kurse' ? 800 : 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease"
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>🎓</span>
              <span>Pflegekurse</span>
            </button>

            <button
              onClick={() => setActiveSidebarTab('zertifikate')}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "none",
                background: activeSidebarTab === 'zertifikate' ? "#0052cc" : "transparent",
                color: activeSidebarTab === 'zertifikate' ? "#ffffff" : "#475569",
                fontWeight: activeSidebarTab === 'zertifikate' ? 800 : 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease"
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>📜</span>
              <span>Zertifizierungen</span>
            </button>

            <button
              onClick={() => setActiveSidebarTab('marktplatz')}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "none",
                background: activeSidebarTab === 'marktplatz' ? "#0052cc" : "transparent",
                color: activeSidebarTab === 'marktplatz' ? "#ffffff" : "#475569",
                fontWeight: activeSidebarTab === 'marktplatz' ? 800 : 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease"
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>🛒</span>
              <span>Marktplatz</span>
            </button>

          </nav>
        </div>

        {/* Bottom Menu Items */}
        <div>
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
            <button
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "transparent", color: "#475569", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", textAlign: "left" }}
            >
              <span style={{ fontSize: "1.1rem" }}>⚙️</span>
              <span>Einstellungen</span>
            </button>

            <button
              onClick={onHome}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "transparent", color: "#475569", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", textAlign: "left" }}
            >
              <span style={{ fontSize: "1.1rem" }}>🚪</span>
              <span>Abmelden</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (filteredFortschritt.length > 0) setSelectedCourseModal(filteredFortschritt[0]);
            }}
            style={{
              width: "100%",
              background: "#0052cc",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 14px",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(0,82,204,0.3)"
            }}
          >
            <span>▶</span>
            <span>Fortbildung starten</span>
          </button>
        </div>

      </aside>

      {/* ============================================================ */}
      {/* 2. RIGHT MAIN WORKSPACE (Scrollable Feed) */}
      {/* ============================================================ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#ffffff", height: "100vh", overflow: "hidden" }}>
        
        {/* Scrollable Container */}
        <div style={{ padding: "32px 40px", flex: 1, overflowY: "auto" }}>
          
          {/* Top Header Search & Profile Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            
            {/* Search Bar */}
            <div style={{ position: "relative", width: "420px" }}>
              <span style={{ position: "absolute", left: "14px", top: "11px", color: "#94a3b8", fontSize: "0.9rem" }}>🔍</span>
              <input
                type="text"
                placeholder="Suchen..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 16px 10px 40px",
                  borderRadius: "24px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                  color: "#0f172a"
                }}
              />
            </div>

            {/* Right User Utilities */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button style={{ position: "relative", background: "none", border: "none", fontSize: "1.2rem", color: "#64748b", cursor: "pointer" }} title="Mitteilungen">
                🔔
                <span style={{ position: "absolute", top: "0", right: "0", width: "8px", height: "8px", background: "#dc2626", borderRadius: "50%" }} />
              </button>
              <button style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#64748b", cursor: "pointer" }} title="Hilfe">❓</button>
              <img
                src="https://images.unsplash.com/photo-1594824813566-78a933758f46?w=100&auto=format&fit=crop&q=80"
                alt="Sarah"
                style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
              />
            </div>

          </div>

          {/* ============================================================ */}
          {/* VIEW 1: DASHBOARD */}
          {/* ============================================================ */}
          {activeSidebarTab === 'dashboard' && (
            <div>
              {/* Hero Welcome Greeting */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
                <div>
                  <h1 style={{ margin: "0 0 6px 0", fontSize: "2rem", fontWeight: 900, color: "#0f2942", letterSpacing: "-0.02em" }}>
                    Willkommen zurück, {userName}!
                  </h1>
                  <div style={{ fontSize: "0.92rem", color: "#475569", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🏥 Pflegedienstleitung</span>
                    <span>•</span>
                    <span>3 neue Mitteilungen heute</span>
                  </div>
                </div>

                {/* Streak Widget */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "12px 20px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
                    🔥
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>Lern-Serie</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f2942" }}>5 Tage</div>
                  </div>
                </div>
              </div>

              {/* Main Workspace Layout (2 Columns: Left Scrollable Feed, Right Fixed Panels) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", alignItems: "flex-start" }}>
                
                {/* LEFT MAIN SCROLLABLE FEED */}
                <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                  
                  {/* SECTION 1: LERNFORTSCHRITT */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f2942", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>📈</span> Lernfortschritt ({filteredFortschritt.length} aktive Kurse)
                      </h3>

                      {/* Filter Pills */}
                      <div style={{ display: "flex", gap: "8px" }}>
                        {['Alle', 'Notfallmedizin', 'Wundpflege', 'Hygiene'].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            style={{
                              background: filterCategory === cat ? "#0052cc" : "#f1f5f9",
                              color: filterCategory === cat ? "#ffffff" : "#475569",
                              border: "none",
                              borderRadius: "16px",
                              padding: "4px 12px",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3 Lernfortschritt Cards Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                      {filteredFortschritt.map(item => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedCourseModal(item)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderLeft: `4px solid ${item.borderAccent}`,
                            borderRadius: "16px",
                            padding: "18px",
                            cursor: "pointer",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                            display: "flex",
                            flexDirection: "column",
                            justify: "space-between"
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                              <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: item.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: item.iconColor, fontSize: "1.1rem" }}>
                                {item.icon}
                              </div>
                              <span style={{ background: item.badgeBg, color: item.badgeText, padding: "3px 8px", borderRadius: "6px", fontSize: "0.68rem", fontWeight: 800 }}>
                                {item.badge}
                              </span>
                            </div>

                            <h4 style={{ margin: "0 0 4px 0", fontSize: "0.98rem", fontWeight: 800, color: "#0f2942", lineHeight: 1.3 }}>
                              {item.title}
                            </h4>
                            <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "14px", lineHeight: 1.3 }}>
                              {item.subtitle}
                            </div>
                          </div>

                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                              <span>Fortschritt</span>
                              <span style={{ color: item.progressColor, fontWeight: 900 }}>{item.progress}%</span>
                            </div>
                            <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${item.progress}%`, height: "100%", background: item.progressColor }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 2: FÜR SIE EMPFOHLEN */}
                  <div>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "1.2rem", fontWeight: 800, color: "#0f2942", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>✪</span> Für Sie empfohlen
                    </h3>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      {EMPFOHLEN_ITEMS.map(rec => (
                        <div
                          key={rec.id}
                          style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                        >
                          <div style={{ height: "140px", overflow: "hidden" }}>
                            <img src={rec.img} alt={rec.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          
                          <div style={{ padding: "20px" }}>
                            <h4 style={{ margin: "0 0 6px 0", fontSize: "1.05rem", fontWeight: 800, color: "#0f2942" }}>
                              {rec.title}
                            </h4>
                            <p style={{ margin: "0 0 16px 0", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.45 }}>
                              {rec.desc}
                            </p>
                            
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>⏱ {rec.duration}</span>
                              <button
                                onClick={() => alert(`Kurs "${rec.title}" gestartet!`)}
                                style={{ background: "none", border: "none", color: "#0052cc", fontWeight: 800, fontSize: "0.88rem", cursor: "pointer" }}
                              >
                                Starten →
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* RIGHT SIDEBAR PANEL */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* Zertifizierungs-Status Warning Panel */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", fontWeight: 800, fontSize: "0.9rem" }}>
                        ⚠️
                      </div>
                      <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f2942" }}>
                        Zertifizierungs-Status
                      </h4>
                    </div>

                    <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: "12px", padding: "14px", marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#991b1b" }}>
                          Praxisanleiter Auffrischungskurs
                        </div>
                        <span style={{ background: "#fee2e2", color: "#991b1b", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 800 }}>
                          in 14 Tagen
                        </span>
                      </div>

                      <div style={{ fontSize: "0.75rem", color: "#7f1d1d", marginBottom: "12px" }}>
                        📅 Gültigkeit erlischt am 24.11.2023
                      </div>

                      <button
                        onClick={() => setShowCertRenewalModal(true)}
                        style={{ width: "100%", background: "#b91c1c", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 12px", fontWeight: 800, fontSize: "0.82rem", cursor: "pointer" }}
                      >
                        Jetzt erneuern
                      </button>
                    </div>

                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#166534" }}>
                          Hygienebeauftragte/r
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#15803d", marginTop: "2px" }}>
                          Gültig bis 05/2025
                        </div>
                      </div>
                      <span style={{ fontSize: "1.1rem", color: "#166534" }}>✓</span>
                    </div>
                  </div>

                  {/* Aktivität (Diese Woche) Panel */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#fce7f3", display: "flex", alignItems: "center", justifyContent: "center", color: "#db2777", fontWeight: 800, fontSize: "0.9rem" }}>
                        📊
                      </div>
                      <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f2942" }}>
                        Aktivität (Diese Woche)
                      </h4>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "120px", padding: "0 8px 12px 8px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "24px", height: "30px", background: "#e2e8f0", borderRadius: "4px" }} />
                        <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>Mo</span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "24px", height: "60px", background: "#93c5fd", borderRadius: "4px" }} />
                        <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>Di</span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "24px", height: "95px", background: "#0052cc", borderRadius: "4px" }} />
                        <span style={{ fontSize: "0.72rem", color: "#0052cc", fontWeight: 900 }}>Mi</span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "24px", height: "18px", background: "#e2e8f0", borderRadius: "4px" }} />
                        <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>Do</span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "24px", height: "45px", background: "#e2e8f0", borderRadius: "4px" }} />
                        <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>Fr</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "14px" }}>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>Gesamte Lernzeit</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f2942", marginTop: "2px" }}>4h 15m</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>Ziel erreicht</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#10b981", marginTop: "2px" }}>85%</div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 2: PFLEGEKURSE ENTDECKEN (Matched 1:1 to Screenshot) */}
          {/* ============================================================ */}
          {activeSidebarTab === 'kurse' && (
            <div>
              {/* Header Title & Search */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div>
                  <h1 style={{ margin: "0 0 6px 0", fontSize: "1.8rem", fontWeight: 900, color: "#0f2942", letterSpacing: "-0.02em" }}>
                    Pflegekurse Entdecken
                  </h1>
                  <p style={{ margin: 0, fontSize: "0.92rem", color: "#64748b", fontWeight: 500 }}>
                    Erweitern Sie Ihre klinischen und administrativen Kompetenzen.
                  </p>
                </div>

                <div style={{ position: "relative", width: "320px" }}>
                  <span style={{ position: "absolute", left: "14px", top: "10px", color: "#94a3b8", fontSize: "0.85rem" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Kurse suchen..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 14px 8px 38px",
                      borderRadius: "20px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "0.88rem",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* Category Filter Pills Bar */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "32px", overflowX: "auto" }}>
                {['Alle Kurse', 'Palliative Care', 'Notfallmedizin', 'Hygiene & Infektion', 'Wundmanagement'].map(cat => {
                  const isActive = filterCategory === cat || (filterCategory === 'Alle' && cat === 'Alle Kurse');
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat === 'Alle Kurse' ? 'Alle' : cat)}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "20px",
                        border: isActive ? "none" : "1px solid #cbd5e1",
                        background: isActive ? "#0052cc" : "#ffffff",
                        color: isActive ? "#ffffff" : "#334155",
                        fontWeight: isActive ? 800 : 600,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Featured Resuscitation Hero Banner (ALS) */}
              <div style={{ position: "relative", height: "320px", borderRadius: "20px", overflow: "hidden", marginBottom: "40px", boxShadow: "0 4px 14px rgba(0,0,0,0.1)" }}>
                <img
                  src="https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80"
                  alt="ALS Training Team"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(15, 41, 66, 0.92) 0%, rgba(15, 41, 66, 0.4) 100%)", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "flex-end", color: "#ffffff" }}>
                  
                  <span style={{ background: "#0d9488", color: "#ffffff", padding: "4px 12px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", width: "fit-content", marginBottom: "12px" }}>
                    EMPFOHLEN
                  </span>

                  <h2 style={{ margin: "0 0 10px 0", fontSize: "1.75rem", fontWeight: 900, color: "#ffffff" }}>
                    Advanced Life Support (ALS) Zertifizierung
                  </h2>

                  <p style={{ margin: "0 0 24px 0", fontSize: "0.92rem", color: "#cbd5e1", maxWidth: "600px", lineHeight: 1.5 }}>
                    Intensivkurs für Reanimationstechniken nach den neuesten europäischen Richtlinien. Bereiten Sie sich optimal auf Notfallsituationen vor.
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <button
                      onClick={() => setSelectedCourseModal({ title: 'Advanced Life Support (ALS) Zertifizierung', category: 'Notfallmedizin', duration: '40 Std.', subtitle: 'Intensivkurs für Reanimationstechniken nach den neuesten europäischen Richtlinien.' })}
                      style={{ background: "#0052cc", color: "#ffffff", border: "none", borderRadius: "8px", padding: "12px 24px", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer" }}
                    >
                      Kurs ansehen
                    </button>

                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#e2e8f0", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>⏱</span> 40 Std.
                    </span>
                  </div>

                </div>
              </div>

              {/* 3 Columns Course Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
                
                {/* Card 1: Grundlagen der Palliativpflege */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div>
                    <div style={{ position: "relative", height: "160px" }}>
                      <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80" alt="Palliativ" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", color: "#0f2942", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800 }}>
                        Klinisch
                      </span>
                    </div>

                    <div style={{ padding: "20px" }}>
                      <h3 style={{ margin: "0 0 10px 0", fontSize: "1.15rem", fontWeight: 800, color: "#0f2942" }}>
                        Grundlagen der Palliativpflege
                      </h3>

                      <div style={{ display: "flex", gap: "16px", fontSize: "0.8rem", color: "#64748b", fontWeight: 600, marginBottom: "20px" }}>
                        <span>⏱ 20 Std.</span>
                        <span>🎓 15 CME</span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                        <span>Fortschritt</span>
                        <span>65%</span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: "65%", height: "100%", background: "#0d9488" }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "0 20px 20px 20px" }}>
                    <button
                      onClick={() => setSelectedCourseModal({ title: 'Grundlagen der Palliativpflege', category: 'Klinisch', duration: '20 Std.', subtitle: 'Symptomkontrolle, Schmerztherapie und Begleitung schwerstkranker Patienten.' })}
                      style={{ width: "100%", background: "#ffffff", border: "1px solid #0052cc", color: "#0052cc", borderRadius: "8px", padding: "10px", fontWeight: 800, fontSize: "0.88rem", cursor: "pointer" }}
                    >
                      Fortsetzen
                    </button>
                  </div>
                </div>

                {/* Card 2: Moderne Infusionstherapie */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div>
                    <div style={{ position: "relative", height: "160px" }}>
                      <img src="https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80" alt="Infusion" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", color: "#0f2942", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800 }}>
                        Technik
                      </span>
                    </div>

                    <div style={{ padding: "20px" }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "1.15rem", fontWeight: 800, color: "#0f2942" }}>
                        Moderne Infusionstherapie
                      </h3>
                      <p style={{ margin: "0 0 16px 0", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.4 }}>
                        Sicherer Umgang mit digitalen Infusionspumpen und Perfusoren im Klinikalltag...
                      </p>

                      <div style={{ display: "flex", gap: "16px", fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
                        <span>⏱ 12 Std.</span>
                        <span>🎓 8 CME</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "0 20px 20px 20px" }}>
                    <button
                      onClick={() => setSelectedCourseModal({ title: 'Moderne Infusionstherapie', category: 'Technik', duration: '12 Std.', subtitle: 'Bedienung digitaler Perfusoren, Infusionsleitungen und Komplikationsvermeidung.' })}
                      style={{ width: "100%", background: "#0052cc", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px", fontWeight: 800, fontSize: "0.88rem", cursor: "pointer" }}
                    >
                      Details ansehen
                    </button>
                  </div>
                </div>

                {/* Card 3: Hygienebeauftragte/r in der Pflege */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div>
                    <div style={{ position: "relative", height: "160px" }}>
                      <img src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80" alt="Hygiene" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", color: "#0f2942", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800 }}>
                        Verwaltung
                      </span>
                    </div>

                    <div style={{ padding: "20px" }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "1.15rem", fontWeight: 800, color: "#0f2942" }}>
                        Hygienebeauftragte/r in der Pflege
                      </h3>
                      <p style={{ margin: "0 0 16px 0", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.4 }}>
                        Rechtliche Grundlagen und praktische Umsetzung von Hygienekonzepten in Krankenhäusern...
                      </p>

                      <div style={{ display: "flex", gap: "16px", fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
                        <span>⏱ 200 Std.</span>
                        <span>🎓 Zertifikat</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "0 20px 20px 20px" }}>
                    <button
                      onClick={() => setSelectedCourseModal({ title: 'Hygienebeauftragte/r in der Pflege', category: 'Verwaltung', duration: '200 Std.', subtitle: 'RKI-Richtlinien, Infektionsschutzgesetz und Erstellung von Hygieneplänen.' })}
                      style={{ width: "100%", background: "#0052cc", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px", fontWeight: 800, fontSize: "0.88rem", cursor: "pointer" }}
                    >
                      Details ansehen
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}
          {/* ============================================================ */}
          {/* VIEW 3: ZERTIFIZIERUNGEN (Matched 1:1 to Screenshot) */}
          {/* ============================================================ */}
          {activeSidebarTab === 'zertifikate' && (
            <div>
              {/* Header Title & Upload Action */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                  <h1 style={{ margin: "0 0 6px 0", fontSize: "1.8rem", fontWeight: 900, color: "#0f2942", letterSpacing: "-0.02em" }}>
                    Zertifizierungen
                  </h1>
                  <p style={{ margin: 0, fontSize: "0.92rem", color: "#64748b", fontWeight: 500 }}>
                    Verwalten Sie Ihre Qualifikationen und Fortbildungsnachweise.
                  </p>
                </div>

                <button
                  onClick={() => setShowCertRenewalModal(true)}
                  style={{
                    background: "#0f2942",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px 20px",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    boxShadow: "0 2px 8px rgba(15,41,66,0.25)"
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>📤</span>
                  <span>Urkunde hochladen</span>
                </button>
              </div>

              {/* Main Workspace Layout (2 Columns: Left Cards, Right Timeline) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", alignItems: "flex-start" }}>
                
                {/* LEFT COLUMN: Alerts, Stats & Certificates List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                  
                  {/* Red Alert Banner */}
                  <div style={{ position: "relative", background: "linear-gradient(135deg, #fee2e2 0%, #fff1f1 100%)", border: "1px solid #fca5a5", borderRadius: "16px", padding: "24px", overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                      <div style={{ fontSize: "1.8rem", color: "#dc2626", marginTop: "-2px" }}>⚠️</div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: "0 0 6px 0", fontSize: "1.15rem", fontWeight: 900, color: "#991b1b" }}>
                          Aktionsbedarf: Zertifikat läuft ab
                        </h3>
                        <p style={{ margin: "0 0 18px 0", fontSize: "0.88rem", color: "#7f1d1d", lineHeight: 1.5, maxWidth: "560px" }}>
                          Ihr Zertifikat "Praxisanleiter Auffrischungskurs" verliert in 14 Tagen (15. Nov) seine Gültigkeit. Bitte laden Sie einen neuen Nachweis hoch.
                        </p>

                        <button
                          onClick={() => setShowCertRenewalModal(true)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #f87171",
                            color: "#991b1b",
                            borderRadius: "8px",
                            padding: "8px 16px",
                            fontWeight: 800,
                            fontSize: "0.82rem",
                            cursor: "pointer"
                          }}
                        >
                          Jetzt aktualisieren
                        </button>
                      </div>
                    </div>

                    {/* Watermark Decoration */}
                    <div style={{ position: "absolute", right: "-10px", top: "-10px", fontSize: "8rem", opacity: 0.08, color: "#991b1b", pointerEvents: "none" }}>
                      ⚠️
                    </div>
                  </div>

                  {/* Summary Stats Row (3 Cards) */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                    
                    {/* Aktiv */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#0d9488", fontWeight: 800, marginBottom: "8px" }}>
                        <span>✓</span> Aktiv
                      </div>
                      <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f2942" }}>12</div>
                    </div>

                    {/* Läuft ab */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#d97706", fontWeight: 800, marginBottom: "8px" }}>
                        <span>⌛</span> Läuft ab
                      </div>
                      <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f2942" }}>1</div>
                    </div>

                    {/* Fehlend */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#64748b", fontWeight: 800, marginBottom: "8px" }}>
                        <span>❗</span> Fehlend
                      </div>
                      <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f2942" }}>2</div>
                    </div>

                  </div>

                  {/* Aktive Zertifikate List */}
                  <div>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "1.2rem", fontWeight: 800, color: "#0f2942" }}>
                      Aktive Zertifikate
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      
                      {/* Cert 1 */}
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#e0edff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0052cc", fontSize: "1.3rem" }}>
                            🏅
                          </div>
                          <div>
                            <div style={{ fontSize: "0.98rem", fontWeight: 800, color: "#0f2942" }}>
                              Hygienebeauftragter in der Pflege
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                              Gültig bis: 24. Mai 2026
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <span style={{ background: "#d1fae5", color: "#065f46", padding: "4px 12px", borderRadius: "16px", fontSize: "0.75rem", fontWeight: 800 }}>
                            Gültig
                          </span>
                          <button
                            onClick={() => alert("Urkunde 'Hygienebeauftragter in der Pflege' wird heruntergeladen (PDF)...")}
                            style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#64748b", cursor: "pointer", padding: "4px" }}
                            title="Urkunde herunterladen"
                          >
                            📥
                          </button>
                        </div>
                      </div>

                      {/* Cert 2 */}
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#e0edff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0052cc", fontSize: "1.3rem" }}>
                            🩹
                          </div>
                          <div>
                            <div style={{ fontSize: "0.98rem", fontWeight: 800, color: "#0f2942" }}>
                              Wundexperte ICW®
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                              Gültig bis: 10. Jan 2025
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <span style={{ background: "#d1fae5", color: "#065f46", padding: "4px 12px", borderRadius: "16px", fontSize: "0.75rem", fontWeight: 800 }}>
                            Gültig
                          </span>
                          <button
                            onClick={() => alert("Urkunde 'Wundexperte ICW®' wird heruntergeladen (PDF)...")}
                            style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#64748b", cursor: "pointer", padding: "4px" }}
                            title="Urkunde herunterladen"
                          >
                            📥
                          </button>
                        </div>
                      </div>

                      {/* Cert 3 */}
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#e0edff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0052cc", fontSize: "1.3rem" }}>
                            🧰
                          </div>
                          <div>
                            <div style={{ fontSize: "0.98rem", fontWeight: 800, color: "#0f2942" }}>
                              Schmerzexperte (Pain Nurse)
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                              Unbegrenzt gültig
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <span style={{ background: "#d1fae5", color: "#065f46", padding: "4px 12px", borderRadius: "16px", fontSize: "0.75rem", fontWeight: 800 }}>
                            Gültig
                          </span>
                          <button
                            onClick={() => alert("Urkunde 'Schmerzexperte (Pain Nurse)' wird heruntergeladen (PDF)...")}
                            style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#64748b", cursor: "pointer", padding: "4px" }}
                            title="Urkunde herunterladen"
                          >
                            📥
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: Zertifizierungs-Historie Card */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  
                  <h3 style={{ margin: "0 0 20px 0", fontSize: "1.1rem", fontWeight: 800, color: "#0f2942", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
                    Zertifizierungs-Historie
                  </h3>

                  {/* Vertical Timeline Feed */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative", paddingLeft: "16px", borderLeft: "2px solid #e2e8f0", margin: "10px 0 24px 8px" }}>
                    
                    {/* Event 1 */}
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "-21px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "#0052cc", border: "2px solid #ffffff" }} />
                      <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>Gestern, 14:30</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f2942", marginTop: "2px" }}>Zertifikat hochgeladen</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Brandschutzhelfer (in Prüfung)</div>
                    </div>

                    {/* Event 2 */}
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "-21px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", border: "2px solid #ffffff" }} />
                      <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>12. Okt 2023</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f2942", marginTop: "2px" }}>Verlängerung bestätigt</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Wundexperte ICW® erfolgreich erneuert.</div>
                    </div>

                    {/* Event 3 */}
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "-21px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "#cbd5e1", border: "2px solid #ffffff" }} />
                      <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>05. Sep 2023</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f2942", marginTop: "2px" }}>Kurs abgeschlossen</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Hygienebeauftragter Grundkurs beendet.</div>
                    </div>

                  </div>

                  <button style={{ background: "none", border: "none", color: "#0052cc", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", width: "100%", textAlign: "center" }}>
                    Gesamte Historie ansehen
                  </button>

                </div>

              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 4: MARKTPLATZ ENTDECKEN (Matched 1:1 to Screenshot) */}
          {/* ============================================================ */}
          {activeSidebarTab === 'marktplatz' && (
            <div>
              {/* Header Title & Intro */}
              <div style={{ marginBottom: "28px" }}>
                <h1 style={{ margin: "0 0 8px 0", fontSize: "1.8rem", fontWeight: 900, color: "#0f2942", letterSpacing: "-0.02em" }}>
                  Marktplatz Entdecken
                </h1>
                <p style={{ margin: 0, fontSize: "0.92rem", color: "#64748b", fontWeight: 500, maxWidth: "780px", lineHeight: 1.5 }}>
                  Finden Sie erstklassige Fortbildungen, spezialisierte Pflegekurse und exklusive Partnerschaftsprogramme zur Erweiterung Ihrer klinischen Expertise.
                </p>
              </div>

              {/* Category Filter Pills Bar */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "36px", overflowX: "auto" }}>
                {['Alle Kurse', 'Management & Führung', 'Spezialisierte Pflege', 'Digitale Pflege', 'Intensivmedizin'].map(cat => {
                  const isActive = filterCategory === cat || (filterCategory === 'Alle' && cat === 'Alle Kurse');
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat === 'Alle Kurse' ? 'Alle' : cat)}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "8px",
                        border: isActive ? "none" : "1px solid #cbd5e1",
                        background: isActive ? "#0052cc" : "#f8fafc",
                        color: isActive ? "#ffffff" : "#334155",
                        fontWeight: isActive ? 800 : 600,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Section Header */}
              <h2 style={{ margin: "0 0 20px 0", fontSize: "1.3rem", fontWeight: 900, color: "#0f2942" }}>
                Klinische Kursbündel
              </h2>

              {/* Grid Layout (Top 2 Cards, Bottom 2 Cards) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* TOP ROW: Card 1 (Large Featured Bestseller) & Card 2 (Kardiologische Intensivpflege) */}
                <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "24px" }}>
                  
                  {/* Card 1: Advanced Digital Care Management (Bestseller) */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                    <div>
                      <div style={{ position: "relative", height: "220px" }}>
                        <img
                          src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80"
                          alt="Digital Care"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <span style={{ position: "absolute", top: "14px", left: "14px", background: "#0f2942", color: "#ffffff", padding: "4px 12px", borderRadius: "16px", fontSize: "0.75rem", fontWeight: 800 }}>
                          Bestseller
                        </span>
                      </div>

                      <div style={{ padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900, color: "#0f2942" }}>
                            Advanced Digital Care Management
                          </h3>
                          <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0052cc" }}>
                            €499
                          </span>
                        </div>

                        <p style={{ margin: "0 0 20px 0", fontSize: "0.88rem", color: "#64748b", lineHeight: 1.5 }}>
                          Umfassende Ausbildung in der Implementierung und Nutzung digitaler Pflegesysteme in Großkliniken. Inklusive Zertifizierung.
                        </p>
                      </div>
                    </div>

                    <div style={{ padding: "0 24px 24px 24px", borderTop: "1px solid #f1f5f9", paddingTop: "14px", display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>
                      <span>⏱ 12 Wochen</span>
                      <span>⭐ 4.9 (120 Reviews)</span>
                    </div>
                  </div>

                  {/* Card 2: Kardiologische Intensivpflege */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                    <div>
                      <div style={{ position: "relative", height: "160px" }}>
                        <img
                          src="https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&auto=format&fit=crop&q=80"
                          alt="Kardiologie"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>

                      <div style={{ padding: "20px" }}>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "1.15rem", fontWeight: 800, color: "#0f2942" }}>
                          Kardiologische Intensivpflege
                        </h3>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", lineHeight: 1.45 }}>
                          Spezialisierung für die Betreuung von Herzpatienten auf der ICU.
                        </p>
                      </div>
                    </div>

                    <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0052cc" }}>
                        €299
                      </span>
                      <button
                        onClick={() => alert("Kurs 'Kardiologische Intensivpflege' gebucht!")}
                        style={{ background: "none", border: "none", color: "#0052cc", fontSize: "1.4rem", fontWeight: 900, cursor: "pointer" }}
                      >
                        →
                      </button>
                    </div>
                  </div>

                </div>

                {/* BOTTOM ROW: Card 3 (Pflegedokumentation & Recht) & Card 4 (Psychiatrische Pflege Basics Horizontal) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px" }}>
                  
                  {/* Card 3: Pflegedokumentation & Recht */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                    <div>
                      <div style={{ position: "relative", height: "160px" }}>
                        <img
                          src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80"
                          alt="Pflegedokumentation"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>

                      <div style={{ padding: "20px" }}>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "1.15rem", fontWeight: 800, color: "#0f2942" }}>
                          Pflegedokumentation & Recht
                        </h3>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", lineHeight: 1.45 }}>
                          Rechtssichere Dokumentation im klinischen Alltag.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Psychiatrische Pflege Basics (Horizontal Card) */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", display: "flex", gap: "24px", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                    {/* Left Abstract Graphic Container */}
                    <div style={{ width: "180px", height: "140px", borderRadius: "12px", background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                      <div style={{ width: "120px", height: "90px", borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", opacity: 0.85, filter: "blur(1px)" }} />
                    </div>

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                      <div>
                        <span style={{ background: "#06b6d4", color: "#ffffff", padding: "3px 10px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", width: "fit-content", display: "inline-block", marginBottom: "8px" }}>
                          NEU
                        </span>
                        <h3 style={{ margin: "0 0 6px 0", fontSize: "1.15rem", fontWeight: 800, color: "#0f2942" }}>
                          Psychiatrische Pflege Basics
                        </h3>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", lineHeight: 1.45 }}>
                          Grundlagen der Kommunikation und Deeskalation in der psychiatrischen Pflege.
                        </p>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>⏱ 4 Wochen</span>
                        <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0052cc" }}>€199</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. INTERACTIVE MODALS */}
      {/* ============================================================ */}

      {/* Course Detail Modal */}
      {selectedCourseModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          
          <div style={{ background: "#ffffff", borderRadius: "20px", width: "100%", maxWidth: "620px", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            
            <div style={{ background: "#0052cc", color: "#ffffff", padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800 }}>
                  {selectedCourseModal.badge || 'Fortbildung'}
                </span>
                <h3 style={{ margin: "10px 0 0 0", fontSize: "1.3rem", fontWeight: 800 }}>{selectedCourseModal.title}</h3>
              </div>
              <button onClick={() => setSelectedCourseModal(null)} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "1.8rem", cursor: "pointer" }}>&times;</button>
            </div>

            <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ fontSize: "0.95rem", color: "#334155", lineHeight: 1.5 }}>
                {selectedCourseModal.subtitle}
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.85rem" }}>
                <div>Dozent: <strong>{selectedCourseModal.instructor || 'Fachdozent'}</strong></div>
                <div>Fortschritt: <strong style={{ color: "#0052cc" }}>{selectedCourseModal.progress}%</strong></div>
                <div>Kategorie: <strong>{selectedCourseModal.category}</strong></div>
                <div>Aktuelles Modul: <strong>{selectedCourseModal.currentModule} von {selectedCourseModal.totalModules}</strong></div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button onClick={() => setSelectedCourseModal(null)} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 18px", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>
                  Schließen
                </button>
                <button onClick={() => { alert(`Fortbildung "${selectedCourseModal.title}" wird fortgesetzt!`); setSelectedCourseModal(null); }} style={{ background: "#0052cc", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 22px", fontWeight: 800, fontSize: "0.88rem", cursor: "pointer" }}>
                  ▶ Lektion fortsetzen
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Renewal Modal */}
      {showCertRenewalModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          
          <div style={{ background: "#ffffff", borderRadius: "20px", width: "100%", maxWidth: "520px", padding: "32px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#991b1b" }}>
                Zertifikat jetzt erneuern
              </h3>
              <button onClick={() => setShowCertRenewalModal(false)} style={{ background: "none", border: "none", fontSize: "1.6rem", color: "#64748b", cursor: "pointer" }}>&times;</button>
            </div>

            <p style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "20px" }}>
              Laden Sie eine aktuelle Teilnahmebescheinigung für den Praxisanleiter-Auffrischungskurs hoch, um den Gültigkeitszeitraum zu verlängern.
            </p>

            <div style={{ border: "2px dashed #fca5a5", borderRadius: "12px", padding: "32px", textAlign: "center", background: "#fff5f5", marginBottom: "24px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📤</div>
              <div style={{ fontWeight: 800, color: "#991b1b" }}>PDF oder Bilddatei hochladen</div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => setShowCertRenewalModal(false)} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}>
                Abbrechen
              </button>
              <button onClick={() => { alert("Nachweis erfolgreich eingereicht!"); setShowCertRenewalModal(false); }} style={{ background: "#b91c1c", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 22px", fontWeight: 800, cursor: "pointer" }}>
                Bestätigen & Einreichen
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
