/**
 * TermineView.jsx — Pixel-Perfect Appointment Booking Portal matching User Screenshot
 * 
 * Features:
 * 1. Left Sidebar (#f4f6f9 bg, 270px) with "Termin" branding (Blue calendar check icon & navy title).
 *    Nav Links: "Requests" (active #dbeafe pill), "History".
 * 2. Main Header: "Termin vereinbaren" & "Erstellen Sie eine neue Terminanfrage für Dozenten oder Betreuer."
 * 3. Left Form Card:
 *    - Empfänger dropdown (Bitte wählen...)
 *    - Betreff input (Worum geht es?)
 *    - Datum (dd.mm.yyyy 📅) & Uhrzeit (--:-- 🕒)
 *    - Nachricht textarea (Zusätzliche Details zur Terminanfrage...)
 *    - Right-aligned "▷ Anfrage senden" navy blue button (#0047ab)
 * 4. Right Column "Meine Terminanfragen":
 *    - Card 1: Projektbesprechung | Ausstehend | Prof. Dr. Schmidt (Dozent) | 12. Okt 2023, 10:00 Uhr
 *    - Card 2: Praxisfeedback | Bestätigt | Frau Müller (Praxisanleiter) | 15. Okt 2023, 14:30 Uhr
 *    - Card 3: Kurzbesprechung | Abgelehnt | Herr Weber (Koordinator) | 09. Okt 2023, 09:00 Uhr
 */

import React, { useState } from "react";

const INITIAL_APPOINTMENTS = [
  {
    id: "apt-1",
    title: "Projektbesprechung",
    contact: "Prof. Dr. Schmidt (Dozent)",
    dateTime: "12. Okt 2023, 10:00 Uhr",
    status: "Ausstehend",
    statusType: "pending"
  },
  {
    id: "apt-2",
    title: "Praxisfeedback",
    contact: "Frau Müller (Praxisanleiter)",
    dateTime: "15. Okt 2023, 14:30 Uhr",
    status: "Bestätigt",
    statusType: "confirmed"
  },
  {
    id: "apt-3",
    title: "Kurzbesprechung",
    contact: "Herr Weber (Koordinator)",
    dateTime: "09. Okt 2023, 09:00 Uhr",
    status: "Abgelehnt",
    statusType: "rejected"
  }
];

export default function TermineView({ onHome, currentUser }) {
  const [activeNav, setActiveNav] = useState("requests"); // 'requests' | 'history'
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);

  // Form State
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [showSuccessNotice, setShowSuccessNotice] = useState(false);

  const handleSubmitAppointment = (e) => {
    e.preventDefault();
    if (!subject.trim() || !recipient) return;

    const newApt = {
      id: `apt-${Date.now()}`,
      title: subject.trim(),
      contact: recipient,
      dateTime: `${date || "16. Okt 2023"}, ${time || "10:00"} Uhr`,
      status: "Ausstehend",
      statusType: "pending"
    };

    setAppointments(prev => [newApt, ...prev]);
    setSubject("");
    setRecipient("");
    setDate("");
    setTime("");
    setMessage("");

    setShowSuccessNotice(true);
    setTimeout(() => setShowSuccessNotice(false), 4000);
  };

  const displayedAppointments = activeNav === "history" 
    ? appointments.filter(a => a.statusType !== "pending")
    : appointments;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#ffffff", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: "#0f172a" }}>
      
      {/* 1. LEFT SIDEBAR (Width 270px, #f4f6f9 bg) */}
      <aside style={{ width: "270px", background: "#f4f6f9", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          {/* Brand Header */}
          <div onClick={onHome} style={{ padding: "24px 20px 18px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #e5e7eb", cursor: "pointer" }} title="Zurück zur Startseite">
            <div style={{ width: "32px", height: "32px", border: "2px solid #0047ab", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#0047ab" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <polyline points="9 16 11 18 15 14"/>
              </svg>
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0047ab", letterSpacing: "-0.01em" }}>
              Termin
            </div>
          </div>

          {/* Nav Items */}
          <nav style={{ padding: "20px 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              onClick={() => setActiveNav("requests")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeNav === "requests" ? "#dbeafe" : "transparent",
                color: activeNav === "requests" ? "#1d4ed8" : "#475569",
                fontWeight: activeNav === "requests" ? 700 : 500,
                fontSize: "0.9rem",
                cursor: "pointer",
                textAlign: "left",
                width: "100%"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Requests</span>
            </button>

            <button
              onClick={() => setActiveNav("history")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeNav === "history" ? "#dbeafe" : "transparent",
                color: activeNav === "history" ? "#1d4ed8" : "#475569",
                fontWeight: activeNav === "history" ? 700 : 500,
                fontSize: "0.9rem",
                cursor: "pointer",
                textAlign: "left",
                width: "100%"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
              <span>History</span>
            </button>
          </nav>
        </div>

        {/* Bottom Home Action */}
        <div style={{ padding: "14px", borderTop: "1px solid #e5e7eb" }}>
          <button onClick={onHome} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "6px", border: "none", background: "transparent", color: "#475569", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", width: "100%" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Startseite</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTENT */}
      <main style={{ flexGrow: 1, padding: "40px 48px", overflowY: "auto" }}>
        
        {/* Main Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>
            Termin vereinbaren
          </h1>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569" }}>
            Erstellen Sie eine neue Terminanfrage für Dozenten oder Betreuer.
          </p>
        </div>

        {/* Two Columns Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", alignItems: "flex-start" }}>
          
          {/* LEFT COLUMN: FORM CARD */}
          <div>
            {showSuccessNotice && (
              <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: "8px", padding: "12px 16px", color: "#166534", fontWeight: 700, fontSize: "0.88rem", marginBottom: "20px" }}>
                ✓ Terminanfrage wurde erfolgreich abgesendet!
              </div>
            )}

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <form onSubmit={handleSubmitAppointment} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* Empfänger */}
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Empfänger</label>
                  <select
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                    required
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.92rem", color: recipient ? "#0f172a" : "#64748b", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="Prof. Dr. Schmidt (Dozent)">Prof. Dr. Schmidt (Dozent)</option>
                    <option value="Frau Müller (Praxisanleiter)">Frau Müller (Praxisanleiter)</option>
                    <option value="Herr Weber (Koordinator)">Herr Weber (Koordinator)</option>
                  </select>
                </div>

                {/* Betreff / Thema */}
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Betreff / Thema</label>
                  <input
                    type="text"
                    placeholder="Worum geht es?"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.92rem", color: "#0f172a", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {/* Datum & Uhrzeit */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Datum</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.92rem", color: "#0f172a", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Uhrzeit</label>
                    <input
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.92rem", color: "#0f172a", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                {/* Nachricht */}
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Nachricht</label>
                  <textarea
                    rows="4"
                    placeholder="Zusätzliche Details zur Terminanfrage..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.92rem", color: "#0f172a", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>

                {/* Submit Button (Navy Blue, Right-aligned) */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button
                    type="submit"
                    style={{
                      background: "#0047ab",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px 28px",
                      fontWeight: 800,
                      fontSize: "0.92rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0, 47, 171, 0.2)"
                    }}
                  >
                    <span style={{ fontSize: "0.9rem" }}>▷</span>
                    <span>Anfrage senden</span>
                  </button>
                </div>

              </form>

            </div>

          </div>

          {/* RIGHT COLUMN: MEINE TERMINANFRAGEN LIST */}
          <div>
            <h2 style={{ margin: "0 0 24px 0", fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
              Meine Terminanfragen
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {displayedAppointments.map(apt => {
                let badgeBg = "#f1f5f9";
                let badgeColor = "#475569";
                let badgeText = `⏱️ ${apt.status}`;
                let borderLeftColor = "#cbd5e1";

                if (apt.statusType === "confirmed" || apt.status === "Bestätigt") {
                  badgeBg = "#cff4fc";
                  badgeColor = "#055160";
                  badgeText = `✓ Bestätigt`;
                  borderLeftColor = "#0284c7";
                } else if (apt.statusType === "rejected" || apt.status === "Abgelehnt") {
                  badgeBg = "#fee2e2";
                  badgeColor = "#b91c1c";
                  badgeText = `✕ Abgelehnt`;
                  borderLeftColor = "#ef4444";
                }

                return (
                  <div
                    key={apt.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderLeft: `4px solid ${borderLeftColor}`,
                      borderRadius: "10px",
                      padding: "20px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px"
                    }}
                  >
                    {/* Title & Status Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                        {apt.title}
                      </div>

                      <span style={{ background: badgeBg, color: badgeColor, padding: "3px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 800, whiteSpace: "nowrap" }}>
                        {badgeText}
                      </span>
                    </div>

                    {/* Contact Subtitle */}
                    <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
                      {apt.contact}
                    </div>

                    {/* Date & Time Line */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#475569", fontWeight: 600, marginTop: "4px" }}>
                      <span>📅</span>
                      <span>{apt.dateTime}</span>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
