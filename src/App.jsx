import React, { useState, useMemo, useEffect, useRef } from 'react';
import './App.css';
import { generateDummyData } from './data';
import PflegeHeute from './PflegeHeute';
import Medikamente from './Medikamente';
import AccountAdminPanel from './AccountAdminPanel';
import Pflegeplanung from './Pflegeplanung';
import AudibleDoku from './AudibleDoku';
import PflegeDikatView from './PflegeDikatView';
import ClassroomView from './ClassroomView';
import ELearningCertificates from './ELearningCertificates';
import DeutschFeed from './DeutschFeed';
import PflegeFeed from './PflegeFeed';
import LetsMeetView from './LetsMeetView';
import DocreateView from './DocreateView';
import LetsZeichnenView from './LetsZeichnenView';
import DeviceTrainingView from './DeviceTrainingView';
import AvatarPicker from './AvatarPicker';
import { AvatarCircle, Icon, UserProfileMenu } from './feedShared';
import KoerperView from './KoerperView';
import TamSurveyView from './TamSurveyView';
import TodoView from './TodoView';
import TermineView from './TermineView';
import PflegedokumentationHub from './PflegedokumentationHub';
import CalendarView from './CalendarView';
import {
  LogoDiscuss, LogoCalendar, LogoAppointments, LogoTodo, LogoKnowledge,
  LogoContacts, LogoCRM, LogoSales, LogoDashboards, LogoRentals,
  LogoPOS, LogoInvoicing, LogoKlassenzimmer, LogoPlanning, LogoMedikamente,
  LogoELearning,  LogoEvents, LogoSurveys, LogoSign, LogoEmployees,
  LogoApps, LogoSettings, LogoPflegeheute, LogoPflegeDiktat, LogoAudibleDoku, LogoLetsMeet, LogoDocreate, LogoLetsZeichnen, LogoDeviceTraining
} from './icons';

const LogoKoerper = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" style={{ padding: '2px' }}>
    <circle cx="12" cy="4" r="2.5" />
    <path d="M12 6.5v11" />
    <path d="M6 10h12" />
    <path d="M9 17.5l-2 4.5" />
    <path d="M15 17.5l2 4.5" />
    <circle cx="12" cy="11" r="2" fill="#38bdf8" />
  </svg>
);

// ==========================================
// 1. ALL APPS METADATA DEFINITION
// ==========================================
const ALL_APPS = [
  { id: 'dashboard', label: 'Dialog', Logo: LogoDiscuss, active: true },
  { id: 'audible_doku', label: 'PflegeDiktat', Logo: LogoPflegeDiktat, active: true },
  { id: 'calendar', label: 'Kalender', Logo: LogoCalendar, active: true },
  { id: 'appointments', label: 'Termine', Logo: LogoAppointments, active: true },
  { id: 'todo', label: 'ToDo', Logo: LogoTodo, active: true },
  { id: 'knowledge', label: 'PflegeFeed', Logo: LogoKnowledge, active: true },
  { id: 'letsmeet', label: 'LetsMeet', Logo: LogoLetsMeet, active: true },
  { id: 'docreate', label: 'Docreate', Logo: LogoDocreate, active: true },
  { id: 'letszeichnen', label: 'LetsZeichnen', Logo: LogoLetsZeichnen, active: true },
  { id: 'devicetraining', label: 'Gerätetraining', Logo: LogoDeviceTraining, active: true },
  { id: 'account_admin', label: 'Kontenverwaltung', Logo: LogoSettings, active: true, adminOnly: true },
  { id: 'pflegeheute', label: 'Pflegeheute', Logo: LogoPflegeheute, active: true },
  { id: 'sales', label: 'TAM Survey', Logo: LogoSales, active: true },
  { id: 'project', label: 'Klassenzimmer', Logo: LogoKlassenzimmer, active: true },
  { id: 'planning', label: 'Pflegeplanung', Logo: LogoPlanning, active: true },
  { id: 'medikamente', label: 'Medikamente', Logo: LogoMedikamente, active: true },
  { id: 'elearning', label: 'E Learning', Logo: LogoELearning, active: true },
  { id: 'surveys', label: 'Umfragen', Logo: LogoSurveys, active: true },
  { id: 'students', label: 'Mitarbeiter', Logo: LogoEmployees, active: true },
  { id: 'koerper', label: 'Körper', Logo: LogoKoerper, active: true }
];

// One-click demo logins on the login screen — each still performs a real /api/auth/login
// against one of the seeded accounts (real password, real JWT, real session), so this is a
// convenience shortcut rather than a fake/bypassed auth path.
const DEMO_ACCOUNTS = [
  { role: 'student', label: 'Schüler(in)', icon: '🎓', email: 'schueler@pflege.de', password: 'student123' },
  { role: 'teacher', label: 'Lehrkraft', icon: '👨‍🏫', email: 'lehrer@pflege.de', password: 'teacher123' },
  { role: 'praxisanleiter', label: 'Praxisanleiter(in)', icon: '🩺', email: 'praxisanleiter@pflege.de', password: 'praxis123' },
  { role: 'admin', label: 'Administrator(in)', icon: '⚙️', email: 'admin@pflege.de', password: 'admin123' }
];

// ==========================================
// 2. SECURE ACCESS AUTH MODAL (LOGIN & REGISTER)
// ==========================================
const REGISTER_ROLE_OPTIONS = [
  { r: 'student', label: 'Schüler', icon: 'graduation-cap', desc: 'Kurse & Fortschritt', activeColor: '#0284c7', activeBg: '#f0f9ff' },
  { r: 'teacher', label: 'Lehrkraft', icon: 'book', desc: 'Klassen & Kurse', activeColor: '#d97706', activeBg: '#fffbeb' },
  { r: 'praxisanleiter', label: 'Praxisanleiter', icon: 'stethoscope', desc: 'Praxisphasen', activeColor: '#0d9488', activeBg: '#f0fdfa' }
];

const AUTH_MODAL_CSS = `
.pf-auth-shell { display: flex; width: min(920px, 100%); max-height: 92vh; border-radius: 26px; overflow: hidden; box-shadow: 0 30px 60px -15px rgba(2,6,23,0.45); background: #ffffff; }
.pf-auth-brand { flex: 0 0 38%; background: linear-gradient(160deg, #0284c7 0%, #0369a1 55%, #0c4a6e 100%); color: #fff; padding: 40px 32px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
.pf-auth-brand::before { content: ''; position: absolute; width: 260px; height: 260px; border-radius: 50%; background: rgba(255,255,255,0.08); top: -90px; right: -80px; }
.pf-auth-brand::after { content: ''; position: absolute; width: 190px; height: 190px; border-radius: 50%; background: rgba(255,255,255,0.06); bottom: -70px; left: -50px; }
.pf-auth-brand-top, .pf-auth-brand-bottom { position: relative; z-index: 1; }
.pf-auth-badge { width: 52px; height: 52px; border-radius: 16px; background: rgba(255,255,255,0.16); display: flex; align-items: center; justify-content: center; margin-bottom: 22px; }
.pf-auth-feature { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; font-weight: 600; margin-bottom: 13px; color: rgba(255,255,255,0.92); }
.pf-auth-feature-icon { width: 26px; height: 26px; border-radius: 50%; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pf-auth-panel { flex: 1 1 auto; padding: 40px 38px 26px; overflow-y: auto; position: relative; text-align: left; }
.pf-auth-close { position: absolute; top: 18px; right: 18px; background: #f1f5f9; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 1.2rem; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.pf-auth-tabs { display: flex; background: #f1f5f9; border-radius: 12px; padding: 4px; margin-bottom: 20px; }
.pf-auth-tab { flex: 1; padding: 8px 16px; border-radius: 9px; border: none; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: all 0.15s ease; }
.pf-auth-step-track { display: flex; gap: 6px; margin-bottom: 18px; }
.pf-auth-step-track > div { flex: 1; height: 4px; border-radius: 2px; background: #e2e8f0; transition: background 0.2s ease; }
.pf-auth-role-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.pf-auth-role-card { border-radius: 14px; border: 1.5px solid #e2e8f0; background: #fff; padding: 14px 8px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; transition: all 0.15s ease; text-align: center; }
.pf-auth-role-card:hover { border-color: #94a3b8; transform: translateY(-1px); }
.pf-auth-role-icon { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
@media (max-width: 760px) {
  .pf-auth-brand { display: none; }
  .pf-auth-shell { border-radius: 20px; }
}
@media (max-width: 460px) {
  .pf-auth-role-grid { grid-template-columns: 1fr; }
  .pf-auth-role-card { flex-direction: row; justify-content: flex-start; text-align: left; padding: 10px 12px; }
}
`;

function SecureAuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [registerStep, setRegisterStep] = useState(1); // 1 = who are you, 2 = credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [specialty, setSpecialty] = useState('');
  const [cohortYear, setCohortYear] = useState('');
  const [institution, setInstitution] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendState, setResendState] = useState(''); // '' | 'sending' | 'sent'
  const [pendingMessage, setPendingMessage] = useState('');

  if (!isOpen) return null;

  const resetTransient = () => {
    setError('');
    setPendingMessage('');
    setShowResend(false);
    setResendState('');
    setRegisterStep(1);
  };

  const handleClose = () => {
    resetTransient();
    setActiveTab('login');
    onClose();
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    resetTransient();
  };

  const handleNextStep = () => {
    setError('');
    if (!fullName.trim() || !email.trim()) {
      setError('Bitte Name und E-Mail-Adresse ausfüllen.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.');
      return;
    }
    setRegisterStep(2);
  };

  const handleBackStep = () => {
    setError('');
    setRegisterStep(1);
  };

  // Shared by the normal login form and the one-click demo-account buttons — both go through
  // this same real /api/auth/login call, so a demo login is a real session, not a bypass.
  const submitLogin = async (loginEmail, loginPassword) => {
    setError('');
    setShowResend(false);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword.trim() })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || data.error) {
        setError(data.error || 'Authentifizierung fehlgeschlagen.');
        setShowResend(data.code === 'EMAIL_NOT_VERIFIED');
        return;
      }

      if (data.token) {
        localStorage.setItem('pflegedb_jwt_token', data.token);
      }
      onLoginSuccess(data.user);
    } catch {
      setLoading(false);
      setError('Server nicht erreichbar. Bitte versuche es erneut.');
    }
  };

  const handleQuickLogin = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    submitLogin(account.email, account.password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeTab === 'register' && registerStep === 1) {
      handleNextStep();
      return;
    }

    if (activeTab === 'login') {
      await submitLogin(email, password);
      return;
    }

    setError('');

    if (role === 'teacher' && !institution.trim()) {
      setError('Bitte gib deine Einrichtung (Schule/Klinik) an.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(), email: email.trim(), password: password.trim(), role,
          specialty: (role === 'praxisanleiter' || role === 'teacher') ? specialty.trim() : undefined,
          cohortYear: role === 'student' ? cohortYear.trim() : undefined,
          institution: role === 'teacher' ? institution.trim() : undefined
        })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || data.error) {
        setError(data.error || 'Registrierung fehlgeschlagen.');
        return;
      }

      setPendingMessage(data.message || 'Bitte bestätige deine E-Mail-Adresse, bevor du dich anmeldest.');
    } catch {
      setLoading(false);
      setError('Server nicht erreichbar. Bitte versuche es erneut.');
    }
  };

  const handleResend = async () => {
    setResendState('sending');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      await res.json();
      setResendState('sent');
    } catch {
      setResendState('');
    }
  };

  const isRegister = activeTab === 'register';
  const headline = pendingMessage
    ? 'Fast geschafft!'
    : activeTab === 'login' ? 'Willkommen zurück' : (registerStep === 1 ? 'Konto erstellen' : 'Letzter Schritt');
  const subheadline = pendingMessage
    ? null
    : activeTab === 'login' ? 'Melde dich an, um fortzufahren.' : (registerStep === 1 ? 'Schritt 1 von 2 — wer bist du?' : 'Schritt 2 von 2 — Zugangsdaten festlegen');

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div className="pf-auth-shell" onClick={e => e.stopPropagation()}>
        <div className="pf-auth-brand">
          <div className="pf-auth-brand-top">
            <div className="pf-auth-badge">
              <Icon name="heart-pulse" size={26} color="#ffffff" />
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Pflege-Plattform
            </h2>
            <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
              Deine digitale Lernumgebung für die Pflegeausbildung.
            </p>
          </div>
          <div className="pf-auth-brand-bottom">
            <div className="pf-auth-feature">
              <span className="pf-auth-feature-icon"><Icon name="shield" size={14} color="#ffffff" /></span>
              Sichere, E-Mail-verifizierte Anmeldung
            </div>
            <div className="pf-auth-feature">
              <span className="pf-auth-feature-icon"><Icon name="users" size={14} color="#ffffff" /></span>
              Rollenbasierter Zugriff für dein Team
            </div>
            <div className="pf-auth-feature">
              <span className="pf-auth-feature-icon"><Icon name="badge" size={14} color="#ffffff" /></span>
              Fortschritt &amp; Zertifikate in Echtzeit
            </div>
          </div>
        </div>

        <div className="pf-auth-panel">
          <button className="pf-auth-close" type="button" onClick={handleClose}>&times;</button>

          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {headline}
          </h2>
          {subheadline && (
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.86rem' }}>{subheadline}</p>
          )}

          {pendingMessage ? (
            <div>
              <div style={{ fontSize: '2.4rem', margin: '10px 0 14px' }}>📬</div>
              <p style={{ margin: '0 0 22px 0', color: '#334155', fontSize: '0.92rem', lineHeight: 1.5 }}>{pendingMessage}</p>
              <button
                type="button"
                onClick={() => { setPendingMessage(''); switchTab('login'); }}
                style={{ width: '100%', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Zum Login
              </button>
            </div>
          ) : (
          <>
          <div className="pf-auth-tabs">
            <button
              type="button"
              className="pf-auth-tab"
              onClick={() => switchTab('login')}
              style={{
                background: activeTab === 'login' ? '#ffffff' : 'transparent',
                color: activeTab === 'login' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'login' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Anmelden
            </button>
            <button
              type="button"
              className="pf-auth-tab"
              onClick={() => switchTab('register')}
              style={{
                background: activeTab === 'register' ? '#ffffff' : 'transparent',
                color: activeTab === 'register' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'register' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Registrieren
            </button>
          </div>

          {isRegister && (
            <div className="pf-auth-step-track">
              <div style={{ background: '#0284c7' }} />
              <div style={{ background: registerStep === 2 ? '#0284c7' : '#e2e8f0' }} />
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '16px', textAlign: 'left' }}>
              ⚠️ {error}
              {showResend && (
                <div style={{ marginTop: '8px' }}>
                  {resendState === 'sent' ? (
                    <span style={{ color: '#166534', fontWeight: 700 }}>✓ Neuer Bestätigungslink wurde verschickt.</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendState === 'sending'}
                      style={{ background: 'none', border: 'none', color: '#991b1b', fontWeight: 800, textDecoration: 'underline', cursor: resendState === 'sending' ? 'default' : 'pointer', padding: 0, fontSize: '0.82rem' }}
                    >
                      {resendState === 'sending' ? 'Wird gesendet…' : 'Verifizierungs-E-Mail erneut senden'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            {activeTab === 'login' && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '6px' }}>
                    E-Mail-Adresse
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#94a3b8' }}>✉️</span>
                    <input
                      type="email"
                      placeholder="name@pflege.de"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', margin: 0 }}>
                      Passwort
                    </label>
                    <a href="#" onClick={e => { e.preventDefault(); alert("Passwort-Zusendung für Pflegedatenbank gesendet."); }} style={{ fontSize: '0.78rem', color: '#0284c7', textDecoration: 'none', fontWeight: 700 }}>
                      Vergessen?
                    </a>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#94a3b8' }}>🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px 40px 10px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#94a3b8' }}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)', opacity: loading ? 0.7 : 1 }}
                >
                  <span>{loading ? 'Wird geprüft…' : 'Anmelden'}</span>
                  {!loading && <span>➔</span>}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '18px 0 12px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>ODER SCHNELL TESTEN</span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {DEMO_ACCOUNTS.map(acct => (
                    <button
                      key={acct.role}
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickLogin(acct)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 10px',
                        borderRadius: '9px', border: '1.5px solid #e2e8f0', background: '#f8fafc',
                        color: '#334155', fontWeight: 700, fontSize: '0.78rem', cursor: loading ? 'default' : 'pointer',
                        textAlign: 'left', opacity: loading ? 0.6 : 1
                      }}
                      title={`Als ${acct.label} anmelden (${acct.email})`}
                    >
                      <span style={{ fontSize: '1rem' }}>{acct.icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acct.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {isRegister && registerStep === 1 && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '8px' }}>
                    Deine Position
                  </label>
                  <div className="pf-auth-role-grid">
                    {REGISTER_ROLE_OPTIONS.map(opt => (
                      <div
                        key={opt.r}
                        role="button"
                        tabIndex={0}
                        className="pf-auth-role-card"
                        onClick={() => setRole(opt.r)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setRole(opt.r); }}
                        style={{ borderColor: role === opt.r ? opt.activeColor : '#e2e8f0', background: role === opt.r ? opt.activeBg : '#ffffff', boxShadow: role === opt.r ? '0 4px 14px rgba(0,0,0,0.08)' : 'none' }}
                      >
                        <span className="pf-auth-role-icon" style={{ background: role === opt.r ? opt.activeColor : '#f1f5f9' }}>
                          <Icon name={opt.icon} size={18} color={role === opt.r ? '#ffffff' : '#64748b'} />
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '0.78rem', color: role === opt.r ? opt.activeColor : '#0f172a' }}>{opt.label}</span>
                        <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>{opt.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '6px' }}>
                    Vollständiger Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#94a3b8' }}>👤</span>
                    <input
                      type="text"
                      placeholder="z.B. Alex Schmidt"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '6px' }}>
                    E-Mail-Adresse
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#94a3b8' }}>✉️</span>
                    <input
                      type="email"
                      placeholder="name@pflege.de"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{ width: '100%', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)' }}
                >
                  <span>Weiter</span>
                  <span>➔</span>
                </button>
              </>
            )}

            {isRegister && registerStep === 2 && (
              <>
                <button
                  type="button"
                  onClick={handleBackStep}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748b', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', padding: 0, marginBottom: '16px' }}
                >
                  <Icon name="arrowleft" size={13} /> Zurück
                </button>

                {role === 'student' && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '6px' }}>
                      Jahrgang / Kohorte
                    </label>
                    <input
                      type="text"
                      placeholder="z.B. 2026"
                      value={cohortYear}
                      onChange={e => setCohortYear(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                {role === 'praxisanleiter' && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '6px' }}>
                      Fachbereich
                    </label>
                    <input
                      type="text"
                      placeholder="z.B. Intensivstation"
                      value={specialty}
                      onChange={e => setSpecialty(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                {role === 'teacher' && (
                  <>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '6px' }}>
                        Einrichtung (Schule / Klinik) *
                      </label>
                      <input
                        type="text"
                        placeholder="z.B. Berufsfachschule für Pflege München"
                        value={institution}
                        onChange={e => setInstitution(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '6px' }}>
                        Unterrichtsfach / Fachbereich
                      </label>
                      <input
                        type="text"
                        placeholder="z.B. Innere Medizin"
                        value={specialty}
                        onChange={e => setSpecialty(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </>
                )}

                <div style={{ marginBottom: '6px' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '6px' }}>
                    Passwort
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#94a3b8' }}>🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      minLength={6}
                      style={{ width: '100%', padding: '10px 40px 10px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#94a3b8' }}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>Mindestens 6 Zeichen.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', marginTop: '16px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)', opacity: loading ? 0.7 : 1 }}
                >
                  <span>{loading ? 'Wird erstellt…' : 'Konto erstellen'}</span>
                  {!loading && <span>➔</span>}
                </button>
              </>
            )}
          </form>

          <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '22px', paddingTop: '14px', fontSize: '0.7rem', color: '#94a3b8', lineHeight: '1.4' }}>
            Mit der Nutzung dieses Portals akzeptierst du die <a href="#" onClick={e => e.preventDefault()} style={{ color: '#64748b', textDecoration: 'underline' }}>Nutzungsrichtlinien</a> und den <a href="#" onClick={e => e.preventDefault()} style={{ color: '#64748b', textDecoration: 'underline' }}>Datenschutz</a>.
          </div>
          </>
          )}
        </div>
      </div>
      <style>{AUTH_MODAL_CSS}</style>
    </div>
  );
}

// ==========================================
// 3. REUSABLE USER PROFILE & LOGIN/LOGOUT MENU
// ==========================================
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
function InfoModal({ app, onClose }) {
  if (!app) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon-title">
            <div className="modal-app-icon" style={{ width: '36px', height: '36px' }}>
              <app.Logo />
            </div>
            <h3>{app.label}</h3>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="demo-badge">Vorschau-Modus</div>
          <p>Dieses Modul befindet sich aktuell in der Entwicklung für die Pflege-Datenbank.</p>
          <div className="active-modules-info">
            <h4>Verfügbare Module im Demo-System:</h4>
            <ul>
              <li><strong>Dialog:</strong> Kommunikationszentrale & Diskussionen</li>
              <li><strong>Mitarbeiter:</strong> Pflege-Dokumentation & Schülerliste</li>
              <li><strong>Pflegeheute:</strong> Pflegedokumentation & Simulation</li>
              <li><strong>Kalender:</strong> Termine & Meetings</li>
            </ul>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-action-btn" onClick={onClose}>Verstanden</button>
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ data }) {
  return (
    <div className="kanban-card">
      <div className="card-color-strip" style={{ backgroundColor: data.color }}></div>
      <div className="card-avatar" style={{ color: data.color }}>
        {data.initials}
      </div>
      <div className="card-details">
        <div className="card-title">{data.name}</div>
        <div className="card-subtitle">{data.email}</div>
        <div className="card-tags">
          <span className="tag">{data.department}</span>
          <span className={`tag ${data.statusClass}`}>{data.statusText}</span>
        </div>
      </div>
    </div>
  );
}

function ListView({ data }) {
  return (
    <div className="list-view">
      <table>
        <thead>
          <tr>
            <th>Schüler</th>
            <th>E-Mail</th>
            <th>Pflegemodul</th>
            <th>Bereich</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="td-avatar" style={{ backgroundColor: item.color }}>{item.initials}</div>
                  <span style={{ fontWeight: 500 }}>{item.name}</span>
                </div>
              </td>
              <td>{item.email}</td>
              <td>{item.module}</td>
              <td>{item.department}</td>
              <td><span className={`tag ${item.statusClass}`}>{item.statusText}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// 3. FULL ACTIVE APP MODULE VIEWS (ODOO REPLICAS)
// ==========================================

// --- DIALOG (Discussion / Communication Platform) ---
function DialogView({ onHome }) {
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "OdooBot",
      avatar: "🤖",
      time: "Gestern um 03:55",
      text: "Welcome to the #General channel 🎉 This is a space for the whole team to connect and share updates."
    }
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: "They are like that.",
      avatar: "A",
      time: "Heute um " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: messageText
    };

    setMessages(prev => [...prev, userMsg]);
    setMessageText("");

    setTimeout(() => {
      let replyText = "Hallo! Ich bin OdooBot. Das ist ein interaktiver Prototyp des Dialog-Kanals.";
      const lowerText = userMsg.text.toLowerCase();
      if (lowerText.includes("mitarbeiter") || lowerText.includes("schüler")) {
        replyText = "Du kannst das Schüler-Dokumentations-Modul aufrufen, indem du links oben auf das Logo klickst und 'Mitarbeiter' wählst.";
      } else if (lowerText.includes("pflegeheute") || lowerText.includes("pflege heute")) {
        replyText = "Das Modul 'Pflegeheute' kannst du über das Hauptmenü öffnen.";
      } else if (lowerText.includes("kalender")) {
        replyText = "Du möchtest deinen Kalender einsehen? Klicke einfach auf das Kalender-Symbol im Hauptmenü.";
      } else if (lowerText.includes("hilfe") || lowerText.includes("odoo")) {
        replyText = "Ich bin hier, um zu helfen! Tippe 'Mitarbeiter', 'Pflegeheute' oder 'Kalender' für Navigationstipps.";
      }

      const botReply = {
        id: Date.now() + 1,
        sender: "OdooBot",
        avatar: "🤖",
        time: "Heute um " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: replyText
      };
      setMessages(prev => [...prev, botReply]);
    }, 1000);
  };

  return (
    <div className="module-view-container">
      {/* Top Navbar */}
      <header className="module-topbar">
        <div className="module-topbar-left" onClick={onHome} style={{ cursor: 'pointer' }} title="Zurück zur Startseite">
          <div className="module-logo">
            <LogoDiscuss />
          </div>
          <span className="module-name">Dialog</span>
          <nav className="module-nav">
            <a href="#" className="active" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Dialog</a>
            <a href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Channels</a>
            <a href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>configuration</a>
          </nav>
        </div>
        <div className="module-topbar-right">
          <div className="topbar-ai-badge">AI</div>
          <div className="topbar-msg-icon" title="Nachrichten">
            💬
            <span className="msg-counter">2</span>
          </div>
          <div className="topbar-utility-icon">⏱️</div>
          <div className="topbar-utility-icon">🛠️</div>
          <span className="db-ident">4trt</span>
          <div className="avatar">A</div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="dialog-workspace">
        {/* Left Channels Sidebar */}
        <aside className="dialog-sidebar">
          <div className="sidebar-search">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Looking for conversations..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button className="camera-btn" type="button" title="Videoanruf starten">📹</button>
          </div>
          <div className="sidebar-menu-list">
            <div className="sidebar-menu-item"><span className="menu-icon">📌</span> bookmark</div>
            <div className="sidebar-section-title"># Channels</div>
            <div className="sidebar-menu-item"><span className="menu-icon">#</span> Administrators</div>
            <div className="sidebar-menu-item active"><span className="menu-icon">#</span> General</div>
            <div className="sidebar-section-title">👤 Direct messages</div>
            <div className="sidebar-menu-item"><span className="menu-icon">🤖</span> OdooBot</div>
          </div>
        </aside>

        {/* Center Chat Workspace */}
        <div className="chat-container">
          <header className="chat-header">
            <div className="chat-header-info">
              <span className="channel-hash">#</span>
              <span className="channel-name">General</span>
              <span className="channel-desc">A place to connect and exchange news with colleagues across the company.</span>
            </div>
            <div className="chat-header-actions">
              <button className="chat-action-btn" type="button" title="Videoanruf starten">📹</button>
              <button className="chat-action-btn" type="button" title="Sprachanruf starten">📞</button>
              <button className="chat-action-btn" type="button" title="Stummschalten">🔔</button>
              <button className="chat-action-btn" type="button" title="Suchen">🔍</button>
              <button className="chat-action-btn" type="button" title="Angepinnte Nachrichten">📌</button>
              <button className="chat-action-btn btn-members" type="button" title="Mitglieder anzeigen">👤 1</button>
              <button className="chat-action-btn btn-invite" type="button">Invite people</button>
            </div>
          </header>

          <div className="chat-messages-area">
            <div className="channel-welcome">
              <span className="welcome-hash">#</span>
              <h3>Welcome to #General!</h3>
              <p>This is the beginning of the #General channel.</p>
            </div>
            
            <div className="date-divider">
              <span className="divider-text">July 6, 2026</span>
            </div>

            {messages.map(msg => (
              <div key={msg.id} className="message-row">
                <div className="message-avatar" style={{ backgroundColor: msg.sender === "OdooBot" ? '#714b67' : '#059669' }}>
                  {msg.avatar}
                </div>
                <div className="message-content">
                  <header className="message-meta">
                    <span className="sender-name">{msg.sender}</span>
                    <span className="message-time">{msg.time}</span>
                  </header>
                  <p className="message-text-body">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <div className="user-indicator">A</div>
            <input 
              type="text" 
              placeholder="Message No. General ..." 
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
            />
            <div className="input-actions">
              <button type="button" className="input-action-btn" title="Emoji">😊</button>
              <button type="button" className="input-action-btn" title="Datei anhängen">📎</button>
              <button type="submit" className="send-msg-btn">➤</button>
            </div>
          </form>
        </div>

        {/* Right Members Sidebar */}
        <aside className="members-sidebar">
          <div className="members-header">👥 MEMBERS</div>
          <button className="invite-btn" type="button">+ Invite people</button>
          <div className="members-section-title">ONLINE - 1</div>
          <div className="member-row">
            <span className="member-avatar" style={{ backgroundColor: '#059669' }}>A</span>
            <div className="member-details">
              <span className="member-name">They are like that.</span>
              <span className="member-star">★</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// --- KALENDER (Calendar) imported from ./CalendarView ---

// --- MITARBEITER (Nursing Documentation) ---
function MitarbeiterView({ data, viewMode, setViewMode, onHome, userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredMitarbeiter = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  return (
    <div className="module-view-container">
      {/* Top Navbar */}
      <header className="module-topbar">
        <div className="module-topbar-left" onClick={onHome} style={{ cursor: 'pointer' }} title="Zurück zur Startseite">
          <div className="module-logo">
            <LogoEmployees />
          </div>
          <span className="module-name">Mitarbeiter</span>
          <nav className="module-nav">
            <a href="#" className="active" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Employees</a>
            <a href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Departments</a>
          </nav>
        </div>
        <div className="module-topbar-right">
          <UserProfileMenu userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
        </div>
      </header>

      {/* Sub Header (Control Panel) */}
      <div className="module-control-panel">
        <div className="panel-left">
          <button className="panel-action-btn" type="button">+ New Student</button>
          <span className="panel-breadcrumb" onClick={onHome} style={{ cursor: 'pointer' }} title="Zurück zur Startseite">Nursing Students / All</span>
        </div>
        <div className="panel-right">
          <div className="panel-search-box">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="view-toggles">
            <button
              className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban View"
              type="button"
            >Kanban</button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
              type="button"
            >List</button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="module-workspace">
        {viewMode === 'kanban' ? (
          <div className="kanban-board">
            {filteredMitarbeiter.map(item => <KanbanCard key={item.id} data={item} />)}
          </div>
        ) : (
          <ListView data={filteredMitarbeiter} />
        )}
      </main>
    </div>
  );
}

// --- PFLEGEHEUTE ---
function PflegeheuteView({ onHome, userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  return (
    <div className="module-view-container">
      {/* Top Navbar */}
      <header className="module-topbar">
        <div className="module-topbar-left" onClick={onHome} style={{ cursor: 'pointer' }} title="Zurück zur Startseite">
          <div className="module-logo">
            <LogoCRM />
          </div>
          <span className="module-name">Pflegeheute</span>
          <nav className="module-nav">
            <a href="#" className="active" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Pflegeheute</a>
            <a href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Lektionen</a>
            <a href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Ergebnisse</a>
          </nav>
        </div>
        <div className="module-topbar-right">
          <UserProfileMenu userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="module-workspace" style={{ padding: 0 }}>
        <PflegeHeute onHome={onHome} userRole={userRole} />
      </main>
    </div>
  );
}

// --- MEDIKAMENTE (Medication Lookup Portal) ---
function MedikamenteView({ onHome, userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  return (
    <div className="module-view-container dark">
      {/* Top Navbar */}
      <header className="module-topbar">
        <div className="module-topbar-left" onClick={onHome} style={{ cursor: 'pointer' }} title="Zurück zur Startseite">
          <div className="module-logo">
            <LogoMedikamente />
          </div>
          <span className="module-name">Medikamente</span>
        </div>
        <div className="module-topbar-right">
          <UserProfileMenu userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="module-workspace" style={{ padding: 0 }}>
        <Medikamente onHome={onHome} />
      </main>
    </div>
  );
}

// --- ANATOMIE (Human Anatomy Model Explorer) ---
// --- OTHER DEMO APPS PLACEHOLDER VIEW ---
function PlaceholderView({ activeTab, onHome, userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  const label = useMemo(() => {
    const app = ALL_APPS.find(a => a.id === activeTab);
    return app ? app.label : 'Modul';
  }, [activeTab]);

  const Logo = useMemo(() => {
    const app = ALL_APPS.find(a => a.id === activeTab);
    return app ? app.Logo : LogoApps;
  }, [activeTab]);

  return (
    <div className="module-view-container">
      {/* Top Navbar */}
      <header className="module-topbar">
        <div className="module-topbar-left" onClick={onHome} style={{ cursor: 'pointer' }} title="Zurück zur Startseite">
          <div className="module-logo">
            <Logo />
          </div>
          <span className="module-name">{label}</span>
          <nav className="module-nav">
            <a href="#" className="active" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Übersicht</a>
            <a href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Berichte</a>
            <a href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Konfiguration</a>
          </nav>
        </div>
        <div className="module-topbar-right">
          <UserProfileMenu userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
        </div>
      </header>

      {/* Workspace content */}
      <main className="module-workspace" style={{ padding: '40px', background: '#f4f5f7' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: '30px', borderRadius: '8px', maxWidth: '600px', margin: '0 auto', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2>{label} Modul</h2>
          <p style={{ color: '#6b7280', marginTop: '12px', lineHeight: '1.6' }}>
            Dieses Modul befindet sich aktuell in der Entwicklung. Die Navigation und die Benutzeroberfläche wurden an das neue Odoo-Design-System angepasst.
          </p>
          <button className="panel-action-btn" type="button" onClick={onHome} style={{ marginTop: '20px' }}>
            Zurück zur Startseite
          </button>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 4. HOME SWITCHER COMPONENT
// ==========================================
function HomeLauncher({ onLaunchApp, userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  const [launcherSearch, setLauncherSearch] = useState('');
  const [selectedDemoApp, setSelectedDemoApp] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        e.ctrlKey || e.metaKey || e.altKey || e.key === 'Escape'
      ) {
        return;
      }
      if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9äöüÄÖÜß\- ]/)) {
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const visibleApps = useMemo(
    () => ALL_APPS.filter(app => !app.adminOnly || userRole === 'admin'),
    [userRole]
  );

  const filteredApps = useMemo(() => {
    if (!launcherSearch.trim()) return visibleApps;
    return visibleApps.filter(app =>
      app.label.toLowerCase().includes(launcherSearch.toLowerCase())
    );
  }, [launcherSearch, visibleApps]);

  const handleAppClick = (app) => {
    if (app.active) {
      onLaunchApp(app.id);
    } else {
      setSelectedDemoApp(app);
    }
  };

  return (
    <div className="home-container">
      {/* Topbar header */}
      <header className="home-topbar">
        <div className="home-topbar-right">
          <UserProfileMenu userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
        </div>
      </header>

      {/* Embedded Search Input */}
      <div className="launcher-search-container">
        <div className="launcher-search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            className="launcher-search-input"
            placeholder="Tippen Sie zum Suchen..."
            value={launcherSearch}
            onChange={(e) => setLauncherSearch(e.target.value)}
          />
          {launcherSearch && (
            <button className="search-clear-btn" type="button" onClick={() => setLauncherSearch('')}>&times;</button>
          )}
        </div>
      </div>

      {/* App Grid Container */}
      <div className="app-grid-container">
        <div className="app-grid">
          {filteredApps.map(app => (
            <button
              key={app.id}
              className={`app-btn ${app.active ? 'active-app' : 'demo-app'}`}
              onClick={() => handleAppClick(app)}
              type="button"
            >
              <div className="app-icon-wrapper">
                <app.Logo />
              </div>
              <div className="app-label">{app.label}</div>
            </button>
          ))}
          {filteredApps.length === 0 && (
            <div className="no-results-msg">
              Keine Apps gefunden für "{launcherSearch}"
            </div>
          )}
        </div>
      </div>

      {/* Info Modal for demo apps */}
      {selectedDemoApp && (
        <InfoModal
          app={selectedDemoApp}
          onClose={() => setSelectedDemoApp(null)}
        />
      )}
    </div>
  );
}

// ==========================================
// 5. ROOT APPLICATION COMPONENT
// ==========================================
function App() {
  const [isHome, setIsHome] = useState(true);
  const [activeTab, setActiveTab] = useState('students');
  const [viewMode, setViewMode] = useState('kanban');
  const [userRole, setUserRole] = useState('student');
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  // Set when another page (e.g. Klassenzimmer's "Video-Unterricht starten") wants LetsMeet to
  // open straight into a specific room instead of its own dashboard — consumed once, then cleared.
  const [pendingMeetJoinCode, setPendingMeetJoinCode] = useState(null);

  const goToMeeting = (roomCode) => {
    setPendingMeetJoinCode(roomCode);
    setActiveTab('letsmeet');
    setIsHome(false);
  };

  // If we arrived via an email confirmation link (?verify=<token>), confirm it and log in.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify');
    if (!verifyToken) return;

    fetch('/api/auth/confirm-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verifyToken })
    })
      .then(res => res.json())
      .then(data => {
        if (data.token && data.user) {
          localStorage.setItem('pflegedb_jwt_token', data.token);
          setCurrentUser(data.user);
          setUserRole(data.user.role || 'student');
          setShowAvatarPicker(true);
        } else {
          alert(data.error || 'Bestätigung fehlgeschlagen.');
        }
      })
      .catch(() => alert('Bestätigung fehlgeschlagen — Server nicht erreichbar.'))
      .finally(() => {
        params.delete('verify');
        const cleanUrl = window.location.pathname + (params.toString() ? `?${params}` : '') + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('pflegedb_jwt_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) {
          // Token rejected (expired, deactivated account, ...) — stop pretending we're signed in.
          localStorage.removeItem('pflegedb_jwt_token');
          throw new Error('session invalid');
        }
        return res.json();
      })
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
          setUserRole(data.user.role || 'student');
        }
      })
      .catch(err => console.log("Session recovery failed:", err));
    }
  }, []);

  // Auto-logout after IDLE_TIMEOUT_MS of no interaction, per the "automatic session timeout" requirement.
  useEffect(() => {
    let idleTimer = setTimeout(handleIdleLogout, IDLE_TIMEOUT_MS);

    function handleIdleLogout() {
      if (localStorage.getItem('pflegedb_jwt_token')) {
        localStorage.removeItem('pflegedb_jwt_token');
        setCurrentUser(null);
        alert('Du wurdest wegen Inaktivität automatisch abgemeldet.');
      }
    }

    function resetIdleTimer() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(handleIdleLogout, IDLE_TIMEOUT_MS);
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, resetIdleTimer));
    return () => {
      clearTimeout(idleTimer);
      events.forEach(evt => window.removeEventListener(evt, resetIdleTimer));
    };
  }, []);

  const handleLoginSuccess = (userObj) => {
    setCurrentUser(userObj);
    setUserRole(userObj.role || 'student');
    setShowAuthModal(false);
  };

  const handleAddAssignment = (newAssignment) => {
    setAssignments(prev => [newAssignment, ...prev.filter(a => !(a.student_id === newAssignment.student_id && a.status === 'active'))]);
  };

  const handleRemoveAssignment = (id) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const handleAddAufgabe = (newTask) => {
    setAufgaben(prev => [newTask, ...prev]);
  };

  const handleUpdateAufgabe = (updatedTask) => {
    setAufgaben(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleAddCompetency = (newComp) => {
    setCompetencies(prev => [newComp, ...prev]);
  };

  const handleAddStudentRequest = (newReq) => {
    setStudentRequests(prev => [newReq, ...prev]);
  };

  const userProps = {
    userRole,
    setUserRole,
    currentUser,
    setCurrentUser,
    onOpenAuthModal: () => setShowAuthModal(true),
    onOpenAvatarPicker: () => setShowAvatarPicker(true)
  };

  let content = null;

  if (isHome) {
    content = (
      <HomeLauncher 
        {...userProps}
        onLaunchApp={(id) => {
          setActiveTab(id);
          setIsHome(false);
        }} 
      />
    );
  } else if (activeTab === 'students') {
    content = (
      <MitarbeiterView 
        data={allData} 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        onHome={() => setIsHome(true)}
        {...userProps}
      />
    );
  } else if (activeTab === 'pflegeheute') {
    content = (
      <PflegeheuteView
        onHome={() => setIsHome(true)}
        {...userProps}
        user={currentUser}
      />
    );
  } else if (activeTab === 'medikamente') {
    content = (
      <MedikamenteView
        onHome={() => setIsHome(true)}
        {...userProps}
      />
    );
  } else if (activeTab === 'account_admin') {
    content = (
      <AccountAdminPanel
        onHome={() => setIsHome(true)}
        currentUser={currentUser}
      />
    );
  } else if (activeTab === 'project') {
    content = (
      <ClassroomView
        onHome={() => setIsHome(true)}
        {...userProps}
        onJoinMeeting={goToMeeting}
      />
    );
  } else if (activeTab === 'letsmeet') {
    content = (
      <LetsMeetView
        onHome={() => setIsHome(true)}
        {...userProps}
        initialRoomCode={pendingMeetJoinCode}
        onConsumedInitialRoomCode={() => setPendingMeetJoinCode(null)}
      />
    );
  } else if (activeTab === 'docreate') {
    content = (
      <DocreateView
        onHome={() => setIsHome(true)}
        {...userProps}
      />
    );
  } else if (activeTab === 'letszeichnen') {
    content = (
      <LetsZeichnenView
        onHome={() => setIsHome(true)}
        {...userProps}
      />
    );
  } else if (activeTab === 'devicetraining') {
    content = (
      <DeviceTrainingView
        onHome={() => setIsHome(true)}
        {...userProps}
      />
    );
  } else if (activeTab === 'elearning') {
    content = (
      <ELearningCertificates
        onHome={() => setIsHome(true)}
        {...userProps}
      />
    );
  } else if (activeTab === 'dashboard') {
    content = <DialogView onHome={() => setIsHome(true)} {...userProps} />;
  } else if (activeTab === 'calendar') {
    content = <CalendarView onHome={() => setIsHome(true)} {...userProps} />;
  } else if (activeTab === 'audible_doku' || activeTab === 'pflegedikat') {
    content = (
      <PflegeDikatView 
        onHome={() => setIsHome(true)} 
        {...userProps}
      />
    );
  } else if (activeTab === 'planning') {
    content = (
      <Pflegeplanung 
        onHome={() => setIsHome(true)} 
        {...userProps}
      />
    );
  } else if (activeTab === 'knowledge' || activeTab === 'deutschfeed' || activeTab === 'pflegefeed') {
    content = (
      <PflegeFeed 
        onHome={() => setIsHome(true)} 
        {...userProps}
      />
    );
  } else if (activeTab === 'koerper') {
    content = (
      <KoerperView 
        onHome={() => setIsHome(true)} 
        {...userProps}
      />
    );
  } else if (activeTab === 'sales' || activeTab === 'tam' || activeTab === 'surveys') {
    content = (
      <TamSurveyView 
        onHome={() => setIsHome(true)} 
        {...userProps}
      />
    );
  } else if (activeTab === 'todo') {
    content = (
      <TodoView 
        onHome={() => setIsHome(true)} 
        {...userProps}
      />
    );
  } else if (activeTab === 'appointments' || activeTab === 'calendar') {
    content = (
      <TermineView 
        onHome={() => setIsHome(true)} 
        {...userProps}
      />
    );
  } else {
    content = <PlaceholderView activeTab={activeTab} onHome={() => setIsHome(true)} {...userProps} />;
  }

  return (
    <>
      {content}
      <SecureAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <AvatarPicker
        isOpen={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        currentUser={currentUser}
        onSaved={(updatedUser) => { setCurrentUser(updatedUser); setShowAvatarPicker(false); }}
      />
    </>
  );
}

export default App;
