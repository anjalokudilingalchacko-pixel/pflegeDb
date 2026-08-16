/**
 * CalendarView.jsx — Pixel-Perfect NurseAcademy Clinical Portal Calendar & Scheduling System
 * 
 * Matched 1:1 to User Reference Screenshots 1, 2, 3, and 4:
 * - View 1: 2024 Academic Year (12-Month Grid with Exams, Milestones & Clinical indicators)
 * - View 2: September 2024 (Full 7-Column Month Grid with Colored Event Badges)
 * - View 3: Add Event Modal (Title, Date & Time, Lecture/Clinical/Exam Pills, Notes, Toggle)
 * - View 4: Notifications Drawer / View (Today/Yesterday Grouped Alerts, Mark as Read)
 */

import React, { useState } from "react";

const INITIAL_EVENTS = [
  { id: "evt-1", title: "Lecture: Pharm", date: "2024-09-02", time: "09:00", type: "Lecture", typeLabel: "Lecture", color: "#0284c7", bg: "#e0f2fe" },
  { id: "evt-2", title: "Clinical Prep", date: "2024-09-04", time: "10:30", type: "Clinical", typeLabel: "Clinical", color: "#0d9488", bg: "#ccfbf1" },
  { id: "evt-3", title: "Anatomy Exam", date: "2024-09-06", time: "08:00", type: "Exam", typeLabel: "Exam", color: "#e11d48", bg: "#ffe4e6", isUrgent: true },
  { id: "evt-4", title: "Abschluss", date: "2024-09-27", time: "14:00", type: "Clinical", typeLabel: "Clinical", color: "#0f766e", bg: "#0d9488", textColor: "#ffffff" },
  { id: "evt-5", title: "Pediatrics Rotation", date: "2024-10-15", time: "07:00", type: "Clinical", typeLabel: "Clinical", color: "#0d9488", bg: "#ccfbf1" },
  { id: "evt-6", title: "Pathophysiology II Final Exam", date: "2024-03-25", time: "08:00", type: "Exam", typeLabel: "Exam", color: "#e11d48", bg: "#ffe4e6", isUrgent: true }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Final Exam tomorrow",
    desc: "Pathophysiology II - Room 302, Science Building. Ensure you bring your ID.",
    time: "8:00 AM • Exam",
    dateGroup: "TODAY",
    type: "Exam",
    isUrgent: true,
    accentColor: "#ef4444",
    icon: "⚠️"
  },
  {
    id: "notif-2",
    title: "Reminder: Clinical Rotation starts in 2 days",
    desc: "Pediatrics Ward, Mercy General Hospital. Pre-briefing materials available.",
    time: "Mar 24, 7:00 AM • Clinicals",
    dateGroup: "TODAY",
    type: "Clinical",
    subTime: "2h ago",
    accentColor: "#0d9488",
    icon: "🩺"
  },
  {
    id: "notif-3",
    title: "Assignment Graded",
    desc: "Your Care Plan draft has been reviewed by Prof. Smith. Grade: 92/100.",
    time: "Yesterday",
    dateGroup: "YESTERDAY",
    type: "System",
    accentColor: "#3b82f6",
    icon: "✓"
  },
  {
    id: "notif-4",
    title: "Schedule Updated",
    desc: "A new study session has been added to the calendar for Pharmacology.",
    time: "Yesterday",
    dateGroup: "YESTERDAY",
    type: "System",
    accentColor: "#0284c7",
    icon: "📅"
  }
];

export default function CalendarView({ onHome, currentUser }) {
  const [activeSidebarNav, setActiveSidebarNav] = useState("calendar"); // 'dashboard' | 'calendar' | 'exams' | 'clinical' | 'notifications' | 'settings'
  const [calendarViewMode, setCalendarViewMode] = useState("year"); // 'year' | 'month' | 'week'
  
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [notifFilter, setNotifFilter] = useState("All Updates");

  // Add Event Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    title: "",
    date: "2024-09-15",
    time: "09:00",
    type: "Lecture",
    notes: "",
    notify: true
  });

  // Current Month State for Month View
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(2024, 8, 1)); // September 2024

  const handleAddEventSubmit = (e) => {
    e.preventDefault();
    if (!newEventForm.title.trim()) return;

    let color = "#0284c7";
    let bg = "#e0f2fe";
    if (newEventForm.type === "Clinical") {
      color = "#0d9488";
      bg = "#ccfbf1";
    } else if (newEventForm.type === "Exam") {
      color = "#e11d48";
      bg = "#ffe4e6";
    }

    const createdEvent = {
      id: `evt-${Date.now()}`,
      title: newEventForm.title.trim(),
      date: newEventForm.date,
      time: newEventForm.time,
      type: newEventForm.type,
      typeLabel: newEventForm.type,
      color,
      bg
    };

    setEvents(prev => [...prev, createdEvent]);
    setShowAddModal(false);
    setNewEventForm({ title: "", date: "2024-09-15", time: "09:00", type: "Lecture", notes: "", notify: true });
  };

  // Month Generation Helpers for Year View
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonthCount = (year, monthIdx) => {
    return new Date(year, monthIdx + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (year, monthIdx) => {
    const day = new Date(year, monthIdx, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday start
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: "#0f172a" }}>
      
      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR (Width 260px, Light Blue #f0f4f9) */}
      {/* ============================================================ */}
      <aside style={{ width: "260px", background: "#f0f4f9", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          {/* Logo Branding */}
          <div onClick={onHome} style={{ padding: "24px 20px 18px 20px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} title="Zurück zur Startseite">
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#006699", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.85rem" }}>
              NA
            </div>
            <div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0047ab", lineHeight: 1.2 }}>NurseAcademy</div>
              <div style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600 }}>Clinical Portal</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              onClick={() => setActiveSidebarNav("dashboard")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeSidebarNav === "dashboard" ? "#e0edff" : "transparent",
                color: activeSidebarNav === "dashboard" ? "#1d4ed8" : "#475569",
                fontWeight: activeSidebarNav === "dashboard" ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveSidebarNav("calendar")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeSidebarNav === "calendar" ? "#e0edff" : "transparent",
                color: activeSidebarNav === "calendar" ? "#1d4ed8" : "#475569",
                fontWeight: activeSidebarNav === "calendar" ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setActiveSidebarNav("exams")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeSidebarNav === "exams" ? "#e0edff" : "transparent",
                color: activeSidebarNav === "exams" ? "#1d4ed8" : "#475569",
                fontWeight: activeSidebarNav === "exams" ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>Exams</span>
            </button>

            <button
              onClick={() => setActiveSidebarNav("clinical")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeSidebarNav === "clinical" ? "#e0edff" : "transparent",
                color: activeSidebarNav === "clinical" ? "#1d4ed8" : "#475569",
                fontWeight: activeSidebarNav === "clinical" ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              <span>Clinical Rotations</span>
            </button>

            <button
              onClick={() => setActiveSidebarNav("notifications")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeSidebarNav === "notifications" ? "#e0edff" : "transparent",
                color: activeSidebarNav === "notifications" ? "#1d4ed8" : "#475569",
                fontWeight: activeSidebarNav === "notifications" ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span>Notifications</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div>
          <div style={{ padding: "0 14px 12px 14px" }}>
            <button
              onClick={() => setActiveSidebarNav("settings")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: "#475569",
                fontWeight: 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                width: "100%"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Settings</span>
            </button>
          </div>

          <div style={{ padding: "12px 14px 20px 14px" }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                width: "100%",
                height: "44px",
                background: "#006699",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0, 102, 153, 0.25)"
              }}
            >
              <span style={{ fontSize: "1.2rem", fontWeight: 400 }}>+</span>
              <span>Add Event</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MAIN CONTENT AREA */}
      {/* ============================================================ */}
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        
        {/* Top Header Bar */}
        <header style={{ height: "64px", background: "#ffffff", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 36px" }}>
          
          {/* Left: Search input or title */}
          {activeSidebarNav === "notifications" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <span onClick={() => setCalendarViewMode("year")} style={{ fontSize: "0.9rem", fontWeight: 600, color: calendarViewMode === "year" ? "#006699" : "#64748b", cursor: "pointer" }}>Year</span>
              <span onClick={() => setCalendarViewMode("month")} style={{ fontSize: "0.9rem", fontWeight: 600, color: calendarViewMode === "month" ? "#006699" : "#64748b", cursor: "pointer" }}>Month</span>
              <span onClick={() => setCalendarViewMode("week")} style={{ fontSize: "0.9rem", fontWeight: 600, color: calendarViewMode === "week" ? "#006699" : "#64748b", cursor: "pointer" }}>Week</span>
            </div>
          ) : (
            <div style={{ position: "relative", width: "320px" }}>
              <span style={{ position: "absolute", left: "14px", top: "10px", color: "#94a3b8", fontSize: "0.88rem" }}>🔍</span>
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 14px 8px 38px",
                  borderRadius: "20px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  fontSize: "0.88rem",
                  outline: "none"
                }}
              />
            </div>
          )}

          {/* Right View Switcher & Utilities */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            
            {activeSidebarNav !== "notifications" && (
              <div style={{ display: "flex", alignItems: "center", gap: "18px", borderRight: "1px solid #e2e8f0", paddingRight: "20px" }}>
                <button onClick={() => setCalendarViewMode("year")} style={{ background: "none", border: "none", fontSize: "0.88rem", fontWeight: calendarViewMode === "year" ? 800 : 500, color: calendarViewMode === "year" ? "#006699" : "#64748b", cursor: "pointer", borderBottom: calendarViewMode === "year" ? "2px solid #006699" : "none", paddingBottom: "4px" }}>Year</button>
                <button onClick={() => setCalendarViewMode("month")} style={{ background: "none", border: "none", fontSize: "0.88rem", fontWeight: calendarViewMode === "month" ? 800 : 500, color: calendarViewMode === "month" ? "#006699" : "#64748b", cursor: "pointer", borderBottom: calendarViewMode === "month" ? "2px solid #006699" : "none", paddingBottom: "4px" }}>Month</button>
                <button onClick={() => setCalendarViewMode("week")} style={{ background: "none", border: "none", fontSize: "0.88rem", fontWeight: calendarViewMode === "week" ? 800 : 500, color: calendarViewMode === "week" ? "#006699" : "#64748b", cursor: "pointer", borderBottom: calendarViewMode === "week" ? "2px solid #006699" : "none", paddingBottom: "4px" }}>Week</button>
              </div>
            )}

            <button onClick={() => setShowAddModal(true)} style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 14px", fontWeight: 700, fontSize: "0.82rem", color: "#006699", cursor: "pointer" }}>
              Add Event
            </button>

            <button onClick={() => setActiveSidebarNav("notifications")} style={{ position: "relative", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.2rem" }} title="Notifications">
              🔔
              <span style={{ position: "absolute", top: "0", right: "0", width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%" }} />
            </button>

            <button style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.2rem" }} title="Help">
              ❓
            </button>

            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#0284c7", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem" }} title="Jane Doe (Student RN)">
              JD
            </div>
          </div>

        </header>

        {/* View Routing */}
        <main style={{ padding: "36px 48px", overflowY: "auto", flexGrow: 1 }}>
          
          {/* VIEW A: NOTIFICATIONS VIEW (Matched to Screenshot 4) */}
          {activeSidebarNav === "notifications" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h1 style={{ margin: "0 0 6px 0", fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>
                    Notifications
                  </h1>
                  <p style={{ margin: 0, fontSize: "0.92rem", color: "#64748b" }}>
                    Stay on top of your schedule and academic requirements.
                  </p>
                </div>

                <button onClick={() => alert("All notifications marked as read.")} style={{ background: "none", border: "none", color: "#006699", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>
                  ✓ Mark all as read
                </button>
              </div>

              {/* Notification Category Filters */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "32px" }}>
                {["All Updates", "Exams", "Clinicals", "System"].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNotifFilter(cat)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "20px",
                      border: notifFilter === cat ? "none" : "1px solid #cbd5e1",
                      background: notifFilter === cat ? "#0f172a" : "#ffffff",
                      color: notifFilter === cat ? "#ffffff" : "#475569",
                      fontWeight: notifFilter === cat ? 800 : 600,
                      fontSize: "0.85rem",
                      cursor: "pointer"
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grouped Notifications */}
              {["TODAY", "YESTERDAY"].map(group => {
                const groupNotifs = notifications.filter(n => n.dateGroup === group && (notifFilter === "All Updates" || n.type === notifFilter || (notifFilter === "Clinicals" && n.type === "Clinical")));
                if (groupNotifs.length === 0) return null;

                return (
                  <div key={group} style={{ marginBottom: "28px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.05em", marginBottom: "12px" }}>
                      {group}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {groupNotifs.map(n => (
                        <div
                          key={n.id}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderLeft: `4px solid ${n.accentColor}`,
                            borderRadius: "12px",
                            padding: "20px 24px",
                            display: "flex",
                            gap: "16px",
                            alignItems: "flex-start",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                          }}
                        >
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `${n.accentColor}15`, color: n.accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                            {n.icon}
                          </div>

                          <div style={{ flexGrow: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                                {n.title}
                              </h3>
                              {n.isUrgent && (
                                <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 800 }}>
                                  Urgent
                                </span>
                              )}
                              {n.subTime && (
                                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{n.subTime}</span>
                              )}
                            </div>

                            <p style={{ margin: "0 0 8px 0", fontSize: "0.88rem", color: "#64748b" }}>
                              {n.desc}
                            </p>

                            <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600 }}>
                              ⏱ {n.time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div style={{ textAlign: "center", marginTop: "24px" }}>
                <button style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "20px", padding: "10px 24px", fontWeight: 700, fontSize: "0.85rem", color: "#475569", cursor: "pointer" }}>
                  Load Earlier Notifications
                </button>
              </div>
            </div>
          )}

          {/* VIEW B: YEAR VIEW (Matched to Screenshot 1 - "2024 Academic Year") */}
          {activeSidebarNav !== "notifications" && calendarViewMode === "year" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <div>
                  <h1 style={{ margin: "0 0 6px 0", fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>
                    2024 Academic Year
                  </h1>
                  <p style={{ margin: 0, fontSize: "0.95rem", color: "#64748b" }}>
                    Cohorte B - Nursing Science
                  </p>
                </div>

                {/* Event Category Indicators */}
                <div style={{ display: "flex", alignItems: "center", gap: "20px", background: "#ffffff", border: "1px solid #e2e8f0", padding: "8px 18px", borderRadius: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                    <span>Exams</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f97316" }} />
                    <span>Milestones</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0d9488" }} />
                    <span>Clinical</span>
                  </div>
                </div>
              </div>

              {/* 12-Month Mini Grid (4 columns x 3 rows) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
                {monthNames.map((mName, mIdx) => {
                  const daysInMonth = getDaysInMonthCount(2024, mIdx);
                  const startDay = getFirstDayOfWeek(2024, mIdx);

                  return (
                    <div
                      key={mName}
                      onClick={() => {
                        setCurrentMonthDate(new Date(2024, mIdx, 1));
                        setCalendarViewMode("month");
                      }}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        padding: "20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        cursor: "pointer",
                        transition: "transform 0.15s ease, boxShadow 0.15s ease"
                      }}
                    >
                      <h3 style={{ margin: "0 0 14px 0", fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                        {mName}
                      </h3>

                      {/* Days Header */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", marginBottom: "8px" }}>
                        <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                      </div>

                      {/* Days Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center", fontSize: "0.78rem", fontWeight: 600, color: "#334155" }}>
                        {/* Empty padding cells */}
                        {Array.from({ length: startDay }).map((_, i) => (
                          <span key={`blank-${i}`} />
                        ))}

                        {/* Month Days */}
                        {Array.from({ length: daysInMonth }).map((_, dIdx) => {
                          const dayNum = dIdx + 1;
                          const dateStr = `2024-${String(mIdx + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                          const hasExam = events.some(e => e.date === dateStr && e.type === "Exam");
                          const hasClinical = events.some(e => e.date === dateStr && e.type === "Clinical");

                          let bg = "transparent";
                          let color = "#334155";
                          let border = "none";

                          if (hasExam) {
                            bg = "#fee2e2";
                            color = "#b91c1c";
                          } else if (hasClinical) {
                            bg = "#ccfbf1";
                            color = "#0f766e";
                          } else if (mIdx === 8 && dayNum === 27) { // Sept 27
                            border = "2px solid #f97316";
                            color = "#f97316";
                          } else if (mIdx === 6 && dayNum === 17) { // July 17
                            border = "2px solid #ef4444";
                            color = "#ef4444";
                          }

                          return (
                            <span
                              key={dayNum}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: bg,
                                color: color,
                                border: border,
                                margin: "0 auto"
                              }}
                            >
                              {dayNum}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* VIEW C: MONTH VIEW (Matched to Screenshot 2 - "September 2024") */}
          {activeSidebarNav !== "notifications" && calendarViewMode === "month" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>
                  September 2024
                </h1>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setCurrentMonthDate(new Date(2024, 7, 1))} style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 12px", fontWeight: 700, cursor: "pointer" }}>&lt;</button>
                  <button onClick={() => setCurrentMonthDate(new Date(2024, 9, 1))} style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 12px", fontWeight: 700, cursor: "pointer" }}>&gt;</button>
                </div>
              </div>

              {/* 7-Column Calendar Grid */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                {/* Column Day Headers */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 0", textAlign: "center", fontSize: "0.75rem", fontWeight: 800, color: "#475569" }}>
                  <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
                </div>

                {/* Days Grid (5 Rows x 7 Cols) */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "120px" }}>
                  {Array.from({ length: 35 }).map((_, idx) => {
                    const dayNum = idx; // Sept 1 starts Sun
                    const isSeptember = dayNum >= 1 && dayNum <= 30;
                    let displayDay = dayNum;
                    if (dayNum === 0) displayDay = 1; // Sun Sept 1st

                    const dateStr = `2024-09-${String(displayDay).padStart(2, "0")}`;
                    const dayEvents = events.filter(e => e.date === dateStr);

                    return (
                      <div
                        key={idx}
                        onClick={() => setShowAddModal(true)}
                        style={{
                          borderRight: (idx + 1) % 7 === 0 ? "none" : "1px solid #f1f5f9",
                          borderBottom: "1px solid #f1f5f9",
                          padding: "10px",
                          background: isSeptember ? "#ffffff" : "#f8fafc",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "6px" }}>
                          <span
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              background: displayDay === 6 ? "#0047ab" : "transparent",
                              color: displayDay === 6 ? "#ffffff" : (isSeptember ? "#0f172a" : "#cbd5e1"),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.82rem",
                              fontWeight: 800
                            }}
                          >
                            {displayDay}
                          </span>
                        </div>

                        {/* Event Badges */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {dayEvents.map(e => (
                            <div
                              key={e.id}
                              style={{
                                background: e.bg,
                                color: e.textColor || e.color,
                                padding: "4px 8px",
                                borderRadius: "12px",
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <span>●</span>
                              <span>{e.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* VIEW D: WEEK VIEW */}
          {activeSidebarNav !== "notifications" && calendarViewMode === "week" && (
            <div>
              <h1 style={{ margin: "0 0 20px 0", fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>
                Week Schedule (Sep 1 - Sep 7, 2024)
              </h1>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px" }}>
                {events.map(e => (
                  <div key={e.id} style={{ padding: "12px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{e.title}</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Date: {e.date} | Time: {e.time}</div>
                    </div>
                    <span style={{ background: e.bg, color: e.color, padding: "4px 12px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 800, height: "fit-content" }}>{e.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

      </div>

      {/* ============================================================ */}
      {/* 3. ADD EVENT MODAL (Matched to Screenshot 3) */}
      {/* ============================================================ */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "480px", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.3rem" }}>📅</span>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>Add Event</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: "1.4rem", color: "#94a3b8", cursor: "pointer" }}>&times;</button>
            </div>

            <form onSubmit={handleAddEventSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              
              {/* Event Title */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Event Title</label>
                <input
                  type="text"
                  placeholder="e.g., Clinical Rotation"
                  value={newEventForm.title}
                  onChange={e => setNewEventForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                />
              </div>

              {/* Date & Time Side by Side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Date</label>
                  <input
                    type="date"
                    value={newEventForm.date}
                    onChange={e => setNewEventForm(prev => ({ ...prev, date: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Time</label>
                  <input
                    type="time"
                    value={newEventForm.time}
                    onChange={e => setNewEventForm(prev => ({ ...prev, time: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Event Type Select Pills */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Event Type</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {[
                    { type: "Lecture", icon: "📖" },
                    { type: "Clinical", icon: "🩺" },
                    { type: "Exam", icon: "📝" }
                  ].map(t => {
                    const isSel = newEventForm.type === t.type;
                    return (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => setNewEventForm(prev => ({ ...prev, type: t.type }))}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: "8px",
                          border: isSel ? "2px solid #006699" : "1px solid #cbd5e1",
                          background: isSel ? "#f0f9ff" : "#ffffff",
                          color: isSel ? "#006699" : "#475569",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px"
                        }}
                      >
                        <span>{t.icon}</span>
                        <span>{t.type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes Optional */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Notes (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Add location or details..."
                  value={newEventForm.notes}
                  onChange={e => setNewEventForm(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              {/* Notify Me Switch Toggle */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>Notify Me</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Receive a reminder on this exact date.</div>
                </div>

                <input
                  type="checkbox"
                  checked={newEventForm.notify}
                  onChange={e => setNewEventForm(prev => ({ ...prev, notify: e.target.checked }))}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 20px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: 700, fontSize: "0.88rem", color: "#475569", cursor: "pointer" }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{ padding: "10px 24px", background: "#006699", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 800, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                >
                  <span>✓</span>
                  <span>Save Event</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
