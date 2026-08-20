/**
 * TamSurveyView.jsx — Pixel-Perfect TAM Interface matching the user's design image exactly
 * 
 * Features:
 * 1. Clean Light Sidebar (280px width, #f4f6f9 bg) with Portal Branding, Nav items, Administration & fixed "+ Add New Survey" button.
 * 2. Active Surveys Page Title & Subtitle (Fully customizable by Administrator).
 * 3. Exact 3-Card Grid matching Clinical Placement Feedback, End of Semester Evaluation, and Peer Support Survey cards.
 * 4. Interactive Modal for Taking Surveys connected live to Google Forms (1FAIpQLSfHnSFtrLM4Yieqci8S1HzLUEDSRNvVKqPaO_3eNlVEU6rsLg).
 * 5. Administrator Control Panel to edit heading, subtitle, portal branding, and add new surveys dynamically.
 */

import React, { useState, useEffect } from "react";
import { UserProfileMenu } from "./feedShared";

const STAFF_TAM_FORM_ID = "1FAIpQLSfPLNd0fFsQzfbl_cIbX74nvrbv6VKqk4cdZcgTGPtq5L9OTQ";
const STAFF_TAM_FORM_EMBED_URL = `https://docs.google.com/forms/d/e/${STAFF_TAM_FORM_ID}/viewform?embedded=true`;
const STUDENT_TAM_FORM_ID = "1FAIpQLSf-rs93WpIZgw7eSZ4tThgQuxma8WWmYEs4Cop-qmI4ygwF3A";
const STUDENT_TAM_FORM_EMBED_URL = `https://docs.google.com/forms/d/e/${STUDENT_TAM_FORM_ID}/viewform?embedded=true`;

// Surveys now simply embed the real Google Form (via formUrl) instead of cloning its questions
// into a hand-built form that POSTs to hardcoded entry.XXXXX field IDs — that approach broke the
// moment the underlying form changed. Embedding stays accurate automatically.
const SURVEYS_STORAGE_KEY = "tam_surveys_list_v3";
const INITIAL_SURVEYS = [
  {
    id: "survey-tam-staff-2026",
    title: "TAM-Umfrage: Schulleitung & Lehrkräfte",
    desc: "Für Schulleitungen, Lehrkräfte und IT-Verantwortliche: organisatorische, pädagogische und wirtschaftliche Anforderungen an eine digitale Pflegelernplattform.",
    tag: "Neu",
    tagType: "blue",
    iconType: "people",
    estTime: "Est. 5 mins",
    buttonStyle: "primary",
    isGoogleForms: true,
    formUrl: STAFF_TAM_FORM_EMBED_URL
  },
  {
    id: "survey-tam-students-2026",
    title: "TAM-Umfrage: Auszubildende",
    desc: "Für Auszubildende im 1.–3. Ausbildungsjahr: deine Erfahrungen mit digitalen Lernmitteln und deine Erwartungen an eine neue Lernplattform (u. a. 3D-Modelle, Simulationen, Fallbeispiele).",
    tag: "Neu",
    tagType: "teal",
    iconType: "mortarboard",
    estTime: "Est. 4 mins",
    buttonStyle: "primary",
    isGoogleForms: true,
    formUrl: STUDENT_TAM_FORM_EMBED_URL
  }
];

export default function TamSurveyView({ onHome, userRole, setUserRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  const [activeNav, setActiveNav] = useState("active_surveys"); // 'dashboard' | 'active_surveys' | 'completed' | 'resources' | 'admin'

  // Administrator Heading Customization States
  const [portalTitle, setPortalTitle] = useState(() => localStorage.getItem("tam_portal_title") || "TAM Nursing");
  const [portalSubtitle, setPortalSubtitle] = useState(() => localStorage.getItem("tam_portal_subtitle") || "Student Portal");
  const [pageHeading, setPageHeading] = useState(() => localStorage.getItem("tam_page_heading") || "Active Surveys");
  const [pageDescription, setPageDescription] = useState(() => localStorage.getItem("tam_page_desc") || "Please complete the following mandatory clinical evaluations and feedback forms for the current semester.");

  const [surveys, setSurveys] = useState(() => {
    try {
      const saved = localStorage.getItem(SURVEYS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_SURVEYS;
    } catch (e) {
      return INITIAL_SURVEYS;
    }
  });

  // Modal States
  const [showAdminEditModal, setShowAdminEditModal] = useState(false);
  const [showAddSurveyModal, setShowAddSurveyModal] = useState(false);
  const [activeTakingSurvey, setActiveTakingSurvey] = useState(null);

  const [completedSurveys, setCompletedSurveys] = useState(() => {
    try {
      const saved = localStorage.getItem("tam_completed_surveys");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // New Survey Form Input
  const [newSurveyForm, setNewSurveyForm] = useState({
    title: "",
    desc: "",
    tag: "Due in 3 days",
    tagType: "blue",
    iconType: "mortarboard",
    estTime: "Est. 5 mins",
    buttonStyle: "primary",
    isGoogleForms: true,
    formUrl: ""
  });

  useEffect(() => {
    localStorage.setItem("tam_portal_title", portalTitle);
    localStorage.setItem("tam_portal_subtitle", portalSubtitle);
    localStorage.setItem("tam_page_heading", pageHeading);
    localStorage.setItem("tam_page_desc", pageDescription);
    localStorage.setItem(SURVEYS_STORAGE_KEY, JSON.stringify(surveys));
  }, [portalTitle, portalSubtitle, pageHeading, pageDescription, surveys]);

  useEffect(() => {
    localStorage.setItem("tam_completed_surveys", JSON.stringify(completedSurveys));
  }, [completedSurveys]);

  const handleCreateSurvey = (e) => {
    e.preventDefault();
    if (!newSurveyForm.title.trim()) return;

    // Google Forms only allow being framed via their own "?embedded=true" view URL — normalize
    // whatever link an admin pastes (share link, viewform?usp=dialog, etc.) into that form.
    let formUrl = newSurveyForm.formUrl.trim();
    if (formUrl) {
      formUrl = formUrl.split(/[?#]/)[0];
      if (!formUrl.endsWith("/viewform")) formUrl = formUrl.replace(/\/$/, "") + "/viewform";
      formUrl += "?embedded=true";
    }

    const newObj = {
      id: `survey-${Date.now()}`,
      title: newSurveyForm.title.trim(),
      desc: newSurveyForm.desc.trim() || "New clinical survey evaluation form.",
      tag: newSurveyForm.tag,
      tagType: newSurveyForm.tagType,
      iconType: newSurveyForm.iconType,
      estTime: newSurveyForm.estTime,
      buttonStyle: newSurveyForm.buttonStyle,
      isGoogleForms: newSurveyForm.isGoogleForms,
      formUrl
    };

    setSurveys(prev => [...prev, newObj]);
    setShowAddSurveyModal(false);
    setNewSurveyForm({ title: "", desc: "", tag: "Due in 3 days", tagType: "blue", iconType: "mortarboard", estTime: "Est. 5 mins", buttonStyle: "primary", isGoogleForms: true, formUrl: "" });
  };

  const handleMarkCompleted = () => {
    if (activeTakingSurvey) setCompletedSurveys(prev => prev.includes(activeTakingSurvey.id) ? prev : [...prev, activeTakingSurvey.id]);
    setActiveTakingSurvey(null);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#ffffff", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: "#0f172a" }}>
      
      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR (Exact width 280px, #f4f6f9 bg, matching image) */}
      {/* ============================================================ */}
      <aside style={{ width: "270px", background: "#f4f6f9", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0 }}>
        
        <div>
          {/* Brand Header */}
          <div 
            onClick={onHome} 
            style={{ padding: "24px 20px 18px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #e5e7eb", cursor: "pointer" }}
            title="Zurück zum Haupt-Dashboard"
          >
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#e0f2fe", border: "1px solid #bae6fd", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>{portalTitle}</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 500 }}>{portalSubtitle}</div>
            </div>
          </div>

          {/* Navigation Section */}
          <nav style={{ padding: "20px 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
            
            {/* Dashboard */}
            <button
              onClick={() => setActiveNav("dashboard")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeNav === "dashboard" ? "#dbeafe" : "transparent",
                color: activeNav === "dashboard" ? "#1d4ed8" : "#475569",
                fontWeight: activeNav === "dashboard" ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                textAlign: "left",
                width: "100%"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <span>Dashboard</span>
            </button>

            {/* Active Surveys (Highlighted state matching image) */}
            <button
              onClick={() => setActiveNav("active_surveys")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeNav === "active_surveys" ? "#dbeafe" : "transparent",
                color: activeNav === "active_surveys" ? "#1d4ed8" : "#475569",
                fontWeight: activeNav === "active_surveys" ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                textAlign: "left",
                width: "100%"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
              <span>Active Surveys</span>
            </button>

            {/* Completed */}
            <button
              onClick={() => setActiveNav("completed")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeNav === "completed" ? "#dbeafe" : "transparent",
                color: activeNav === "completed" ? "#1d4ed8" : "#475569",
                fontWeight: activeNav === "completed" ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                textAlign: "left",
                width: "100%"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Completed</span>
            </button>

            {/* Resources */}
            <button
              onClick={() => setActiveNav("resources")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeNav === "resources" ? "#dbeafe" : "transparent",
                color: activeNav === "resources" ? "#1d4ed8" : "#475569",
                fontWeight: activeNav === "resources" ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                textAlign: "left",
                width: "100%"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <span>Resources</span>
            </button>

            {/* ADMINISTRATION SECTION */}
            <div style={{ marginTop: "28px", padding: "0 14px 6px 14px", fontSize: "0.7rem", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              ADMINISTRATION
            </div>

            <button
              onClick={() => setShowAdminEditModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeNav === "admin" ? "#dbeafe" : "transparent",
                color: activeNav === "admin" ? "#1d4ed8" : "#475569",
                fontWeight: 600,
                fontSize: "0.88rem",
                cursor: "pointer",
                textAlign: "left",
                width: "100%"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Admin Panel</span>
            </button>

          </nav>
        </div>

        {/* Bottom Primary Button (+ Add New Survey) */}
        <div style={{ padding: "16px 20px 24px 20px", borderTop: "1px solid #e5e7eb" }}>
          <button
            onClick={() => setShowAddSurveyModal(true)}
            style={{
              width: "100%",
              height: "44px",
              background: "#0047ab",
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
              boxShadow: "0 2px 6px rgba(0, 71, 171, 0.25)",
              transition: "background 0.2s"
            }}
          >
            <span style={{ fontSize: "1.2rem", fontWeight: 400 }}>+</span>
            <span>Add New Survey</span>
          </button>
        </div>

      </aside>

      {/* ============================================================ */}
      {/* 2. MAIN WORKSPACE AREA */}
      {/* ============================================================ */}
      <main style={{ flexGrow: 1, padding: "40px 48px", overflowY: "auto" }}>
        
        {/* Dynamic Administrator Page Heading & Description */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "36px" }}>
          <div>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>
              {pageHeading}
            </h1>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569", maxWidth: "760px", lineHeight: 1.5 }}>
              {pageDescription}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              onClick={() => setShowAdminEditModal(true)}
              style={{
                background: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "7px 14px",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              ✏️ Edit Heading (Admin)
            </button>
            <UserProfileMenu
              variant="light"
              userRole={userRole}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              onOpenAuthModal={onOpenAuthModal}
              onOpenAvatarPicker={onOpenAvatarPicker}
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. SURVEY CARDS GRID (Exact match to reference design) */}
        {/* ============================================================ */}
        {activeNav === "active_surveys" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {surveys.map(survey => {
              const isCompleted = completedSurveys.includes(survey.id);

              return (
                <div
                  key={survey.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "330px",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
                  }}
                >
                  <div>
                    {/* Top Pill Tag & Line-art Icon */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                      
                      {/* Tag Pills matching image colors exactly */}
                      {survey.tagType === "blue" && (
                        <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "4px 12px", borderRadius: "14px", fontSize: "0.75rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span>{survey.tag}</span>
                        </span>
                      )}
                      {survey.tagType === "teal" && (
                        <span style={{ background: "#ccfbf1", color: "#0f766e", padding: "4px 12px", borderRadius: "14px", fontSize: "0.75rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <span>{survey.tag}</span>
                        </span>
                      )}
                      {survey.tagType === "gray" && (
                        <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 12px", borderRadius: "14px", fontSize: "0.75rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                          <span>{survey.tag}</span>
                        </span>
                      )}

                      {/* Line-Art SVG Icons matching image */}
                      <div style={{ color: "#94a3b8", opacity: 0.8 }}>
                        {survey.iconType === "bag" && (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
                        )}
                        {survey.iconType === "mortarboard" && (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                        )}
                        {survey.iconType === "people" && (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        )}
                      </div>

                    </div>

                    {/* Survey Title */}
                    <h3 style={{ margin: "0 0 12px 0", fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>
                      {survey.title}
                    </h3>

                    {/* Survey Description */}
                    <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b", lineHeight: 1.55 }}>
                      {survey.desc}
                    </p>
                  </div>

                  {/* Footer Divider & Buttons */}
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px", marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600 }}>
                      {survey.estTime}
                    </span>

                    {isCompleted ? (
                      <span style={{ color: "#10b981", fontWeight: 800, fontSize: "0.85rem" }}>
                        ✓ Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => setActiveTakingSurvey(survey)}
                        style={{
                          background: survey.buttonStyle === "outline" ? "#ffffff" : "#0047ab",
                          color: survey.buttonStyle === "outline" ? "#0047ab" : "#ffffff",
                          border: survey.buttonStyle === "outline" ? "1px solid #0047ab" : "none",
                          borderRadius: "6px",
                          padding: "9px 18px",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <span>Start Survey</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* OTHER NAV TABS */}
        {activeNav === "completed" && (
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.3rem", fontWeight: 800 }}>Abgeschlossene Umfragen</h3>
            <p style={{ color: "#64748b", margin: 0 }}>
              {completedSurveys.length > 0 ? `${completedSurveys.length} Umfragen wurden erfolgreich absolviert.` : "Noch keine Umfragen abgeschlossen."}
            </p>
          </div>
        )}

      </main>

      {/* ============================================================ */}
      {/* MODAL 1: TAKE SURVEY MODAL (Connected to Google Forms) */}
      {/* ============================================================ */}
      {activeTakingSurvey && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "820px", height: "88vh", display: "flex", flexDirection: "column", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", flexShrink: 0 }}>
              <div>
                <span style={{ fontSize: "0.75rem", background: "#dbeafe", color: "#1d4ed8", padding: "3px 10px", borderRadius: "12px", fontWeight: 700 }}>
                  GOOGLE FORMS
                </span>
                <h2 style={{ margin: "6px 0 0 0", fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
                  {activeTakingSurvey.title}
                </h2>
              </div>
              <button onClick={() => setActiveTakingSurvey(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#94a3b8", cursor: "pointer" }}>&times;</button>
            </div>

            {activeTakingSurvey.formUrl ? (
              <>
                <iframe
                  title={activeTakingSurvey.title}
                  src={activeTakingSurvey.formUrl}
                  style={{ flex: 1, width: "100%", border: "none", borderRadius: "10px" }}
                >
                  Wird geladen…
                </iframe>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginTop: "16px", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>Deine Antworten werden direkt an Google Forms übermittelt.</p>
                  <button onClick={handleMarkCompleted} style={{ padding: "10px 20px", background: "#0047ab", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                    ✓ Als abgeschlossen markieren
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>Für diese Umfrage ist noch kein Formular hinterlegt.</div>
            )}

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: ADMINISTRATOR HEADING EDIT MODAL */}
      {/* ============================================================ */}
      {showAdminEditModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "550px", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                🛡️ Administrator Heading Customization
              </h3>
              <button onClick={() => setShowAdminEditModal(false)} style={{ background: "none", border: "none", fontSize: "1.3rem", color: "#94a3b8", cursor: "pointer" }}>&times;</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Portal Title (Sidebar)</label>
                <input
                  type="text"
                  value={portalTitle}
                  onChange={e => setPortalTitle(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Portal Subtitle (Sidebar)</label>
                <input
                  type="text"
                  value={portalSubtitle}
                  onChange={e => setPortalSubtitle(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Main Page Heading</label>
                <input
                  type="text"
                  value={pageHeading}
                  onChange={e => setPageHeading(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Main Subtitle Description</label>
                <textarea
                  rows="3"
                  value={pageDescription}
                  onChange={e => setPageDescription(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", resize: "vertical" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <button onClick={() => setShowAdminEditModal(false)} style={{ padding: "10px 20px", background: "#0047ab", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
                Speichern & Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: ADD NEW SURVEY MODAL */}
      {/* ============================================================ */}
      {showAddSurveyModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "550px", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                ➕ Add New Survey (Admin)
              </h3>
              <button onClick={() => setShowAddSurveyModal(false)} style={{ background: "none", border: "none", fontSize: "1.3rem", color: "#94a3b8", cursor: "pointer" }}>&times;</button>
            </div>

            <form onSubmit={handleCreateSurvey} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Survey Title</label>
                <input
                  type="text"
                  placeholder="e.g. Clinical Placement Feedback Q3"
                  value={newSurveyForm.title}
                  onChange={e => setNewSurveyForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Description</label>
                <textarea
                  rows="3"
                  placeholder="Evaluate your recent rotation..."
                  value={newSurveyForm.desc}
                  onChange={e => setNewSurveyForm(prev => ({ ...prev, desc: e.target.value }))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Google Form Link</label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  value={newSurveyForm.formUrl}
                  onChange={e => setNewSurveyForm(prev => ({ ...prev, formUrl: e.target.value }))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Tag Text</label>
                  <input
                    type="text"
                    value={newSurveyForm.tag}
                    onChange={e => setNewSurveyForm(prev => ({ ...prev, tag: e.target.value }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Estimated Time</label>
                  <input
                    type="text"
                    value={newSurveyForm.estTime}
                    onChange={e => setNewSurveyForm(prev => ({ ...prev, estTime: e.target.value }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button type="button" onClick={() => setShowAddSurveyModal(false)} style={{ padding: "10px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 24px", background: "#0047ab", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 800, cursor: "pointer" }}>Create Survey</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
