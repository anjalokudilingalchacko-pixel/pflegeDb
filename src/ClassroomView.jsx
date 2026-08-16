import React, { useState, useEffect } from 'react';
import './App.css';

export default function ClassroomView({ onHome, userRole, setUserRole, currentUser, setCurrentUser, onOpenAuthModal, user }) {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'assignments', 'documents', 'students'
  const [isLoading, setIsLoading] = useState(true);

  // Modal / Form states
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const [showNewAssignModal, setShowNewAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ title: '', dueDate: '', description: '' });

  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [docForm, setDocForm] = useState({ title: '', size: '2.5 MB' });

  const [showNewStudentModal, setShowNewStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: '', email: '' });

  const isTeacher = userRole === 'teacher' || user?.role === 'teacher';

  const selectedClassroom = classrooms.find(c => c.id === selectedClassId) || classrooms[0] || null;

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = () => {
    setIsLoading(true);
    fetch('/api/classrooms')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setClassrooms(data);
          setSelectedClassId(prev => prev || data[0].id);
        }
      })
      .catch(err => console.error("Error loading classrooms:", err))
      .finally(() => setIsLoading(false));
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      const res = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName.trim(), teacher: user?.name || 'Prof. Dr. Elisabeth Müller' })
      });
      if (res.ok) {
        const newClass = await res.json();
        setClassrooms(prev => [...prev, newClass]);
        setSelectedClassId(newClass.id);
        setNewClassName('');
        setShowNewClassModal(false);
      }
    } catch (err) {
      alert("Fehler beim Erstellen der Klasse.");
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignForm.title.trim() || !selectedClassroom) return;

    try {
      const res = await fetch(`/api/classrooms/${selectedClassroom.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm)
      });
      if (res.ok) {
        const newAssign = await res.json();
        setClassrooms(prev => prev.map(c => {
          if (c.id === selectedClassroom.id) {
            return { ...c, assignments: [...(c.assignments || []), newAssign] };
          }
          return c;
        }));
        setAssignForm({ title: '', dueDate: '', description: '' });
        setShowNewAssignModal(false);
      }
    } catch (err) {
      alert("Fehler beim Erstellen der Aufgabe.");
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docForm.title.trim() || !selectedClassroom) return;

    try {
      const res = await fetch(`/api/classrooms/${selectedClassroom.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docForm)
      });
      if (res.ok) {
        const newDoc = await res.json();
        setClassrooms(prev => prev.map(c => {
          if (c.id === selectedClassroom.id) {
            return { ...c, documents: [...(c.documents || []), newDoc] };
          }
          return c;
        }));
        setDocForm({ title: '', size: '2.5 MB' });
        setShowNewDocModal(false);
      }
    } catch (err) {
      alert("Fehler beim Teilen des Dokuments.");
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.name.trim() || !selectedClassroom) return;

    try {
      const res = await fetch(`/api/classrooms/${selectedClassroom.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm)
      });
      if (res.ok) {
        const newStu = await res.json();
        setClassrooms(prev => prev.map(c => {
          if (c.id === selectedClassroom.id) {
            return { ...c, students: [...(c.students || []), newStu] };
          }
          return c;
        }));
        setStudentForm({ name: '', email: '' });
        setShowNewStudentModal(false);
      }
    } catch (err) {
      alert("Fehler beim Hinzufügen des Schülers.");
    }
  };

  const handleProfileClick = () => {
    if (!currentUser && onOpenAuthModal) {
      onOpenAuthModal();
    } else if (setUserRole) {
      setUserRole(isTeacher ? 'student' : 'teacher');
    }
  };

  return (
    <div className="module-view-container" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Top Navbar */}
      <header className="module-topbar" style={{ background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="module-topbar-left" onClick={onHome} style={{ cursor: 'pointer' }} title="Zurück zur Startseite">
          <div className="module-logo" style={{ color: '#38bdf8' }}>
            🏫
          </div>
          <span className="module-name" style={{ color: '#ffffff', fontWeight: 800 }}>Klassenzimmer & Aufgaben</span>
          <nav className="module-nav">
            <a href="#" className="active" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Klassenübersicht</a>
            <a href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Dokumenten-Hub</a>
          </nav>
        </div>
        <div className="module-topbar-right">
          <button
            type="button"
            onClick={handleProfileClick}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isTeacher ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: '2px solid rgba(255,255,255,0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
            title={currentUser ? (isTeacher ? "Prof. Dr. E. Müller (Lehrer) - Rollen-Wechsel" : "Alex Schmidt (Schüler) - Rollen-Wechsel") : "Login / Register"}
          >
            {currentUser ? (isTeacher ? '👨‍🏫' : '🎓') : '👤'}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* LEFT SIDEBAR: Classrooms List */}
        <aside style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Klassenzimmer</h3>
            {isTeacher && (
              <button 
                onClick={() => setShowNewClassModal(true)}
                style={{ background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                + Neue Klasse
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {classrooms.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: selectedClassId === c.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: selectedClassId === c.id ? '#f0f9ff' : '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: selectedClassId === c.id ? '#0369a1' : '#1e293b' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  👨‍🏫 {c.teacher} • {c.students?.length || 0} Schüler
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* RIGHT AREA: Classroom Detail Workspace */}
        <main>
          {selectedClassroom ? (
            <div>
              {/* Classroom Header Banner */}
              <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderRadius: '12px', padding: '24px 32px', color: '#ffffff', marginBottom: '24px', boxShadow: '0 4px 12px rgba(2,132,199,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: 800 }}>{selectedClassroom.name}</h2>
                    <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>Dozent: {selectedClassroom.teacher}</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                    {isTeacher ? '👨‍🏫 Administrator' : '🎓 Eingeschrieben'}
                  </div>
                </div>

                {/* Sub Tab Navigation */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  {[
                    { id: 'overview', label: '📋 Übersicht' },
                    { id: 'assignments', label: `📝 Aufgaben (${selectedClassroom.assignments?.length || 0})` },
                    { id: 'documents', label: `📁 Shared Dokumente (${selectedClassroom.documents?.length || 0})` },
                    { id: 'students', label: `👥 Schülerliste (${selectedClassroom.students?.length || 0})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        background: activeTab === tab.id ? '#ffffff' : 'rgba(255,255,255,0.15)',
                        color: activeTab === tab.id ? '#0369a1' : '#ffffff',
                        fontWeight: 700,
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  
                  {/* Recent Assignments Card */}
                  <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Aktuelle Aufgaben & Fallstudien</h4>
                      {isTeacher && (
                        <button 
                          onClick={() => setShowNewAssignModal(true)}
                          style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          + Aufgabe erstellen
                        </button>
                      )}
                    </div>
                    {selectedClassroom.assignments?.map(a => (
                      <div key={a.id} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#f8fafc', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{a.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Fällig am: <strong>{a.dueDate}</strong> • Status: <span style={{ color: '#0284c7', fontWeight: 700 }}>{a.status}</span></div>
                        <p style={{ fontSize: '0.8rem', color: '#334155', marginTop: '6px', marginBottom: 0 }}>{a.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Shared Documents Card */}
                  <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Geteilte Unterlagen & Leitfäden</h4>
                      {isTeacher && (
                        <button 
                          onClick={() => setShowNewDocModal(true)}
                          style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          + Dokument teilen
                        </button>
                      )}
                    </div>
                    {selectedClassroom.documents?.map(d => (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#f8fafc', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>📄 {d.title}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{d.size} • Hochgeladen von {d.uploadedBy} am {d.date}</div>
                        </div>
                        <button style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                          Herunterladen
                        </button>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* Tab 2: ASSIGNMENTS */}
              {activeTab === 'assignments' && (
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Aufgabenverwaltung für Pflegeschüler</h3>
                    {isTeacher && (
                      <button 
                        onClick={() => setShowNewAssignModal(true)}
                        style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + Neue Aufgabe anlegen
                      </button>
                    )}
                  </div>
                  <table className="ph-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Aufgabentitel</th>
                        <th>Abgabefrist</th>
                        <th>Status</th>
                        <th>Beschreibung</th>
                        <th>Aktion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClassroom.assignments?.map(a => (
                        <tr key={a.id}>
                          <td><strong>{a.title}</strong></td>
                          <td>📅 {a.dueDate}</td>
                          <td><span className="tag tag-active">{a.status}</span></td>
                          <td>{a.description}</td>
                          <td>
                            <button className="panel-action-btn" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                              {isTeacher ? 'Bearbeiten' : 'Einreichen'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 3: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Unterrichtsmaterialien & Expertenstandards</h3>
                    {isTeacher && (
                      <button 
                        onClick={() => setShowNewDocModal(true)}
                        style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + Neues Dokument hochladen
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {selectedClassroom.documents?.map(d => (
                      <div key={d.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📄</div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{d.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 12px 0' }}>{d.size} • {d.date}</div>
                        <button style={{ width: '100%', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                          Öffnen / Herunterladen
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: STUDENTS */}
              {activeTab === 'students' && (
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Eingeschriebene Pflegeschüler</h3>
                    {isTeacher && (
                      <button 
                        onClick={() => setShowNewStudentModal(true)}
                        style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + Schüler hinzufügen
                      </button>
                    )}
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
                      {selectedClassroom.students?.map(s => (
                        <tr key={s.id}>
                          <td><strong>🎓 {s.name}</strong></td>
                          <td>{s.email}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                <div style={{ width: `${s.progress}%`, background: '#0284c7', height: '100%' }}></div>
                              </div>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{s.progress}%</span>
                            </div>
                          </td>
                          <td><span className="tag tag-active">Aktiv</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          ) : (
            <div>Keine Klasse ausgewählt.</div>
          )}
        </main>
      </div>

      {/* MODAL 1: Create Classroom */}
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
                <button type="submit" className="modal-action-btn">Klasse anlegen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Assignment */}
      {showNewAssignModal && (
        <div className="modal-overlay" onClick={() => setShowNewAssignModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>📝 Neue Aufgabe für Klasse anlegen</h3>
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
                <button type="submit" className="modal-action-btn">Aufgabe veröffentlichen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Share Document */}
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
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', fontSize: '0.82rem' }}>Dokumentname</label>
                  <input 
                    type="text" 
                    placeholder="z.B. Expertenstandard_Dekubitus_2026.pdf"
                    value={docForm.title}
                    onChange={e => setDocForm(prev => ({ ...prev, title: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="modal-action-btn">Dokument teilen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Add Student */}
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
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px', fontSize: '0.82rem' }}>E-Mail-Adresse</label>
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

    </div>
  );
}
