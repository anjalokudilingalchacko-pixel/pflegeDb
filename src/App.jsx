import React, { useState, useMemo, useEffect, useRef } from 'react';
import './App.css';
import { generateDummyData } from './data';
import PflegeHeute from './PflegeHeute';
import Medikamente from './Medikamente';
import AdminPanel from './AdminPanel';
import Anatomie from './Anatomie';
import Pflegeplanung from './Pflegeplanung';
import AudibleDoku from './AudibleDoku';
import PflegeDikatView from './PflegeDikatView';
import ClassroomView from './ClassroomView';
import ELearningCertificates from './ELearningCertificates';
import DeutschFeed from './DeutschFeed';
import PflegeFeed from './PflegeFeed';
import KoerperView from './KoerperView';
import TamSurveyView from './TamSurveyView';
import TodoView from './TodoView';
import TermineView from './TermineView';
import PflegedokumentationHub from './PflegedokumentationHub';
import CalendarView from './CalendarView';
import {
  LogoDiscuss, LogoCalendar, LogoAppointments, LogoTodo, LogoKnowledge,
  LogoContacts, LogoCRM, LogoSales, LogoDashboards, LogoRentals,
  LogoPOS, LogoInvoicing, LogoProject, LogoPlanning, LogoMedikamente,
  LogoELearning,  LogoEvents, LogoSurveys, LogoSign, LogoEmployees,
  LogoApps, LogoSettings, LogoPflegeheute, LogoPflegeDiktat, LogoAudibleDoku
} from './icons';

const LogoAnatomie = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" style={{ padding: '2px' }}>
    <circle cx="12" cy="5" r="2.5" />
    <path d="M12 7.5v8.5" />
    <path d="M7 10h10" />
    <path d="M9 16h6" />
    <path d="M10 16v6h4v-6" />
  </svg>
);

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
  { id: 'todo', label: 'To-do & Aufgaben', Logo: LogoTodo, active: true },
  { id: 'knowledge', label: 'PflegeFeed', Logo: LogoKnowledge, active: true },
  { id: 'admin_panel', label: 'Admin-Zentrale', Logo: LogoSettings, active: true },
  { id: 'pflegeheute', label: 'Pflegeheute', Logo: LogoPflegeheute, active: true },
  { id: 'sales', label: 'TAM Survey', Logo: LogoSales, active: true },
  { id: 'project', label: 'Klassenzimmer', Logo: LogoProject, active: true },
  { id: 'planning', label: 'Pflegeplanung', Logo: LogoPlanning, active: true },
  { id: 'medikamente', label: 'Medikamente', Logo: LogoMedikamente, active: true },
  { id: 'elearning', label: 'E-Learning Zertifikate', Logo: LogoELearning, active: true },
  { id: 'surveys', label: 'Umfragen', Logo: LogoSurveys, active: true },
  { id: 'students', label: 'Mitarbeiter', Logo: LogoEmployees, active: true },
  { id: 'anatomie', label: 'Anatomie', Logo: LogoAnatomie, active: true },
  { id: 'koerper', label: 'Körper', Logo: LogoKoerper, active: true }
];

// ==========================================
// 2. SECURE ACCESS AUTH MODAL (LOGIN & REGISTER)
// ==========================================
function SecureAuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFillPreset = (presetRole) => {
    setError('');
    if (presetRole === 'teacher') {
      setEmail('lehrer@pflege.de');
      setPassword('teacher123');
      setRole('teacher');
    } else {
      setEmail('schueler@pflege.de');
      setPassword('student123');
      setRole('student');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = activeTab === 'login' 
      ? { email: email.trim(), password: password.trim(), role }
      : { name: fullName.trim(), email: email.trim(), password: password.trim(), role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || data.error) {
        setError(data.error || 'Authentifizierung fehlgeschlagen.');
        return;
      }

      if (data.token) {
        localStorage.setItem('pflegedb_jwt_token', data.token);
      }

      onLoginSuccess(data.user || {
        name: fullName || email.split('@')[0] || 'Benutzer',
        email,
        role,
        title: role === 'teacher' ? 'Lehrer / Administrator' : 'Pflegeschüler(in)',
        avatar: role === 'teacher' ? '👨‍🏫' : '🎓'
      });
    } catch (err) {
      setLoading(false);
      // Fallback local authentication if offline
      const isTeacher = email.toLowerCase().includes('lehrer') || role === 'teacher';
      const fallbackUser = {
        name: activeTab === 'register' ? fullName : (isTeacher ? 'Prof. Dr. Elisabeth Müller' : 'Alex Schmidt'),
        email: email.trim(),
        role: isTeacher ? 'teacher' : 'student',
        title: isTeacher ? 'Lehrer / Administrator' : 'Pflegeschüler(in)',
        avatar: isTeacher ? '👨‍🏫' : '🎓'
      };
      onLoginSuccess(fallbackUser);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
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
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '440px', 
          width: '100%', 
          background: '#ffffff', 
          borderRadius: '20px', 
          padding: '36px 32px 28px 32px', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}
      >
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            background: '#f1f5f9', 
            border: 'none', 
            borderRadius: '50%', 
            width: '32px', 
            height: '32px', 
            fontSize: '1.2rem', 
            color: '#64748b', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          &times;
        </button>

        <h2 style={{ margin: '0 0 6px 0', fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Secure Access
        </h2>
        <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '0.88rem' }}>
          Anmelden oder Registrieren im Portal.
        </p>

        {/* Tab Segment Switcher */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '12px', padding: '4px', marginBottom: '22px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'login' ? '#ffffff' : 'transparent',
              color: activeTab === 'login' ? '#0f172a' : '#64748b',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'login' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'register' ? '#ffffff' : 'transparent',
              color: activeTab === 'register' ? '#0f172a' : '#64748b',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'register' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Register
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '16px', textAlign: 'left' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Quick Fill Presets */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => handleFillPreset('student')}
            style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, fontSize: '0.78rem', color: '#0284c7', cursor: 'pointer' }}
          >
            🎓 Demo Schüler
          </button>
          <button
            type="button"
            onClick={() => handleFillPreset('teacher')}
            style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, fontSize: '0.78rem', color: '#d97706', cursor: 'pointer' }}
          >
            👨‍🏫 Demo Lehrer
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          {activeTab === 'register' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#94a3b8' }}>👤</span>
                <input 
                  type="text"
                  placeholder="e.g. Alex Schmidt"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                  required
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '6px' }}>
              Institutional Email
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#94a3b8' }}>✉️</span>
              <input 
                type="email"
                placeholder="student@nursing.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                required
              />
            </div>
          </div>

          {activeTab === 'register' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '6px' }}>
                Academic Role
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: role === 'student' ? '2px solid #0284c7' : '1px solid #cbd5e1', background: role === 'student' ? '#f0f9ff' : '#ffffff', fontWeight: 700, fontSize: '0.78rem', color: role === 'student' ? '#0369a1' : '#475569', cursor: 'pointer' }}
                >
                  🎓 Schüler
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: role === 'teacher' ? '2px solid #d97706' : '1px solid #cbd5e1', background: role === 'teacher' ? '#fffbeb' : '#ffffff', fontWeight: 700, fontSize: '0.78rem', color: role === 'teacher' ? '#b45309' : '#475569', cursor: 'pointer' }}
                >
                  👨‍🏫 Lehrer / Admin
                </button>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', margin: 0 }}>
                Password
              </label>
              {activeTab === 'login' && (
                <a href="#" onClick={e => { e.preventDefault(); alert("Passwort-Zusendung für Pflegedatenbank gesendet."); }} style={{ fontSize: '0.78rem', color: '#0284c7', textDecoration: 'none', fontWeight: 700 }}>
                  Forgot?
                </a>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#94a3b8' }}>🔒</span>
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 40px 10px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
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
            style={{ 
              width: '100%', 
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '10px', 
              padding: '12px', 
              fontWeight: 800, 
              fontSize: '0.95rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}
          >
            <span>{activeTab === 'login' ? 'Authenticate' : 'Create Account'}</span>
            <span>➔</span>
          </button>
        </form>

        <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '24px', paddingTop: '16px', fontSize: '0.72rem', color: '#94a3b8', lineHeight: '1.4' }}>
          By accessing this portal, you agree to the <br />
          <a href="#" onClick={e => e.preventDefault()} style={{ color: '#64748b', textDecoration: 'underline' }}>Academic Policy</a> and <a href="#" onClick={e => e.preventDefault()} style={{ color: '#64748b', textDecoration: 'underline' }}>Clinical Privacy terms</a>.
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. REUSABLE USER PROFILE & LOGIN/LOGOUT MENU
// ==========================================
function UserProfileMenu({ userRole, setUserRole, currentUser, setCurrentUser, onOpenAuthModal }) {
  const [isOpen, setIsOpen] = useState(false);
  const isTeacher = userRole === 'teacher';

  const handleProfileClick = (e) => {
    e.stopPropagation();
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={handleProfileClick}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: currentUser ? (isTeacher ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)') : 'rgba(255,255,255,0.25)',
          color: '#ffffff',
          border: '2px solid rgba(255,255,255,0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
        title={currentUser ? `${currentUser.name} (${currentUser.title})` : "Login / Register"}
      >
        {currentUser ? (isTeacher ? '👨‍🏫' : '🎓') : '👤'}
      </button>

      {isOpen && currentUser && (
        <div 
          style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            width: '240px',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
            border: '1px solid #cbd5e1',
            padding: '16px',
            zIndex: 9999,
            color: '#0f172a',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
              {isTeacher ? '👨‍🏫' : '🎓'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {currentUser.title}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Rolle wechseln (Test-Pilot)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { r: 'teacher', name: '👨‍🏫 Lehrer / Pflegedozent', title: 'Lehrer / Administrator' },
                { r: 'student', name: '🎓 Pflegeschüler', title: 'Pflegeschüler(in)' }
              ].map(opt => (
                <button
                  key={opt.r}
                  type="button"
                  onClick={() => {
                    if (setUserRole) setUserRole(opt.r);
                    if (setCurrentUser) setCurrentUser(prev => prev ? ({ ...prev, role: opt.r, title: opt.title, avatar: opt.name.split(' ')[0] }) : null);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: userRole === opt.r ? '#0052cc' : '#f8fafc',
                    color: userRole === opt.r ? '#ffffff' : '#334155',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (setCurrentUser) setCurrentUser(null);
              setIsOpen(false);
            }}
            style={{
              width: '100%',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: '8px',
              padding: '8px 12px',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            🔒 Abmelden (Logout)
          </button>
        </div>
      )}
    </div>
  );
}
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
function MitarbeiterView({ data, viewMode, setViewMode, onHome, userRole, setUserRole, currentUser, setCurrentUser, onOpenAuthModal, onLaunchApp }) {
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
            {userRole === 'teacher' && (
              <a href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLaunchApp('admin_panel'); }} style={{ color: '#ffc107', fontWeight: 600 }}>⚙️ Lehrer-Konfig</a>
            )}
          </nav>
        </div>
        <div className="module-topbar-right">
          <UserProfileMenu userRole={userRole} setUserRole={setUserRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} />
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
function PflegeheuteView({ onHome, userRole, setUserRole, currentUser, setCurrentUser, onOpenAuthModal, onLaunchApp }) {
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
            {userRole === 'teacher' && (
              <a href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLaunchApp('admin_panel'); }} style={{ color: '#ffc107', fontWeight: 600 }}>⚙️ Lehrer-Konfig</a>
            )}
          </nav>
        </div>
        <div className="module-topbar-right">
          <UserProfileMenu userRole={userRole} setUserRole={setUserRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} />
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
function MedikamenteView({ onHome, userRole, setUserRole, currentUser, setCurrentUser, onOpenAuthModal, onLaunchApp }) {
  return (
    <div className="module-view-container dark">
      {/* Top Navbar */}
      <header className="module-topbar">
        <div className="module-topbar-left" onClick={onHome} style={{ cursor: 'pointer' }} title="Zurück zur Startseite">
          <div className="module-logo">
            <LogoMedikamente />
          </div>
          <span className="module-name">Medikamente</span>
          <nav className="module-nav">
            <a href="#" className="active" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Wirkstoffsuche</a>
            <a href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Offline-Katalog</a>
            {userRole === 'teacher' && (
              <a href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLaunchApp('admin_panel'); }} style={{ color: '#ffc107', fontWeight: 600 }}>⚙️ Lehrer-Konfig</a>
            )}
          </nav>
        </div>
        <div className="module-topbar-right">
          <UserProfileMenu userRole={userRole} setUserRole={setUserRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} />
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
function AnatomieView({ onHome, userRole, setUserRole, currentUser, setCurrentUser, onOpenAuthModal, onLaunchApp }) {
  return (
    <div className="module-view-container">
      {/* Top Navbar */}
      <header className="module-topbar">
        <div className="module-topbar-left" onClick={onHome} style={{ cursor: 'pointer' }} title="Zurück zur Startseite">
          <div className="module-logo" style={{ color: 'var(--primary)', fill: 'currentColor' }}>
            <LogoAnatomie />
          </div>
          <span className="module-name">Anatomie</span>
          <nav className="module-nav">
            <a href="#" className="active" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Körpermodell</a>
            <a href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Klinische Relevanz</a>
            {userRole === 'teacher' && (
              <a href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLaunchApp('admin_panel'); }} style={{ color: '#ffc107', fontWeight: 600 }}>⚙️ Lehrer-Konfig</a>
            )}
          </nav>
        </div>
        <div className="module-topbar-right">
          <UserProfileMenu userRole={userRole} setUserRole={setUserRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="module-workspace" style={{ padding: 0 }}>
        <Anatomie onHome={onHome} />
      </main>
    </div>
  );
}

// --- OTHER DEMO APPS PLACEHOLDER VIEW ---
function PlaceholderView({ activeTab, onHome, userRole, setUserRole, currentUser, setCurrentUser, onOpenAuthModal }) {
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
          <UserProfileMenu userRole={userRole} setUserRole={setUserRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} />
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
function HomeLauncher({ onLaunchApp, userRole, setUserRole, currentUser, setCurrentUser, onOpenAuthModal }) {
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

  const filteredApps = useMemo(() => {
    if (!launcherSearch.trim()) return ALL_APPS;
    return ALL_APPS.filter(app =>
      app.label.toLowerCase().includes(launcherSearch.toLowerCase())
    );
  }, [launcherSearch]);

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
          <UserProfileMenu userRole={userRole} setUserRole={setUserRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} />
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
  const [currentUser, setCurrentUser] = useState({
    id: 'usr-stud-1',
    name: 'Alex Schmidt',
    email: 'schueler@pflege.de',
    role: 'student',
    title: 'Pflegeschüler(in)',
    avatar: '🎓'
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('pflegedb_jwt_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
          setUserRole(data.user.role || 'student');
        }
      })
      .catch(err => console.log("Session recovery failed:", err));
    }
  }, []);

  const handleLoginSuccess = (userObj) => {
    setCurrentUser(userObj);
    setUserRole(userObj.role || 'student');
    setShowAuthModal(false);
  };

  const handleUpdateUserRole = (userId, newRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({ ...prev, role: newRole }));
      setUserRole(newRole);
    }
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
    onOpenAuthModal: () => setShowAuthModal(true)
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
        onLaunchApp={(id) => setActiveTab(id)}
      />
    );
  } else if (activeTab === 'pflegeheute') {
    content = (
      <PflegeheuteView 
        onHome={() => setIsHome(true)} 
        {...userProps}
        user={currentUser}
        onLaunchApp={(id) => setActiveTab(id)}
      />
    );
  } else if (activeTab === 'medikamente') {
    content = (
      <MedikamenteView 
        onHome={() => setIsHome(true)} 
        {...userProps}
        onLaunchApp={(id) => setActiveTab(id)}
      />
    );
  } else if (activeTab === 'anatomie') {
    content = (
      <AnatomieView 
        onHome={() => setIsHome(true)} 
        {...userProps}
        onLaunchApp={(id) => setActiveTab(id)}
      />
    );
  } else if (activeTab === 'admin_panel') {
    content = (
      <AdminPanel 
        onHome={() => setIsHome(true)} 
      />
    );
  } else if (activeTab === 'project') {
    content = (
      <ClassroomView 
        onHome={() => setIsHome(true)}
        {...userProps}
        user={currentUser}
      />
    );
  } else if (activeTab === 'elearning') {
    content = (
      <ELearningCertificates 
        onHome={() => setIsHome(true)}
        {...userProps}
        user={currentUser}
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
    </>
  );
}

export default App;
