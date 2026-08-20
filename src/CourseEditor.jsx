/**
 * CourseEditor.jsx — course authoring form (teacher/praxisanleiter/admin
 * only): title/description/category/duration + a repeatable module/lesson
 * builder with an optional per-lesson quiz. Wired to the "+ Neuer Kurs"
 * button already sitting in ELearningCertificates.jsx's Marktplatz sidebar.
 */

import React, { useState } from "react";
import { CATEGORIES, apiCreateCourse, apiUpdateCourse } from "./elearningShared";

let uid = 0;
const nextUid = () => `tmp-${Date.now()}-${uid++}`;

function emptyLesson() {
  return { key: nextUid(), title: "", type: "text", content: "", videoUrl: "", quiz: { questions: [] } };
}
function emptyModule() {
  return { key: nextUid(), title: "", lessons: [emptyLesson()] };
}
function emptyQuestion() {
  return { key: nextUid(), q: "", options: ["", ""], correctIndex: 0 };
}

function courseToFormState(course) {
  return {
    title: course.title, subtitle: course.subtitle || "", description: course.description || "",
    category: course.category, coverImage: course.coverImage || "",
    durationHours: course.durationHours || "", cmePoints: course.cmePoints || "", price: course.price || 0,
    issuesCertificate: !!course.issuesCertificate,
    certificateTitle: course.certificateTitle || course.title,
    certificateValidityMonths: course.certificateValidityMonths || 24,
    modules: course.modules.map(m => ({
      key: nextUid(), title: m.title,
      lessons: m.lessons.map(l => ({
        key: nextUid(), title: l.title, type: l.type,
        content: l.content || "", videoUrl: l.videoUrl || "",
        quiz: { questions: (l.quiz?.questions || []).map(q => ({ key: nextUid(), q: q.q, options: q.options, correctIndex: q.correctIndex ?? 0 })) }
      }))
    }))
  };
}

export default function CourseEditor({ onClose, onSaved, editingCourse }) {
  const [form, setForm] = useState(() => editingCourse ? courseToFormState(editingCourse) : {
    title: "", subtitle: "", description: "", category: CATEGORIES[0], coverImage: "",
    durationHours: "", cmePoints: "", price: 0,
    issuesCertificate: true, certificateTitle: "", certificateValidityMonths: 24,
    modules: [emptyModule()]
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const updateModule = (mi, patch) => setForm(f => ({
    ...f, modules: f.modules.map((m, i) => i === mi ? { ...m, ...patch } : m)
  }));
  const updateLesson = (mi, li, patch) => setForm(f => ({
    ...f, modules: f.modules.map((m, i) => i !== mi ? m : { ...m, lessons: m.lessons.map((l, j) => j === li ? { ...l, ...patch } : l) })
  }));
  const addModule = () => setForm(f => ({ ...f, modules: [...f.modules, emptyModule()] }));
  const removeModule = (mi) => setForm(f => ({ ...f, modules: f.modules.filter((_, i) => i !== mi) }));
  const addLesson = (mi) => updateModule(mi, { lessons: [...form.modules[mi].lessons, emptyLesson()] });
  const removeLesson = (mi, li) => updateModule(mi, { lessons: form.modules[mi].lessons.filter((_, j) => j !== li) });

  const addQuestion = (mi, li) => updateLesson(mi, li, { quiz: { questions: [...form.modules[mi].lessons[li].quiz.questions, emptyQuestion()] } });
  const removeQuestion = (mi, li, qi) => updateLesson(mi, li, { quiz: { questions: form.modules[mi].lessons[li].quiz.questions.filter((_, k) => k !== qi) } });
  const updateQuestion = (mi, li, qi, patch) => updateLesson(mi, li, {
    quiz: { questions: form.modules[mi].lessons[li].quiz.questions.map((q, k) => k === qi ? { ...q, ...patch } : q) }
  });
  const updateOption = (mi, li, qi, oi, value) => {
    const q = form.modules[mi].lessons[li].quiz.questions[qi];
    const options = q.options.map((o, k) => k === oi ? value : o);
    updateQuestion(mi, li, qi, { options });
  };
  const addOption = (mi, li, qi) => {
    const q = form.modules[mi].lessons[li].quiz.questions[qi];
    if (q.options.length >= 6) return;
    updateQuestion(mi, li, qi, { options: [...q.options, ""] });
  };
  const removeOption = (mi, li, qi, oi) => {
    const q = form.modules[mi].lessons[li].quiz.questions[qi];
    if (q.options.length <= 2) return;
    const options = q.options.filter((_, k) => k !== oi);
    updateQuestion(mi, li, qi, { options, correctIndex: q.correctIndex >= options.length ? 0 : q.correctIndex });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("Bitte einen Kurstitel eingeben."); return; }
    if (form.modules.every(m => m.lessons.length === 0)) { setError("Bitte mindestens eine Lektion hinzufügen."); return; }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      category: form.category,
      coverImage: form.coverImage.trim() || null,
      durationHours: Number(form.durationHours) || 0,
      cmePoints: Number(form.cmePoints) || 0,
      price: Number(form.price) || 0,
      issuesCertificate: form.issuesCertificate,
      certificateTitle: form.certificateTitle.trim() || form.title.trim(),
      certificateValidityMonths: Number(form.certificateValidityMonths) || 24,
      modules: form.modules.map(m => ({
        title: m.title.trim() || "Modul",
        lessons: m.lessons.map(l => ({
          title: l.title.trim() || "Lektion",
          type: l.type,
          content: l.type === "text" ? l.content : undefined,
          videoUrl: l.type === "video" ? l.videoUrl : undefined,
          quiz: l.type === "quiz" ? { questions: l.quiz.questions.map(q => ({ q: q.q, options: q.options, correctIndex: q.correctIndex })) } : undefined
        }))
      }))
    };

    try {
      const saved = editingCourse ? await apiUpdateCourse(editingCourse.id, payload) : await apiCreateCourse(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ce-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{COURSE_EDITOR_CSS}</style>
      <div className="ce-modal">
        <div className="ce-head">
          <h3>{editingCourse ? "Kurs bearbeiten" : "Neuer Kurs"}</h3>
          <button className="ce-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="ce-form">
          <div className="ce-grid-2">
            <label>Titel
              <input value={form.title} onChange={e => set("title", e.target.value)} />
            </label>
            <label>Kategorie
              <select value={form.category} onChange={e => set("category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <label>Untertitel
            <input value={form.subtitle} onChange={e => set("subtitle", e.target.value)} placeholder="Kurzer Teaser-Satz" />
          </label>

          <label>Beschreibung
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} />
          </label>

          <label>Titelbild-URL (optional)
            <input value={form.coverImage} onChange={e => set("coverImage", e.target.value)} placeholder="https://…" />
          </label>

          <div className="ce-grid-3">
            <label>Dauer (Std.)
              <input type="number" min="0" value={form.durationHours} onChange={e => set("durationHours", e.target.value)} />
            </label>
            <label>CME-Punkte
              <input type="number" min="0" value={form.cmePoints} onChange={e => set("cmePoints", e.target.value)} />
            </label>
            <label>Preis (€)
              <input type="number" min="0" value={form.price} onChange={e => set("price", e.target.value)} />
            </label>
          </div>

          <label className="ce-checkbox-row">
            <input type="checkbox" checked={form.issuesCertificate} onChange={e => set("issuesCertificate", e.target.checked)} />
            Stellt bei 100% Abschluss ein Zertifikat aus
          </label>

          {form.issuesCertificate && (
            <div className="ce-grid-2">
              <label>Zertifikatstitel
                <input value={form.certificateTitle} onChange={e => set("certificateTitle", e.target.value)} placeholder={form.title || "Kurstitel"} />
              </label>
              <label>Gültig für (Monate)
                <input type="number" min="1" value={form.certificateValidityMonths} onChange={e => set("certificateValidityMonths", e.target.value)} />
              </label>
            </div>
          )}

          <div className="ce-section-title">Module &amp; Lektionen</div>

          {form.modules.map((m, mi) => (
            <div className="ce-module" key={m.key}>
              <div className="ce-module-head">
                <input
                  className="ce-module-title-input"
                  value={m.title}
                  onChange={e => updateModule(mi, { title: e.target.value })}
                  placeholder={`Modul ${mi + 1} Titel`}
                />
                {form.modules.length > 1 && (
                  <button type="button" className="ce-remove-btn" onClick={() => removeModule(mi)}>Modul entfernen</button>
                )}
              </div>

              {m.lessons.map((l, li) => (
                <div className="ce-lesson" key={l.key}>
                  <div className="ce-lesson-row">
                    <input
                      className="ce-lesson-title-input"
                      value={l.title}
                      onChange={e => updateLesson(mi, li, { title: e.target.value })}
                      placeholder={`Lektion ${li + 1} Titel`}
                    />
                    <select value={l.type} onChange={e => updateLesson(mi, li, { type: e.target.value })}>
                      <option value="text">Text</option>
                      <option value="video">Video</option>
                      <option value="quiz">Quiz</option>
                    </select>
                    {m.lessons.length > 1 && (
                      <button type="button" className="ce-remove-btn" onClick={() => removeLesson(mi, li)}>×</button>
                    )}
                  </div>

                  {l.type === "text" && (
                    <textarea
                      className="ce-lesson-content"
                      rows={3}
                      value={l.content}
                      onChange={e => updateLesson(mi, li, { content: e.target.value })}
                      placeholder="Lektionsinhalt…"
                    />
                  )}
                  {l.type === "video" && (
                    <input
                      className="ce-lesson-content"
                      value={l.videoUrl}
                      onChange={e => updateLesson(mi, li, { videoUrl: e.target.value })}
                      placeholder="Video-URL"
                    />
                  )}
                  {l.type === "quiz" && (
                    <div className="ce-quiz-builder">
                      {l.quiz.questions.map((q, qi) => (
                        <div className="ce-quiz-q" key={q.key}>
                          <div className="ce-quiz-q-row">
                            <input
                              value={q.q}
                              onChange={e => updateQuestion(mi, li, qi, { q: e.target.value })}
                              placeholder={`Frage ${qi + 1}`}
                            />
                            <button type="button" className="ce-remove-btn" onClick={() => removeQuestion(mi, li, qi)}>×</button>
                          </div>
                          {q.options.map((opt, oi) => (
                            <div className="ce-quiz-opt-row" key={oi}>
                              <input
                                type="radio"
                                checked={q.correctIndex === oi}
                                onChange={() => updateQuestion(mi, li, qi, { correctIndex: oi })}
                                title="Als richtige Antwort markieren"
                              />
                              <input
                                className="ce-quiz-opt-input"
                                value={opt}
                                onChange={e => updateOption(mi, li, qi, oi, e.target.value)}
                                placeholder={`Option ${oi + 1}`}
                              />
                              {q.options.length > 2 && (
                                <button type="button" className="ce-remove-btn" onClick={() => removeOption(mi, li, qi, oi)}>×</button>
                              )}
                            </div>
                          ))}
                          <button type="button" className="ce-add-link" onClick={() => addOption(mi, li, qi)}>+ Option</button>
                        </div>
                      ))}
                      <button type="button" className="ce-add-link" onClick={() => addQuestion(mi, li)}>+ Frage hinzufügen</button>
                    </div>
                  )}
                </div>
              ))}
              <button type="button" className="ce-add-link" onClick={() => addLesson(mi)}>+ Lektion hinzufügen</button>
            </div>
          ))}
          <button type="button" className="ce-outline-btn" onClick={addModule}>+ Modul hinzufügen</button>

          {error && <div className="ce-error">{error}</div>}

          <div className="ce-form-actions">
            <button type="button" className="ce-outline-btn" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="ce-primary-btn" disabled={saving}>
              {saving ? "Wird gespeichert…" : editingCourse ? "Speichern" : "Kurs erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COURSE_EDITOR_CSS = `
  .ce-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.65); backdrop-filter: blur(4px); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .ce-modal { background: #fff; border-radius: 20px; width: 100%; max-width: 660px; max-height: 92vh; overflow-y: auto; padding: 26px 28px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; }
  .ce-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .ce-head h3 { margin: 0; font-size: 1.2rem; font-weight: 900; color: #0f2942; }
  .ce-close { background: #f1f5f9; border: none; border-radius: 999px; width: 30px; height: 30px; font-size: 1.2rem; color: #64748b; cursor: pointer; }
  .ce-form { display: flex; flex-direction: column; gap: 14px; }
  .ce-form label { display: flex; flex-direction: column; gap: 5px; font-size: .8rem; font-weight: 700; color: #334155; }
  .ce-form input, .ce-form select, .ce-form textarea { border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 11px; font-family: inherit; font-size: .88rem; font-weight: 400; box-sizing: border-box; width: 100%; }
  .ce-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .ce-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .ce-checkbox-row { flex-direction: row !important; align-items: center; gap: 8px !important; }
  .ce-checkbox-row input { width: auto; }
  .ce-section-title { font-weight: 900; font-size: 1rem; color: #0f2942; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  .ce-module { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
  .ce-module-head { display: flex; gap: 8px; align-items: center; }
  .ce-module-title-input { font-weight: 800; }
  .ce-lesson { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
  .ce-lesson-row { display: flex; gap: 8px; }
  .ce-lesson-row select { max-width: 110px; }
  .ce-lesson-content { font-size: .85rem; }
  .ce-quiz-builder { display: flex; flex-direction: column; gap: 12px; background: #f8fafc; border-radius: 8px; padding: 10px; }
  .ce-quiz-q { display: flex; flex-direction: column; gap: 6px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; }
  .ce-quiz-q-row { display: flex; gap: 8px; }
  .ce-quiz-opt-row { display: flex; align-items: center; gap: 6px; }
  .ce-quiz-opt-input { flex: 1; }
  .ce-add-link { background: none; border: none; color: #0052cc; font-weight: 700; font-size: .82rem; cursor: pointer; text-align: left; padding: 2px 0; align-self: flex-start; }
  .ce-remove-btn { background: none; border: none; color: #dc2626; font-weight: 700; font-size: .8rem; cursor: pointer; white-space: nowrap; }
  .ce-outline-btn { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 16px; font-weight: 700; font-size: .85rem; cursor: pointer; align-self: flex-start; }
  .ce-primary-btn { background: #0052cc; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-weight: 800; font-size: .88rem; cursor: pointer; }
  .ce-primary-btn:disabled { opacity: .6; cursor: default; }
  .ce-form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
  .ce-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 8px; padding: 10px 14px; font-size: .85rem; }
`;
