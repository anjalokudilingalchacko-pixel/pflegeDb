/**
 * ELearningCertificates.jsx — Pflege Akademie (E-Learning & Zertifikate)
 *
 * Fully wired to the /api/elearning/* backend in server.cjs: real courses,
 * real enrollment/progress, real quiz-graded lesson completion, and real
 * certificate issuance/upload. Visual shell (sidebar, hero, card language,
 * color system) matches the original design; LessonViewer.jsx and
 * CourseEditor.jsx handle the two pieces the original design didn't have
 * (actually taking a lesson, and actually authoring a course).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CATEGORIES, ProgressBar, CertStatusBadge, formatDateDe, fileToDataURL,
  apiGetCourses, apiGetCourse, apiDeleteCourse, apiEnroll,
  apiMyEnrollments, apiMyCertificates, apiUploadCertificate
} from './elearningShared';
import { UserProfileMenu } from './feedShared';
import LessonViewer from './LessonViewer';
import CourseEditor from './CourseEditor';
import { LogoELearning } from './icons';

const NAV_ITEMS = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'kurse', icon: '🎓', label: 'Pflegekurse' },
  { key: 'zertifikate', icon: '📜', label: 'Zertifizierungen' },
  { key: 'marktplatz', icon: '🛒', label: 'Marktplatz' }
];

const COLORS = ['#0052cc', '#0d9488', '#f59e0b', '#7c3aed', '#dc2626'];
function categoryColor(category) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function ELearningCertificates({ onHome, userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  const me = currentUser || { id: 'guest', name: 'Gast', role: 'student' };
  const isLoggedIn = !!localStorage.getItem('pflegedb_jwt_token');
  const isInstructor = ['teacher', 'praxisanleiter', 'admin'].includes(me.role);

  const [activeSidebarTab, setActiveSidebarTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Alle');

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');

  const [myEnrollments, setMyEnrollments] = useState([]);
  const [myCertificates, setMyCertificates] = useState([]);
  const [certsLoading, setCertsLoading] = useState(true);

  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState(null);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [courseActionError, setCourseActionError] = useState('');

  const [showLessonViewer, setShowLessonViewer] = useState(false);
  const [showCourseEditor, setShowCourseEditor] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showCertUpload, setShowCertUpload] = useState(false);

  function ensureAuth() {
    if (!isLoggedIn) {
      if (onOpenAuthModal) onOpenAuthModal();
      else alert('Bitte melde dich an, um diese Funktion zu nutzen.');
      return false;
    }
    return true;
  }

  const loadCourses = useCallback(() => {
    setCoursesLoading(true);
    apiGetCourses({ q: searchQuery, category: filterCategory })
      .then(data => { setCourses(data); setCoursesError(''); })
      .catch(err => setCoursesError(err.message))
      .finally(() => setCoursesLoading(false));
  }, [searchQuery, filterCategory]);

  useEffect(() => { loadCourses(); }, [loadCourses]); // eslint-disable-line react-hooks/set-state-in-effect -- loadCourses() sets a loading flag before its async fetch, the standard data-fetch idiom

  const loadMyStuff = useCallback(() => {
    if (!isLoggedIn) { setCertsLoading(false); return; }
    setCertsLoading(true);
    Promise.all([apiMyEnrollments(), apiMyCertificates()])
      .then(([enrollments, certs]) => { setMyEnrollments(enrollments); setMyCertificates(certs); })
      .catch(() => {})
      .finally(() => setCertsLoading(false));
  }, [isLoggedIn]);

  useEffect(() => { loadMyStuff(); }, [loadMyStuff]); // eslint-disable-line react-hooks/set-state-in-effect -- loadMyStuff() sets a loading flag before its async fetch, the standard data-fetch idiom

  const refreshAfterProgress = () => {
    loadCourses();
    loadMyStuff();
    if (selectedCourseId) {
      apiGetCourse(selectedCourseId).then(setSelectedCourseDetail).catch(() => {});
    }
  };

  const openCourse = (id) => {
    setSelectedCourseId(id);
    setSelectedCourseDetail(null);
    setCourseActionError('');
    setCourseDetailLoading(true);
    apiGetCourse(id)
      .then(setSelectedCourseDetail)
      .catch(err => setCourseActionError(err.message))
      .finally(() => setCourseDetailLoading(false));
  };
  const closeCourseModal = () => { setSelectedCourseId(null); setSelectedCourseDetail(null); };

  const handleEnroll = async () => {
    if (!ensureAuth()) return;
    setCourseActionError('');
    try {
      const detail = await apiEnroll(selectedCourseDetail.id);
      setSelectedCourseDetail(detail);
      loadMyStuff();
      loadCourses();
    } catch (err) {
      setCourseActionError(err.message);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm(`„${selectedCourseDetail.title}" wirklich löschen? Alle Einschreibungen gehen verloren.`)) return;
    try {
      await apiDeleteCourse(selectedCourseDetail.id);
      closeCourseModal();
      loadCourses();
      loadMyStuff();
    } catch (err) {
      alert(err.message);
    }
  };

  const userName = me.name || 'Gast';
  const inProgress = myEnrollments.filter(c => !c.completedAt);
  const completed = myEnrollments.filter(c => c.completedAt);
  const enrolledIds = new Set(myEnrollments.map(c => c.id));
  const recommended = courses.filter(c => !enrolledIds.has(c.id)).slice(0, 4);

  const activeCertCount = myCertificates.filter(c => c.status === 'active').length;
  const expiringCerts = myCertificates.filter(c => c.status === 'expiring');
  const expiredCertCount = myCertificates.filter(c => c.status === 'expired').length;

  const navBtnStyle = (active) => ({
    display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px",
    border: "none", background: active ? "#0052cc" : "transparent", color: active ? "#ffffff" : "#475569",
    fontWeight: active ? 800 : 600, fontSize: "0.9rem", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease"
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: "#1e293b" }}>
      <style>{ELEARNING_RESPONSIVE_CSS}</style>

      {/* ============ LEFT SIDEBAR ============ */}
      <aside className="ea-sidebar" style={{ width: "240px", background: "#f0f4fa", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "24px 16px", flexShrink: 0 }}>
        <div>
          <div onClick={onHome} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 8px 20px 8px", cursor: "pointer" }} title="Zurück zur Startseite">
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,82,204,0.25)" }}><LogoELearning /></div>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f2942", letterSpacing: "-0.02em", lineHeight: 1.1 }}>E learning</div>
          </div>

          {activeSidebarTab === 'marktplatz' && isInstructor && (
            <button
              onClick={() => { setEditingCourse(null); setShowCourseEditor(true); }}
              style={{ width: "100%", background: "#0052cc", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 14px", fontWeight: 800, fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px" }}
            >
              <span>+</span><span>Neuer Kurs</span>
            </button>
          )}

          <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {NAV_ITEMS.map(item => (
              <button key={item.key} onClick={() => setActiveSidebarTab(item.key)} style={navBtnStyle(activeSidebarTab === item.key)}>
                <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div>
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
            <button onClick={onHome} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "transparent", color: "#475569", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: "1.1rem" }}>🚪</span><span>Zurück zur Startseite</span>
            </button>
          </div>

          <button
            onClick={() => { if (inProgress.length > 0) openCourse(inProgress[0].id); else setActiveSidebarTab('kurse'); }}
            style={{ width: "100%", background: "#0052cc", color: "#ffffff", border: "none", borderRadius: "10px", padding: "12px 14px", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 12px rgba(0,82,204,0.3)" }}
          >
            <span>▶</span><span>Fortbildung starten</span>
          </button>
        </div>
      </aside>

      {/* ============ MAIN WORKSPACE ============ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#ffffff" }}>
        <div style={{ padding: "32px 40px", flex: 1 }} className="ea-main-pad">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", gap: 16, flexWrap: 'wrap' }}>
            <div style={{ position: "relative", width: "420px", maxWidth: '100%' }}>
              <span style={{ position: "absolute", left: "14px", top: "11px", color: "#94a3b8", fontSize: "0.9rem" }}>🔍</span>
              <input
                type="text" placeholder="Kurse suchen..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "10px 16px 10px 40px", borderRadius: "24px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "0.9rem", outline: "none", color: "#0f172a", boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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

          {activeSidebarTab === 'dashboard' && (
            <DashboardView
              userName={userName} isLoggedIn={isLoggedIn} inProgress={inProgress} completed={completed}
              recommended={recommended} coursesLoading={coursesLoading} certsLoading={certsLoading}
              onOpenCourse={openCourse}
            />
          )}

          {activeSidebarTab === 'kurse' && (
            <CatalogView
              title="Pflegekurse Entdecken" subtitle="Erweitern Sie Ihre klinischen und administrativen Kompetenzen."
              searchQuery={searchQuery}
              filterCategory={filterCategory} setFilterCategory={setFilterCategory}
              courses={courses} loading={coursesLoading} error={coursesError}
              onOpenCourse={openCourse}
            />
          )}

          {activeSidebarTab === 'zertifikate' && (
            <ZertifikateView
              isLoggedIn={isLoggedIn} loading={certsLoading} certificates={myCertificates}
              activeCount={activeCertCount} expiringCerts={expiringCerts} expiredCount={expiredCertCount}
              onUpload={() => { if (ensureAuth()) setShowCertUpload(true); }}
              ensureAuth={ensureAuth}
            />
          )}

          {activeSidebarTab === 'marktplatz' && (
            <CatalogView
              title="Marktplatz Entdecken" subtitle="Finden Sie erstklassige Fortbildungen, spezialisierte Pflegekurse und exklusive Partnerschaftsprogramme zur Erweiterung Ihrer klinischen Expertise."
              searchQuery={searchQuery}
              filterCategory={filterCategory} setFilterCategory={setFilterCategory}
              courses={courses} loading={coursesLoading} error={coursesError}
              onOpenCourse={openCourse} showPrice
            />
          )}
        </div>
      </div>

      {/* ============ COURSE DETAIL MODAL ============ */}
      {selectedCourseId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }} onClick={(e) => { if (e.target === e.currentTarget) closeCourseModal(); }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", width: "100%", maxWidth: "640px", maxHeight: '88vh', overflowY: 'auto', boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            {courseDetailLoading || !selectedCourseDetail ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Lädt…</div>
            ) : (
              <>
                <div style={{ background: "#0052cc", color: "#ffffff", padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800 }}>{selectedCourseDetail.category}</span>
                    <h3 style={{ margin: "10px 0 0 0", fontSize: "1.3rem", fontWeight: 800 }}>{selectedCourseDetail.title}</h3>
                  </div>
                  <button onClick={closeCourseModal} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "1.8rem", cursor: "pointer" }}>&times;</button>
                </div>

                <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div style={{ fontSize: "0.95rem", color: "#334155", lineHeight: 1.5 }}>{selectedCourseDetail.subtitle}</div>

                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.85rem" }}>
                    <div>Dozent: <strong>{selectedCourseDetail.instructorName}</strong></div>
                    <div>Fortschritt: <strong style={{ color: "#0052cc" }}>{selectedCourseDetail.progressPercent}%</strong></div>
                    <div>Dauer: <strong>{selectedCourseDetail.durationHours} Std.</strong></div>
                    <div>Lektionen: <strong>{selectedCourseDetail.lessonCount}</strong></div>
                  </div>

                  {selectedCourseDetail.isEnrolled && <ProgressBar percent={selectedCourseDetail.progressPercent} />}

                  <div>
                    {selectedCourseDetail.modules.map(m => (
                      <div key={m.id} style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 800, fontSize: '.85rem', color: '#0f2942', marginBottom: 6 }}>{m.title}</div>
                        {m.lessons.map(l => (
                          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: '.85rem', color: '#475569' }}>
                            <span>{l.completed ? '✅' : l.type === 'quiz' ? '❓' : l.type === 'video' ? '▶️' : '📄'}</span>
                            <span>{l.title}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {courseActionError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, padding: '10px 14px', fontSize: '.85rem' }}>{courseActionError}</div>}

                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "6px", flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {isInstructor && (me.role === 'admin' || selectedCourseDetail.createdBy === me.id) && (
                        <>
                          <button onClick={() => { setEditingCourse(selectedCourseDetail); setShowCourseEditor(true); }} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 16px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>Bearbeiten</button>
                          <button onClick={handleDeleteCourse} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: '#991b1b', borderRadius: "8px", padding: "10px 16px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>Löschen</button>
                        </>
                      )}
                    </div>
                    {selectedCourseDetail.isEnrolled ? (
                      <button onClick={() => setShowLessonViewer(true)} style={{ background: "#0052cc", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 22px", fontWeight: 800, fontSize: "0.88rem", cursor: "pointer" }}>
                        ▶ {selectedCourseDetail.progressPercent >= 100 ? 'Kurs ansehen' : 'Lektion fortsetzen'}
                      </button>
                    ) : (
                      <button onClick={handleEnroll} style={{ background: "#0052cc", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 22px", fontWeight: 800, fontSize: "0.88rem", cursor: "pointer" }}>
                        Kurs beitreten{selectedCourseDetail.price > 0 ? ` — €${selectedCourseDetail.price}` : ' (kostenlos)'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showLessonViewer && selectedCourseDetail && (
        <LessonViewer
          course={selectedCourseDetail}
          onClose={() => setShowLessonViewer(false)}
          onFinished={refreshAfterProgress}
        />
      )}

      {showCourseEditor && (
        <CourseEditor
          editingCourse={editingCourse}
          onClose={() => setShowCourseEditor(false)}
          onSaved={(saved) => {
            setShowCourseEditor(false);
            loadCourses();
            if (selectedCourseId === saved.id) setSelectedCourseDetail(saved);
          }}
        />
      )}

      {showCertUpload && (
        <CertUploadModal
          onClose={() => setShowCertUpload(false)}
          onUploaded={() => { setShowCertUpload(false); loadMyStuff(); }}
        />
      )}
    </div>
  );
}

// ==================== Dashboard ====================
function DashboardView({ userName, isLoggedIn, inProgress, completed, recommended, coursesLoading, certsLoading, onOpenCourse }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "1.8rem", fontWeight: 900, color: "#0f2942", letterSpacing: "-0.02em" }}>
            Willkommen zurück{isLoggedIn ? `, ${userName}!` : '!'}
          </h1>
          <p style={{ margin: 0, fontSize: "0.92rem", color: "#64748b", fontWeight: 500 }}>
            {isLoggedIn ? `${inProgress.length} Kurs${inProgress.length === 1 ? '' : 'e'} in Bearbeitung · ${completed.length} abgeschlossen` : 'Melde dich an, um deinen Lernfortschritt zu sehen.'}
          </p>
        </div>
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "14px", padding: "14px 20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.4rem" }}>🎓</span>
          <div>
            <div style={{ fontWeight: 900, color: "#9a3412", fontSize: "1.1rem" }}>{completed.length} Zertifizierung{completed.length === 1 ? '' : 'en'}</div>
            <div style={{ fontSize: "0.75rem", color: "#c2410c", fontWeight: 700 }}>erfolgreich abgeschlossen</div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0f2942", marginBottom: 16 }}>Lernfortschritt</h2>
      {!isLoggedIn ? (
        <EmptyBlock text="Melde dich an, um deine laufenden Kurse hier zu sehen." />
      ) : certsLoading ? (
        <SkeletonRow />
      ) : inProgress.length === 0 ? (
        <EmptyBlock text="Noch keine Kurse begonnen — entdecke unten Empfehlungen für dich." />
      ) : (
        <div style={{ display: "flex", gap: "18px", overflowX: "auto", paddingBottom: 10, marginBottom: 36 }}>
          {inProgress.map(c => (
            <div key={c.id} onClick={() => onOpenCourse(c.id)} style={{ minWidth: 280, background: "#fff", border: "1px solid #e2e8f0", borderLeft: `4px solid ${categoryColor(c.category)}`, borderRadius: "16px", padding: "18px", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <span style={{ background: `${categoryColor(c.category)}1a`, color: categoryColor(c.category), padding: "3px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 800 }}>{c.category}</span>
              <h3 style={{ margin: "12px 0 14px", fontSize: "1rem", fontWeight: 800, color: "#0f2942" }}>{c.title}</h3>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                <span>Fortschritt</span><span>{c.progressPercent}%</span>
              </div>
              <ProgressBar percent={c.progressPercent} color={categoryColor(c.category)} />
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0f2942", marginBottom: 16 }}>Für Sie empfohlen</h2>
      {coursesLoading ? <SkeletonRow /> : (
        <div className="ea-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
          {recommended.map(c => <CourseCard key={c.id} course={c} onClick={() => onOpenCourse(c.id)} compact />)}
          {recommended.length === 0 && <EmptyBlock text="Alle verfügbaren Kurse sind bereits gestartet." />}
        </div>
      )}
    </div>
  );
}

// ==================== Catalog (Kurse / Marktplatz) ====================
function CatalogView({ title, subtitle, searchQuery, filterCategory, setFilterCategory, courses, loading, error, onOpenCourse, showPrice }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "1.8rem", fontWeight: 900, color: "#0f2942", letterSpacing: "-0.02em" }}>{title}</h1>
          <p style={{ margin: 0, fontSize: "0.92rem", color: "#64748b", fontWeight: 500, maxWidth: 700 }}>{subtitle}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "28px", overflowX: "auto" }}>
        {['Alle', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            style={{ padding: "8px 18px", borderRadius: "20px", border: filterCategory === cat ? "none" : "1px solid #cbd5e1", background: filterCategory === cat ? "#0052cc" : "#ffffff", color: filterCategory === cat ? "#ffffff" : "#334155", fontWeight: filterCategory === cat ? 800 : 600, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>{error}</div>}
      {loading ? <SkeletonRow tall /> : (
        <div className="ea-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {courses.map(c => <CourseCard key={c.id} course={c} onClick={() => onOpenCourse(c.id)} showPrice={showPrice} />)}
          {courses.length === 0 && <EmptyBlock text={`Keine Kurse für „${searchQuery || filterCategory}" gefunden.`} />}
        </div>
      )}
    </div>
  );
}

// ==================== Shared course card ====================
function CourseCard({ course, onClick, compact, showPrice }) {
  const color = categoryColor(course.category);
  return (
    <div onClick={onClick} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", cursor: "pointer" }}>
      <div>
        <div style={{ position: "relative", height: compact ? 110 : 160, background: course.coverImage ? undefined : `linear-gradient(135deg, ${color} 0%, #0f2942 100%)` }}>
          {course.coverImage
            ? <img src={course.coverImage} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎓</div>}
          <span style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)", color: "#0f2942", padding: "4px 10px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 800 }}>{course.category}</span>
          {course.isEnrolled && course.completedAt && (
            <span style={{ position: "absolute", top: "10px", right: "10px", background: "#10b981", color: '#fff', padding: "4px 10px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 800 }}>✓ Abgeschlossen</span>
          )}
        </div>
        <div style={{ padding: compact ? '14px' : "20px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: compact ? '0.98rem' : "1.1rem", fontWeight: 800, color: "#0f2942" }}>{course.title}</h3>
          {!compact && <p style={{ margin: "0 0 14px 0", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.4 }}>{course.subtitle}</p>}
          <div style={{ display: "flex", gap: "14px", fontSize: "0.78rem", color: "#64748b", fontWeight: 600, marginBottom: course.isEnrolled ? 12 : 0 }}>
            <span>⏱ {course.durationHours} Std.</span>
            {course.cmePoints > 0 && <span>🎓 {course.cmePoints} CME</span>}
            {showPrice && <span style={{ color: '#0052cc', fontWeight: 800 }}>{course.price > 0 ? `€${course.price}` : 'Kostenlos'}</span>}
          </div>
          {course.isEnrolled && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>
                <span>Fortschritt</span><span>{course.progressPercent}%</span>
              </div>
              <ProgressBar percent={course.progressPercent} color={color} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonRow({ tall }) {
  return (
    <div style={{ display: 'flex', gap: 18 }}>
      {[0, 1, 2].map(i => <div key={i} style={{ flex: 1, height: tall ? 260 : 140, borderRadius: 16, background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%)', backgroundSize: '400% 100%', animation: 'ea-skel 1.4s ease infinite' }} />)}
    </div>
  );
}

function EmptyBlock({ text }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 16, padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '.88rem', gridColumn: '1 / -1' }}>
      {text}
    </div>
  );
}

// ==================== Zertifizierungen ====================
function ZertifikateView({ isLoggedIn, loading, certificates, activeCount, expiringCerts, expiredCount, onUpload }) {
  if (!isLoggedIn) {
    return (
      <div>
        <h1 style={{ margin: "0 0 6px 0", fontSize: "1.8rem", fontWeight: 900, color: "#0f2942" }}>Zertifizierungen</h1>
        <EmptyBlock text="Melde dich an, um deine Zertifikate zu sehen." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "1.8rem", fontWeight: 900, color: "#0f2942", letterSpacing: "-0.02em" }}>Zertifizierungen</h1>
          <p style={{ margin: 0, fontSize: "0.92rem", color: "#64748b", fontWeight: 500 }}>Verwalten Sie Ihre Qualifikationen und Fortbildungsnachweise.</p>
        </div>
        <button onClick={onUpload} style={{ background: "#0f2942", color: "#ffffff", border: "none", borderRadius: "10px", padding: "12px 20px", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 2px 8px rgba(15,41,66,0.25)" }}>
          <span>📤</span><span>Urkunde hochladen</span>
        </button>
      </div>

      {loading ? <SkeletonRow /> : (
        <>
          {expiringCerts.length > 0 && (
            <div style={{ background: "linear-gradient(135deg, #fee2e2 0%, #fff1f1 100%)", border: "1px solid #fca5a5", borderRadius: "16px", padding: "22px", marginBottom: 28 }}>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "1.05rem", fontWeight: 900, color: "#991b1b" }}>⚠️ Aktionsbedarf: {expiringCerts.length} Zertifikat{expiringCerts.length === 1 ? '' : 'e'} läuft/laufen bald ab</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#7f1d1d" }}>
                {expiringCerts.map(c => `„${c.title}" (gültig bis ${formatDateDe(c.validUntil)})`).join(', ')}
              </p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: 28 }} className="ea-card-grid">
            <StatCard label="Aktiv" icon="✓" color="#0d9488" value={activeCount} />
            <StatCard label="Läuft ab" icon="⌛" color="#d97706" value={expiringCerts.length} />
            <StatCard label="Abgelaufen" icon="❗" color="#64748b" value={expiredCount} />
          </div>

          <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: 800, color: "#0f2942" }}>Meine Zertifikate</h3>
          {certificates.length === 0 ? <EmptyBlock text="Noch keine Zertifikate. Schließe einen Kurs ab oder lade eine Urkunde hoch." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {certificates.map(cert => (
                <div key={cert.id} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#e0edff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0052cc", fontSize: "1.3rem" }}>🏅</div>
                    <div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f2942" }}>{cert.title}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                        {cert.validUntil ? `Gültig bis: ${formatDateDe(cert.validUntil)}` : 'Ohne Ablaufdatum'} · Ausgestellt {formatDateDe(cert.issuedAt)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <CertStatusBadge status={cert.status} />
                    {cert.fileUrl ? (
                      <a href={cert.fileUrl} download title="Urkunde herunterladen" style={{ fontSize: "1.2rem", color: "#64748b" }}>📥</a>
                    ) : (
                      <span style={{ fontSize: '.72rem', color: '#94a3b8', fontWeight: 600 }}>Automatisch ausgestellt</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, icon, color, value }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color, fontWeight: 800, marginBottom: "8px" }}>
        <span>{icon}</span> {label}
      </div>
      <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f2942" }}>{value}</div>
    </div>
  );
}

// ==================== Certificate upload modal ====================
function CertUploadModal({ onClose, onUploaded }) {
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Bitte einen Titel eingeben.'); return; }
    setSaving(true);
    setError('');
    try {
      const dataUrl = file ? await fileToDataURL(file) : null;
      await apiUploadCertificate({ title: title.trim(), validUntil: validUntil || null, dataUrl });
      onUploaded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#ffffff", borderRadius: "20px", width: "100%", maxWidth: "480px", padding: "32px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f2942" }}>Urkunde hochladen</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.6rem", color: "#64748b", cursor: "pointer" }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontSize: '.8rem', fontWeight: 700, color: '#334155', display: 'flex', flexDirection: 'column', gap: 5 }}>
            Titel
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. Praxisanleiter-Auffrischungskurs" style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 11px', fontSize: '.88rem' }} />
          </label>
          <label style={{ fontSize: '.8rem', fontWeight: 700, color: '#334155', display: 'flex', flexDirection: 'column', gap: 5 }}>
            Gültig bis (optional)
            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 11px', fontSize: '.88rem' }} />
          </label>

          <label htmlFor="cert-file-input" style={{ border: "2px dashed #fca5a5", borderRadius: "12px", padding: "26px", textAlign: "center", background: "#fff5f5", cursor: 'pointer' }}>
            <div style={{ fontSize: "2rem", marginBottom: "6px" }}>📤</div>
            <div style={{ fontWeight: 800, color: "#991b1b", fontSize: '.85rem' }}>{file ? file.name : 'PDF oder Bilddatei auswählen'}</div>
            <input id="cert-file-input" type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, padding: '10px 14px', fontSize: '.85rem' }}>{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button type="button" onClick={onClose} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}>Abbrechen</button>
            <button type="submit" disabled={saving} style={{ background: "#b91c1c", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 22px", fontWeight: 800, cursor: "pointer" }}>
              {saving ? 'Wird eingereicht…' : 'Bestätigen & Einreichen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ELEARNING_RESPONSIVE_CSS = `
  @keyframes ea-skel { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
  @media (max-width: 900px) {
    .ea-sidebar { display: none; }
    .ea-main-pad { padding: 20px !important; }
    .ea-card-grid { grid-template-columns: 1fr !important; }
  }
  @media (min-width: 901px) and (max-width: 1200px) {
    .ea-card-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
`;
