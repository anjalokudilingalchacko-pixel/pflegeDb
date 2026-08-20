import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import { UserProfileMenu, AvatarCircle, authHeaders, fileToDataURL, formatFileSize } from './feedShared';
import { LogoKlassenzimmer } from './icons';

const ROLE_LABEL = {
  student: 'Pflegeschüler(in)',
  teacher: 'Lehrkraft',
  praxisanleiter: 'Praxisanleiter(in)',
  admin: 'Administrator(in)'
};

const CLASSROOM_CSS = `
.kz-scroll { flex: 1; overflow-y: auto; }
.kz-sidebar { width: 300px; flex-shrink: 0; }
.kz-tab-btn { background: rgba(255,255,255,0.15); color: #ffffff; font-weight: 700; border: none; border-radius: 8px; padding: 9px 16px; font-size: 0.85rem; cursor: pointer; transition: background 0.15s ease; }
.kz-tab-btn.active { background: #ffffff; color: #0369a1; }
.kz-btn-primary { background: #0284c7; color: #fff; border: none; border-radius: 7px; padding: 8px 14px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: background 0.15s ease; }
.kz-btn-primary:hover { background: #0369a1; }
.kz-btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
.kz-card { background: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; }
@media (max-width: 900px) {
  .kz-layout { grid-template-columns: 1fr !important; }
  .kz-sidebar { width: 100% !important; }
  .kz-overview-grid { grid-template-columns: 1fr !important; }
}
`;

export default function ClassroomView({ onHome, userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker, onJoinMeeting }) {
  const role = currentUser?.role || null;
  const isLoggedIn = !!currentUser;
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';
  const isPraxis = role === 'praxisanleiter';
  const isStudent = role === 'student';

  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'assignments' | 'documents' | 'students'
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Praxisanleiter: supervised-student roster instead of a classroom switcher
  const [supervisees, setSupervisees] = useState([]);
  const [superviseesLoading, setSuperviseesLoading] = useState(false);
  const [selectedSuperviseeId, setSelectedSuperviseeId] = useState(null);
  const [praxisTab, setPraxisTab] = useState('assignments'); // 'assignments' | 'documents'

  // Modal / Form states
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [savingClass, setSavingClass] = useState(false);

  const [showNewAssignModal, setShowNewAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ title: '', dueDate: '', description: '' });
  const [savingAssign, setSavingAssign] = useState(false);

  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [docForm, setDocForm] = useState({ title: '', file: null });
  const [savingDoc, setSavingDoc] = useState(false);
  const [docError, setDocError] = useState('');

  const [showNewStudentModal, setShowNewStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: '', email: '' });

  const [submitModal, setSubmitModal] = useState(null); // assignment object, or null
  const [submitNote, setSubmitNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [submissionsModal, setSubmissionsModal] = useState(null); // assignment object, or null

  // The classroom the "+ assignment / + document" modals should write into: the currently
  // browsed classroom for teacher/admin/student, or the supervisee's own classroom for a
  // praxisanleiter (who has no classroom of their own).
  const [targetClassId, setTargetClassId] = useState(null);

  const selectedClassroom = classrooms.find(c => c.id === selectedClassId) || null;
  const selectedSupervisee = supervisees.find(s => s.id === selectedSuperviseeId) || null;
  const superviseeClassroom = selectedSupervisee
    ? classrooms.find(c => c.id === selectedSupervisee.classroomId) || null
    : null;

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoading(false);
      setClassrooms([]);
      return;
    }
    fetchClassrooms();
    if (isPraxis) fetchSupervisees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, role]);

  function fetchClassrooms() {
    setIsLoading(true);
    setLoadError('');
    fetch('/api/classrooms/mine', { headers: { ...authHeaders() } })
      .then(async res => {
        const data = await res.json().catch(() => ([]));
        if (!res.ok) throw new Error(data.error || 'Klassen konnten nicht geladen werden.');
        return data;
      })
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setClassrooms(list);
        setSelectedClassId(prev => (prev && list.some(c => c.id === prev) ? prev : (list[0]?.id || null)));
      })
      .catch(err => setLoadError(err.message || 'Verbindung zum Server fehlgeschlagen.'))
      .finally(() => setIsLoading(false));
  }

  function fetchSupervisees() {
    setSuperviseesLoading(true);
    fetch('/api/roster/students', { headers: { ...authHeaders() } })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setSupervisees(list);
        setSelectedSuperviseeId(prev => (prev && list.some(s => s.id === prev) ? prev : (list[0]?.id || null)));
      })
      .catch(() => {})
      .finally(() => setSuperviseesLoading(false));
  }

  useEffect(() => {
    if (isPraxis && superviseeClassroom) setTargetClassId(superviseeClassroom.id);
    else if (!isPraxis) setTargetClassId(selectedClassId);
  }, [isPraxis, superviseeClassroom, selectedClassId]);

  const findStudentProgress = (supervisee) => {
    const cls = classrooms.find(c => c.id === supervisee.classroomId);
    const entry = cls?.students?.find(s => s.userId === supervisee.id);
    return entry ? entry.progress : null;
  };

  const openAssignmentsFor = (supervisee) => {
    const cls = classrooms.find(c => c.id === supervisee.classroomId);
    if (!cls) return [];
    return (cls.assignments || []).filter(a => !(a.submissions || []).some(s => s.studentId === supervisee.id));
  };

  const praxisStats = useMemo(() => {
    if (!isPraxis) return null;
    const progresses = supervisees.map(findStudentProgress).filter(p => p !== null);
    const avg = progresses.length ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length) : null;
    const openCount = supervisees.reduce((sum, s) => sum + openAssignmentsFor(s).length, 0);
    return { count: supervisees.length, avg, openCount };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPraxis, supervisees, classrooms]);

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setSavingClass(true);
    try {
      const res = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name: newClassName.trim(), teacher: currentUser?.name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClassrooms(prev => [...prev, data]);
      setSelectedClassId(data.id);
      setNewClassName('');
      setShowNewClassModal(false);
    } catch (err) {
      alert(err.message || 'Fehler beim Erstellen der Klasse.');
    } finally {
      setSavingClass(false);
    }
  };

  const patchClassroom = (classId, updater) => {
    setClassrooms(prev => prev.map(c => (c.id === classId ? updater(c) : c)));
  };

  const [startingMeetingFor, setStartingMeetingFor] = useState(null);
  const handleStartClassMeeting = async (classroomId, title) => {
    if (!onJoinMeeting) return;
    setStartingMeetingFor(classroomId);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title, type: 'instant', classroomId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onJoinMeeting(data.roomCode);
    } catch (err) {
      alert(err.message || 'Video-Meeting konnte nicht gestartet werden.');
    } finally {
      setStartingMeetingFor(null);
    }
  };

  const [startingAppointmentFor, setStartingAppointmentFor] = useState(null);
  const handleStartAppointment = async (inviteeEmail, title) => {
    if (!onJoinMeeting) return;
    setStartingAppointmentFor(inviteeEmail);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title, type: 'instant', inviteeEmails: [inviteeEmail] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onJoinMeeting(data.roomCode);
    } catch (err) {
      alert(err.message || 'Video-Gespräch konnte nicht gestartet werden.');
    } finally {
      setStartingAppointmentFor(null);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignForm.title.trim() || !targetClassId) return;
    setSavingAssign(true);
    try {
      const res = await fetch(`/api/classrooms/${targetClassId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(assignForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      patchClassroom(targetClassId, c => ({ ...c, assignments: [...(c.assignments || []), data] }));
      setAssignForm({ title: '', dueDate: '', description: '' });
      setShowNewAssignModal(false);
    } catch (err) {
      alert(err.message || 'Fehler beim Erstellen der Aufgabe.');
    } finally {
      setSavingAssign(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docForm.title.trim() || !docForm.file || !targetClassId) return;
    setSavingDoc(true);
    setDocError('');
    try {
      const dataUrl = await fileToDataURL(docForm.file);
      const res = await fetch(`/api/classrooms/${targetClassId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title: docForm.title.trim(), dataUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      patchClassroom(targetClassId, c => ({ ...c, documents: [...(c.documents || []), data] }));
      setDocForm({ title: '', file: null });
      setShowNewDocModal(false);
    } catch (err) {
      setDocError(err.message || 'Fehler beim Teilen des Dokuments.');
    } finally {
      setSavingDoc(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.name.trim() || !selectedClassroom) return;
    try {
      const res = await fetch(`/api/classrooms/${selectedClassroom.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(studentForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      patchClassroom(selectedClassroom.id, c => ({ ...c, students: [...(c.students || []), data] }));
      setStudentForm({ name: '', email: '' });
      setShowNewStudentModal(false);
    } catch (err) {
      alert(err.message || 'Fehler beim Hinzufügen des Schülers.');
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submitModal || !selectedClassroom) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/classrooms/${selectedClassroom.id}/assignments/${submitModal.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ note: submitNote })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      patchClassroom(selectedClassroom.id, c => ({
        ...c,
        assignments: (c.assignments || []).map(a => (a.id === data.id ? data : a))
      }));
      setSubmitModal(null);
      setSubmitNote('');
    } catch (err) {
      alert(err.message || 'Einreichen fehlgeschlagen.');
    } finally {
      setSubmitting(false);
    }
  };

  const mySubmission = (assignment) => (assignment.submissions || []).find(s => s.studentId === currentUser?.id);

  return (
    <div className="module-view-container" style={{ background: '#f8fafc' }}>
      <style>{CLASSROOM_CSS}</style>

      {/* Top Navbar */}
      <header className="module-topbar" style={{ background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="module-topbar-left" onClick={onHome} style={{ cursor: 'pointer' }} title="Zurück zur Startseite">
          <div className="module-logo"><LogoKlassenzimmer /></div>
          <span className="module-name" style={{ color: '#ffffff', fontWeight: 800 }}>Klassenzimmer & Aufgaben</span>
          {isLoggedIn && (
            <nav className="module-nav">
              <a href="#" className="active" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                {isStudent ? 'Meine Klasse' : isPraxis ? 'Meine Praktikanten' : 'Klassenübersicht'}
              </a>
            </nav>
          )}
        </div>
        <div className="module-topbar-right">
          <UserProfileMenu userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
        </div>
      </header>

      <div className="kz-scroll" style={{ padding: '24px' }}>
        <div className="kz-layout" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>

          {/* ============ LEFT SIDEBAR ============ */}
          <aside className="kz-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {!isLoggedIn ? (
              <div className="kz-card" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', marginBottom: '6px' }}>Nicht angemeldet</div>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                  Melde dich an, um deine Klasse, Aufgaben und Dokumente zu sehen.
                </p>
                <button className="kz-btn-primary" style={{ width: '100%' }} onClick={onOpenAuthModal}>Anmelden</button>
              </div>
            ) : (
            <>
            {/* Identity card */}
            <div className="kz-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <AvatarCircle name={currentUser.name} size={44} avatarType={currentUser.avatarType} avatarIcon={currentUser.avatarIcon} avatarUrl={currentUser.avatarUrl} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{ROLE_LABEL[role] || role}</div>
              </div>
            </div>

            {/* STUDENT: single classroom card */}
            {isStudent && (
              <div className="kz-card" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Meine Klasse</h3>
                {selectedClassroom ? (
                  <div style={{ padding: '12px 14px', borderRadius: '8px', border: '2px solid #0284c7', background: '#f0f9ff' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0369a1' }}>{selectedClassroom.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>👨‍🏫 {selectedClassroom.teacher}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Noch keiner Klasse zugeordnet.</div>
                )}
              </div>
            )}

            {/* TEACHER / ADMIN: classroom switcher */}
            {isTeacherOrAdmin && (
              <div className="kz-card" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    {role === 'admin' ? 'Alle Klassen' : 'Meine Klassen'}
                  </h3>
                  <button className="kz-btn-primary" onClick={() => setShowNewClassModal(true)}>+ Neu</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {classrooms.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClassId(c.id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '12px 14px',
                        borderRadius: '8px', border: selectedClassId === c.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: selectedClassId === c.id ? '#f0f9ff' : '#ffffff', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: selectedClassId === c.id ? '#0369a1' : '#1e293b' }}>{c.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>👨‍🏫 {c.teacher} • {c.students?.length || 0} Schüler</div>
                    </button>
                  ))}
                  {classrooms.length === 0 && !isLoading && (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', padding: '4px 2px' }}>Noch keine Klasse angelegt.</div>
                  )}
                </div>
              </div>
            )}

            {/* PRAXISANLEITER: supervisee roster */}
            {isPraxis && (
              <div className="kz-card" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Meine Praktikanten</h3>
                {praxisStats && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px' }}>
                    {praxisStats.count} Praktikant(inn)en{praxisStats.avg !== null ? ` • Ø ${praxisStats.avg}%` : ''}{praxisStats.openCount > 0 ? ` • ${praxisStats.openCount} offene Aufgabe(n)` : ''}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {supervisees.map(s => {
                    const progress = findStudentProgress(s);
                    const open = openAssignmentsFor(s).length;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSuperviseeId(s.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                          borderRadius: '8px', border: selectedSuperviseeId === s.id ? '2px solid #0d9488' : '1px solid #e2e8f0',
                          background: selectedSuperviseeId === s.id ? '#f0fdfa' : '#ffffff', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease'
                        }}
                      >
                        <AvatarCircle name={s.name} size={30} fontSize={11} avatarType={s.avatarType} avatarIcon={s.avatarIcon} avatarUrl={s.avatarUrl} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: selectedSuperviseeId === s.id ? '#0b7a70' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {progress !== null ? `${progress}% Fortschritt` : 'Kein Fortschritt'}{open > 0 ? ` • ${open} offen` : ''}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {supervisees.length === 0 && !superviseesLoading && (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', padding: '4px 2px' }}>Dir sind aktuell keine Pflegeschüler(innen) zur Praxisanleitung zugeordnet.</div>
                  )}
                </div>
              </div>
            )}
            </>
            )}

            <button
              onClick={onHome}
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              🏠 Zurück zur Startseite
            </button>
          </aside>

          {/* ============ RIGHT: WORKSPACE ============ */}
          <main style={{ minWidth: 0 }}>
            {!isLoggedIn ? (
              <div className="kz-card" style={{ textAlign: 'center', padding: '60px 32px' }}>
                <div style={{ width: '64px', height: '64px', margin: '0 auto 16px' }}><LogoKlassenzimmer /></div>
                <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.3rem' }}>Willkommen im Klassenzimmer</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Hier findest du deine Klasse, Aufgaben und geteilte Dokumente — sobald du angemeldet bist. Melde dich an, um loszulegen.
                </p>
                <button className="kz-btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }} onClick={onOpenAuthModal}>
                  Anmelden
                </button>
              </div>
            ) : isLoading ? (
              <div className="kz-card" style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 20px' }}>Lade Klassenzimmer…</div>
            ) : loadError ? (
              <div className="kz-card" style={{ textAlign: 'center', color: '#b91c1c', padding: '40px 20px' }}>{loadError}</div>
            ) : isPraxis ? (
              selectedSupervisee ? (
                <PraxisStudentWorkspace
                  supervisee={selectedSupervisee}
                  classroom={superviseeClassroom}
                  praxisTab={praxisTab}
                  setPraxisTab={setPraxisTab}
                  onNewAssignment={() => setShowNewAssignModal(true)}
                  onNewDocument={() => setShowNewDocModal(true)}
                  onOpenSubmissions={a => setSubmissionsModal(a)}
                  onStartAppointment={onJoinMeeting ? () => handleStartAppointment(selectedSupervisee.email, `Praxisgespräch mit ${selectedSupervisee.name}`) : null}
                  startingAppointment={startingAppointmentFor === selectedSupervisee.email}
                />
              ) : (
                <div className="kz-card" style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 20px' }}>
                  Wähle links eine(n) Praktikant(in) aus, um Aufgaben und Dokumente zu sehen.
                </div>
              )
            ) : selectedClassroom ? (
              <ClassroomWorkspace
                classroom={selectedClassroom}
                role={role}
                isTeacherOrAdmin={isTeacherOrAdmin}
                isStudent={isStudent}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                mySubmission={mySubmission}
                onSubmit={a => { setSubmitModal(a); setSubmitNote(mySubmission(a)?.note || ''); }}
                onOpenSubmissions={a => setSubmissionsModal(a)}
                onNewAssignment={() => setShowNewAssignModal(true)}
                onNewDocument={() => setShowNewDocModal(true)}
                onNewStudent={() => setShowNewStudentModal(true)}
                onStartMeeting={onJoinMeeting ? () => handleStartClassMeeting(selectedClassroom.id, `Videounterricht: ${selectedClassroom.name}`) : null}
                startingMeeting={startingMeetingFor === selectedClassroom.id}
              />
            ) : (
              <div className="kz-card" style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 20px' }}>
                {isStudent
                  ? 'Du bist noch keiner Klasse zugeordnet. Bitte wende dich an deine Lehrkraft.'
                  : 'Noch keine Klasse angelegt. Erstelle links deine erste Klasse.'}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODAL: Create Classroom */}
      {showNewClassModal && (
        <div className="modal-overlay" onClick={() => setShowNewClassModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>🏫 Neues Klassenzimmer erstellen</h3>
              <button className="close-btn" onClick={() => setShowNewClassModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateClassroom}>
              <div className="modal-body">
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', fontSize: '0.85rem' }}>Name des Klassenzimmers</label>
                  <input
                    type="text"
                    placeholder="z.B. Pflegeklasse 2026-B München"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="modal-action-btn" disabled={savingClass}>{savingClass ? 'Wird angelegt…' : 'Klasse anlegen'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Assignment */}
      {showNewAssignModal && (
        <div className="modal-overlay" onClick={() => setShowNewAssignModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>📝 Neue Aufgabe anlegen</h3>
              <button className="close-btn" onClick={() => setShowNewAssignModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateAssignment}>
              <div className="modal-body">
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', fontSize: '0.82rem' }}>Titel der Aufgabe</label>
                  <input
                    type="text"
                    placeholder="z.B. SIS Dokumentation Patient Maria Schmidt"
                    value={assignForm.title}
                    onChange={e => setAssignForm(prev => ({ ...prev, title: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', fontSize: '0.82rem' }}>Abgabefrist (Datum)</label>
                  <input
                    type="text"
                    placeholder="z.B. 25.08.2026"
                    value={assignForm.dueDate}
                    onChange={e => setAssignForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', fontSize: '0.82rem' }}>Beschreibung & Anweisungen</label>
                  <textarea
                    rows={3}
                    placeholder="Aufgabenstellung für die Schüler..."
                    value={assignForm.description}
                    onChange={e => setAssignForm(prev => ({ ...prev, description: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="modal-action-btn" disabled={savingAssign}>{savingAssign ? 'Wird veröffentlicht…' : 'Aufgabe veröffentlichen'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Share Document (real file upload) */}
      {showNewDocModal && (
        <div className="modal-overlay" onClick={() => setShowNewDocModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>📁 Dokument teilen</h3>
              <button className="close-btn" onClick={() => setShowNewDocModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUploadDocument}>
              <div className="modal-body">
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', fontSize: '0.82rem' }}>Datei (PDF, DOC, DOCX, TXT — max. 8 MB)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setDocForm(prev => ({ title: prev.title || file?.name?.replace(/\.[^.]+$/, '') || '', file }));
                    }}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', fontSize: '0.82rem' }}>Angezeigter Name</label>
                  <input
                    type="text"
                    placeholder="z.B. Expertenstandard_Dekubitus_2026"
                    value={docForm.title}
                    onChange={e => setDocForm(prev => ({ ...prev, title: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                {docError && <div style={{ color: '#b91c1c', fontSize: '0.8rem', marginBottom: '8px' }}>{docError}</div>}
              </div>
              <div className="modal-footer">
                <button type="submit" className="modal-action-btn" disabled={savingDoc}>{savingDoc ? 'Wird hochgeladen…' : 'Dokument teilen'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Student */}
      {showNewStudentModal && (
        <div className="modal-overlay" onClick={() => setShowNewStudentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>👥 Schüler zur Klasse hinzufügen</h3>
              <button className="close-btn" onClick={() => setShowNewStudentModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddStudent}>
              <div className="modal-body">
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', fontSize: '0.82rem' }}>Name des Schülers</label>
                  <input
                    type="text"
                    placeholder="z.B. Lisa Hoffmann"
                    value={studentForm.name}
                    onChange={e => setStudentForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', fontSize: '0.82rem' }}>E-Mail-Adresse (verknüpft ein bestehendes Konto)</label>
                  <input
                    type="email"
                    placeholder="lisa.hoffmann@pflege-schule.de"
                    value={studentForm.email}
                    onChange={e => setStudentForm(prev => ({ ...prev, email: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="modal-action-btn">Schüler hinzufügen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Student submits an assignment */}
      {submitModal && (
        <div className="modal-overlay" onClick={() => setSubmitModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>✅ Aufgabe einreichen</h3>
              <button className="close-btn" onClick={() => setSubmitModal(null)}>&times;</button>
            </div>
            <form onSubmit={handleSubmitAssignment}>
              <div className="modal-body">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '10px' }}>{submitModal.title}</div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', fontSize: '0.82rem' }}>Notiz zu deiner Abgabe (optional)</label>
                <textarea
                  rows={4}
                  placeholder="z.B. Link zur Dokumentation, Rückfragen, Anmerkungen..."
                  value={submitNote}
                  onChange={e => setSubmitNote(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div className="modal-footer">
                <button type="submit" className="modal-action-btn" disabled={submitting}>{submitting ? 'Wird eingereicht…' : 'Einreichen'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Teacher/Praxisanleiter views who submitted */}
      {submissionsModal && (
        <div className="modal-overlay" onClick={() => setSubmissionsModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>📥 Eingereichte Abgaben</h3>
              <button className="close-btn" onClick={() => setSubmissionsModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '12px' }}>{submissionsModal.title}</div>
              {(submissionsModal.submissions || []).length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Noch keine Abgaben.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {submissionsModal.submissions.map(s => (
                    <div key={s.id} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>🎓 {s.studentName}</span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{new Date(s.submittedAt).toLocaleString('de-DE')}</span>
                      </div>
                      {s.note && <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: '#334155' }}>{s.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// =====================================================================
// Classroom workspace (student / teacher / admin) — hero banner + tabs
// =====================================================================
function ClassroomWorkspace({ classroom, role, isTeacherOrAdmin, isStudent, activeTab, setActiveTab, mySubmission, onSubmit, onOpenSubmissions, onNewAssignment, onNewDocument, onNewStudent, onStartMeeting, startingMeeting }) {
  const tabs = [
    { id: 'overview', label: '📋 Übersicht' },
    { id: 'assignments', label: `📝 Aufgaben (${classroom.assignments?.length || 0})` },
    { id: 'documents', label: `📁 Dokumente (${classroom.documents?.length || 0})` },
    ...(isTeacherOrAdmin ? [{ id: 'students', label: `👥 Schülerliste (${classroom.students?.length || 0})` }] : [])
  ];

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderRadius: '12px', padding: '24px 32px', color: '#ffffff', marginBottom: '24px', boxShadow: '0 4px 12px rgba(2,132,199,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: 800 }}>{classroom.name}</h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>Dozent: {classroom.teacher}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isTeacherOrAdmin && onStartMeeting && (
              <button
                onClick={onStartMeeting}
                disabled={startingMeeting}
                style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '0.82rem', fontWeight: 800, cursor: startingMeeting ? 'default' : 'pointer', opacity: startingMeeting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                🎥 {startingMeeting ? 'Wird gestartet…' : 'Video-Unterricht starten'}
              </button>
            )}
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {role === 'admin' ? '⚙️ Administrator' : isTeacherOrAdmin ? '👨‍🏫 Dozent(in)' : '🎓 Eingeschrieben'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`kz-tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="kz-overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="kz-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Aktuelle Aufgaben</h4>
              {isTeacherOrAdmin && <button className="kz-btn-primary" onClick={onNewAssignment}>+ Aufgabe</button>}
            </div>
            {(classroom.assignments || []).slice(0, 3).map(a => (
              <AssignmentRow key={a.id} a={a} isStudent={isStudent} isTeacherOrAdmin={isTeacherOrAdmin} mySubmission={mySubmission} onSubmit={onSubmit} onOpenSubmissions={onOpenSubmissions} totalStudents={classroom.students?.length || 0} compact />
            ))}
            {(classroom.assignments || []).length === 0 && <EmptyRow text="Noch keine Aufgaben." />}
          </div>

          <div className="kz-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Geteilte Dokumente</h4>
              {isTeacherOrAdmin && <button className="kz-btn-primary" onClick={onNewDocument}>+ Dokument</button>}
            </div>
            {(classroom.documents || []).slice(0, 3).map(d => <DocumentRow key={d.id} d={d} />)}
            {(classroom.documents || []).length === 0 && <EmptyRow text="Noch keine Dokumente." />}
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="kz-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Aufgabenverwaltung</h3>
            {isTeacherOrAdmin && <button className="kz-btn-primary" onClick={onNewAssignment}>+ Neue Aufgabe anlegen</button>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(classroom.assignments || []).map(a => (
              <AssignmentRow key={a.id} a={a} isStudent={isStudent} isTeacherOrAdmin={isTeacherOrAdmin} mySubmission={mySubmission} onSubmit={onSubmit} onOpenSubmissions={onOpenSubmissions} totalStudents={classroom.students?.length || 0} />
            ))}
            {(classroom.assignments || []).length === 0 && <EmptyRow text="Noch keine Aufgaben." />}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="kz-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Unterrichtsmaterialien</h3>
            {isTeacherOrAdmin && <button className="kz-btn-primary" onClick={onNewDocument}>+ Dokument teilen</button>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {(classroom.documents || []).map(d => <DocumentCard key={d.id} d={d} />)}
          </div>
          {(classroom.documents || []).length === 0 && <EmptyRow text="Noch keine Dokumente." />}
        </div>
      )}

      {activeTab === 'students' && isTeacherOrAdmin && (
        <div className="kz-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Eingeschriebene Pflegeschüler</h3>
            <button className="kz-btn-primary" onClick={onNewStudent}>+ Schüler hinzufügen</button>
          </div>
          <table className="ph-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Schüler Name</th>
                <th>E-Mail</th>
                <th>Lernfortschritt</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(classroom.students || []).map(s => (
                <tr key={s.id}>
                  <td><strong>🎓 {s.name}</strong></td>
                  <td>{s.email}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '4px', height: '8px', overflow: 'hidden', maxWidth: '140px' }}>
                        <div style={{ width: `${s.progress}%`, background: '#0284c7', height: '100%' }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{s.progress}%</span>
                    </div>
                  </td>
                  <td><span className="tag tag-active">Aktiv</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {(classroom.students || []).length === 0 && <EmptyRow text="Noch keine Schüler eingeschrieben." />}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// Praxisanleiter workspace — one supervised student at a time
// =====================================================================
function PraxisStudentWorkspace({ supervisee, classroom, praxisTab, setPraxisTab, onNewAssignment, onNewDocument, onOpenSubmissions, onStartAppointment, startingAppointment }) {
  if (!classroom) {
    return (
      <div className="kz-card" style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 20px' }}>
        {supervisee.name} ist noch keiner Klasse zugeordnet.
      </div>
    );
  }
  const progressEntry = classroom.students?.find(s => s.userId === supervisee.id);

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0b7a70 100%)', borderRadius: '12px', padding: '24px 32px', color: '#ffffff', marginBottom: '24px', boxShadow: '0 4px 12px rgba(13,148,136,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <AvatarCircle name={supervisee.name} size={56} fontSize={20} avatarType={supervisee.avatarType} avatarIcon={supervisee.avatarIcon} avatarUrl={supervisee.avatarUrl} style={{ border: '3px solid rgba(255,255,255,0.6)' }} />
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 800 }}>{supervisee.name}</h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.85rem' }}>
              🏫 {classroom.name}{supervisee.cohortYear ? ` • Jahrgang ${supervisee.cohortYear}` : ''}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onStartAppointment && (
              <button
                onClick={onStartAppointment}
                disabled={startingAppointment}
                style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '0.82rem', fontWeight: 800, cursor: startingAppointment ? 'default' : 'pointer', opacity: startingAppointment ? 0.7 : 1, whiteSpace: 'nowrap' }}
              >
                🎥 {startingAppointment ? 'Wird gestartet…' : 'Video-Gespräch starten'}
              </button>
            )}
            {progressEntry && (
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{progressEntry.progress}%</div>
                <div style={{ fontSize: '0.68rem', opacity: 0.9 }}>Fortschritt</div>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {[
            { id: 'assignments', label: `📝 Aufgaben (${classroom.assignments?.length || 0})` },
            { id: 'documents', label: `📁 Dokumente (${classroom.documents?.length || 0})` }
          ].map(tab => (
            <button key={tab.id} onClick={() => setPraxisTab(tab.id)} className={`kz-tab-btn ${praxisTab === tab.id ? 'active' : ''}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {praxisTab === 'assignments' && (
        <div className="kz-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Praxisaufgaben in {classroom.name}</h3>
            <button className="kz-btn-primary" onClick={onNewAssignment}>+ Praxisaufgabe stellen</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(classroom.assignments || []).map(a => {
              const submitted = (a.submissions || []).find(s => s.studentId === supervisee.id);
              return (
                <div key={a.id} style={{ padding: '14px', borderRadius: '10px', border: '1px solid #f1f5f9', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{a.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Fällig am: <strong>{a.dueDate}</strong></div>
                      {a.description && <p style={{ fontSize: '0.8rem', color: '#334155', marginTop: '6px', marginBottom: 0 }}>{a.description}</p>}
                    </div>
                    {submitted
                      ? <span className="tag tag-active" style={{ whiteSpace: 'nowrap' }}>✅ {supervisee.name.split(' ')[0]} hat abgegeben</span>
                      : <span className="tag tag-pending" style={{ whiteSpace: 'nowrap' }}>Offen</span>}
                  </div>
                  <button
                    onClick={() => onOpenSubmissions(a)}
                    style={{ marginTop: '10px', background: 'none', border: 'none', color: '#0d9488', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
                  >
                    Alle Abgaben ansehen ({(a.submissions || []).length})
                  </button>
                </div>
              );
            })}
            {(classroom.assignments || []).length === 0 && <EmptyRow text="Noch keine Aufgaben in dieser Klasse." />}
          </div>
        </div>
      )}

      {praxisTab === 'documents' && (
        <div className="kz-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Dokumente in {classroom.name}</h3>
            <button className="kz-btn-primary" onClick={onNewDocument}>+ Dokument teilen</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {(classroom.documents || []).map(d => <DocumentCard key={d.id} d={d} />)}
          </div>
          {(classroom.documents || []).length === 0 && <EmptyRow text="Noch keine Dokumente." />}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// Small shared presentational pieces
// =====================================================================
function EmptyRow({ text }) {
  return <div style={{ fontSize: '0.85rem', color: '#94a3b8', padding: '10px 2px' }}>{text}</div>;
}

function AssignmentRow({ a, isStudent, isTeacherOrAdmin, mySubmission, onSubmit, onOpenSubmissions, totalStudents, compact }) {
  const mine = isStudent ? mySubmission(a) : null;
  const submittedCount = (a.submissions || []).length;

  return (
    <div style={{ padding: compact ? '10px 12px' : '14px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#f8fafc', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{a.title}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Fällig am: <strong>{a.dueDate}</strong></div>
          {!compact && a.description && <p style={{ fontSize: '0.8rem', color: '#334155', marginTop: '6px', marginBottom: 0 }}>{a.description}</p>}
        </div>
        {isStudent && (mine
          ? <span className="tag tag-active" style={{ whiteSpace: 'nowrap' }}>✅ Eingereicht</span>
          : <span className="tag tag-pending" style={{ whiteSpace: 'nowrap' }}>Offen</span>)}
        {isTeacherOrAdmin && (
          <span className="tag tag-pending" style={{ whiteSpace: 'nowrap' }}>{submittedCount}/{totalStudents} eingereicht</span>
        )}
      </div>
      {isStudent && (
        <button className="kz-btn-primary" style={{ marginTop: '10px' }} onClick={() => onSubmit(a)}>
          {mine ? 'Abgabe bearbeiten' : 'Einreichen'}
        </button>
      )}
      {isTeacherOrAdmin && submittedCount > 0 && (
        <button
          onClick={() => onOpenSubmissions(a)}
          style={{ marginTop: '10px', background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', padding: 0, display: 'block' }}
        >
          Abgaben ansehen
        </button>
      )}
    </div>
  );
}

function DocumentRow({ d }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#f8fafc', marginBottom: '8px' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>📄 {d.title}</div>
        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{formatFileSize(d.size)} • {d.uploadedBy} am {d.date}</div>
      </div>
      <a
        href={d.url} target="_blank" rel="noopener noreferrer" download
        style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}
      >
        Herunterladen
      </a>
    </div>
  );
}

function DocumentCard({ d }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📄</div>
      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', wordBreak: 'break-word' }}>{d.title}</div>
      <div style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 12px 0' }}>{formatFileSize(d.size)} • {d.date}</div>
      <a
        href={d.url} target="_blank" rel="noopener noreferrer" download
        style={{ display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}
      >
        Öffnen / Herunterladen
      </a>
    </div>
  );
}
