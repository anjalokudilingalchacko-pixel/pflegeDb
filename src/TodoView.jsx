/**
 * TodoView.jsx — Pixel-Perfect Todo App with Collapsible Sections & Praxisanleiter Integration
 * 
 * Layout matched 1:1 to Reference Screenshot 1:
 * - Sidebar Sections:
 *   - HAUPTMENÜ (v): Dashboard, Offene Aufgaben (active state), Erledigt
 *   - ZUSAMMENARBEIT (v): Praxisanleiter
 * - Main Workspace:
 *   - Meine Aufgaben (Verwalten Sie Ihre Aufgaben und Aktivitäten.)
 *   - Wichtige Aufgaben (Collapsible ^, Badge: "3 Offen")
 *   - Aufgaben vom Praxisanleiter (Collapsible v, Badge: "2 Neu", Icon: 🎓)
 *   - Tägliche Aufgaben (Collapsible v)
 * - Right Sidebar:
 *   - Persönlicher Fortschritt (12 completed this week, 🔥 5 streak)
 *   - Jährliche Beiträge (52-week Blue Contribution Heatmap with interactive hover tooltips)
 */

import React, { useState, useMemo, useEffect } from "react";

const INITIAL_IMPORTANT_TASKS = [
  {
    id: "imp-1",
    title: "Projektpräsentation vorbereiten",
    desc: "Erstellen Sie die Folien für das morgige Meeting.",
    dueDate: "Heute",
    dueColor: "red",
    status: "In Bearbeitung",
    statusColor: "cyan",
    completed: false
  },
  {
    id: "imp-2",
    title: "Rechnungen überprüfen",
    desc: "Überprüfen Sie die Ausgaben der letzten Woche.",
    dueDate: "12. Okt",
    dueColor: "gray",
    status: "Offen",
    statusColor: "gray",
    completed: false
  }
];

const INITIAL_PRAXIS_TASKS = [
  {
    id: "praxis-1",
    title: "SIS-Erstaufnahmenamnese bei Fr. Schmidt durchführen",
    desc: "Strukturierte SIS-Anamnese für Themenfeld 1 bis 4 dokumentieren.",
    preceptor: "M. Weber (Praxisanleiter)",
    dueDate: "15. Okt",
    completed: false
  },
  {
    id: "praxis-2",
    title: "Dekubitus-Risikobeurteilung & Mikrolagerungsplan",
    desc: "Braden-Skala ausfüllen und 30-Grad-Seitenlagerungsplan im System eintragen.",
    preceptor: "Dr. Schmidt (Dozent)",
    dueDate: "18. Okt",
    completed: false
  }
];

const INITIAL_DAILY_TASKS = [
  { id: "daily-1", title: "E-Mails beantworten", completed: true, status: "Erledigt" }
];

function initializeHeatmap365() {
  const saved = localStorage.getItem("todo_heatmap_data_2026");
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }

  const weeks = [];
  const startDate = new Date(2026, 0, 1);

  for (let w = 0; w < 52; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (w * 7 + d));
      const dateStr = currentDate.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
      const monthIdx = currentDate.getMonth();

      let count = 0;
      if ((w + d) % 3 === 0) count = 1;
      if ((w * 2 + d) % 5 === 0) count = 2;
      if ((w + d) % 7 === 0) count = 3;
      if (currentDate.getDate() === 12 && monthIdx === 7) count = 4;

      days.push({ date: dateStr, monthIdx, count, timestamp: currentDate.getTime() });
    }
    weeks.push(days);
  }
  return weeks;
}

export default function TodoView({ onHome, userRole, currentUser }) {
  const [activeNav, setActiveNav] = useState("offene_aufgaben"); // 'dashboard' | 'offene_aufgaben' | 'erledigt' | 'praxis'

  // Section Collapse States
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [showCollabMenu, setShowCollabMenu] = useState(true);

  // Main Card Collapsibles
  const [expandImportant, setExpandImportant] = useState(true);
  const [expandPraxis, setExpandPraxis] = useState(false);
  const [expandDaily, setExpandDaily] = useState(false);

  // Tasks Data
  const [importantTasks, setImportantTasks] = useState(INITIAL_IMPORTANT_TASKS);
  const [praxisTasks, setPraxisTasks] = useState(INITIAL_PRAXIS_TASKS);
  const [dailyTasks, setDailyTasks] = useState(INITIAL_DAILY_TASKS);
  const [newDailyInput, setNewDailyInput] = useState("");

  // Heatmap State
  const [heatmapWeeks, setHeatmapWeeks] = useState(initializeHeatmap365);
  const [hoveredDay, setHoveredDay] = useState(null);

  // Add Task Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModalTask, setNewModalTask] = useState({ title: "", desc: "", isImportant: true });

  useEffect(() => {
    localStorage.setItem("todo_heatmap_data_2026", JSON.stringify(heatmapWeeks));
  }, [heatmapWeeks]);

  const incrementTodayContribution = () => {
    const todayStr = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
    setHeatmapWeeks(prevWeeks => prevWeeks.map(week => week.map(day => {
      if (day.date === todayStr) {
        return { ...day, count: Math.min(5, day.count + 1) };
      }
      return day;
    })));
  };

  const handleToggleImportantTask = (id) => {
    setImportantTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        if (nextCompleted) incrementTodayContribution();
        return { ...t, completed: nextCompleted };
      }
      return t;
    }));
  };

  const handleTogglePraxisTask = (id) => {
    setPraxisTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        if (nextCompleted) incrementTodayContribution();
        return { ...t, completed: nextCompleted };
      }
      return t;
    }));
  };

  const handleToggleDailyTask = (id) => {
    setDailyTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        if (nextCompleted) incrementTodayContribution();
        return { ...t, completed: nextCompleted };
      }
      return t;
    }));
  };

  const handleAddDailyTask = (e) => {
    e.preventDefault();
    if (!newDailyInput.trim()) return;

    setDailyTasks(prev => [{ id: `daily-${Date.now()}`, title: newDailyInput.trim(), completed: false, status: "Offen" }, ...prev]);
    setNewDailyInput("");
  };

  const handleCreateModalTask = (e) => {
    e.preventDefault();
    if (!newModalTask.title.trim()) return;

    if (newModalTask.isImportant) {
      setImportantTasks(prev => [...prev, { id: `imp-${Date.now()}`, title: newModalTask.title.trim(), desc: newModalTask.desc.trim() || "Neue zugewiesene Aufgabe.", dueDate: "Heute", dueColor: "red", status: "Offen", statusColor: "gray", completed: false }]);
    } else {
      setDailyTasks(prev => [{ id: `daily-${Date.now()}`, title: newModalTask.title.trim(), completed: false, status: "Offen" }, ...prev]);
    }

    setShowAddModal(false);
    setNewModalTask({ title: "", desc: "", isImportant: true });
  };

  const openImportantCount = importantTasks.filter(t => !t.completed).length;
  const openPraxisCount = praxisTasks.filter(t => !t.completed).length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#ffffff", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: "#0f172a" }}>
      
      {/* 1. LEFT SIDEBAR (Width 270px, #f4f6f9 bg) */}
      <aside style={{ width: "270px", background: "#f4f6f9", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          {/* Brand Header */}
          <div onClick={onHome} style={{ padding: "24px 20px 18px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #e5e7eb", cursor: "pointer" }} title="Zurück zur Startseite">
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#0047ab", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>Todo</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 500 }}>Mein Aufgabenplaner</div>
            </div>
          </div>

          {/* Nav Sections */}
          <nav style={{ padding: "20px 14px", display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* SECTION 1: HAUPTMENÜ */}
            <div>
              <div
                onClick={() => setShowMainMenu(!showMainMenu)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", fontSize: "0.75rem", fontWeight: 800, color: "#64748b", letterSpacing: "0.05em", cursor: "pointer", marginBottom: "4px" }}
              >
                <span>HAUPTMENÜ</span>
                <span style={{ fontSize: "0.7rem" }}>{showMainMenu ? "∨" : "∧"}</span>
              </div>

              {showMainMenu && (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <button onClick={() => setActiveNav("dashboard")} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "9px 12px", borderRadius: "8px", border: "none", background: activeNav === "dashboard" ? "#dbeafe" : "transparent", color: activeNav === "dashboard" ? "#1d4ed8" : "#475569", fontWeight: activeNav === "dashboard" ? 700 : 500, fontSize: "0.88rem", cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    <span>Dashboard</span>
                  </button>

                  <button onClick={() => setActiveNav("offene_aufgaben")} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "9px 12px", borderRadius: "8px", border: "none", background: activeNav === "offene_aufgaben" ? "#dbeafe" : "transparent", color: activeNav === "offene_aufgaben" ? "#1d4ed8" : "#475569", fontWeight: activeNav === "offene_aufgaben" ? 700 : 500, fontSize: "0.88rem", cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
                    <span>Offene Aufgaben</span>
                  </button>

                  <button onClick={() => setActiveNav("erledigt")} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "9px 12px", borderRadius: "8px", border: "none", background: activeNav === "erledigt" ? "#dbeafe" : "transparent", color: activeNav === "erledigt" ? "#1d4ed8" : "#475569", fontWeight: activeNav === "erledigt" ? 700 : 500, fontSize: "0.88rem", cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Erledigt</span>
                  </button>
                </div>
              )}
            </div>

            {/* SECTION 2: ZUSAMMENARBEIT */}
            <div>
              <div
                onClick={() => setShowCollabMenu(!showCollabMenu)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", fontSize: "0.75rem", fontWeight: 800, color: "#64748b", letterSpacing: "0.05em", cursor: "pointer", marginBottom: "4px" }}
              >
                <span>ZUSAMMENARBEIT</span>
                <span style={{ fontSize: "0.7rem" }}>{showCollabMenu ? "∨" : "∧"}</span>
              </div>

              {showCollabMenu && (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <button onClick={() => { setActiveNav("praxis"); setExpandPraxis(true); }} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "9px 12px", borderRadius: "8px", border: "none", background: activeNav === "praxis" ? "#dbeafe" : "transparent", color: activeNav === "praxis" ? "#1d4ed8" : "#475569", fontWeight: activeNav === "praxis" ? 700 : 500, fontSize: "0.88rem", cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <span style={{ fontSize: "1rem" }}>🎓</span>
                    <span>Praxisanleiter</span>
                  </button>
                </div>
              )}
            </div>

          </nav>
        </div>

        {/* Bottom Actions */}
        <div>
          <div style={{ padding: "0 20px 16px 20px" }}>
            <button onClick={() => setShowAddModal(true)} style={{ width: "100%", height: "44px", background: "#0047ab", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", boxShadow: "0 2px 6px rgba(0, 71, 171, 0.25)" }}>
              <span style={{ fontSize: "1.2rem", fontWeight: 400 }}>+</span>
              <span>Neue Aufgabe</span>
            </button>
          </div>

          <div style={{ padding: "12px 14px 20px 14px", borderTop: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: "2px" }}>
            <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", borderRadius: "6px", border: "none", background: "transparent", color: "#475569", fontWeight: 500, fontSize: "0.85rem", cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Einstellungen</span>
            </button>
            <button onClick={onHome} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", borderRadius: "6px", border: "none", background: "transparent", color: "#475569", fontWeight: 500, fontSize: "0.85rem", cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Abmelden</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main style={{ flexGrow: 1, padding: "40px 48px", overflowY: "auto" }}>
        
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>
            Meine Aufgaben
          </h1>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569" }}>
            Verwalten Sie Ihre Aufgaben und Aktivitäten.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "28px", alignItems: "flex-start" }}>
          
          {/* LEFT COLUMN: COLLAPSIBLE TASKS CARDS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* CARD 1: Wichtige Aufgaben (Collapsible ^) */}
            {(activeNav !== "praxis") && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div onClick={() => setExpandImportant(!expandImportant)} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                      Wichtige Aufgaben
                    </h2>
                    <span style={{ fontSize: "0.9rem", color: "#64748b" }}>{expandImportant ? "∧" : "∨"}</span>
                  </div>

                  <span style={{ background: "#0047ab", color: "#ffffff", padding: "4px 12px", borderRadius: "14px", fontSize: "0.75rem", fontWeight: 700 }}>
                    {openImportantCount} Offen
                  </span>
                </div>

                {expandImportant && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "20px" }}>
                    {importantTasks
                      .filter(t => activeNav === "erledigt" ? t.completed : activeNav === "offene_aufgaben" ? !t.completed : true)
                      .map(t => (
                      <div key={t.id} onClick={() => handleToggleImportantTask(t.id)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer", opacity: t.completed ? 0.6 : 1 }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: t.completed ? "none" : "2px solid #cbd5e1", background: t.completed ? "#0047ab" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "2px", flexShrink: 0 }}>
                          {t.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>

                        <div style={{ flexGrow: 1 }}>
                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", textDecoration: t.completed ? "line-through" : "none", marginBottom: "4px" }}>
                            {t.title}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "10px" }}>
                            {t.desc}
                          </div>

                          <div style={{ display: "flex", gap: "8px" }}>
                            <span style={{ background: t.dueColor === "red" ? "#fee2e2" : "#f1f5f9", color: t.dueColor === "red" ? "#b91c1c" : "#475569", padding: "3px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700 }}>
                              ● Fällig: {t.dueDate}
                            </span>
                            <span style={{ background: t.statusColor === "cyan" ? "#cff4fc" : "#f1f5f9", color: t.statusColor === "cyan" ? "#055160" : "#475569", padding: "3px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700 }}>
                              {t.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {importantTasks.filter(t => activeNav === "erledigt" ? t.completed : activeNav === "offene_aufgaben" ? !t.completed : true).length === 0 && (
                      <div style={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic", textAlign: "center", padding: "12px" }}>
                        Keine Aufgaben in dieser Kategorie.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* CARD 2: Aufgaben vom Praxisanleiter (Collapsible v, Badge: "2 Neu", Icon: 🎓) */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div onClick={() => setExpandPraxis(!expandPraxis)} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <span style={{ fontSize: "1.2rem" }}>🎓</span>
                  <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                    Aufgaben vom Praxisanleiter
                  </h2>
                  <span style={{ fontSize: "0.9rem", color: "#64748b" }}>{expandPraxis ? "∧" : "∨"}</span>
                </div>

                <span style={{ background: "#cff4fc", color: "#055160", padding: "4px 12px", borderRadius: "14px", fontSize: "0.75rem", fontWeight: 800 }}>
                  {openPraxisCount} Neu
                </span>
              </div>

              {(expandPraxis || activeNav === "praxis") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "20px" }}>
                  {praxisTasks
                    .filter(pt => activeNav === "erledigt" ? pt.completed : activeNav === "offene_aufgaben" ? !pt.completed : true)
                    .map(pt => (
                    <div key={pt.id} onClick={() => handleTogglePraxisTask(pt.id)} style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "16px", display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer", opacity: pt.completed ? 0.6 : 1 }}>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: pt.completed ? "none" : "2px solid #0284c7", background: pt.completed ? "#0284c7" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "2px", flexShrink: 0 }}>
                        {pt.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>

                      <div style={{ flexGrow: 1 }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", textDecoration: pt.completed ? "line-through" : "none", marginBottom: "4px" }}>
                          {pt.title}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "8px" }}>
                          {pt.desc}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#0284c7", fontWeight: 700 }}>
                          👨‍⚕️ Zugewiesen von: {pt.preceptor} | Fällig: {pt.dueDate}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CARD 3: Tägliche Aufgaben (Collapsible v) */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div onClick={() => setExpandDaily(!expandDaily)} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                  Tägliche Aufgaben
                </h2>
                <span style={{ fontSize: "0.9rem", color: "#64748b" }}>{expandDaily ? "∧" : "∨"}</span>
              </div>

              {expandDaily && (
                <div style={{ marginTop: "20px" }}>
                  <form onSubmit={handleAddDailyTask} style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
                    <div style={{ position: "relative", flexGrow: 1 }}>
                      <span style={{ position: "absolute", left: "14px", top: "11px", color: "#94a3b8", fontSize: "1.1rem" }}>+</span>
                      <input type="text" placeholder="Neue Aufgabe hinzufügen..." value={newDailyInput} onChange={e => setNewDailyInput(e.target.value)} style={{ width: "100%", padding: "10px 14px 10px 34px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <button type="submit" style={{ background: "#0047ab", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>Hinzufügen</button>
                  </form>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {dailyTasks
                      .filter(t => activeNav === "erledigt" ? t.completed : activeNav === "offene_aufgaben" ? !t.completed : true)
                      .map(t => (
                      <div key={t.id} onClick={() => handleToggleDailyTask(t.id)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: t.completed ? "none" : "2px solid #cbd5e1", background: t.completed ? "#0047ab" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {t.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ fontSize: "0.92rem", fontWeight: t.completed ? 500 : 700, color: t.completed ? "#94a3b8" : "#0f172a", textDecoration: t.completed ? "line-through" : "none" }}>{t.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: PERSÖNLICHER FORTSCHRITT & HEATMAP */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <h2 style={{ margin: "0 0 20px 0", fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
              Persönlicher Fortschritt
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "28px" }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 12px", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#0047ab", lineHeight: 1 }}>12</div>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, marginTop: "8px", lineHeight: 1.3 }}>Erledigte Aufgaben diese Woche</div>
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 12px", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0f172a", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <span>🔥</span><span>5</span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, marginTop: "8px", lineHeight: 1.3 }}>Aktuelle Serie (Tage)</div>
              </div>
            </div>

            {/* JÄHRLICHE BEITRÄGE (HEATMAP) */}
            <div>
              <h3 style={{ margin: "0 0 14px 0", fontSize: "0.9rem", fontWeight: 800, color: "#0f172a" }}>
                Jährliche Beiträge
              </h3>

              <div style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "8px", padding: "10px 4px" }}>
                <div style={{ display: "flex", paddingLeft: "24px", marginBottom: "6px", fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>
                  <span style={{ width: "25%" }}>Jan</span>
                  <span style={{ width: "25%" }}>Feb</span>
                  <span style={{ width: "25%" }}>Mrz</span>
                  <span style={{ width: "25%" }}>Apr</span>
                </div>

                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.62rem", color: "#94a3b8", fontWeight: 700, paddingRight: "4px" }}>
                    <span style={{ height: "10px", lineHeight: "10px" }}>Mo</span>
                    <span style={{ height: "10px", lineHeight: "10px", marginTop: "10px" }}>Mi</span>
                    <span style={{ height: "10px", lineHeight: "10px", marginTop: "10px" }}>Fr</span>
                  </div>

                  <div style={{ display: "flex", gap: "3px", flexGrow: 1, overflowX: "auto" }}>
                    {heatmapWeeks.map((week, wIdx) => (
                      <div key={wIdx} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        {week.map((day, dIdx) => {
                          const level = day.count;
                          let bgColor = "#f1f5f9";
                          if (level === 1) bgColor = "#93c5fd";
                          if (level === 2) bgColor = "#3b82f6";
                          if (level === 3) bgColor = "#1d4ed8";
                          if (level >= 4) bgColor = "#0047ab";

                          return (
                            <div key={dIdx} onMouseEnter={() => setHoveredDay(day)} onMouseLeave={() => setHoveredDay(null)} style={{ width: "10px", height: "10px", borderRadius: "2px", background: bgColor, cursor: "pointer" }} />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {hoveredDay && (
                  <div style={{ marginTop: "12px", background: "#0f172a", color: "#ffffff", padding: "6px 12px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700, textAlign: "center" }}>
                    📅 {hoveredDay.date}: <span style={{ color: "#38bdf8" }}>{hoveredDay.count} Aufgaben erledigt</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "4px", marginTop: "12px", paddingRight: "4px", fontSize: "0.65rem", color: "#64748b", fontWeight: 600 }}>
                  <span>Weniger</span>
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#f1f5f9" }} />
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#93c5fd" }} />
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#3b82f6" }} />
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#1d4ed8" }} />
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#0047ab" }} />
                  <span>Mehr</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* MODAL */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "480px", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>➕ Neue Aufgabe erstellen</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: "1.4rem", color: "#94a3b8", cursor: "pointer" }}>&times;</button>
            </div>
            <form onSubmit={handleCreateModalTask} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Titel der Aufgabe</label>
                <input type="text" value={newModalTask.title} onChange={e => setNewModalTask(prev => ({ ...prev, title: e.target.value }))} required style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "10px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>Abbrechen</button>
                <button type="submit" style={{ padding: "10px 24px", background: "#0047ab", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 800, cursor: "pointer" }}>Aufgabe Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
